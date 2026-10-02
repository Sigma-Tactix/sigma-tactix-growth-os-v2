import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Settings2, X, Sparkles, Mic } from 'lucide-react';
import { BorderBeam } from 'border-beam';
import { useVanta } from '@/src/contexts/VantaContext';
import { useToast } from '@/src/contexts/ToastContext';
import { getVantaVoiceSettings, saveVantaVoiceSettings, verifyVantaTextProvider, verifyVantaVoiceProvider, type VantaVoiceSettings } from '@/src/lib/vantaApi';
import { Button, GlassCard, Badge } from '@/src/components/ui';

export default function VantaProviderPanel() {
  const { state, refreshStatus } = useVanta();
  const { notifyError, notifySuccess } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [voice, setVoice] = useState<VantaVoiceSettings>({
    provider: 'gemini',
    sttModel: 'gemini-2.5-flash',
    ttsModel: 'gemini-2.5-flash-preview-tts',
    voice: 'Kore',
  });

  useEffect(() => {
    if (!open) return;
    void getVantaVoiceSettings().then(setVoice).catch(() => undefined);
  }, [open]);

  const run = async (key: string, action: () => Promise<void>, success: string) => {
    setBusy(key);
    try {
      await action();
      await refreshStatus();
      notifySuccess(success);
      if (key === 'voice') setVoice(previous => ({ ...previous, verified: true }));
    } catch (error) {
      notifyError('VANTA provider check failed', error instanceof Error ? error.message : 'Provider verification failed.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="relative">
      <button 
        type="button" 
        onClick={() => setOpen(value => !value)} 
        className="rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-bg-subtle)] p-2 text-[var(--sigma-text-secondary)] transition hover:border-[var(--sigma-primary)]/40 hover:text-[var(--sigma-text)] cursor-pointer" 
        aria-label="Configure VANTA providers"
      >
        <Settings2 size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(400px,calc(100vw-2rem))]">
          <BorderBeam size="md" colorVariant="mono" strength={0.35} active theme="dark">
            <div className="w-full rounded-2xl border border-[var(--sigma-border)] bg-[var(--sigma-bg)] p-5 shadow-2xl glass-panel animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-start justify-between pb-3 border-b border-[var(--sigma-border)]">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="vermilion" size="xs">VANTA ENGINE</Badge>
                <h2 className="text-sm font-semibold text-[var(--sigma-text)]">Provider Verification</h2>
              </div>
              <p className="mt-1 text-xs text-[var(--sigma-text-muted)] leading-relaxed">
                Credentials remain server-side. Live calls require handshake verification.
              </p>
            </div>
            <button 
              type="button" 
              onClick={() => setOpen(false)} 
              className="rounded-lg p-1 text-[var(--sigma-text-muted)] hover:bg-[var(--sigma-bg-subtle)] hover:text-[var(--sigma-text)] transition-colors cursor-pointer" 
              aria-label="Close provider settings"
            >
              <X size={15} />
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-bg-subtle)] p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-[var(--sigma-text)] flex items-center gap-1.5">
                  <Sparkles size={13} className="text-[var(--sigma-primary)]" />
                  Conversation · Gemini
                </p>
                <p className="text-[11px] font-mono text-[var(--sigma-text-muted)] mt-0.5">{state.provider.label}</p>
              </div>
              {state.provider.verified ? (
                <Badge variant="success" size="xs" dot>Verified</Badge>
              ) : (
                <Badge variant="warning" size="xs">Unverified</Badge>
              )}
            </div>
            <Button 
              type="button" 
              variant="primary"
              size="xs"
              disabled={busy !== null} 
              isLoading={busy === 'text'}
              onClick={() => void run('text', verifyVantaTextProvider, 'VANTA conversation provider verified')} 
              className="w-full"
            >
              Verify Conversation Provider
            </Button>
          </div>

          <div className="mt-3 space-y-3 rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-bg-subtle)] p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[var(--sigma-text)] flex items-center gap-1.5">
                <Mic size={13} className="text-[var(--sigma-primary)]" />
                Voice Input & Output
              </p>
              {voice.verified ? (
                <Badge variant="success" size="xs" dot>Verified</Badge>
              ) : (
                <Badge variant="neutral" size="xs">Pending</Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(['gemini', 'local'] as const).map(provider => (
                <button 
                  key={provider} 
                  type="button" 
                  onClick={() => setVoice(previous => ({ ...previous, provider, verified: false }))} 
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors cursor-pointer ${
                    voice.provider === provider 
                      ? 'border-[var(--sigma-primary)] bg-[var(--sigma-primary)]/10 text-[var(--sigma-primary)] font-semibold' 
                      : 'border-[var(--sigma-border)] text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)] hover:bg-[var(--sigma-bg)]'
                  }`}
                >
                  {provider}
                </button>
              ))}
            </div>

            <div className="space-y-2 pt-1">
              {voice.provider === 'local' && (
                <input 
                  value={voice.baseUrl || ''} 
                  onChange={event => setVoice(previous => ({ ...previous, baseUrl: event.target.value }))} 
                  placeholder="http://127.0.0.1:1234" 
                  className="w-full rounded-lg border border-[var(--sigma-border)] bg-[var(--sigma-bg)] px-3 py-1.5 text-xs font-mono text-[var(--sigma-text)] outline-none focus:border-[var(--sigma-primary)] transition-colors" 
                />
              )}
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1 text-[10px] text-[var(--sigma-text-muted)]">
                  <span>Transcription model</span>
                  <input
                    value={voice.sttModel || ''}
                    onChange={event => setVoice(previous => ({ ...previous, sttModel: event.target.value }))}
                    placeholder={voice.provider === 'local' ? 'whisper-1' : 'gemini-2.5-flash'}
                    className="w-full rounded-lg border border-[var(--sigma-border)] bg-[var(--sigma-bg)] px-3 py-1.5 text-xs font-mono text-[var(--sigma-text)] outline-none focus:border-[var(--sigma-primary)]"
                  />
                </label>
                <label className="space-y-1 text-[10px] text-[var(--sigma-text-muted)]">
                  <span>Speech model</span>
                  <input
                    value={voice.ttsModel || ''}
                    onChange={event => setVoice(previous => ({ ...previous, ttsModel: event.target.value }))}
                    placeholder={voice.provider === 'local' ? 'tts-1' : 'gemini-2.5-flash-preview-tts'}
                    className="w-full rounded-lg border border-[var(--sigma-border)] bg-[var(--sigma-bg)] px-3 py-1.5 text-xs font-mono text-[var(--sigma-text)] outline-none focus:border-[var(--sigma-primary)]"
                  />
                </label>
              </div>
              <label className="space-y-1 text-[10px] text-[var(--sigma-text-muted)]">
                <span>Voice</span>
                <input
                  value={voice.voice || ''}
                  onChange={event => setVoice(previous => ({ ...previous, voice: event.target.value }))}
                  placeholder={voice.provider === 'local' ? 'alloy' : 'Kore'}
                  className="w-full rounded-lg border border-[var(--sigma-border)] bg-[var(--sigma-bg)] px-3 py-1.5 text-xs font-mono text-[var(--sigma-text)] outline-none focus:border-[var(--sigma-primary)]"
                />
              </label>
              {voice.provider === 'local' && (
                <p className="text-[10px] text-[var(--sigma-text-muted)] leading-relaxed">
                  Only loopback endpoints accepted. On hosted servers, localhost refers to that server.
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <Button 
                type="button" 
                variant="secondary"
                size="xs"
                disabled={busy !== null} 
                onClick={() => void run('save', () => saveVantaVoiceSettings(voice), 'Voice settings saved; verify before use')} 
                className="flex-1"
              >
                Save
              </Button>
              <Button 
                type="button" 
                variant="primary"
                size="xs"
                disabled={busy !== null} 
                isLoading={busy === 'voice'}
                onClick={() => void run('voice', async () => {
                  await saveVantaVoiceSettings(voice);
                  await verifyVantaVoiceProvider();
                }, 'VANTA voice settings saved and provider verified')}
                className="flex-1"
              >
                Verify Voice
              </Button>
            </div>
          </div>
        </div>
      </BorderBeam>
    </div>
  )}
</div>
  );
}
