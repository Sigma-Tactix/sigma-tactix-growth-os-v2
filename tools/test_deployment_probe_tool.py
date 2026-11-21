# /// script
# requires-python = ">=3.12"
# dependencies = ["atomic-agents==2.16.2", "httpx==0.28.1"]
# ///
"""Deterministic checks for the audit tool; no network or provider calls."""
import asyncio
import json
import unittest
import httpx
from pydantic import ValidationError
from deployment_probe_tool import DeploymentProbeTool, DeploymentProbeInput, DeploymentProbeConfig

class DeploymentProbeTests(unittest.TestCase):
    def tool(self, status=200, data=None, **kwargs):
        return DeploymentProbeTool(transport=httpx.MockTransport(lambda request: httpx.Response(status, json=data, **kwargs)))

    def test_schema_rejects_unreviewed_paths(self):
        with self.assertRaises(ValidationError):
            DeploymentProbeInput(deployment='production', path='/api/workspace/vault/documents')
        with self.assertRaises(ValidationError):
            DeploymentProbeInput(deployment='http://127.0.0.1', path='/api/health')

    def test_real_schema_types_are_registered(self):
        tool = self.tool()
        self.assertIs(tool.input_schema, DeploymentProbeInput)
        self.assertEqual(tool.output_schema.__name__, 'DeploymentProbeOutput')

    def test_health_requires_valid_contract(self):
        p = DeploymentProbeInput(deployment='production', path='/api/health')
        self.assertEqual(self.tool(data={'ok': True, 'status': 'alive'}).run(p).status, 'passed')
        self.assertEqual(self.tool(data={'ok': True}).run(p).status, 'failed')

    def test_unready_is_blocked_not_passed(self):
        p = DeploymentProbeInput(deployment='production', path='/api/ready')
        r = self.tool(503, {'ready': False}).run(p)
        self.assertEqual(r.status, 'blocked')
        self.assertFalse(r.ready)

    def test_protected_route_requires_401(self):
        p = DeploymentProbeInput(deployment='production', path='/api/workspace')
        self.assertEqual(self.tool(401, {'error': 'unauthorized'}).run(p).status, 'passed')
        self.assertEqual(self.tool(200, {'private': 'test-secret'}).run(p).status, 'failed')
        self.assertNotIn('test-secret', self.tool(200, {'private': 'test-secret'}).run(p).model_dump_json())

    def test_network_errors_are_typed_and_sanitized(self):
        def fail(request):
            raise httpx.ConnectError('private diagnostic must not escape')
        tool = DeploymentProbeTool(transport=httpx.MockTransport(fail))
        r = tool.run(DeploymentProbeInput(deployment='production', path='/api/health'))
        self.assertEqual(r.error_code, 'http_request_failed')
        self.assertNotIn('private diagnostic', r.model_dump_json())

    def test_async_uses_the_same_contract(self):
        p = DeploymentProbeInput(deployment='analytics_preview', path='/api/ready')
        r = asyncio.run(self.tool(200, {'ready': True}).run_async(p))
        self.assertEqual(r.status, 'passed')
        self.assertTrue(r.ready)

    def test_oversized_body_is_rejected(self):
        transport = httpx.MockTransport(lambda request: httpx.Response(200, content=b'x' * 2048))
        tool = DeploymentProbeTool(DeploymentProbeConfig(max_bytes=1024), transport=transport)
        r = tool.run(DeploymentProbeInput(deployment='production', path='/api/health'))
        self.assertEqual(r.error_code, 'response_too_large')

if __name__ == '__main__':
    unittest.main()
