# /// script
# requires-python = ">=3.12"
# dependencies = ["atomic-agents==2.16.2", "httpx==0.28.1"]
# ///
"""Bounded, read-only deployment checks; no credentials or client records."""
import asyncio
import json
import os
from urllib.parse import urlparse
from datetime import datetime, timezone
from typing import Literal
import httpx
from pydantic import Field
from atomic_agents import BaseIOSchema, BaseTool, BaseToolConfig

TARGETS = {
    'production': 'https://growth-os.sigmatactix.com',
    'analytics_preview': 'https://sigma-tactix-growth-os-v2-aycb8ssm3-nazims-projects-ddc76692.vercel.app',
}
PATHS = {
    '/': (200, 'text/html'), '/api/health': (200, 'application/json'),
    '/healthz': (200, 'application/json'), '/api/ready': (None, 'application/json'),
    '/readyz': (None, 'application/json'), '/api/workspace': (401, 'application/json'),
    '/api': (404, 'application/json'), '/api/__connection_check_missing__': (404, 'application/json'),
}

class DeploymentProbeConfig(BaseToolConfig):
    """Limits for unauthenticated public checks."""
    timeout_seconds: float = Field(default_factory=lambda: float(os.environ.get('AUDIT_HTTP_TIMEOUT_SECONDS', '15')), ge=1, le=30)
    max_bytes: int = Field(default=65536, ge=1024, le=262144)

class DeploymentProbeInput(BaseIOSchema):
    """Select an approved deployment and a reviewed read-only path."""
    deployment: Literal['production', 'analytics_preview'] = Field(description='Approved target; arbitrary hosts are forbidden.')
    path: Literal['/', '/api/health', '/healthz', '/api/ready', '/readyz', '/api/workspace', '/api', '/api/__connection_check_missing__'] = Field(description='Reviewed public GET endpoint.')

class DeploymentProbeOutput(BaseIOSchema):
    """Observed HTTP evidence; blocked readiness is never a passing release."""
    status: Literal['passed', 'failed', 'blocked', 'error'] = Field(description='Probe result, not whole-platform certification.')
    deployment: str = Field(description='Target name.')
    path: str = Field(description='Requested path.')
    http_status: int | None = Field(default=None, description='Observed HTTP status.')
    content_type: str | None = Field(default=None, description='Observed media type.')
    commit: str | None = Field(default=None, description='Reported public source commit, when provided.')
    ready: bool | None = Field(default=None, description='Readiness endpoint result; separate from liveness.')
    error_code: str | None = Field(default=None, description='Stable sanitized failure code.')

class DeploymentProbeTool(BaseTool[DeploymentProbeInput, DeploymentProbeOutput]):
    """Check a reviewed deployment endpoint without authentication or writes."""
    def __init__(self, config: DeploymentProbeConfig | None = None, transport=None):
        super().__init__(config or DeploymentProbeConfig())
        self._transport = transport

    def _output(self, params, status, **fields):
        return DeploymentProbeOutput(status=status, deployment=params.deployment, path=params.path, **fields)

    def _evaluate(self, params, response, body):
        media = response.headers.get('content-type', '').split(';', 1)[0].lower()
        fields = {'http_status': response.status_code, 'content_type': media}
        location = urlparse(response.headers.get('location', ''))
        if params.deployment == 'analytics_preview' and response.status_code == 302 and location.hostname == 'vercel.com' and location.path in ('/sso-api', '/login'):
            return self._output(params, 'blocked', error_code='deployment_authentication_required', **fields)
        expected, expected_type = PATHS[params.path]
        if media != expected_type:
            return self._output(params, 'failed', error_code='unexpected_content_type', **fields)
        if expected is not None and response.status_code != expected:
            return self._output(params, 'failed', error_code='unexpected_http_status', **fields)
        if media != 'application/json':
            return self._output(params, 'passed', **fields)
        try:
            data = json.loads(body)
        except (ValueError, UnicodeDecodeError):
            return self._output(params, 'failed', error_code='invalid_json', **fields)
        if not isinstance(data, dict):
            return self._output(params, 'failed', error_code='unexpected_json_shape', **fields)
        commit = data.get('commit')
        if isinstance(commit, str) and len(commit) <= 64 and all(c in '0123456789abcdef' for c in commit.lower()):
            fields['commit'] = commit
        if params.path in ('/api/ready', '/readyz'):
            ready = data.get('ready')
            if ready is False and response.status_code == 503:
                return self._output(params, 'blocked', ready=False, error_code='runtime_not_ready', **fields)
            if ready is True and response.status_code == 200:
                return self._output(params, 'passed', ready=True, **fields)
            return self._output(params, 'failed', error_code='invalid_readiness_contract', **fields)
        if params.path in ('/api/health', '/healthz') and (data.get('ok') is not True or data.get('status') != 'alive'):
            return self._output(params, 'failed', error_code='invalid_health_contract', **fields)
        return self._output(params, 'passed', **fields)

    def run(self, params: DeploymentProbeInput) -> DeploymentProbeOutput:
        try:
            with httpx.Client(timeout=self.config.timeout_seconds, follow_redirects=False, transport=self._transport) as client:
                with client.stream('GET', TARGETS[params.deployment] + params.path) as response:
                    chunks = bytearray()
                    for chunk in response.iter_bytes():
                        chunks.extend(chunk)
                        if len(chunks) > self.config.max_bytes:
                            return self._output(params, 'error', error_code='response_too_large')
                    return self._evaluate(params, response, chunks)
        except httpx.HTTPError:
            return self._output(params, 'error', error_code='http_request_failed')

    async def run_async(self, params: DeploymentProbeInput) -> DeploymentProbeOutput:
        try:
            async with httpx.AsyncClient(timeout=self.config.timeout_seconds, follow_redirects=False, transport=self._transport) as client:
                async with client.stream('GET', TARGETS[params.deployment] + params.path) as response:
                    chunks = bytearray()
                    async for chunk in response.aiter_bytes():
                        chunks.extend(chunk)
                        if len(chunks) > self.config.max_bytes:
                            return self._output(params, 'error', error_code='response_too_large')
                    return self._evaluate(params, response, chunks)
        except httpx.HTTPError:
            return self._output(params, 'error', error_code='http_request_failed')

async def main():
    results = []
    for deployment in TARGETS:
        for path in PATHS:
            result = await DeploymentProbeTool().run_async(DeploymentProbeInput(deployment=deployment, path=path))
            results.append(result.model_dump())
    print(json.dumps({'checkedAt': datetime.now(timezone.utc).isoformat(), 'checks': results, 'scope': 'public_read_only_http', 'authenticated_workflows': 'not_tested_by_this_tool'}, indent=2))

if __name__ == '__main__':
    asyncio.run(main())
