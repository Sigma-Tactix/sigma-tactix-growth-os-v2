import React, { useEffect, useState } from 'react';
import { CheckCircle2, ExternalLink, RefreshCw, Search, ShieldCheck, Terminal, XCircle } from 'lucide-react';
import { Badge, Button, GlassCard } from '@/src/components/ui';
import { discoverGoogleAdsMcpCustomers, getGoogleAdsMcpStatus } from '@/src/lib/api';
import type { GoogleAdsMcpStatus } from '@/src/types';

interface GoogleAdsMcpControlProps {
  onSelectCustomer: (customerId: string) => void;
}

function State({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--sigma-text-soft)]">
      {ok ? <CheckCircle2 size={13} className="text-emerald-accent" /> : <XCircle size={13} className="text-amber-accent" />}
      {label}
    </div>
  );
}

export function GoogleAdsMcpControl({ onSelectCustomer }: GoogleAdsMcpControlProps) {
  const [status, setStatus] = useState<GoogleAdsMcpStatus | null>(null);
  const [customers, setCustomers] = useState<string[]>([]);
  const [checking, setChecking] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkRuntime = async () => {
    setChecking(true);
    setError(null);
    try { setStatus(await getGoogleAdsMcpStatus()); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Runtime check failed.'); }
    finally { setChecking(false); }
  };

  const discoverCustomers = async () => {
    setDiscovering(true);
    setError(null);
    try {
      const result = await discoverGoogleAdsMcpCustomers();
      setCustomers(result.customers);
      await checkRuntime();
    } catch (reason) {
      setCustomers([]);
      setError(reason instanceof Error ? reason.message : 'Customer discovery failed.');
    } finally { setDiscovering(false); }
  };

  useEffect(() => { void checkRuntime(); }, []);

  return (
    <GlassCard className="p-5 border border-blue-500/20 bg-blue-500/[0.03]">
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-5">
        <div className="space-y-3 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info" size="xs">OFFICIAL GOOGLE MCP</Badge>
            <Badge variant="neutral" size="xs">READ ONLY</Badge>
            <span className="text-[10px] font-mono text-[var(--sigma-text-muted)]">google-ads-mcp 0.0.4</span>
          </div>
          <div>
            <h3 className="text-base font-semibold text-[var(--sigma-text)]">Google Ads MCP Reporting Control</h3>
            <p className="text-xs text-[var(--sigma-text-muted)] mt-1 max-w-3xl">
              Discovers accessible Google Ads customers and exposes resource metadata and GAQL reporting. Campaign, bid and budget mutations are not available through this MCP.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <State ok={Boolean(status?.installed)} label="Runtime installed" />
            <State ok={Boolean(status?.reachable)} label="MCP handshake" />
            <State ok={Boolean(status?.configured)} label="Credentials configured" />
            <State ok={customers.length > 0} label="Account access verified" />
          </div>

          {status && <p className="text-[11px] text-[var(--sigma-text-soft)]">{status.detail}</p>}
          {status?.missingConfiguration.length ? (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
              <div className="text-[10px] uppercase font-mono font-bold text-amber-accent">Required server configuration</div>
              <ul className="mt-1.5 space-y-1 text-[11px] font-mono text-[var(--sigma-text-soft)]">
                {status.missingConfiguration.map(item => <li key={item}>• {item}</li>)}
              </ul>
            </div>
          ) : null}
          {error && <div className="text-xs text-red-500 border border-red-500/20 bg-red-500/5 rounded-xl p-3">{error}</div>}

          {customers.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase text-emerald-accent font-bold">Verified accessible customers</div>
              <div className="flex flex-wrap gap-2">
                {customers.map(customer => (
                  <button key={customer} onClick={() => onSelectCustomer(customer)} className="px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-accent text-xs font-mono cursor-pointer">
                    {customer} · configure pipeline
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row xl:flex-col gap-2 min-w-52">
          <Button variant="secondary" size="sm" onClick={checkRuntime} disabled={checking} icon={<RefreshCw size={13} className={checking ? 'animate-spin' : ''} />}>
            Check MCP Runtime
          </Button>
          <Button variant="primary" size="sm" onClick={discoverCustomers} disabled={discovering || !status?.reachable} icon={<Search size={13} className={discovering ? 'animate-pulse' : ''} />}>
            Discover Accounts
          </Button>
          <a href="https://developers.google.com/google-ads/api/docs/developer-toolkit/mcp-server" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-1.5 text-[11px] font-mono text-blue-accent hover:underline py-1">
            Setup requirements <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </GlassCard>
  );
}

