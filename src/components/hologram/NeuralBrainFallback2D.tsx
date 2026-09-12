import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { ShieldCheck, Sparkles, Activity, Layers, Radio, Cpu, Zap, Eye } from 'lucide-react';
import { HoloNode3D, HoloLink3D } from '../../lib/hologramGraph';
import { PlanetAssignment } from '../../lib/hologramPlanets';
import { HoloCameraPreset } from './HoloTelemetryHUD';

export type ConsciousnessMode = 'JARVIS' | 'ULTRON';

interface NeuralBrainFallback2DProps {
  nodes: HoloNode3D[];
  links: HoloLink3D[];
  selectedId: string | null;
  onSelectNode: (node: HoloNode3D | null) => void;
  resetSignal: number;
  zoomInSignal: number;
  zoomOutSignal: number;
  cameraPreset: HoloCameraPreset;
  onHoverNode?: (node: HoloNode3D | null) => void;
  healthColors?: Record<string, string>;
  coreActivity?: number;
  onCameraChange?: (readout: { azimuth: number; elevation: number; distance: number }) => void;
  planets: PlanetAssignment[];
  orbitMotion: boolean;
  activeMode?: ConsciousnessMode;
}

interface SynapticPulse {
  progress: number;
  speed: number;
  targetIndex: number;
  color: string;
}

interface QuantumParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  tendrilPhase: number;
}

const SECOND_BRAIN_VAULTS = [
  { key: 'brand', label: 'Brand Vault', subtitle: 'Identity & Voice', color: '#F59E0B', angle: -Math.PI * 0.45, dist: 180 },
  { key: 'customer', label: 'Customer Vault', subtitle: 'ICP & Personas', color: '#06B6D4', angle: -Math.PI * 0.15, dist: 220 },
  { key: 'website', label: 'Website Vault', subtitle: 'CRO & Architecture', color: '#8B5CF6', angle: Math.PI * 0.25, dist: 190 },
  { key: 'marketing', label: 'Marketing Vault', subtitle: 'Paid Ads & Outbound', color: '#EC4899', angle: Math.PI * 0.65, dist: 230 },
  { key: 'operations', label: 'Operations Vault', subtitle: 'Data Pipelines & SOPs', color: '#10B981', angle: Math.PI * 1.05, dist: 200 }
];

