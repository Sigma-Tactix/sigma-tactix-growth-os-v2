import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react';

/**
 * A HUD panel the operator owns: drag it by the header, resize from the corner,
 * collapse it to its title bar, and it stays where it was put.
 *
 * Position and size are stored per panel id in localStorage as a fraction of
 * the container, so a panel dragged to the right edge on a wide monitor is
 * still on the right edge in a narrow one instead of off-screen. Everything is
 * clamped to the container on every read, so a stored layout from a bigger
 * viewport can never strand a panel outside the canvas.
 */

export interface PanelLayout {
  /** Fractions of the container, 0..1. */
  x: number;
  y: number;
  /** Pixels — panels have a natural size that should not scale with the view. */
  w: number;
  h: number | null;
}

const STORAGE_KEY = 'growth-matrix.hud.layout';
const MIN_W = 180;
const MIN_H = 90;

type LayoutMap = Record<string, PanelLayout>;

function readStored(): LayoutMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LayoutMap) : {};
  } catch {
    return {};
  }
}

function writeStored(map: LayoutMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* private mode — the layout just won't persist */
  }
}

/** Shared layout state for every panel in one Matrix instance. */
export function usePanelLayouts(defaults: Record<string, PanelLayout>) {
  const [layouts, setLayouts] = useState<LayoutMap>(() => ({ ...defaults, ...readStored() }));
  const [topPanel, setTopPanel] = useState<string | null>(null);

  const update = useCallback((id: string, next: PanelLayout) => {
    setLayouts((prev) => {
      const merged = { ...prev, [id]: next };
      writeStored(merged);
      return merged;
    });
  }, []);

  const reset = useCallback(() => {
    setLayouts({ ...defaults });
    writeStored({});
  }, [defaults]);

  return { layouts, update, reset, topPanel, setTopPanel };
}

interface HoloPanelProps {
  id: string;
  title: string;
  layout: PanelLayout;
  onLayoutChange: (next: PanelLayout) => void;
  /** Container the panel is clamped inside. */
  boundsRef: React.RefObject<HTMLElement | null>;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onFocus?: () => void;
  isTop?: boolean;
  headerRight?: React.ReactNode;
  resizable?: boolean;
  children: React.ReactNode;
}

export default function HoloPanel({
  id,
  title,
  layout,
  onLayoutChange,
  boundsRef,
  collapsed,
  onToggleCollapsed,
  onFocus,
  isTop,
  headerRight,
  resizable = true,
  children,
}: HoloPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ mode: 'move' | 'resize'; startX: number; startY: number; origin: PanelLayout } | null>(null);
  const [live, setLive] = useState<PanelLayout>(layout);

  useEffect(() => setLive(layout), [layout]);

  const bounds = () => boundsRef.current?.getBoundingClientRect();

  const clamp = useCallback(
    (next: PanelLayout): PanelLayout => {
      const rect = bounds();
      if (!rect) return next;
      const w = Math.min(Math.max(next.w, MIN_W), rect.width);
      const h = next.h === null ? null : Math.min(Math.max(next.h, MIN_H), rect.height);
      const maxX = rect.width > w ? (rect.width - w) / rect.width : 0;
      const panelH = h ?? panelRef.current?.offsetHeight ?? MIN_H;
      const maxY = rect.height > panelH ? (rect.height - panelH) / rect.height : 0;
      return {
        w,
        h,
        x: Math.min(Math.max(next.x, 0), maxX),
        y: Math.min(Math.max(next.y, 0), maxY),
      };
    },
    [boundsRef]
  );

  const onPointerDown = (mode: 'move' | 'resize') => (e: React.PointerEvent) => {
    // Never start a drag from a control inside the header.
    if (mode === 'move' && (e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    e.stopPropagation();
    onFocus?.();
    drag.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      origin: { ...live, h: live.h ?? panelRef.current?.offsetHeight ?? MIN_H },
    };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* capture unavailable */
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const state = drag.current;
    const rect = bounds();
    if (!state || !rect) return;
    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;

    if (state.mode === 'move') {
      setLive(
        clamp({
          ...state.origin,
          x: state.origin.x + dx / rect.width,
          y: state.origin.y + dy / rect.height,
        })
      );
    } else {
      setLive(
        clamp({
          ...state.origin,
          w: state.origin.w + dx,
          h: (state.origin.h ?? MIN_H) + dy,
        })
      );
    }
  };

  const endDrag = (e: React.PointerEvent) => {
    if (!drag.current) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      /* nothing captured */
    }
    drag.current = null;
    onLayoutChange(live);
  };

  /** Keyboard nudging, so the panels are not mouse-only. */
  const onHeaderKeyDown = (e: React.KeyboardEvent) => {
    const rect = bounds();
    if (!rect) return;
    const step = e.shiftKey ? 0.08 : 0.02;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    const next = clamp({ ...live, x: live.x + move[0], y: live.y + move[1] });
    setLive(next);
    onLayoutChange(next);
  };

  return (
    <div
      ref={panelRef}
      className={`absolute pointer-events-auto bg-[#050515]/92 border rounded-lg backdrop-blur-md font-mono ${
        isTop ? 'border-[#FF481B]/60 shadow-[0_0_28px_rgba(255,72,27,0.28)]' : 'border-[#FF481B]/30 shadow-[0_0_20px_rgba(255,72,27,0.12)]'
      }`}
      style={{
        left: `${live.x * 100}%`,
        top: `${live.y * 100}%`,
        width: live.w,
        height: collapsed ? undefined : live.h ?? undefined,
        zIndex: isTop ? 25 : 20,
      }}
      onPointerDownCapture={() => onFocus?.()}
    >
      <div
        role="toolbar"
        tabIndex={0}
        aria-label={`${title} panel — drag or use arrow keys to move`}
        onKeyDown={onHeaderKeyDown}
        onPointerDown={onPointerDown('move')}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="flex items-center justify-between gap-2 px-2 py-1.5 cursor-grab active:cursor-grabbing touch-none select-none rounded-t-lg focus:outline-none focus:ring-1 focus:ring-[#FF481B]/70"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <GripVertical className="h-3 w-3 text-[#FF481B]/70 shrink-0" aria-hidden />
          <span className="text-[10px] font-bold text-[#FFB088] tracking-wider truncate">{title}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {headerRight}
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? `Expand ${title}` : `Collapse ${title}`}
            aria-expanded={!collapsed}
            className="p-0.5 rounded text-[#FFB088]/70 hover:text-[#FF481B] hover:bg-[#FF481B]/10 transition cursor-pointer"
          >
            {collapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="border-t border-[#FF481B]/20 overflow-auto" style={{ maxHeight: live.h ? live.h - 30 : undefined }}>
          {children}
        </div>
      )}

      {!collapsed && resizable && (
        <div
          role="separator"
          aria-label={`Resize ${title}`}
          onPointerDown={onPointerDown('resize')}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize touch-none"
        >
          <svg viewBox="0 0 16 16" className="w-full h-full text-[#FF481B]/60" aria-hidden>
            <path d="M15 5 L5 15 M15 10 L10 15" stroke="currentColor" strokeWidth="1.4" fill="none" />
          </svg>
        </div>
      )}
    </div>
  );
}
