import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Building2, Check, FileText, Loader2, Upload, X } from 'lucide-react';
import { analyzeVaultDocument } from '@/src/lib/api';
import {
  buildClientWorkspaceDraft,
  createEmptyOnboardingDraft,
  markFieldConfirmed,
  mergeDocumentSuggestion,
  normalizeDomain,
  type ClientOnboardingDraft,
  type OnboardingField,
} from '@/src/lib/clientOnboarding';

interface OnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (clientData: ReturnType<typeof buildClientWorkspaceDraft>) => void;
  initialDomain?: string;
}

const steps = ['Add client', 'Review profile', 'Data setup', 'Confirm'];
const fieldClass = 'w-full rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-input)] px-3 py-2.5 text-sm text-[var(--sigma-text)] placeholder:text-[var(--sigma-text-muted)] focus:border-[var(--sigma-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sigma-primary)]/15';
const labelClass = 'mb-1.5 block text-xs font-semibold text-[var(--sigma-text-soft)]';

export default function ClientOnboardingWizard({ isOpen, onClose, onComplete, initialDomain = '' }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(() => createEmptyOnboardingDraft(initialDomain));
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [fileError, setFileError] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep(0);
    setDraft(createEmptyOnboardingDraft(initialDomain));
    setFileError('');
    setUploadedFileName('');
  }, [isOpen, initialDomain]);

  const unreviewed = useMemo(() => Object.entries(draft.sources).filter(([, source]) => source?.status === 'suggested'), [draft.sources]);
  const identityReady = Boolean(draft.companyName.trim() && normalizeDomain(draft.domain));
  if (!isOpen) return null;

  const updateManual = (field: 'companyName' | 'domain' | 'industry' | 'icp' | 'geography', value: string) => {
    setDraft((current) => markFieldConfirmed({ ...current, [field]: value }, field));
  };

  const updateBrand = (field: keyof ClientOnboardingDraft['brandVault'], value: string) => {
    setDraft((current) => markFieldConfirmed({ ...current, brandVault: { ...current.brandVault, [field]: value } }, field));
  };

  const reviewSuggestion = (field: OnboardingField, accept: boolean) => {
    setDraft((current) => {
      const next = structuredClone(current);
      if (!accept) {
        if (field in next.brandVault) next.brandVault[field as keyof typeof next.brandVault] = '';
        else (next as unknown as Record<string, unknown>)[field] = '';
      }
      return markFieldConfirmed(next, field);
    });
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    setIsAnalyzing(true);
    setFileError('');
    try {
      const result = await analyzeVaultDocument(file);
      if (!result.success || !result.analysis) throw new Error('No usable analysis was returned.');
      setDraft((current) => mergeDocumentSuggestion(current, {
        fileName: result.fileName || file.name,
        title: result.analysis.title,
        summary: result.analysis.summary,
        category: result.analysis.category,
      }));
      setUploadedFileName(file.name);
      setStep(1);
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'The document could not be analyzed.');
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const finish = () => {
    if (!identityReady || unreviewed.length > 0) return;
    onComplete(buildClientWorkspaceDraft(draft));
    onClose();
  };

  return (
    <div className="sigma-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <section role="dialog" aria-modal="true" aria-labelledby="client-onboarding-title" className="sigma-modal flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden">
        <header className="flex items-start justify-between gap-4 border-b border-[var(--sigma-border)] px-5 py-4 sm:px-7 sm:py-5">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-semibold text-[var(--sigma-primary)]">Client onboarding</p>
            <h2 id="client-onboarding-title" className="text-xl font-bold text-[var(--sigma-text)] sm:text-2xl">{steps[step]}</h2>
            <p className="mt-1 text-sm text-[var(--sigma-text-muted)]">Add the minimum facts now. Complete the profile and connect data when ready.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close onboarding" className="sigma-icon-button shrink-0"><X size={18} /></button>
        </header>

        <nav aria-label="Onboarding progress" className="border-b border-[var(--sigma-border)] px-5 py-3 sm:px-7">
          <ol className="grid grid-cols-4 gap-2">
            {steps.map((label, index) => (
              <li key={label} className="min-w-0">
                <div className={`h-1 rounded-full ${index <= step ? 'bg-[var(--sigma-primary)]' : 'bg-[var(--sigma-border)]'}`} />
                <span className={`mt-2 hidden truncate text-xs sm:block ${index === step ? 'font-semibold text-[var(--sigma-text)]' : 'text-[var(--sigma-text-muted)]'}`}>{index + 1}. {label}</span>
              </li>
            ))}
          </ol>
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          {step === 0 && (
            <div className="space-y-6">
              <div><h3 className="text-base font-semibold text-[var(--sigma-text)]">Choose how to start</h3><p className="mt-1 text-sm text-[var(--sigma-text-muted)]">Enter two required fields, or upload a source file to create reviewable suggestions.</p></div>
              <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
                <div className="sigma-subpanel p-4 sm:p-5">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--sigma-text)]"><Building2 size={17} className="text-[var(--sigma-primary)]" /> Enter manually</div>
                  <label className={labelClass} htmlFor="onboarding-company">Company name *</label>
                  <input id="onboarding-company" className={fieldClass} value={draft.companyName} onChange={(event) => updateManual('companyName', event.target.value)} placeholder="Acme Ltd" autoFocus />
                  <label className={`${labelClass} mt-4`} htmlFor="onboarding-domain">Website domain *</label>
                  <input id="onboarding-domain" className={fieldClass} value={draft.domain} onChange={(event) => updateManual('domain', event.target.value)} placeholder="acme.com" inputMode="url" />
                </div>
                <div className="flex items-center justify-center text-xs font-semibold text-[var(--sigma-text-muted)]">OR</div>
                <div className="sigma-subpanel flex flex-col p-4 sm:p-5">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--sigma-text)]"><FileText size={17} className="text-[var(--sigma-primary)]" /> Upload a client file</div>
                  <p className="mb-4 text-sm leading-6 text-[var(--sigma-text-muted)]">We will suggest profile fields from the document. You must review them before the workspace is created.</p>
                  <input ref={fileInputRef} type="file" className="sr-only" accept=".pdf,.txt,.md,.csv,.json" onChange={(event) => handleFile(event.target.files?.[0])} />
                  <button type="button" className="mt-auto flex min-h-24 items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--sigma-border-strong)] bg-[var(--sigma-surface)] px-4 py-5 text-sm font-semibold text-[var(--sigma-text)] hover:border-[var(--sigma-primary)] disabled:opacity-60" onClick={() => fileInputRef.current?.click()} disabled={isAnalyzing}>
                    {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}{isAnalyzing ? 'Analyzing document…' : 'Choose file'}
                  </button>
                  <p className="mt-3 text-xs text-[var(--sigma-text-muted)]">PDF, text, Markdown, CSV, or JSON. Spreadsheet uploads are temporarily unavailable. Max 15 MB.</p>
                  {fileError && <p role="alert" className="mt-3 text-sm text-red-600">{fileError}</p>}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div><h3 className="text-base font-semibold text-[var(--sigma-text)]">Review the client profile</h3><p className="mt-1 text-sm text-[var(--sigma-text-muted)]">File-derived fields are suggestions, not verified facts. Confirm or clear each one.</p>{uploadedFileName && <p className="mt-2 text-xs text-[var(--sigma-text-muted)]">Source file: {uploadedFileName}</p>}</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <ReviewField field="companyName" label="Company name" value={draft.companyName} source={draft.sources.companyName} onChange={(value) => updateManual('companyName', value)} onReview={reviewSuggestion} required />
                <ReviewField field="domain" label="Website domain" value={draft.domain} source={draft.sources.domain} onChange={(value) => updateManual('domain', value)} onReview={reviewSuggestion} required />
                <ReviewField field="industry" label="Industry" value={draft.industry} source={draft.sources.industry} onChange={(value) => updateManual('industry', value)} onReview={reviewSuggestion} />
                <ReviewField field="geography" label="Primary geography" value={draft.geography} source={draft.sources.geography} onChange={(value) => updateManual('geography', value)} onReview={reviewSuggestion} />
              </div>
              <ReviewField field="icp" label="Ideal customer profile" value={draft.icp} source={draft.sources.icp} onChange={(value) => updateManual('icp', value)} onReview={reviewSuggestion} multiline />
              <ReviewField field="corePositioning" label="Core positioning" value={draft.brandVault.corePositioning} source={draft.sources.corePositioning} onChange={(value) => updateBrand('corePositioning', value)} onReview={reviewSuggestion} multiline />
              <div className="grid gap-4 sm:grid-cols-2">
                <ReviewField field="offersAndPricing" label="Offers and pricing" value={draft.brandVault.offersAndPricing} source={draft.sources.offersAndPricing} onChange={(value) => updateBrand('offersAndPricing', value)} onReview={reviewSuggestion} multiline />
                <ReviewField field="voiceAndTone" label="Voice and tone" value={draft.brandVault.voiceAndTone} source={draft.sources.voiceAndTone} onChange={(value) => updateBrand('voiceAndTone', value)} onReview={reviewSuggestion} multiline />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="mx-auto max-w-2xl space-y-5">
              <div><h3 className="text-base font-semibold text-[var(--sigma-text)]">Choose data setup requests</h3><p className="mt-1 text-sm text-[var(--sigma-text-muted)]">Selection records setup intent only. It does not mean an account is connected or verified.</p></div>
              {[
                ['gsc', 'Google Search Console', 'sc-domain:example.com'], ['ga4', 'Google Analytics 4', 'properties/123456'], ['google_ads', 'Google Ads', '123-456-7890'], ['meta_ads', 'Meta Ads', 'act_123456'], ['hubspot', 'HubSpot', 'Portal ID'],
              ].map(([platform, name, placeholder]) => {
                const connector = draft.connectors.find((item) => item.platform === platform);
                return <div key={platform} className="sigma-subpanel p-4">
                  <label className="flex cursor-pointer items-center gap-3"><input type="checkbox" checked={Boolean(connector)} onChange={(event) => setDraft((current) => ({ ...current, connectors: event.target.checked ? [...current.connectors, { platform, accountName: name, propertyId: '' }] : current.connectors.filter((item) => item.platform !== platform) }))} /><span className="text-sm font-semibold text-[var(--sigma-text)]">Request {name} setup</span></label>
                  {connector && <input className={`${fieldClass} mt-3`} aria-label={`${name} property or account ID`} value={connector.propertyId} onChange={(event) => setDraft((current) => ({ ...current, connectors: current.connectors.map((item) => item.platform === platform ? { ...item, propertyId: event.target.value } : item) }))} placeholder={placeholder} />}
                </div>;
              })}
              <p className="rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)] p-4 text-sm text-[var(--sigma-text-muted)]">You can skip this step. Provider authorization and a successful runtime check are required before any connector is shown as live.</p>
            </div>
          )}

          {step === 3 && (
            <div className="mx-auto max-w-2xl space-y-5">
              <div><h3 className="text-base font-semibold text-[var(--sigma-text)]">Confirm workspace draft</h3><p className="mt-1 text-sm text-[var(--sigma-text-muted)]">This saves a client profile in this browser. It does not create cloud infrastructure, verify connectors, or run a diagnostic.</p></div>
              <dl className="sigma-subpanel divide-y divide-[var(--sigma-border)] px-4">
                <SummaryRow label="Client" value={draft.companyName || 'Missing'} /><SummaryRow label="Domain" value={normalizeDomain(draft.domain) || 'Missing'} /><SummaryRow label="Industry" value={draft.industry || 'Not provided'} /><SummaryRow label="ICP" value={draft.icp || 'Not provided'} /><SummaryRow label="Setup requests" value={draft.connectors.length ? draft.connectors.map((item) => item.accountName).join(', ') : 'None'} />
              </dl>
              {(!identityReady || unreviewed.length > 0) && <div role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-[var(--sigma-text)]">{!identityReady ? 'Company name and website domain are required.' : `${unreviewed.length} file-derived suggestion${unreviewed.length === 1 ? '' : 's'} still need review.`}</div>}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-[var(--sigma-border)] px-5 py-4 sm:px-7">
          <button type="button" onClick={() => step === 0 ? onClose() : setStep((current) => current - 1)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[var(--sigma-text-soft)] hover:bg-[var(--sigma-surface-subtle)]">{step > 0 && <ArrowLeft size={16} />}{step === 0 ? 'Cancel' : 'Back'}</button>
          {step < steps.length - 1 ? <button type="button" onClick={() => setStep((current) => current + 1)} disabled={step === 0 && !identityReady} className="flex items-center gap-2 rounded-xl bg-[var(--sigma-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Continue <ArrowRight size={16} /></button> : <button type="button" onClick={finish} disabled={!identityReady || unreviewed.length > 0} className="flex items-center gap-2 rounded-xl bg-[var(--sigma-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"><Check size={16} /> Create workspace draft</button>}
        </footer>
      </section>
    </div>
  );
}

function ReviewField({ field, label, value, source, onChange, onReview, multiline = false, required = false }: { field: OnboardingField; label: string; value: string; source?: ClientOnboardingDraft['sources'][OnboardingField]; onChange: (value: string) => void; onReview: (field: OnboardingField, accept: boolean) => void; multiline?: boolean; required?: boolean }) {
  const suggested = source?.status === 'suggested';
  return <div className={`rounded-xl ${suggested ? 'border border-amber-500/40 bg-amber-500/5 p-3' : ''}`}>
    <div className="mb-1.5 flex items-center justify-between gap-2"><label className="text-xs font-semibold text-[var(--sigma-text-soft)]">{label}{required ? ' *' : ''}</label>{source && <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${suggested ? 'bg-amber-500/15 text-amber-700 dark:text-amber-accent' : 'bg-[var(--sigma-surface-subtle)] text-[var(--sigma-text-muted)]'}`}>{suggested ? 'File suggestion · review' : source.kind === 'file' ? 'File · confirmed' : 'Entered manually'}</span>}</div>
    {multiline ? <textarea className={`${fieldClass} min-h-24 resize-y`} value={value} onChange={(event) => onChange(event.target.value)} /> : <input className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)} />}
    {suggested && <div className="mt-2 flex gap-2"><button type="button" className="rounded-lg bg-[var(--sigma-primary)] px-3 py-1.5 text-xs font-semibold text-white" onClick={() => onReview(field, true)}>Confirm</button><button type="button" className="rounded-lg border border-[var(--sigma-border)] bg-[var(--sigma-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--sigma-text)]" onClick={() => onReview(field, false)}>Clear</button></div>}
  </div>;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr]"><dt className="text-xs font-semibold text-[var(--sigma-text-muted)]">{label}</dt><dd className="min-w-0 break-words text-sm text-[var(--sigma-text)]">{value}</dd></div>;
}

