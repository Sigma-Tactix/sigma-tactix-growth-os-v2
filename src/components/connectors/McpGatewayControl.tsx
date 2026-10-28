import React, { useState } from 'react';
import { apiFetch } from '@/src/lib/api';

export function McpGatewayControl() {
  const [status, setStatus] = useState<any>(null);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function request(path: string, options?: RequestInit) {
    const response = await apiFetch(`/api/workspace/mcp${path}`, options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'MCP request failed.');
    return data;
  }
  async function refresh() {
    setBusy(true); setMessage('');
    try {
      setStatus(await request('/status'));
      setReceipts((await request('/receipts')).receipts);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'MCP unavailable.'); }
    finally { setBusy(false); }
  }
  async function discover() {
    setBusy(true); setMessage('');
    try {
      const receipt = await request('/google-ads/read', { method: 'POST', body: JSON.stringify({ operation: 'discover' }) });
      setMessage(`Account discovery ${receipt.status}. Receipt: ${receipt.receiptId}`);
      setReceipts((await request('/receipts')).receipts);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Discovery failed.'); }
    finally { setBusy(false); }
  }
  return <section className="p-5 border border-[var(--sigma-border)] rounded-2xl space-y-3" aria-label="Growth OS MCP connections">
    <h3 className="font-semibold">Growth OS MCP connections</h3>
    <p className="text-sm text-[var(--sigma-text-muted)]">VANTA’s marketing specialists can request read-only Google Ads data. External assistants can read workspace capability and execution summaries.</p>
    {status && <p className="text-sm">Google Ads workspace binding: {status.outbound.boundToWorkspace ? 'Configured, account access not checked here' : 'Not configured'}. External access: {status.inboundEnabled ? 'Enabled, authenticated clients only' : 'Disabled'}.</p>}
    <div className="flex flex-wrap gap-3">
      <button className="sigma-btn-secondary px-3 py-2 rounded-lg" disabled={busy} onClick={refresh}>{busy ? 'Checking…' : 'Check configuration and receipts'}</button>
      <button className="sigma-btn-secondary px-3 py-2 rounded-lg" disabled={busy || !status?.outbound.boundToWorkspace} onClick={discover}>Discover accounts with receipt</button>
    </div>
    {message && <p role="status" className="text-sm break-words">{message}</p>}
    {receipts.length > 0 && <ul className="text-xs space-y-2">{receipts.map(receipt => <li key={receipt.id} className="break-words">
      {receipt.tool_name}: {receipt.status} · {receipt.started_at} · Receipt {receipt.id}
    </li>)}</ul>}
  </section>;
}
