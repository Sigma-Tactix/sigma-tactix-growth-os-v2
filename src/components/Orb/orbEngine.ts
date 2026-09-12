import {
  OrbColors,
  OrbEngine,
  OrbEngineOptions,
  OrbSatelliteDef,
  ProjectedSatellite,
} from './orb.types';
import { isLandPoint } from './landMask';

export const DEFAULT_ORB_COLORS: OrbColors = {
  core: '#FF4B04',
  deep: '#992B00',
  glow: '#FF8A4C',
  land: '#FFF4ED',
  ring: '#FF6A24',
  node: '#FFD9C4',
  bloom: '#661800',
  ground: '#050515',
};

export function createOrbEngine(
  canvas: HTMLCanvasElement,
  options: OrbEngineOptions = {}
): OrbEngine {
  const ctx = canvas.getContext('2d', { alpha: true })!;
  const colors: OrbColors = { ...DEFAULT_ORB_COLORS, ...options.colors };

  let width = canvas.clientWidth || 600;
  let height = canvas.clientHeight || 600;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  // Configuration
  const pointCount = options.density || (width > 900 ? 2600 : width > 600 ? 1600 : 1000);
  const ringCount = options.rings !== undefined ? options.rings : 3;
  const baseSpin = options.spin !== undefined ? options.spin : 0.0016;
  const isInteractive = options.interactive !== false;
  const isDragEnabled = options.enableDragRotation !== false;
  const isWheelZoomEnabled = options.enableWheelZoom !== false;

  let satellites: OrbSatelliteDef[] = options.satellites || [];
  let onProjectedSatellites = options.onProjectedSatellites;
  let onReady = options.onReady;
  let isReadyFired = false;

  // State
  let progress = options.progress || 0;
  let rotX = 0.22; // subtle forward tilt
  let rotY = 0;
  let pointerTargetX = 0;
  let pointerTargetY = 0;
  let pointerCurrentX = 0;
  let pointerCurrentY = 0;
  let userRotX = 0;
  let userRotY = 0;
  let zoom = options.zoom || 1.0;
  let isSpinPaused = false;
  let isDragging = false;
  let lastDragX = 0;
  let lastDragY = 0;
  let animId: number | null = null;
  let isDestroyed = false;

  // Geometry: Fibonacci sphere coordinates
  // Float32Arrays for cache-friendly fast iteration without object allocation
  const rawX = new Float32Array(pointCount);
  const rawY = new Float32Array(pointCount);
  const rawZ = new Float32Array(pointCount);
  const isLand = new Uint8Array(pointCount);

  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  const angleIncrement = Math.PI * 2 * goldenRatio;

  for (let i = 0; i < pointCount; i++) {
    const t = i / pointCount;
    const phi = Math.acos(1 - 2 * t); // from 0 to PI
    const theta = angleIncrement * i; // azimuthal angle

    rawX[i] = Math.sin(phi) * Math.cos(theta);
    rawY[i] = Math.cos(phi);
    rawZ[i] = Math.sin(phi) * Math.sin(theta);

    isLand[i] = isLandPoint(theta, phi) ? 1 : 0;
  }

  // Pre-calculated orbital rings
  const RING_RADII = [1.28, 1.48, 1.72];
  const RING_TILTS = [0.38, -0.28, 0.52]; // inclination around X/Z
  const RING_ANGLES = [0.15, 0.45, -0.3];

  function resize() {
    width = canvas.clientWidth || 600;
    height = canvas.clientHeight || 600;
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.scale(dpr, dpr);
  }

  resize();

  // Pointer & Touch Listeners
  function handlePointerMove(e: PointerEvent) {
    if (!isInteractive) return;
    const rect = canvas.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;

    pointerTargetX = nx * 0.35;
    pointerTargetY = ny * 0.25;

    if (isDragging && isDragEnabled) {
      const dx = e.clientX - lastDragX;
      const dy = e.clientY - lastDragY;
      userRotY += dx * 0.007;
      userRotX += dy * 0.007;
      userRotX = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, userRotX));
      lastDragX = e.clientX;
      lastDragY = e.clientY;
    }
  }

  function handlePointerDown(e: PointerEvent) {
    if (!isDragEnabled) return;
    isDragging = true;
    lastDragX = e.clientX;
    lastDragY = e.clientY;
    canvas.setPointerCapture?.(e.pointerId);
  }

  function handlePointerUp(e: PointerEvent) {
    isDragging = false;
    canvas.releasePointerCapture?.(e.pointerId);
  }

  function handleWheel(e: WheelEvent) {
    if (!isWheelZoomEnabled) return;
    e.preventDefault();
    const zoomDelta = -e.deltaY * 0.001;
    zoom = Math.max(0.65, Math.min(2.4, zoom + zoomDelta));
  }

  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointerup', handlePointerUp);
  canvas.addEventListener('pointercancel', handlePointerUp);
  canvas.addEventListener('wheel', handleWheel, { passive: false });

  // Render Loop
  function render() {
    if (isDestroyed) return;

    if (!isSpinPaused && !options.still) {
      rotY += baseSpin;
    }

    // Smooth pointer parallax damping
    pointerCurrentX += (pointerTargetX - pointerCurrentX) * 0.08;
    pointerCurrentY += (pointerTargetY - pointerCurrentY) * 0.08;

    const currentRotX = rotX + userRotX + pointerCurrentY;
    const currentRotY = rotY + userRotY + pointerCurrentX;

    const cosX = Math.cos(currentRotX);
    const sinX = Math.sin(currentRotX);
    const cosY = Math.cos(currentRotY);
    const sinY = Math.sin(currentRotY);

    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const sphereRadius = Math.min(width, height) * 0.32 * zoom;
    const cameraDist = 3.6;

    // Atmospheric Back Haze
    const hazeGrad = ctx.createRadialGradient(cx, cy, sphereRadius * 0.3, cx, cy, sphereRadius * 1.55);
    hazeGrad.addColorStop(0, 'rgba(255, 75, 4, 0.16)');
    hazeGrad.addColorStop(0.5, 'rgba(255, 75, 4, 0.05)');
    hazeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = hazeGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, sphereRadius * 1.55, 0, Math.PI * 2);
    ctx.fill();

    // Core Solid Shadow Sphere
    const coreGrad = ctx.createRadialGradient(
      cx - sphereRadius * 0.25,
      cy - sphereRadius * 0.25,
      sphereRadius * 0.1,
      cx,
      cy,
      sphereRadius
    );
    coreGrad.addColorStop(0, '#100508');
    coreGrad.addColorStop(0.7, '#070205');
    coreGrad.addColorStop(1, '#020103');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, sphereRadius * 0.98, 0, Math.PI * 2);
    ctx.fill();

    // 1. BACK ORBIT RINGS
    if (ringCount > 0) {
      drawOrbitRings(false);
    }

    // 2. PARTICLES (BACK & FRONT)
    // We do one pass sorting or two depth passes for optimal visual layering
    for (let i = 0; i < pointCount; i++) {
      const x0 = rawX[i];
      const y0 = rawY[i];
      const z0 = rawZ[i];

      // Rotate Y
      const x1 = x0 * cosY - z0 * sinY;
      const z1 = z0 * cosY + x0 * sinY;

      // Rotate X
      const y2 = y0 * cosX - z1 * sinX;
      const z2 = z1 * cosX + y0 * sinX;

      // Perspective scale factor
      const k = cameraDist / (cameraDist + z2);
      const px = cx + x1 * sphereRadius * k;
      const py = cy - y2 * sphereRadius * k;

      const isContinent = isLand[i] === 1;
      const isNear = z2 < 0; // closer to camera

      // Normal facing camera
      const facing = -z2; // dot product with camera forward (0,0,-1)

      if (facing < -0.15) {
        // Far back side
        const alpha = Math.max(0.08, 0.25 + facing * 0.2);
        ctx.fillStyle = isContinent ? `rgba(255, 175, 130, ${alpha * 0.6})` : `rgba(180, 50, 0, ${alpha * 0.4})`;
        const sz = Math.max(0.7, (isContinent ? 1.4 : 1.0) * k * 0.7);
        ctx.fillRect(px - sz / 2, py - sz / 2, sz, sz);
      } else {
        // Near side: high brightness, continent highlights
        const alpha = Math.min(1.0, 0.4 + facing * 0.65);
        if (isContinent) {
          ctx.fillStyle = facing > 0.6 ? colors.land : `rgba(255, 240, 230, ${alpha})`;
          const sz = (facing > 0.5 ? 2.2 : 1.7) * k;
          ctx.beginPath();
          ctx.arc(px, py, sz, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = facing > 0.5 ? colors.glow : `rgba(255, 75, 4, ${alpha})`;
          const sz = (facing > 0.5 ? 1.4 : 1.1) * k;
          ctx.beginPath();
          ctx.arc(px, py, sz, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 3. FRONT ORBIT RINGS & SATELLITES
    const projected: ProjectedSatellite[] = [];
    if (ringCount > 0) {
      drawOrbitRings(true, projected);
    }

    if (onProjectedSatellites) {
      onProjectedSatellites(projected);
    }

    // Notify ready on first paint
    if (!isReadyFired && onReady) {
      isReadyFired = true;
      onReady();
    }

    if (!options.still) {
      animId = requestAnimationFrame(render);
    }

    function drawOrbitRings(isFrontPass: boolean, projectedOut?: ProjectedSatellite[]) {
      ctx.lineWidth = 1.0;
      ctx.strokeStyle = colors.ring;

      for (let r = 0; r < Math.min(ringCount, RING_RADII.length); r++) {
        const ringR = RING_RADII[r] * sphereRadius;
        const tiltX = RING_TILTS[r] + currentRotX * 0.4;
        const tiltY = RING_ANGLES[r] + currentRotY;

        const segments = 80;
        ctx.beginPath();
        let first = true;

        for (let s = 0; s <= segments; s++) {
          const theta = (s / segments) * Math.PI * 2;
          const rx = Math.cos(theta) * ringR;
          const rz = Math.sin(theta) * ringR;

          // Apply ring inclination
          const rx1 = rx * Math.cos(tiltY) - rz * Math.sin(tiltY);
          const rz1 = rz * Math.cos(tiltY) + rx * Math.sin(tiltY);
          const ry2 = -rz1 * Math.sin(tiltX);
          const rz2 = rz1 * Math.cos(tiltX);

          const isPointFront = rz2 <= 0;
          if (isPointFront !== isFrontPass) {
            first = true;
            continue;
          }

          const k = cameraDist / (cameraDist + rz2 / sphereRadius);
          const px = cx + rx1 * k;
          const py = cy - ry2 * k;

          if (first) {
            ctx.moveTo(px, py);
            first = false;
          } else {
            ctx.lineTo(px, py);
          }
        }

        ctx.globalAlpha = isFrontPass ? 0.35 : 0.12;
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        // Render Satellites attached to this ring
        if (satellites.length) {
          const ringSats = satellites.filter((s) => s.ringIndex === r);
          for (const sat of ringSats) {
            // Speed progression along ring
            const satTheta = (sat.phase + (isSpinPaused ? 0 : rotY * (0.8 + r * 0.2))) % (Math.PI * 2);
            const rx = Math.cos(satTheta) * ringR;
            const rz = Math.sin(satTheta) * ringR;

            const rx1 = rx * Math.cos(tiltY) - rz * Math.sin(tiltY);
            const rz1 = rz * Math.cos(tiltY) + rx * Math.sin(tiltY);
            const ry2 = -rz1 * Math.sin(tiltX);
            const rz2 = rz1 * Math.cos(tiltX);

            const isFront = rz2 <= 0;
            const k = cameraDist / (cameraDist + rz2 / sphereRadius);
            const px = cx + rx1 * k;
            const py = cy - ry2 * k;
            const baseSize = sat.size || 4.2;
            const renderedSize = baseSize * k;
            const alpha = isFront ? 0.95 : 0.25;

            if (projectedOut) {
              projectedOut.push({
                id: sat.id,
                x: px,
                y: py,
                z: rz2,
                k,
                size: renderedSize,
                alpha,
                isFront,
                definition: sat,
              });
            }

            if (isFront === isFrontPass) {
              const nodeColor = sat.color || colors.node;
              ctx.fillStyle = nodeColor;
              ctx.globalAlpha = alpha;

              ctx.beginPath();
              ctx.arc(px, py, renderedSize, 0, Math.PI * 2);
              ctx.fill();

              if (isFront && sat.pulse) {
                ctx.strokeStyle = nodeColor;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.arc(px, py, renderedSize * 1.8, 0, Math.PI * 2);
                ctx.stroke();
              }
              ctx.globalAlpha = 1.0;
            }
          }
        }
      }
    }
  }

  // Start engine
  render();

  return {
    start() {
      if (!animId && !isDestroyed) render();
    },
    stop() {
      if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
    },
    pauseSpin() {
      isSpinPaused = true;
    },
    resumeSpin() {
      isSpinPaused = false;
    },
    setProgress(p: number) {
      progress = p;
    },
    setPointer(x: number, y: number) {
      pointerTargetX = x;
      pointerTargetY = y;
    },
    setZoom(z: number) {
      zoom = Math.max(0.5, Math.min(3.0, z));
    },
    getZoom() {
      return zoom;
    },
    rotateBy(deltaX: number, deltaY: number) {
      userRotY += deltaX;
      userRotX += deltaY;
      userRotX = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, userRotX));
    },
    setRotation(rx: number, ry: number) {
      userRotX = rx;
      userRotY = ry;
    },
    getRotation() {
      return { rotX: userRotX, rotY: userRotY };
    },
    setSatellites(newSats: OrbSatelliteDef[]) {
      satellites = newSats;
    },
    resize,
    destroy() {
      isDestroyed = true;
      if (animId) cancelAnimationFrame(animId);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerUp);
      canvas.removeEventListener('wheel', handleWheel);
    },
  };
}
