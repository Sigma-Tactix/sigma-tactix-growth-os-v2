import React from 'react';

export interface OrbColors {
  /** '#FF4B04' ocean dot-field mid tone */
  core: string;
  /** '#C43A00' far-side points */
  deep: string;
  /** '#FF8A4C' near-side points */
  glow: string;
  /** '#FFF3EC' continent clusters, near-white */
  land: string;
  /** '#FF6A24' orbit rings */
  ring: string;
  /** '#FFD9C4' ring nodes */
  node: string;
  /** '#7A1B00' atmospheric halo */
  bloom: string;
  /** '#000000' backdrop */
  ground: string;
}

export interface OrbSatelliteDef {
  id: string;
  ringIndex: number;
  phase: number; // 0 to 2*PI angle along the orbit
  label: string;
  category: 'file' | 'connector' | 'vault' | 'tool';
  subLabel?: string;
  status?: string;
  isReady?: boolean;
  size?: number; // base size (e.g. 3.5 to 5.5px)
  color?: string;
  pulse?: boolean;
  metadata?: Record<string, any>;
}

export interface ProjectedSatellite {
  id: string;
  x: number;
  y: number;
  z: number;
  k: number;
  size: number;
  alpha: number;
  isFront: boolean;
  definition: OrbSatelliteDef;
}

export interface OrbProps {
  /** 0→1 choreography position. If omitted, the component self-drives from its own scroll position. */
  progress?: number;
  /** Total points on the sphere at DPR 1. Auto-tiered by viewport if omitted. */
  density?: number; // default: 2600 desktop / 1400 tablet / 900 mobile
  /** Palette override. */
  colors?: Partial<OrbColors>;
  /** Orbit rings count. 0 disables. */
  rings?: number; // default 3
  /** Base Y-rotation in radians per frame at 60fps. */
  spin?: number; // default 0.0016
  /** Follow the pointer with a subtle parallax tilt. */
  interactive?: boolean; // default true
  /** Enable manual click/touch drag rotation. */
  enableDragRotation?: boolean; // default true
  /** Enable mouse wheel / pinch zooming. */
  enableWheelZoom?: boolean; // default true
  /** Initial zoom multiplier (0.6 to 2.5). */
  zoom?: number; // default 1.0
  /** Render one static frame and never animate. Forced true under reduced-motion. */
  still?: boolean; // default false
  /** Multiplier on the whole choreography. 0 = orb ignores scroll entirely. */
  scrollIntensity?: number; // default 1
  /** Interactive file & connector satellite definitions to render on orbit rings. */
  satellites?: OrbSatelliteDef[];
  /** Callback fired with projected 2D screen coordinates of satellites for hover/click interaction. */
  onProjectedSatellites?: (satellites: ProjectedSatellite[]) => void;
  className?: string;
  style?: React.CSSProperties;
  /** Fired once the first frame has painted — use to dismiss a loader. */
  onReady?: () => void;
}

export interface OrbEngineOptions {
  progress?: number;
  density?: number;
  colors?: Partial<OrbColors>;
  rings?: number;
  spin?: number;
  interactive?: boolean;
  enableDragRotation?: boolean;
  enableWheelZoom?: boolean;
  zoom?: number;
  still?: boolean;
  scrollIntensity?: number;
  satellites?: OrbSatelliteDef[];
  onProjectedSatellites?: (satellites: ProjectedSatellite[]) => void;
  onReady?: () => void;
}

export interface OrbEngine {
  start: () => void;
  stop: () => void;
  /** Freeze continuous Y-rotation without stopping the render loop */
  pauseSpin: () => void;
  /** Resume continuous Y-rotation */
  resumeSpin: () => void;
  setProgress: (progress: number) => void;
  setPointer: (x: number, y: number) => void;
  setZoom: (zoom: number) => void;
  getZoom: () => number;
  rotateBy: (deltaX: number, deltaY: number) => void;
  setRotation: (rotX: number, rotY: number) => void;
  getRotation: () => { rotX: number; rotY: number };
  setSatellites: (satellites: OrbSatelliteDef[]) => void;
  resize: () => void;
  destroy: () => void;
}

export interface ScrollProgressOptions {
  /** Start trigger description e.g. 'top top' (element top reaches viewport top) or 'top bottom' */
  start?: string;
  /** End trigger description e.g. 'bottom top' (element bottom reaches viewport top) */
  end?: string;
  /** Callback on computed scroll progress [0, 1] */
  onUpdate?: (progress: number) => void;
}
