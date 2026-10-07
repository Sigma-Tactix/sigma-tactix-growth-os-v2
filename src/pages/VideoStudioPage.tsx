import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock, Download, Film, Play, RefreshCw, ShieldCheck, Sliders, Video } from 'lucide-react';
import { useToast } from '@/src/contexts/ToastContext';
import { apiFetch } from '@/src/lib/api';
import { getCreativeProvidersStatus, queueDeterministicRender, type CreativeProviderStatus } from '@/src/lib/creativeApi';
import AgentRunResults, { type AgentRunRecord } from '@/src/components/AgentRunResults';
import { Badge, Button, GlassCard } from '@/src/components/ui';

type AspectRatio = '9:16' | '16:9' | '1:1';
const LAST_RENDER_STORAGE_KEY = 'sigma.video-studio.last-render';

interface QueuedRender {
  id: string;
  status: string;
}

function parseArtifact(task: any): { downloadUrl?: string; sceneCount?: number; hasVoiceover?: boolean } | null {
  if (!task?.output || typeof task.output !== 'string') return null;
  try {
    const parsed = JSON.parse(task.output);
    return parsed?.kind === 'deterministic_mp4' ? parsed : null;
  } catch {
    return null;
  }
}

export default function VideoStudioPage() {
  const { notifyError, notifyInfo, notifySuccess } = useToast();
  const [title, setTitle] = useState('Sigma Tactix Growth OS');
  const [subtitle, setSubtitle] = useState('Evidence-led growth operations with human approval at every execution gate.');
  const [cta, setCta] = useState('SIGMATACTIX.COM');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [durationSeconds, setDurationSeconds] = useState(8);
  const [providers, setProviders] = useState<CreativeProviderStatus[]>([]);
  const [queueing, setQueueing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [queuedRender, setQueuedRender] = useState<QueuedRender | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = window.sessionStorage.getItem(LAST_RENDER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [artifactUrl, setArtifactUrl] = useState('');
  const [runHistory, setRunHistory] = useState<AgentRunRecord[]>([]);

  const loadArtifact = async (downloadUrl: string) => {
    const response = await apiFetch(downloadUrl);
    if (!response.ok) {
      const failure = await response.json().catch(() => ({}));
      throw new Error(failure.error || 'Could not load the authenticated MP4 artifact.');
    }
    const blob = await response.blob();
    if (!blob.type.startsWith('video/')) throw new Error('The renderer artifact is not a video response.');
    const objectUrl = URL.createObjectURL(blob);
    setArtifactUrl(previous => {
      if (previous.startsWith('blob:')) URL.revokeObjectURL(previous);
      return objectUrl;
    });
  };

  useEffect(() => {
    getCreativeProvidersStatus().then(setProviders).catch(() => setProviders([]));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !queuedRender) return;
    window.sessionStorage.setItem(LAST_RENDER_STORAGE_KEY, JSON.stringify(queuedRender));
  }, [queuedRender]);

  useEffect(() => {
    let active = true;
    apiFetch('/api/workspace')
      .then(async response => ({ response, workspace: await response.json().catch(() => ({})) }))
      .then(({ response, workspace }) => {
        if (!active || !response.ok || !Array.isArray(workspace.agentTasks)) return;
        const latest = workspace.agentTasks.find((task: any) => task?.creativeRender);
        if (!latest) return;
        setQueuedRender({ id: latest.id, status: latest.status });
        const artifact = parseArtifact(latest);
        if (latest.status === 'Success' && artifact?.downloadUrl) void loadArtifact(artifact.downloadUrl).catch(() => undefined);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => () => {
    if (artifactUrl.startsWith('blob:')) URL.revokeObjectURL(artifactUrl);
  }, [artifactUrl]);

  const hyperframes = useMemo(
    () => providers.find(provider => provider.provider === 'hyperframes'),
    [providers],
  );

  const queueRender = async () => {
    if (!title.trim()) {
      notifyError('Title required', 'Enter the headline that should appear in the rendered video.');
      return;
    }
    setQueueing(true);
    try {
      const result = await queueDeterministicRender({
        title: title.trim(),
        subtitle: subtitle.trim(),
        cta: cta.trim(),
        aspectRatio,
        durationSeconds,
      });
      setQueuedRender({ id: result.task.id, status: result.task.status });
      setArtifactUrl('');
      notifySuccess('Render queued for approval', `${result.task.id} is pending owner/admin approval in Agent Cockpit.`);
    } catch (error: any) {
      notifyError('Could not queue render', error?.message || 'The deterministic renderer is unavailable.');
    } finally {
      setQueueing(false);
    }
  };

  const checkRender = async () => {
    if (!queuedRender) return;
    setChecking(true);
    try {
      const response = await apiFetch('/api/workspace');
      const workspace = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(workspace.error || 'Could not read workspace render status.');
      const task = Array.isArray(workspace.agentTasks)
        ? workspace.agentTasks.find((candidate: any) => candidate.id === queuedRender.id)
        : null;
      if (!task) throw new Error('The queued render task is not present in this workspace.');
      setQueuedRender({ id: task.id, status: task.status });
      const artifact = parseArtifact(task);
      if (task.status === 'Success' && artifact?.downloadUrl) {
        await loadArtifact(artifact.downloadUrl);
        setRunHistory(current => current.some(run => run.id === task.id) ? current : [{
          id: task.id,
          agentName: 'Creative Director Agent',
          agentRole: 'Approval-gated deterministic renderer',
          timestamp: task.reviewedAt || task.timestamp,
          status: 'SUCCESS',
          moduleOrigin: 'Video & Motion Studio',
          inputSummary: `${aspectRatio} / ${durationSeconds}s / ${title}`,
          outputSummary: `HyperFrames produced an authenticated ${artifact.sceneCount || 3}-scene MP4 with ${artifact.hasVoiceover ? 'a verified voice-over track' : 'no verified voice-over track'}.`,
          fullOutput: task.output,
          metrics: [
            { label: 'Renderer', value: 'HyperFrames' },
            { label: 'Aspect ratio', value: aspectRatio },
            { label: 'Duration', value: `${durationSeconds}s` },
            { label: 'Scenes', value: `${artifact.sceneCount || 3}` },
            { label: 'Voice-over', value: artifact.hasVoiceover ? 'Verified audio stream' : 'Not verified' },
          ],
        }, ...current]);
        notifySuccess('Render complete', 'The verified MP4 is ready below.');
      } else if (task.status === 'Failed' || task.status === 'Rejected') {
        notifyError(`Render ${task.status.toLowerCase()}`, task.output || 'Open Agent Cockpit for the execution record.');
      } else {
        notifyInfo('Render not complete', `Current status: ${task.status}.`);
      }
    } catch (error: any) {
      notifyError('Status check failed', error?.message || 'Could not verify the render task.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <GlassCard spotlight elevation="raised" className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="vermilion">CREATION LAYER</Badge>
              <Badge variant="neutral">HYPERFRAMES MP4</Badge>
              <span className={`flex items-center gap-1 text-xs font-mono ${hyperframes?.active ? 'text-emerald-400' : 'text-amber-400'}`}>
                <ShieldCheck className="h-3.5 w-3.5" />
                {hyperframes?.active ? 'Renderer ready' : 'Renderer not verified'}
              </span>
            </div>
            <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white md:text-3xl">
              <Video className="h-7 w-7 text-[var(--sigma-vermilion)]" />
              Video &amp; Motion Studio
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-400">
              Build a three-scene branded motion creative with a local voice-over, queue it for approval, and download the MP4 only after the governed render succeeds.
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <section className="space-y-5 rounded-2xl border border-white/10 bg-[#0F0F12] p-5 lg:col-span-5">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Sliders className="h-4 w-4 text-amber-400" /> Render specification
          </h2>
          <label className="block text-xs font-medium text-slate-300">
            Headline
            <input value={title} onChange={event => setTitle(event.target.value)} maxLength={160} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-500/50" />
          </label>
          <label className="block text-xs font-medium text-slate-300">
            Supporting message
            <textarea value={subtitle} onChange={event => setSubtitle(event.target.value)} maxLength={240} rows={4} className="mt-1.5 w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs leading-relaxed text-slate-200 outline-none focus:border-amber-500/50" />
          </label>
          <label className="block text-xs font-medium text-slate-300">
            CTA label
            <input value={cta} onChange={event => setCta(event.target.value)} maxLength={80} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-amber-500/50" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-medium text-slate-300">
              Aspect ratio
              <select value={aspectRatio} onChange={event => setAspectRatio(event.target.value as AspectRatio)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-300">
                <option value="9:16">9:16 Shorts / Reels</option>
                <option value="16:9">16:9 YouTube / Web</option>
                <option value="1:1">1:1 Social feed</option>
              </select>
            </label>
            <label className="text-xs font-medium text-slate-300">
              Duration
              <select value={durationSeconds} onChange={event => setDurationSeconds(Number(event.target.value))} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-300">
                <option value={5}>5 seconds</option>
                <option value={8}>8 seconds</option>
                <option value={15}>15 seconds</option>
                <option value={30}>30 seconds</option>
              </select>
            </label>
          </div>
          <Button variant="primary" onClick={queueRender} disabled={queueing} className="w-full justify-center" leftIcon={queueing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}>
            {queueing ? 'Queueing governed render...' : 'Queue HyperFrames render'}
          </Button>

          {queuedRender && (
            <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-amber-300">{queuedRender.id}</span>
                <Badge variant={queuedRender.status === 'Success' ? 'success' : 'warning'}>{queuedRender.status}</Badge>
              </div>
              <p className="text-zinc-400">Approve this task in Agent Cockpit, then return here to verify the stitched three-scene MP4 and its voice-over track.</p>
              <div className="flex flex-wrap gap-2">
                <a href="/agents" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-zinc-200 hover:bg-white/10">Open Agent Cockpit</a>
                <button onClick={checkRender} disabled={checking} className="rounded-lg bg-amber-600 px-3 py-2 font-medium text-white hover:bg-amber-500 disabled:opacity-50">
                  {checking ? 'Checking...' : 'Check render status'}
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-2xl border border-white/10 bg-[#0F0F12] p-6 lg:col-span-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-white"><Film className="h-4 w-4 text-amber-400" /> Output</h2>
              <p className="mt-1 text-xs text-zinc-500">Only an approved MP4 with three scenes and a verified voice-over stream appears here.</p>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500"><Clock className="h-3.5 w-3.5" /> {durationSeconds}s / {aspectRatio}</span>
          </div>

          {artifactUrl ? (
            <div className="space-y-3">
              <video src={artifactUrl} controls playsInline className={`mx-auto max-h-[620px] rounded-xl border border-emerald-500/30 bg-black ${aspectRatio === '9:16' ? 'max-w-[350px]' : 'w-full'}`} />
              <a href={artifactUrl} download className="mx-auto flex w-fit items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500"><Download className="h-4 w-4" /> Download verified MP4</a>
            </div>
          ) : (
            <div className={`mx-auto flex min-h-[440px] flex-col justify-end overflow-hidden rounded-2xl border border-amber-500/20 bg-[radial-gradient(circle_at_80%_0%,rgba(217,119,6,.45),transparent_38%),linear-gradient(180deg,#07090d,#030405)] p-8 ${aspectRatio === '9:16' ? 'max-w-[340px]' : 'w-full'}`}>
              <div className="mb-auto text-[10px] font-bold tracking-[0.22em] text-amber-400">SIGMA TACTIX / LAYOUT PREVIEW</div>
              <h3 className="max-w-xl text-4xl font-extrabold leading-[0.95] tracking-[-0.05em] text-white">{title || 'Untitled motion creative'}</h3>
              <p className="mt-5 max-w-lg text-sm leading-relaxed text-zinc-300">{subtitle || 'Add a supporting message.'}</p>
              <div className="mt-12 flex items-center justify-between border-t border-amber-500/30 pt-4 text-[10px] tracking-[0.14em] text-amber-400"><span>{cta || 'CTA'}</span><span>NOT YET RENDERED</span></div>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-white/10 bg-[#0F0F12] p-5">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Storyboard status</h2>
        <div className="mt-4 rounded-xl border border-dashed border-white/10 p-6 text-center">
          <p className="font-medium text-zinc-200">No storyboard scenes yet</p>
          <p className="mx-auto mt-1 max-w-xl text-xs leading-relaxed text-zinc-500">The previous scene list was demo data and did not produce video. This studio now queues a real deterministic render; generative multi-scene footage will remain unavailable until a verified footage provider is connected.</p>
        </div>
      </section>

      {runHistory.length > 0 && <AgentRunResults records={runHistory} title="Verified Video Studio Runs" description="Only completed renderer artifacts appear here." onClear={() => setRunHistory([])} />}
    </div>
  );
}