export default function NeuralBrainFallback2D({
  nodes,
  links,
  selectedId,
  onSelectNode,
  resetSignal,
  zoomInSignal,
  zoomOutSignal,
  cameraPreset,
  onHoverNode,
  healthColors = {},
  coreActivity = 0.4,
  onCameraChange,
  planets,
  orbitMotion,
  activeMode = 'ULTRON',
}: NeuralBrainFallback2DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [zoom, setZoom] = useState(1.0);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [hoveredVaultKey, setHoveredVaultKey] = useState<string | null>(null);

  const angleRef = useRef(0);
  const particlesRef = useRef<QuantumParticle[]>([]);
  const pulsesRef = useRef<SynapticPulse[]>([]);

  // Initialize quantum/synaptic particles
  useEffect(() => {
    const particles: QuantumParticle[] = [];
    const count = 160;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 260 + 30;
      particles.push({
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2.5 + 0.8,
        alpha: Math.random() * 0.7 + 0.3,
        color: activeMode === 'JARVIS'
          ? (Math.random() > 0.5 ? '#F59E0B' : '#FBBF24')
          : (Math.random() > 0.6 ? '#00F0FF' : Math.random() > 0.3 ? '#A855F7' : '#EF4444'),
        tendrilPhase: Math.random() * Math.PI * 2,
      });
    }
    particlesRef.current = particles;
  }, [activeMode]);

  // Handle zoom & reset signals
  useEffect(() => {
    if (zoomInSignal > 0) setZoom((z) => Math.min(2.5, z * 1.2));
  }, [zoomInSignal]);

  useEffect(() => {
    if (zoomOutSignal > 0) setZoom((z) => Math.max(0.4, z / 1.2));
  }, [zoomOutSignal]);

  useEffect(() => {
    if (resetSignal > 0) {
      setZoom(1.0);
      setPanOffset({ x: 0, y: 0 });
      setRotationAngle(0);
      angleRef.current = 0;
    }
  }, [resetSignal]);

  // Animation Loop
  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      if (width === 0 || height === 0) return;

      const time = performance.now() * 0.001;

      // Deep space backdrop
      ctx.clearRect(0, 0, width, height);
      const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, Math.max(width, height) * 0.8);
      if (activeMode === 'JARVIS') {
        bgGrad.addColorStop(0, '#0f0c05');
        bgGrad.addColorStop(0.5, '#070502');
        bgGrad.addColorStop(1, '#020101');
      } else {
        bgGrad.addColorStop(0, '#050914');
        bgGrad.addColorStop(0.4, '#03050c');
        bgGrad.addColorStop(0.8, '#010207');
        bgGrad.addColorStop(1, '#000002');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Orbital rotation angle
      if (orbitMotion && !isDragging) {
        angleRef.current += activeMode === 'JARVIS' ? 0.002 : 0.004;
      }
      const curAngle = angleRef.current + rotationAngle;

      const cx = width / 2 + panOffset.x;
      const cy = height / 2 + panOffset.y;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(zoom, zoom);

      // 1. Draw Synaptic Tendril Lines from Core to 5 Second Brain Vaults
      SECOND_BRAIN_VAULTS.forEach((vault, idx) => {
        const vAngle = vault.angle + (activeMode === 'JARVIS' ? 0 : Math.sin(time * 0.5 + idx) * 0.08);
        const vx = Math.cos(vAngle) * vault.dist;
        const vy = Math.sin(vAngle) * vault.dist;

        ctx.beginPath();
        ctx.moveTo(0, 0);

        if (activeMode === 'JARVIS') {
          // Clean golden harmonic arc
          const midX = vx * 0.5 + Math.sin(idx * 1.5) * 20;
          const midY = vy * 0.5 - Math.cos(idx * 1.5) * 20;
          ctx.quadraticCurveTo(midX, midY, vx, vy);
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
          ctx.lineWidth = 1.5;
        } else {
          // Ultron undulating synaptic tendril
          const wave = Math.sin(time * 3 + idx * 2) * 22;
          const midX = vx * 0.5 + wave;
          const midY = vy * 0.5 - wave;
          ctx.quadraticCurveTo(midX, midY, vx, vy);
          ctx.strokeStyle = `rgba(${idx % 2 === 0 ? '0, 240, 255' : '168, 85, 247'}, 0.4)`;
          ctx.lineWidth = 2.0;
        }
        ctx.stroke();

        // Animated Synaptic Pulse along the tendril
        const pulseProgress = (time * 0.8 + idx * 0.2) % 1.0;
        const px = Math.pow(1 - pulseProgress, 2) * 0 + 2 * (1 - pulseProgress) * pulseProgress * (vx * 0.5) + Math.pow(pulseProgress, 2) * vx;
        const py = Math.pow(1 - pulseProgress, 2) * 0 + 2 * (1 - pulseProgress) * pulseProgress * (vy * 0.5) + Math.pow(pulseProgress, 2) * vy;

        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = activeMode === 'JARVIS' ? '#FBBF24' : '#00F0FF';
        ctx.shadowColor = activeMode === 'JARVIS' ? '#F59E0B' : '#00F0FF';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 2. Quantum Synaptic Particles
      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        const dist = Math.hypot(p.x, p.y);
        if (dist > 300) {
          p.x = (Math.random() - 0.5) * 60;
          p.y = (Math.random() - 0.5) * 60;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // 3. Central Core Rendering (Ultron vs Jarvis)
      if (activeMode === 'JARVIS') {
        // --- JARVIS PROTOCOL: Golden Gyro Gimbals & Geodesic Order ---
        const gyroTime = time * 0.6;

        // Concentric Gyro Rings
        [85, 65, 45].forEach((radius, i) => {
          ctx.beginPath();
          ctx.save();
          ctx.rotate(gyroTime * (i % 2 === 0 ? 1 : -1) + (i * Math.PI) / 3);
          ctx.ellipse(0, 0, radius, radius * 0.45, 0, 0, Math.PI * 2);
          ctx.strokeStyle = i === 0 ? 'rgba(245, 158, 11, 0.55)' : i === 1 ? 'rgba(251, 191, 36, 0.4)' : 'rgba(245, 158, 11, 0.7)';
          ctx.lineWidth = i === 2 ? 2.2 : 1.2;
          ctx.stroke();

          // Small ring tracking nodes
          const dotAngle = gyroTime * 2 + (i * Math.PI) / 2;
          const dx = Math.cos(dotAngle) * radius;
          const dy = Math.sin(dotAngle) * radius * 0.45;
          ctx.beginPath();
          ctx.arc(dx, dy, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#FDE68A';
          ctx.shadowColor = '#F59E0B';
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.restore();
        });

        // Golden Geodesic Core Aura
        const jAura = ctx.createRadialGradient(0, 0, 10, 0, 0, 50);
        jAura.addColorStop(0, 'rgba(254, 243, 199, 0.9)');
        jAura.addColorStop(0.3, 'rgba(245, 158, 11, 0.5)');
        jAura.addColorStop(0.7, 'rgba(217, 119, 6, 0.2)');
        jAura.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = jAura;
        ctx.beginPath();
        ctx.arc(0, 0, 50, 0, Math.PI * 2);
        ctx.fill();

        // Central Core Sphere
        const jCore = ctx.createRadialGradient(0, 0, 0, 0, 0, 24);
        jCore.addColorStop(0, '#FFFFFF');
        jCore.addColorStop(0.4, '#FBBF24');
        jCore.addColorStop(0.8, '#D97706');
        jCore.addColorStop(1, '#78350F');
        ctx.fillStyle = jCore;
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.fill();

        // Jarvis HUD reticle ticks
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
        ctx.lineWidth = 1;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
          const x1 = Math.cos(a) * 32;
          const y1 = Math.sin(a) * 32;
          const x2 = Math.cos(a) * 38;
          const y2 = Math.sin(a) * 38;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }

        // Jarvis Typography
        ctx.fillStyle = '#FEF3C7';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('JARVIS AI', 0, -5);
        ctx.font = '7px monospace';
        ctx.fillStyle = '#F59E0B';
        ctx.fillText('PROTOCOL 4.2', 0, 7);

      } else {
        // --- ULTRON CONSCIOUSNESS: Undulating Neural Lattice & Organic Synaptic Tendrils ---
        const ultronPulse = Math.sin(time * 4) * 4 + coreActivity * 12;
        const uRadius = 38 + ultronPulse;

        // Ultron Electric Crimson & Cyan Energy Cloud
        const uAura = ctx.createRadialGradient(0, 0, 10, 0, 0, uRadius * 2.0);
        uAura.addColorStop(0, 'rgba(0, 240, 255, 0.85)');
        uAura.addColorStop(0.35, 'rgba(168, 85, 247, 0.45)');
        uAura.addColorStop(0.7, 'rgba(239, 68, 68, 0.25)');
        uAura.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = uAura;
        ctx.beginPath();
        ctx.arc(0, 0, uRadius * 2.0, 0, Math.PI * 2);
        ctx.fill();

        // Animated Complex Polygon Crystalline Lattice (Displaced Vertices)
        const vertices = 14;
        ctx.beginPath();
        for (let i = 0; i < vertices; i++) {
          const theta = (i / vertices) * Math.PI * 2;
          const noise = Math.sin(theta * 5 + time * 3.5) * 8 + Math.cos(theta * 3 - time * 2) * 6;
          const r = uRadius + noise;
          const vx = Math.cos(theta) * r;
          const vy = Math.sin(theta) * r;
          if (i === 0) ctx.moveTo(vx, vy);
          else ctx.lineTo(vx, vy);
        }
        ctx.closePath();
        ctx.strokeStyle = '#00F0FF';
        ctx.lineWidth = 2.0;
        ctx.shadowColor = '#00F0FF';
        ctx.shadowBlur = 14;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Inner Synaptic Cross-Tendril Web
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.45)';
        ctx.lineWidth = 1;
        for (let i = 0; i < vertices; i += 2) {
          const t1 = (i / vertices) * Math.PI * 2;
          const t2 = ((i + 7) / vertices) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(t1) * (uRadius * 0.8), Math.sin(t1) * (uRadius * 0.8));
          ctx.lineTo(Math.cos(t2) * (uRadius * 0.8), Math.sin(t2) * (uRadius * 0.8));
          ctx.stroke();
        }

        // Ultron Core Sphere
        const uCore = ctx.createRadialGradient(0, 0, 0, 0, 0, 22);
        uCore.addColorStop(0, '#FFFFFF');
        uCore.addColorStop(0.3, '#00F0FF');
        uCore.addColorStop(0.7, '#7C3AED');
        uCore.addColorStop(1, '#DC2626');
        ctx.fillStyle = uCore;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();

        // Ultron Typography
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ULTRON', 0, -5);
        ctx.font = '7px monospace';
        ctx.fillStyle = '#00F0FF';
        ctx.fillText('SYNAPTIC AI', 0, 7);
      }

      // 4. Second Brain Vault Nodes
      SECOND_BRAIN_VAULTS.forEach((vault, idx) => {
        const vAngle = vault.angle + (activeMode === 'JARVIS' ? 0 : Math.sin(time * 0.5 + idx) * 0.08);
        const vx = Math.cos(vAngle) * vault.dist;
        const vy = Math.sin(vAngle) * vault.dist;
        const isHovered = hoveredVaultKey === vault.key;
        const isSelected = selectedId === vault.key || selectedId?.includes(vault.key);

        const nodeRadius = isHovered || isSelected ? 18 : 14;

        // Outer Glow
        const halo = ctx.createRadialGradient(vx, vy, nodeRadius * 0.5, vx, vy, nodeRadius * 2.2);
        halo.addColorStop(0, vault.color);
        halo.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(vx, vy, nodeRadius * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Node Body
        const nodeGrad = ctx.createRadialGradient(vx - 4, vy - 4, 2, vx, vy, nodeRadius);
        nodeGrad.addColorStop(0, '#FFFFFF');
        nodeGrad.addColorStop(0.4, vault.color);
        nodeGrad.addColorStop(1, '#090915');
        ctx.fillStyle = nodeGrad;
        ctx.beginPath();
        ctx.arc(vx, vy, nodeRadius, 0, Math.PI * 2);
        ctx.fill();

        // Node Border
        ctx.strokeStyle = isSelected ? '#FFFFFF' : vault.color;
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.stroke();

        // Billboard Label Box
        const labelY = vy + nodeRadius + 14;
        ctx.fillStyle = 'rgba(9, 9, 15, 0.85)';
        ctx.strokeStyle = isHovered || isSelected ? vault.color : 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        const labelText = vault.label.toUpperCase();
        ctx.font = 'bold 9px monospace';
        const textWidth = ctx.measureText(labelText).width;
        const boxWidth = textWidth + 14;
        const boxHeight = 18;

        ctx.fillRect(vx - boxWidth / 2, labelY - boxHeight / 2, boxWidth, boxHeight);
        ctx.strokeRect(vx - boxWidth / 2, labelY - boxHeight / 2, boxWidth, boxHeight);

        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText, vx, labelY);

        // Subtitle
        ctx.font = '7px monospace';
        ctx.fillStyle = vault.color;
        ctx.fillText(vault.subtitle, vx, labelY + 12);
      });

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    activeMode,
    orbitMotion,
    isDragging,
    rotationAngle,
    panOffset,
    zoom,
    coreActivity,
    hoveredVaultKey,
    selectedId
  ]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (container && canvas) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mouse Interactivity
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    // Check hit testing with 5 vaults
    const cx = canvas.width / 2 + panOffset.x;
    const cy = canvas.height / 2 + panOffset.y;
    const localX = (mouseX - cx) / zoom;
    const localY = (mouseY - cy) / zoom;

    let found: string | null = null;
    SECOND_BRAIN_VAULTS.forEach((v) => {
      const vx = Math.cos(v.angle) * v.dist;
      const vy = Math.sin(v.angle) * v.dist;
      const dist = Math.hypot(localX - vx, localY - vy);
      if (dist < 26) {
        found = v.key;
      }
    });

    setHoveredVaultKey(found);
    if (found) {
      const matched = nodes.find((n) => n.id.toLowerCase().includes(found!));
      onHoverNode?.(matched || null);
    } else {
      onHoverNode?.(null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    if (hoveredVaultKey) {
      const matched = nodes.find((n) => n.id.toLowerCase().includes(hoveredVaultKey!));
      if (matched) onSelectNode(matched);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.max(0.4, Math.min(2.5, z * delta)));
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative select-none overflow-hidden bg-[#030308]"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      onWheel={handleWheel}
      style={{ cursor: isDragging ? 'grabbing' : hoveredVaultKey ? 'pointer' : 'grab' }}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Cinematic HUD Pill Overlay */}
      <div className="absolute bottom-4 left-4 pointer-events-none p-3 bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl text-[11px] font-mono text-zinc-400 space-y-1 hidden sm:block shadow-2xl">
        <div className="flex items-center gap-2">
          {activeMode === 'JARVIS' ? (
            <span className="text-amber-400 font-bold flex items-center gap-1.5">
              <Sparkles size={12} className="text-amber-400 animate-pulse" /> JARVIS PROTOCOL ACTIVE
            </span>
          ) : (
            <span className="text-cyan-400 font-bold flex items-center gap-1.5">
              <Zap size={12} className="text-cyan-400 animate-pulse" /> ULTRON CONSCIOUSNESS ACTIVE
            </span>
          )}
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400">5 Second Brain Vaults Synced</span>
        </div>
        <div className="text-[10px] text-zinc-500">
          • Hover / Click any Vault node to inspect neural memory
        </div>
        <div className="text-[10px] text-zinc-500">
          • Drag to pan • Scroll to zoom in/out of the consciousness core
        </div>
      </div>
    </div>
  );
}
