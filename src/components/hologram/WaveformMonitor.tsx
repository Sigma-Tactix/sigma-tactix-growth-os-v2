import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { HEALTH_COLOR, HEALTH_LABEL, HEALTH_GLYPH, type ModuleStatus } from '../../lib/hologramTelemetry';

/**
 * Module activity monitor.
 * Plots one band per Growth OS module: bar height is module real activity score,
 * bar colour is its health, and the trace across the top is the activity profile.
 */

interface WaveformMonitorProps {
  isInspecting?: boolean;
  statuses: ModuleStatus[];
  selectedModuleKey?: string | null;
  onSelectModule?: (moduleKey: string) => void;
}

export default function WaveformMonitor({
  isInspecting = false,
  statuses,
  selectedModuleKey = null,
  onSelectModule,
}: WaveformMonitorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameIdRef = useRef<number>(0);
  const statusesRef = useRef(statuses);
  statusesRef.current = statuses;
  const selectedRef = useRef(selectedModuleKey);
  selectedRef.current = selectedModuleKey;

  const stats = useMemo(() => {
    if (!statuses.length) {
      return { peak: null as ModuleStatus | null, mean: 0, blocked: 0, pending: 0, coverage: 0 };
    }
    const peak = statuses.reduce((a, b) => (b.activity > a.activity ? b : a));
    const mean = statuses.reduce((sum, s) => sum + s.activity, 0) / statuses.length;
    return {
      peak,
      mean,
      blocked: statuses.filter((s) => s.health === 'blocked').length,
      pending: statuses.filter((s) => s.health === 'pending').length,
      coverage: statuses.filter((s) => s.health !== 'blocked' && s.health !== 'locked').length / statuses.length,
    };
  }, [statuses]);

  /** Ambient audio only — explicitly not a sonification of the data. */
  const toggleAudio = useCallback(() => {
    if (audioEnabled) {
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
      setAudioEnabled(false);
      return;
    }
    try {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.045, ctx.currentTime);
      masterGain.connect(ctx.destination);

      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(55, ctx.currentTime);
      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(220, ctx.currentTime);
      const osc2Gain = ctx.createGain();
      osc2Gain.gain.setValueAtTime(0.025, ctx.currentTime);

      osc2.connect(osc2Gain);
      osc2Gain.connect(masterGain);
      osc1.connect(masterGain);
      osc1.start();
      osc2.start();

      audioCtxRef.current = ctx;
      setAudioEnabled(true);
    } catch (err) {
      console.warn('Web Audio API not supported or blocked:', err);
    }
  }, [audioEnabled]);

  useEffect(() => () => { audioCtxRef.current?.close().catch(() => {}); }, []);

  // Backing store follows panel width
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      const width = Math.max(160, Math.floor(wrap.clientWidth - 20));
      if (canvas.width !== width) canvas.width = width;
    });
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const render = () => {
      time += 0.02;
      const width = canvas.width;
      const height = canvas.height;
      const current = statusesRef.current;
      ctx.clearRect(0, 0, width, height);

      // Grid
      ctx.strokeStyle = 'rgba(255, 72, 27, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < width; x += 16) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
      for (let y = 0; y < height; y += 12) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
      ctx.stroke();

      if (!current.length) {
        ctx.fillStyle = 'rgba(255, 176, 136, 0.7)';
        ctx.font = '10px monospace';
        ctx.fillText('NO MODULE TELEMETRY', 12, height / 2);
        animFrameIdRef.current = requestAnimationFrame(render);
        return;
      }

      const padding = 10;
      const usable = width - padding * 2;
      const slot = usable / current.length;
      const baseline = height - 14;
      const maxBar = baseline - 18;

      // Activity profile across modules
      ctx.beginPath();
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = '#FF481B';
      ctx.shadowColor = '#FF481B';
      ctx.shadowBlur = 8;
      current.forEach((status, i) => {
        const x = padding + slot * (i + 0.5);
        const y = baseline - status.activity * maxBar;
        if (i === 0) ctx.moveTo(x, y);
        else {
          const prevX = padding + slot * (i - 0.5);
          const prevY = baseline - current[i - 1].activity * maxBar;
          const midX = (prevX + x) / 2;
          ctx.bezierCurveTo(midX, prevY, midX, y, x, y);
        }
      });
      ctx.stroke();
      ctx.shadowBlur = 0;

      // One bar per module, coloured by health
      current.forEach((status, i) => {
        const x = padding + slot * i + slot * 0.2;
        const barWidth = Math.max(2, slot * 0.6);
        const barHeight = Math.max(2, status.activity * maxBar);
        const isSelected = status.moduleKey === selectedRef.current;

        ctx.fillStyle = HEALTH_COLOR[status.health];
        ctx.globalAlpha = isSelected ? 1 : 0.75;
        ctx.fillRect(x, baseline - barHeight, barWidth, barHeight);

        if (isSelected) {
          ctx.globalAlpha = 1;
          ctx.strokeStyle = '#FFF7ED';
          ctx.lineWidth = 1;
          ctx.strokeRect(x - 1, baseline - barHeight - 1, barWidth + 2, barHeight + 2);
        }
        ctx.globalAlpha = 1;
      });

      // Baseline
      ctx.strokeStyle = 'rgba(255, 72, 27, 0.35)';
      ctx.beginPath();
      ctx.moveTo(0, baseline);
      ctx.lineTo(width, baseline);
      ctx.stroke();

      // Decorative scan line
      const scanX = (time * 40) % width;
      const gradient = ctx.createLinearGradient(scanX - 30, 0, scanX, 0);
      gradient.addColorStop(0, 'rgba(255, 122, 60, 0)');
      gradient.addColorStop(1, `rgba(255, 122, 60, ${isInspecting ? 0.35 : 0.18})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(scanX - 30, 0, 30, height);

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrameIdRef.current);
  }, [isInspecting]);

  const indexFromEvent = (e: React.MouseEvent<HTMLCanvasElement>): number | null => {
    const canvas = canvasRef.current;
    if (!canvas || !statuses.length) return null;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const padding = 10;
    const slot = (canvas.width - padding * 2) / statuses.length;
    const index = Math.floor((x - padding) / slot);
    return index >= 0 && index < statuses.length ? index : null;
  };

  const hovered = hoverIndex !== null ? statuses[hoverIndex] : null;

  return (
    <div ref={wrapRef} className="px-2.5 py-2 w-full">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span
          className="text-[8px] px-1 py-0.5 rounded border border-[#FF481B]/40 text-[#FFB088]"
          title="Share of modules whose dependencies are satisfied"
        >
          COVERAGE {Math.round(stats.coverage * 100)}%
        </span>
        <button
          type="button"
          onClick={toggleAudio}
          title={audioEnabled ? 'Mute ambient tone' : 'Play ambient tone'}
          aria-label={audioEnabled ? 'Mute ambient tone' : 'Play ambient tone'}
          aria-pressed={audioEnabled}
          className="p-1 rounded hover:bg-[#FF481B]/15 transition cursor-pointer"
        >
          {audioEnabled ? (
            <Volume2 className="h-3 w-3 text-[#FF481B]" aria-hidden />
          ) : (
            <VolumeX className="h-3 w-3 text-neutral-500" aria-hidden />
          )}
        </button>
      </div>
      <div>
        <canvas
          ref={canvasRef}
          height={76}
          className="w-full h-[76px] cursor-pointer block"
          onMouseMove={(e) => setHoverIndex(indexFromEvent(e))}
          onMouseLeave={() => setHoverIndex(null)}
          onClick={(e) => {
            const idx = indexFromEvent(e);
            if (idx !== null) onSelectModule?.(statuses[idx].moduleKey);
          }}
          role="img"
          aria-label={`Activity by module. ${statuses
            .map((s) => `${s.label}: ${HEALTH_LABEL[s.health]}`)
            .join('. ')}`}
        />

        {hovered ? (
          <div className="mt-1.5 pt-1.5 border-t border-[#FF481B]/15">
            <div className="flex items-center gap-1.5">
              <span aria-hidden style={{ color: HEALTH_COLOR[hovered.health] }} className="text-[10px]">
                {HEALTH_GLYPH[hovered.health]}
              </span>
              <span className="text-[10px] text-white font-bold truncate">{hovered.label}</span>
            </div>
            <div className="text-[8px] text-slate-400 mt-0.5 truncate">{hovered.headline}</div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 mt-1.5 pt-1.5 border-t border-[#FF481B]/15 text-[8px]">
            <div>
              <span className="text-slate-500 block">BUSIEST</span>
              <span className="text-[#FFB088] font-bold truncate block">
                {stats.peak && stats.peak.activity > 0 ? stats.peak.label : 'IDLE'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">MEAN_LOAD</span>
              <span className="text-[#FFB088] font-bold">{Math.round(stats.mean * 100)}%</span>
            </div>
            <div>
              <span className="text-slate-500 block">BLOCKED</span>
              <span className={stats.blocked ? 'text-[#EC4899] font-bold' : 'text-[#35C9A5] font-bold'}>
                {stats.blocked || 'NONE'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
