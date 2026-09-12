import React, { useRef, useEffect, useState, useCallback } from 'react';
import { SystemElementNode, SystemDependency } from '@/src/data/livingSystemData';

interface LivingSystemCanvasProps {
  nodes: SystemElementNode[];
  dependencies: SystemDependency[];
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onHoverNode: (nodeId: string | null) => void;
  activeFilter: string;
  searchQuery?: string;
  energyPulseTrigger: number; // Increment to fire a shockwave pulse
  viewMode?: '3D_SPHERE' | 'RADIAL_MATRIX' | 'DATA_FLOW';
  isMiniPreview?: boolean;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  alpha: number;
  color: string;
}

interface EnergyPacket {
  sourceId: string;
  targetId: string;
  progress: number;
  speed: number;
  color: string;
}

export default function LivingSystemCanvas({
  nodes,
  dependencies,
  selectedNodeId,
  hoveredNodeId,
  onSelectNode,
  onHoverNode,
  activeFilter,
  searchQuery = '',
  energyPulseTrigger,
  viewMode = '3D_SPHERE',
  isMiniPreview = false
}: LivingSystemCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 3D rotation angles & interaction state
  const rotXRef = useRef(0.35);
  const rotYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(isMiniPreview ? 0.85 : 1.0);
  const animFrameRef = useRef<number | null>(null);

  // Dynamic shockwave pulses
  const shockwavesRef = useRef<{ radius: number; maxRadius: number; opacity: number; color: string }[]>([]);

  // Ambient embers / star particles
  const particlesRef = useRef<Particle[]>([]);

  // Energy packets traveling on dependency lines
  const energyPacketsRef = useRef<EnergyPacket[]>([]);

  // Projected 2D node screen coordinates for hit testing
  const projectedNodesRef = useRef<Map<string, { x: number; y: number; r: number; node: SystemElementNode; z: number }>>(new Map());

  // Initialize ambient embers
  useEffect(() => {
    const particleCount = isMiniPreview ? 35 : 120;
    const pts: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const dist = 50 + Math.random() * 450;
      pts.push({
        x: dist * Math.sin(phi) * Math.cos(theta),
        y: dist * Math.sin(phi) * Math.sin(theta),
        z: dist * Math.cos(phi),
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        vz: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2.2 + 0.6,
        alpha: Math.random() * 0.7 + 0.2,
        color: Math.random() > 0.4 ? '#FFA500' : '#FF4500'
      });
    }
    particlesRef.current = pts;
  }, [isMiniPreview]);

  // Seed energy packets along dependencies
  useEffect(() => {
    const packets: EnergyPacket[] = [];
    dependencies.forEach((dep, i) => {
      packets.push({
        sourceId: dep.sourceId,
        targetId: dep.targetId,
        progress: (i * 0.15) % 1.0,
        speed: 0.006 + (Math.random() * 0.005),
        color: '#FFB74D'
      });
    });
    energyPacketsRef.current = packets;
  }, [dependencies]);

  // React to energy pulse trigger (from video: intense expanding shockwave)
  useEffect(() => {
    if (energyPulseTrigger > 0) {
      shockwavesRef.current.push(
        { radius: 5, maxRadius: 550, opacity: 1.0, color: '#FFF3E0' },
        { radius: 0, maxRadius: 480, opacity: 0.85, color: '#FF7A00' }
      );
    }
  }, [energyPulseTrigger]);

  // Main Render Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const render = () => {
      time += 0.02;

      // Auto rotate slowly if not dragging
      if (!isDraggingRef.current) {
        rotYRef.current += 0.0035;
      }

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const dpr = window.devicePixelRatio || 1;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Clear with rich deep cosmic gradient
      const bgGrad = ctx.createRadialGradient(
        width / 2, height / 2, 10,
        width / 2, height / 2, Math.max(width, height) * 0.85
      );
      bgGrad.addColorStop(0, '#150903');
      bgGrad.addColorStop(0.35, '#0c0502');
      bgGrad.addColorStop(0.75, '#050201');
      bgGrad.addColorStop(1, '#020100');

      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const zoom = zoomRef.current;

      // 3D Projection Helper
      const project3D = (x: number, y: number, z: number) => {
        // Rotate around Y
        const cosY = Math.cos(rotYRef.current);
        const sinY = Math.sin(rotYRef.current);
        const x1 = x * cosY - z * sinY;
        const z1 = z * cosY + x * sinY;

        // Rotate around X
        const cosX = Math.cos(rotXRef.current);
        const sinX = Math.sin(rotXRef.current);
        const y2 = y * cosX - z1 * sinX;
        const z2 = z1 * cosX + y * sinX;

        // Perspective camera
        const cameraDist = 800;
        const scale = (cameraDist / (cameraDist + z2)) * zoom;
        const screenX = cx + x1 * scale;
        const screenY = cy + y2 * scale;

        return { x: screenX, y: screenY, scale, z: z2 };
      };

      // 1. RENDER AMBIENT COSMIC EMBERS & PARTICLES
      particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        if (Math.hypot(p.x, p.y, p.z) > 500) {
          p.x = (Math.random() - 0.5) * 100;
          p.y = (Math.random() - 0.5) * 100;
          p.z = (Math.random() - 0.5) * 100;
        }

        const proj = project3D(p.x, p.y, p.z);
        if (proj.scale > 0) {
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, Math.max(0.6, p.size * proj.scale), 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0.1, p.alpha * (proj.scale * 0.8));
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 6 * proj.scale;
          ctx.fill();
        }
      });
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1.0;

      // 2. RENDER SPHERICAL LATTICE WIREFRAME (Subtle glowing rings from video)
      if (!isMiniPreview) {
        ctx.strokeStyle = 'rgba(255, 120, 30, 0.08)';
        ctx.lineWidth = 1;
        [140, 240, 340, 430].forEach(r => {
          ctx.beginPath();
          for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.15) {
            const px = r * Math.cos(a);
            const pz = r * Math.sin(a);
            const proj = project3D(px, 0, pz);
            if (a === 0) ctx.moveTo(proj.x, proj.y);
            else ctx.lineTo(proj.x, proj.y);
          }
          ctx.stroke();
        });
      }

      // Compute 3D positions for all nodes
      const nodeProjections = new Map<string, { x: number; y: number; r: number; node: SystemElementNode; z: number }>();

      nodes.forEach(node => {
        // Filter check
        const isTypeMatch = activeFilter === 'ALL' || 
          (activeFilter === 'VAULTS' && node.type === 'VAULT') ||
          (activeFilter === 'FILES' && node.type === 'FILE') ||
          (activeFilter === 'AGENTS' && node.type === 'AGENT') ||
          (activeFilter === 'PIPELINES' && node.type === 'PIPELINE') ||
          (activeFilter === 'AUDITS' && node.type === 'AUDIT');

        const isSearchMatch = !searchQuery.trim() || 
          node.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          node.category.toLowerCase().includes(searchQuery.toLowerCase());

        const isVisible = isTypeMatch && isSearchMatch;
        if (!isVisible && node.type !== 'CORE') return;

        let x = 0, y = 0, z = 0;

        if (node.type === 'CORE') {
          x = 0; y = 0; z = 0;
        } else {
          const r = node.orbitRadius;
          const a = (node.angle || 0) + (node.type === 'VAULT' ? time * 0.05 : node.type === 'FILE' ? -time * 0.03 : time * 0.02);
          
          // Subtle vertical wave
          const yOff = Math.sin(a * 2 + time) * 35;
          x = r * Math.cos(a);
          z = r * Math.sin(a);
          y = yOff;
        }

        const proj = project3D(x, y, z);
        let baseRadius = node.type === 'CORE' ? (isMiniPreview ? 26 : 46) :
                         node.type === 'VAULT' ? 14 :
                         node.type === 'AGENT' ? 16 :
                         node.type === 'PIPELINE' ? 13 :
                         node.type === 'AUDIT' ? 15 : 10;

        const rScreen = Math.max(4, baseRadius * proj.scale);
        nodeProjections.set(node.id, { x: proj.x, y: proj.y, r: rScreen, node, z: proj.z });
      });

      projectedNodesRef.current = nodeProjections;

      // 3. RENDER DEPENDENCY CONNECTIONS & LIVING DENDRITE FILAMENTS
      const activeNode = selectedNodeId || hoveredNodeId;

      dependencies.forEach(dep => {
        const src = nodeProjections.get(dep.sourceId);
        const tgt = nodeProjections.get(dep.targetId);
        if (!src || !tgt) return;

        const isHighlighted = activeNode && (
          dep.sourceId === activeNode || dep.targetId === activeNode
        );
        const isDimmed = activeNode && !isHighlighted;

        ctx.save();

        if (isHighlighted) {
          ctx.strokeStyle = '#FFC107';
          ctx.lineWidth = Math.max(1.8, 2.5 * src.r / 20);
          ctx.shadowColor = '#FF8C00';
          ctx.shadowBlur = 12;
          ctx.globalAlpha = 0.95;
        } else if (isDimmed) {
          ctx.strokeStyle = 'rgba(255, 120, 50, 0.08)';
          ctx.lineWidth = 0.8;
          ctx.globalAlpha = 0.15;
        } else {
          // Subtle dendritic curve
          ctx.strokeStyle = dep.sourceId === 'second-brain-core' 
            ? 'rgba(255, 140, 0, 0.35)' 
            : 'rgba(255, 180, 80, 0.22)';
          ctx.lineWidth = dep.sourceId === 'second-brain-core' ? 1.4 : 1.0;
          ctx.globalAlpha = 0.65;
        }

        // Draw curved branching line
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        
        // Control point curved towards center
        const mx = (src.x + tgt.x) / 2;
        const my = (src.y + tgt.y) / 2;
        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const bend = Math.sin(time * 2 + dep.strength * 5) * 8;
        const cpx = mx - dy * 0.1 + bend;
        const cpy = my + dx * 0.1 + bend;

        ctx.quadraticCurveTo(cpx, cpy, tgt.x, tgt.y);
        ctx.stroke();
        ctx.restore();
      });

      // 4. RENDER TRAVELING ENERGY PULSE PACKETS ALONG DEPENDENCIES
      energyPacketsRef.current.forEach(pkt => {
        const src = nodeProjections.get(pkt.sourceId);
        const tgt = nodeProjections.get(pkt.targetId);
        if (!src || !tgt) return;

        pkt.progress = (pkt.progress + pkt.speed) % 1.0;
        const p = pkt.progress;

        // Quadratic bezier position
        const mx = (src.x + tgt.x) / 2;
        const my = (src.y + tgt.y) / 2;
        const cpx = mx;
        const cpy = my;

        const qx = (1 - p) * (1 - p) * src.x + 2 * (1 - p) * p * cpx + p * p * tgt.x;
        const qy = (1 - p) * (1 - p) * src.y + 2 * (1 - p) * p * cpy + p * p * tgt.y;

        ctx.beginPath();
        ctx.arc(qx, qy, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = '#FFF8E1';
        ctx.shadowColor = '#FFA500';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 5. RENDER EXPANDING SHOCKWAVES (From Video Pulse Effect)
      for (let i = shockwavesRef.current.length - 1; i >= 0; i--) {
        const sw = shockwavesRef.current[i];
        sw.radius += 9.5;
        sw.opacity = Math.max(0, 1.0 - (sw.radius / sw.maxRadius));

        if (sw.opacity <= 0 || sw.radius >= sw.maxRadius) {
          shockwavesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, sw.radius * zoom, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = Math.max(1, 4 * sw.opacity);
        ctx.globalAlpha = sw.opacity;
        ctx.shadowColor = '#FF6B00';
        ctx.shadowBlur = 20 * sw.opacity;
        ctx.stroke();

        // Secondary inner refraction glow ring
        ctx.beginPath();
        ctx.arc(cx, cy, (sw.radius * 0.85) * zoom, 0, Math.PI * 2);
        ctx.strokeStyle = '#FFA000';
        ctx.lineWidth = 2 * sw.opacity;
        ctx.globalAlpha = sw.opacity * 0.6;
        ctx.stroke();

        ctx.restore();
      }

      // Sort nodes by Z-depth (painter's algorithm) so foreground nodes render on top
      const sortedNodes = Array.from(nodeProjections.values()).sort((a, b) => a.z - b.z);

      // 6. RENDER LIVING CENTRAL SECOND BRAIN ORGANISM (Core from Video)
      const coreProj = nodeProjections.get('second-brain-core');
      if (coreProj) {
        ctx.save();
        const coreX = coreProj.x;
        const coreY = coreProj.y;
        const pulse = Math.sin(time * 3) * (isMiniPreview ? 3 : 6);
        const coreRadius = coreProj.r + pulse;

        // Outer fiery corona
        const coronaGrad = ctx.createRadialGradient(
          coreX, coreY, coreRadius * 0.2,
          coreX, coreY, coreRadius * 2.8
        );
        coronaGrad.addColorStop(0, 'rgba(255, 230, 180, 0.95)');
        coronaGrad.addColorStop(0.2, 'rgba(255, 140, 0, 0.85)');
        coronaGrad.addColorStop(0.5, 'rgba(255, 60, 0, 0.45)');
        coronaGrad.addColorStop(0.85, 'rgba(180, 20, 0, 0.15)');
        coronaGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.arc(coreX, coreY, coreRadius * 2.8, 0, Math.PI * 2);
        ctx.fillStyle = coronaGrad;
        ctx.fill();

        // Radiating dendritic flares (like in video 00:02 - 00:04)
        const flareCount = isMiniPreview ? 8 : 16;
        for (let f = 0; f < flareCount; f++) {
          const flareAngle = (f / flareCount) * Math.PI * 2 + time * 0.4;
          const flareLen = coreRadius * (1.6 + Math.sin(time * 4 + f * 1.5) * 0.5);

          ctx.beginPath();
          ctx.moveTo(coreX, coreY);
          
          // Tendril curve
          const midX = coreX + Math.cos(flareAngle + 0.15) * (flareLen * 0.6);
          const midY = coreY + Math.sin(flareAngle + 0.15) * (flareLen * 0.6);
          const endX = coreX + Math.cos(flareAngle) * flareLen;
          const endY = coreY + Math.sin(flareAngle) * flareLen;

          ctx.quadraticCurveTo(midX, midY, endX, endY);
          ctx.strokeStyle = f % 2 === 0 ? '#FFE082' : '#FF7043';
          ctx.lineWidth = Math.max(1, 2.4 * (1 - f / flareCount));
          ctx.shadowColor = '#FF9800';
          ctx.shadowBlur = 10;
          ctx.globalAlpha = 0.8;
          ctx.stroke();

          // Dendrite synaptic terminal bulb
          ctx.beginPath();
          ctx.arc(endX, endY, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFDE7';
          ctx.fill();
        }

        // Blazing Plasma Core Sphere
        const coreGrad = ctx.createRadialGradient(
          coreX - coreRadius * 0.25, coreY - coreRadius * 0.25, coreRadius * 0.05,
          coreX, coreY, coreRadius
        );
        coreGrad.addColorStop(0, '#FFFFFF');
        coreGrad.addColorStop(0.3, '#FFF3E0');
        coreGrad.addColorStop(0.65, '#FFA726');
        coreGrad.addColorStop(0.9, '#E65100');
        coreGrad.addColorStop(1, '#BF360C');

        ctx.beginPath();
        ctx.arc(coreX, coreY, coreRadius, 0, Math.PI * 2);
        ctx.fillStyle = coreGrad;
        ctx.shadowColor = '#FF9100';
        ctx.shadowBlur = 28;
        ctx.fill();

        // Inner filament crackle
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.8;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const a1 = time * 2 + i * 1.57;
          const x1 = coreX + Math.cos(a1) * (coreRadius * 0.6);
          const y1 = coreY + Math.sin(a1) * (coreRadius * 0.6);
          const x2 = coreX + Math.cos(a1 + 1.2) * (coreRadius * 0.7);
          const y2 = coreY + Math.sin(a1 + 1.2) * (coreRadius * 0.7);
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
        }
        ctx.stroke();

        ctx.restore();
      }

      // 7. RENDER ALL ORBITAL SYSTEM ELEMENT NODES
      sortedNodes.forEach(({ x, y, r, node, z }) => {
        if (node.type === 'CORE') return; // Rendered above with custom plasma shader

        const isSelected = selectedNodeId === node.id;
        const isHovered = hoveredNodeId === node.id;
        const isFocus = isSelected || isHovered;

        ctx.save();

        // Node Glow Halo
        const glowGrad = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 2.2);
        glowGrad.addColorStop(0, node.color);
        glowGrad.addColorStop(0.5, `${node.color}55`);
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.beginPath();
        ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = glowGrad;
        ctx.globalAlpha = isFocus ? 0.95 : 0.45;
        ctx.fill();

        // Main Node Sphere
        const nodeGrad = ctx.createRadialGradient(
          x - r * 0.3, y - r * 0.3, r * 0.1,
          x, y, r
        );
        nodeGrad.addColorStop(0, '#FFFFFF');
        nodeGrad.addColorStop(0.35, node.color);
        nodeGrad.addColorStop(1, '#0F0906');

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = nodeGrad;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = isFocus ? 18 : 8;
        ctx.fill();

        // Selection / Focus Ring
        if (isFocus) {
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(x, y, r + 4, 0, Math.PI * 2);
          ctx.stroke();

          // Animated pulse ring
          const ringR = r + 4 + Math.sin(time * 6) * 3;
          ctx.strokeStyle = node.color;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(x, y, ringR, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Node Label (for non-mini mode, or when selected/hovered)
        if (!isMiniPreview && (isFocus || r > 9)) {
          ctx.fillStyle = isFocus ? '#FFFFFF' : '#D1D5DB';
          ctx.font = `${isFocus ? 'bold 11px' : '9px'} monospace`;
          ctx.textAlign = 'center';
          ctx.shadowColor = '#000000';
          ctx.shadowBlur = 4;
          
          // Draw short text label with high contrast backing
          const text = node.shortName;
          const textY = y + r + 13;

          // Backing pill
          const textWidth = ctx.measureText(text).width;
          ctx.fillStyle = isFocus ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.6)';
          ctx.fillRect(x - textWidth / 2 - 4, textY - 9, textWidth + 8, 12);

          ctx.fillStyle = isFocus ? '#FFA500' : '#E5E7EB';
          ctx.fillText(text, x, textY);
        }

        ctx.restore();
      });

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [nodes, dependencies, selectedNodeId, hoveredNodeId, activeFilter, searchQuery, isMiniPreview]);

  // Pointer Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDraggingRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      rotYRef.current += dx * 0.007;
      rotXRef.current = Math.max(-1.1, Math.min(1.1, rotXRef.current - dy * 0.007));
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    } else {
      // Hit testing for node hover
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let foundId: string | null = null;
      projectedNodesRef.current.forEach(({ x, y, r, node }) => {
        const dist = Math.hypot(x - mouseX, y - mouseY);
        if (dist <= r + 6) {
          foundId = node.id;
        }
      });

      if (foundId !== hoveredNodeId) {
        onHoverNode(foundId);
      }
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let clickedNodeId: string | null = null;
    projectedNodesRef.current.forEach(({ x, y, r, node }) => {
      const dist = Math.hypot(x - mouseX, y - mouseY);
      if (dist <= r + 8) {
        clickedNodeId = node.id;
      }
    });

    onSelectNode(clickedNodeId);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * -0.001;
    zoomRef.current = Math.max(0.4, Math.min(2.2, zoomRef.current + zoomDelta));
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        isDraggingRef.current = false;
        onHoverNode(null);
      }}
      onClick={handleClick}
      onWheel={handleWheel}
      className="w-full h-full cursor-grab active:cursor-grabbing block"
      style={{ touchAction: 'none' }}
    />
  );
}
