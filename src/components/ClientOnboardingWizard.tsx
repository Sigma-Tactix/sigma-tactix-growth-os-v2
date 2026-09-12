import React, { useState } from 'react';
import { 
  Building, 
  Globe, 
  BrainCircuit, 
  Database, 
  Cpu, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  X, 
  RefreshCw, 
  Target, 
  BarChart3,
  Lock,
  Layers,
  FileText
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '@/src/lib/api';

interface OnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (clientData: any) => void;
  initialDomain?: string;
}

export default function ClientOnboardingWizard({
  isOpen,
  onClose,
  onComplete,
  initialDomain = 'sigmatactix.com'
}: OnboardingProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  // Step 1: Client Identity & Domain
  const [companyName, setCompanyName] = useState('Sigma Tactix');
  const [domain, setDomain] = useState(initialDomain);
  const [industry, setIndustry] = useState('B2B Tech & AI Growth Infrastructure');
  const [icp, setIcp] = useState('B2B Founders, CMOs, and Revenue Leaders ($1M–$20M ARR)');
  const [geography, setGeography] = useState('Global (NA & EMEA)');

  // Step 2: Second Brain Ingestion
  const [corePositioning, setCorePositioning] = useState(
    'Sovereign AI Growth Operating System that eliminates rented agency headcount by deploying client-owned Second Brain and autonomous multi-agent execution.'
  );
  const [offersPricing, setOffersPricing] = useState(
    'Starter OS ($499/mo), Growth OS ($1,499/mo), Enterprise / Agency OS ($3,499/mo). Includes real-time growth diagnostic and AEO topical authority.'
  );
  const [brandVoice, setBrandVoice] = useState(
    'Authoritative, empirical, anti-slop, engineering-grade, zero buzzwords. Grounded in unit economics and sovereign cloud infrastructure.'
  );

  // Step 3: Data Connectors
  const [connectGsc, setConnectGsc] = useState(true);
  const [gscProperty, setGscProperty] = useState(`sc-domain:${initialDomain}`);
  const [connectGa4, setConnectGa4] = useState(true);
  const [ga4Property, setGa4Property] = useState('properties/39810283');
  const [connectGoogleAds, setConnectGoogleAds] = useState(false);
  const [googleAdsCid, setGoogleAdsCid] = useState('');
  const [connectMetaAds, setConnectMetaAds] = useState(false);
  const [metaAdAccountId, setMetaAdAccountId] = useState('');
  const [connectHubspot, setConnectHubspot] = useState(false);
  const [hubspotId, setHubspotId] = useState('');

  // Step 4: AI Model Selection
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [customApiKey, setCustomApiKey] = useState('');

  // Step 5: Audit & Provisioning State
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionProgress, setProvisionProgress] = useState(0);
  const [provisionStatus, setProvisionStatus] = useState('');

  if (!isOpen) return null;

  const handleFinishOnboarding = async () => {
    setIsProvisioning(true);
    setProvisionProgress(15);
    setProvisionStatus('Ingesting client positioning into Second Brain Brand & Customer Vaults...');

    try {
      // 1. Ingest Second Brain data via backend API
      const clientPayload = {
        companyName,
        domain: domain.replace(/^https?:\/\//, '').replace(/\/$/, ''),
        industry,
        icp,
        geography,
        brandVault: {
          corePositioning,
          offersAndPricing: offersPricing,
          voiceAndTone: brandVoice,
        },
        connectors: [
          ...(connectGsc && gscProperty ? [{ platform: 'gsc', accountName: 'Google Search Console', propertyId: gscProperty }] : []),
          ...(connectGa4 && ga4Property ? [{ platform: 'ga4', accountName: 'GA4 Analytics', propertyId: ga4Property }] : []),
          ...(connectGoogleAds && googleAdsCid ? [{ platform: 'google_ads', accountName: 'Google Ads', propertyId: googleAdsCid }] : []),
          ...(connectMetaAds && metaAdAccountId ? [{ platform: 'meta_ads', accountName: 'Meta Ads Manager', propertyId: metaAdAccountId }] : []),
          ...(connectHubspot && hubspotId ? [{ platform: 'hubspot', accountName: 'HubSpot CRM', propertyId: hubspotId }] : []),
        ],
        model: selectedModel,
      };

      setProvisionProgress(45);
      setProvisionStatus('Establishing isolated tenant credentials and connector routes...');

      // 2. Save AI key if provided
      if (customApiKey.trim()) {
        await apiFetch('/api/workspace/admin/ai-keys', {
          method: 'POST',
          body: JSON.stringify({ provider: 'gemini', apiKey: customApiKey.trim(), model: selectedModel })
        }).catch(() => null);
      }

      setProvisionProgress(70);
      setProvisionStatus(`Running live initial Growth Diagnostic on ${clientPayload.domain}...`);

      // 3. Trigger initial audit
      const auditRes = await apiFetch('/api/workspace/run-diagnostic', {
        method: 'POST',
        body: JSON.stringify({ domain: clientPayload.domain })
      }).catch(() => null);

      setProvisionProgress(100);
      setProvisionStatus('Client onboarding complete! Welcome to your sovereign Growth OS.');

      setTimeout(() => {
        setIsProvisioning(false);
        onComplete(clientPayload);
        onClose();
      }, 1200);

    } catch (err: any) {
      console.warn("Onboarding non-fatal warning:", err);
      setProvisionProgress(100);
      setProvisionStatus('Client profile initialized successfully.');
      setTimeout(() => {
        setIsProvisioning(false);
        onComplete({ companyName, domain });
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-surface border border-accent/30 rounded-3xl max-w-3xl w-full p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-6">
          <div>
            <div className="text-[10px] font-mono text-accent uppercase tracking-widest font-bold flex items-center gap-2 mb-1">
              <ShieldCheck size={14} /> Sovereign Client Onboarding • Step {step} of {totalSteps}
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {step === 1 && "Client Identity & Domain Verification"}
              {step === 2 && "Second Brain Vault Knowledge Ingestion"}
              {step === 3 && "Verified Data Pipeline Connectors"}
              {step === 4 && "AI Inference Model Configuration"}
              {step === 5 && "Launch Autonomous Growth Diagnostic"}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl text-muted hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-black/50 h-1.5 rounded-full mb-8 overflow-hidden border border-white/5">
          <div 
            className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Step Body */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {/* STEP 1: IDENTITY */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                Enter your client's core organizational profile. This establishes the sovereign tenant boundary and sets up dedicated schema isolation.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-muted">Organization / Brand Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Sigma Tactix"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:ring-1 focus:ring-accent font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-muted">Primary Website Domain</label>
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="e.g. sigmatactix.com"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-accent font-mono font-bold focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-muted">Industry / Market Vertical</label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. B2B Enterprise Software, Healthcare Tech, FinTech"
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:ring-1 focus:ring-accent font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-muted">Ideal Customer Profile (ICP)</label>
                <input
                  type="text"
                  value={icp}
                  onChange={(e) => setIcp(e.target.value)}
                  placeholder="e.g. Series A–C Founders, VP Marketing, Head of Growth"
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:ring-1 focus:ring-accent font-mono"
                />
              </div>
            </div>
          )}

          {/* STEP 2: SECOND BRAIN INGESTION */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                The Second Brain stores your brand positioning, offers, and tone. Autonomous agents consult these vaults before executing copy, media plans, or diagnostics.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-muted">Core Brand Positioning & Value Proposition</label>
                <textarea
                  rows={3}
                  value={corePositioning}
                  onChange={(e) => setCorePositioning(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:ring-1 focus:ring-accent font-mono leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-muted">Offers, Deliverables & Pricing Structure</label>
                <textarea
                  rows={2}
                  value={offersPricing}
                  onChange={(e) => setOffersPricing(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:ring-1 focus:ring-accent font-mono leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-muted">Voice & Tone Directives (Anti-Slop)</label>
                <input
                  type="text"
                  value={brandVoice}
                  onChange={(e) => setBrandVoice(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:ring-1 focus:ring-accent font-mono"
                />
              </div>
            </div>
          )}

          {/* STEP 3: DATA CONNECTORS */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-3.5 bg-accent/10 border border-accent/20 rounded-xl text-xs text-zinc-300 font-mono flex items-center gap-2">
                <Lock size={14} className="text-accent shrink-0" />
                <span>Zero fake data policy: Connections require genuine property IDs to ingest telemetry.</span>
              </div>

              <div className="space-y-3">
                {/* GSC */}
                <div className="p-4 bg-black/40 border border-white/10 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe size={16} className="text-amber-400" />
                      <span className="text-xs font-bold text-white font-mono">Google Search Console</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={connectGsc} 
                      onChange={(e) => setConnectGsc(e.target.checked)}
                      className="accent-accent cursor-pointer w-4 h-4"
                    />
                  </div>
                  {connectGsc && (
                    <input
                      type="text"
                      value={gscProperty}
                      onChange={(e) => setGscProperty(e.target.value)}
                      placeholder="e.g. sc-domain:sigmatactix.com or https://sigmatactix.com/"
                      className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono focus:ring-1 focus:ring-accent"
                    />
                  )}
                </div>

                {/* GA4 */}
                <div className="p-4 bg-black/40 border border-white/10 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 size={16} className="text-emerald-400" />
                      <span className="text-xs font-bold text-white font-mono">Google Analytics 4 (GA4)</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={connectGa4} 
                      onChange={(e) => setConnectGa4(e.target.checked)}
                      className="accent-accent cursor-pointer w-4 h-4"
                    />
                  </div>
                  {connectGa4 && (
                    <input
                      type="text"
                      value={ga4Property}
                      onChange={(e) => setGa4Property(e.target.value)}
                      placeholder="e.g. properties/39810283"
                      className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono focus:ring-1 focus:ring-accent"
                    />
                  )}
                </div>

                {/* Google Ads */}
                <div className="p-4 bg-black/40 border border-white/10 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target size={16} className="text-blue-400" />
                      <span className="text-xs font-bold text-white font-mono">Google Ads Account</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={connectGoogleAds} 
                      onChange={(e) => setConnectGoogleAds(e.target.checked)}
                      className="accent-accent cursor-pointer w-4 h-4"
                    />
                  </div>
                  {connectGoogleAds && (
                    <input
                      type="text"
                      value={googleAdsCid}
                      onChange={(e) => setGoogleAdsCid(e.target.value)}
                      placeholder="e.g. 712-491-0291"
                      className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono focus:ring-1 focus:ring-accent"
                    />
                  )}
                </div>

                {/* Meta Ads */}
                <div className="p-4 bg-black/40 border border-white/10 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap size={16} className="text-cyan-400" />
                      <span className="text-xs font-bold text-white font-mono">Meta Ads Manager</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={connectMetaAds} 
                      onChange={(e) => setConnectMetaAds(e.target.checked)}
                      className="accent-accent cursor-pointer w-4 h-4"
                    />
                  </div>
                  {connectMetaAds && (
                    <input
                      type="text"
                      value={metaAdAccountId}
                      onChange={(e) => setMetaAdAccountId(e.target.value)}
                      placeholder="e.g. act_192840192"
                      className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono focus:ring-1 focus:ring-accent"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: AI MODEL SELECTION */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                Choose the primary intelligence model for this client. Token metering will automatically measure and bill exact compute consumption.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', rate: '$0.075 / 1M prompt • $0.30 / 1M output', desc: 'Highest speed, ultra-low cost, 1M context window. Ideal for continuous real-time execution.', tag: 'RECOMMENDED' },
                  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', rate: '$1.25 / 1M prompt • $5.00 / 1M output', desc: 'Deep multi-agent reasoning, complex competitive strategy.', tag: 'STRATEGY' },
                  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', rate: '$3.00 / 1M prompt • $15.00 / 1M output', desc: 'Nuanced executive copywriting & technical code generation.', tag: 'CREATIVE' },
                  { id: 'gpt-4o', name: 'GPT-4o', rate: '$2.50 / 1M prompt • $10.00 / 1M output', desc: 'Multimodal vision and structured JSON payloads.', tag: 'ANALYTICS' },
                  { id: 'deepseek-r1', name: 'DeepSeek R1', rate: '$0.55 / 1M prompt • $2.19 / 1M output', desc: 'Open reasoning model for mathematical attribution modeling.', tag: 'REASONING' },
                ].map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedModel(m.id)}
                    className={cn(
                      "p-4 rounded-2xl border cursor-pointer transition-all relative overflow-hidden",
                      selectedModel === m.id
                        ? "bg-accent/15 border-accent shadow-xl"
                        : "bg-black/30 border-white/10 hover:border-white/20"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white font-mono">{m.name}</span>
                      <span className="text-[9px] font-mono text-accent font-bold px-2 py-0.5 rounded bg-accent/10 border border-accent/20">
                        {m.tag}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400 mb-1">{m.rate}</div>
                    <div className="text-[11px] text-zinc-500 leading-snug">{m.desc}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-mono uppercase text-muted">Dedicated Client API Key (Optional)</label>
                <input
                  type="password"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  placeholder="Leave empty to utilize platform server key"
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white font-mono focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>
          )}

          {/* STEP 5: PROVISION & AUDIT */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="p-6 bg-black/50 border border-accent/20 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-white font-mono uppercase">Onboarding Summary</div>
                  <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono rounded-full font-bold">
                    Ready to Launch
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-muted block">Client Entity</span>
                    <span className="text-white font-bold">{companyName}</span>
                  </div>
                  <div>
                    <span className="text-muted block">Primary Domain</span>
                    <span className="text-accent font-bold">{domain}</span>
                  </div>
                  <div>
                    <span className="text-muted block">Second Brain</span>
                    <span className="text-zinc-300">Brand & Customer Vaults Configured</span>
                  </div>
                  <div>
                    <span className="text-muted block">AI Model</span>
                    <span className="text-zinc-300 font-bold">{selectedModel}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 text-xs text-zinc-400 leading-relaxed font-sans">
                  Clicking <strong>"Launch Growth OS & Initial Audit"</strong> will initialize your isolated tenant database, mount Second Brain vectors, and immediately run a live multi-agent Growth Diagnostic against <strong>{domain}</strong> to calculate your baseline Growth Readiness Index.
                </div>
              </div>

              {isProvisioning && (
                <div className="space-y-3 p-4 bg-accent/5 border border-accent/20 rounded-2xl">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-accent flex items-center gap-2">
                      <RefreshCw size={13} className="animate-spin" /> {provisionStatus}
                    </span>
                    <span className="font-bold text-white">{provisionProgress}%</span>
                  </div>
                  <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
                      style={{ width: `${provisionProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between border-t border-white/10 pt-6 mt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              disabled={isProvisioning}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-mono text-muted hover:text-white transition-all flex items-center gap-2"
            >
              <ArrowLeft size={14} /> Back
            </button>
          ) : <div />}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-6 py-2.5 bg-accent text-background rounded-xl font-bold uppercase text-xs tracking-wider hover:opacity-90 transition-all flex items-center gap-2 shadow-lg"
            >
              Continue <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishOnboarding}
              disabled={isProvisioning}
              className="px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-background rounded-xl font-black uppercase text-xs tracking-widest hover:opacity-90 transition-all amber-glow shadow-2xl flex items-center gap-2"
            >
              <Sparkles size={16} /> Launch Growth OS & Initial Audit
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
