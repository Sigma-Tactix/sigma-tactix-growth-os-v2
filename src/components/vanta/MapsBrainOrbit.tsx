import React, { useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import {
  Copy,
  ExternalLink,
  LocateFixed,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Search,
  Type,
} from 'lucide-react';
import { getLivingSystemGraph } from '@/src/data/livingSystemData';
import {
  areaSummary,
  buildMapsLayout,
  MAPS_FRAME,
  MAPS_LAYER_ORDER,
  MAPS_LAYER_RADIUS,
  nodesForTimeline,
  timelineDays,
  type MapsLayoutPoint,
} from '@/src/lib/mapsBrainLayout';
import {
  buildMapsBrainGraph,
  MAPS_BRAIN_VIEWS,
  type MapsBrainGraph,
  type MapsBrainKind,
  type MapsBrainNode,
  type MapsBrainView,
} from '@/src/lib/mapsBrainOrbit';

const SecondBrainOrbit3D = lazy(() => import('./SecondBrainOrbit3D'));

const KIND_LABEL: Record<MapsBrainKind, string> = {
  root: 'Core',
  area: 'Area',
  memory: 'Memory',
  skill: 'Skill',
  routine: 'Routine',
  run: 'Run',
};

const LAYER_LABEL = {
  memory: 'Memory',
  skills: 'Skills',
  routines: 'Routines',
  apps: 'Apps',
  runs: 'Runs',
} as const;

type Camera = { cx: number; cy: number; zoom: number };
const FIT_CAMERA: Camera = { cx: MAPS_FRAME.cx, cy: MAPS_FRAME.height / 2, zoom: 1 };

function stableUnit(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  return (hash % 10_000) / 10_000;
}

function edgePath(source: MapsLayoutPoint, target: MapsLayoutPoint, view: MapsBrainView) {
  if (view === 'circle') return `M ${source.x} ${source.y} Q ${MAPS_FRAME.cx} ${MAPS_FRAME.cy} ${target.x} ${target.y}`;
  return `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
}

function NodeGlyph({ node, point, selected }: { node: MapsBrainNode; point: MapsLayoutPoint; selected: boolean }) {
  const base = 3.2 + Math.min(5.2, Math.sqrt(node.degree) * 1.35);
  const size = base * point.scale;
  const color = node.areaColor;

  if (node.kind === 'area') {
    return (
      <>
        <circle cx={point.x} cy={point.y} r={size + 4} fill="none" stroke={color} strokeOpacity={selected ? 1 : 0.5} strokeWidth="1" />
        <circle cx={point.x} cy={point.y} r={size} fill={color} />
      </>
    );
  }
  if (node.kind === 'skill' || node.kind === 'memory') {
    return <rect x={point.x - size} y={point.y - size} width={size * 2} height={size * 2} rx="0.7" fill={color} transform={`rotate(45 ${point.x} ${point.y})`} />;
  }
  if (node.kind === 'routine') {
    return <rect x={point.x - size} y={point.y - size} width={size * 2} height={size * 2} rx="1" fill={color} />;
  }
  if (node.kind === 'run') {
    return <circle cx={point.x} cy={point.y} r={size} fill="none" stroke={color} strokeWidth={selected ? 2.2 : 1.4} />;
  }
  return <circle cx={point.x} cy={point.y} r={size} fill={color} />;
}

function CoreOrb({ motion }: { motion: boolean }) {
  const particles = useMemo(() => Array.from({ length: 26 }, (_, index) => {
    const angle = stableUnit(`vanta-angle-${index}`) * Math.PI * 2;
    const radius = 8 + stableUnit(`vanta-radius-${index}`) * 23;
    return {
      x: MAPS_FRAME.cx + Math.cos(angle) * radius,
      y: MAPS_FRAME.cy + Math.sin(angle) * radius * 0.76,
      radius: 0.8 + stableUnit(`vanta-size-${index}`) * 1.25,
    };
  }), []);

  return (
    <g aria-label="VANTA core">
      <circle cx={MAPS_FRAME.cx} cy={MAPS_FRAME.cy} r="51" fill="url(#mapsCoreGlow)" opacity="0.34" className={motion ? 'animate-pulse' : ''} />
      <circle cx={MAPS_FRAME.cx} cy={MAPS_FRAME.cy} r="37" fill="rgba(12,5,2,.94)" stroke="rgba(255,112,45,.78)" strokeWidth="0.8" />
      <circle cx={MAPS_FRAME.cx} cy={MAPS_FRAME.cy} r="44" fill="none" stroke="rgba(255,120,56,.28)" strokeDasharray="2 6" />
      {particles.map((particle, index) => (
        <circle key={index} cx={particle.x} cy={particle.y} r={particle.radius} fill={index % 4 === 0 ? '#FFD0B5' : '#FF6B2C'} opacity={0.42 + (index % 5) * 0.1} />
      ))}
      <text x={MAPS_FRAME.cx} y={MAPS_FRAME.cy - 3} textAnchor="middle" fill="#FFF5EE" fontSize="8" fontWeight="700" letterSpacing="2.1">VANTA</text>
      <text x={MAPS_FRAME.cx} y={MAPS_FRAME.cy + 10} textAnchor="middle" fill="#FF9A64" fontSize="5.6" letterSpacing="1.5">SIGMA CORE</text>
    </g>
  );
}

function formatDay(day: string) {
  const value = new Date(`${day}T00:00:00Z`);
  return Number.isFinite(value.valueOf())
    ? value.toLocaleDateString('en', { month: 'short', day: 'numeric', timeZone: 'UTC' }).toUpperCase()
    : day;
}

export default function MapsBrainOrbit({ graph: suppliedGraph }: { graph?: MapsBrainGraph } = {}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const lastFrameRef = useRef(0);
  const [view, setView] = useState<MapsBrainView>(suppliedGraph ? 'areas' : 'rings');
  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<'all' | MapsBrainKind>('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [showNames, setShowNames] = useState(false);
  const [motion, setMotion] = useState(() => typeof window === 'undefined' || !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const [rotation, setRotation] = useState(0);
  const [sceneRevision, setSceneRevision] = useState(0);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [copiedNodeId, setCopiedNodeId] = useState<string | null>(null);
  const [camera, setCamera] = useState<Camera>(FIT_CAMERA);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [compact, setCompact] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches);

  const graph = useMemo(() => {
    if (suppliedGraph) return suppliedGraph;
    const { nodes, dependencies } = getLivingSystemGraph();
    return buildMapsBrainGraph(nodes, dependencies);
  }, [suppliedGraph]);
  const areas = useMemo(() => areaSummary(graph), [graph]);

  useEffect(() => {
    if (!motion || view !== 'orbit' || suppliedGraph) return;
    let frame = 0;
    const animate = (now: number) => {
      if (now - lastFrameRef.current >= 33) {
        setRotation(current => current + (now - lastFrameRef.current) * 0.00012);
        lastFrameRef.current = now;
      }
      frame = requestAnimationFrame(animate);
    };
    lastFrameRef.current = performance.now();
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [motion, view, suppliedGraph]);

  useEffect(() => {
    const update = () => setIsFullscreen(document.fullscreenElement === shellRef.current);
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)');
    const update = () => setCompact(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const rawPoints = useMemo(() => buildMapsLayout(graph, view, rotation), [graph, rotation, view]);
  const points = useMemo(() => new Map(Array.from(rawPoints, ([id, point]) => [id, compact
    ? { ...point, x: MAPS_FRAME.cx + (point.x - MAPS_FRAME.cx) * 0.72 }
    : point])), [compact, rawPoints]);

  const normalizedQuery = query.trim().toLowerCase();
  const filterActive = Boolean(normalizedQuery || kindFilter !== 'all' || areaFilter !== 'all');
  const matchingIds = useMemo(() => new Set(graph.nodes.filter(node => {
    if (node.id === graph.coreNodeId) return true;
    const matchesQuery = !normalizedQuery || [node.label, node.path || '', node.note || '', node.area]
      .some(value => value.toLowerCase().includes(normalizedQuery));
    return matchesQuery
      && (kindFilter === 'all' || node.kind === kindFilter)
      && (areaFilter === 'all' || node.area === areaFilter);
  }).map(node => node.id)), [areaFilter, graph, kindFilter, normalizedQuery]);
  const matchingCount = graph.nodes.filter(node => node.id !== graph.coreNodeId && matchingIds.has(node.id)).length;
  const searchResults = useMemo(() => normalizedQuery
    ? graph.nodes.filter(node => node.id !== graph.coreNodeId && [node.label, node.path || '', node.note || ''].some(value => value.toLowerCase().includes(normalizedQuery))).slice(0, 6)
    : [], [graph.nodes, normalizedQuery]);
  const selectedNode = graph.nodes.find(node => node.id === selectedNodeId) || null;
  const activeNodeId = hoveredNodeId || selectedNodeId;
  const activeNeighbors = useMemo(() => {
    if (!activeNodeId) return null;
    const ids = new Set([activeNodeId]);
    graph.links.forEach(link => {
      if (link.source === activeNodeId) ids.add(link.target);
      if (link.target === activeNodeId) ids.add(link.source);
    });
    return ids;
  }, [activeNodeId, graph.links]);

  const centroids = useMemo(() => areas.map(area => {
    const areaPoints = graph.nodes
      .filter(node => node.id !== graph.coreNodeId && node.area === area.area)
      .map(node => points.get(node.id))
      .filter((point): point is MapsLayoutPoint => Boolean(point));
    return {
      ...area,
      x: areaPoints.reduce((total, point) => total + point.x, 0) / Math.max(1, areaPoints.length),
      y: areaPoints.reduce((total, point) => total + point.y, 0) / Math.max(1, areaPoints.length),
    };
  }), [areas, graph.coreNodeId, graph.nodes, points]);

  const timeline = useMemo(() => nodesForTimeline(graph), [graph]);
  const timelineRunDays = useMemo(() => timelineDays(timeline.runs), [timeline.runs]);
  const timelineFileDays = useMemo(() => timelineDays(timeline.files), [timeline.files]);

  const flyTo = (nodeId: string) => {
    const point = points.get(nodeId);
    if (!point) return;
    setSelectedNodeId(nodeId);
    setCamera({ cx: point.x, cy: point.y, zoom: 1.85 });
  };

  const fitView = () => { setCamera(FIT_CAMERA); setSceneRevision(value => value + 1); };
  const reset = () => {
    setQuery('');
    setKindFilter('all');
    setAreaFilter('all');
    setSelectedNodeId(null);
    setHoveredNodeId(null);
    setRotation(0);
    fitView();
  };

  const selectView = (nextView: MapsBrainView) => {
    setView(nextView);
    fitView();
  };

  const toggleFullscreen = async () => {
    if (!shellRef.current) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await shellRef.current.requestFullscreen();
  };

  const copyPath = async (node: MapsBrainNode) => {
    if (!node.path || !navigator.clipboard) return;
    await navigator.clipboard.writeText(node.path);
    setCopiedNodeId(node.id);
    window.setTimeout(() => setCopiedNodeId(current => current === node.id ? null : current), 1400);
  };

  const baseWidth = compact ? 500 : MAPS_FRAME.width;
  const baseHeight = compact ? 560 : MAPS_FRAME.height;
  const cameraWidth = baseWidth / camera.zoom;
  const cameraHeight = baseHeight / camera.zoom;
  const viewBox = `${camera.cx - cameraWidth / 2} ${camera.cy - cameraHeight / 2} ${cameraWidth} ${cameraHeight}`;
  const graphLinks = view === 'timeline' ? [] : graph.links;

  return (
    <div ref={shellRef} className="absolute inset-0 overflow-hidden bg-[#07090b] font-mono text-zinc-400" aria-label="Second Brain map views">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.34] [background-image:radial-gradient(rgba(255,255,255,.12)_0.65px,transparent_0.65px)] [background-size:5px_5px]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_58%,rgba(255,87,34,.05),transparent_36%),linear-gradient(180deg,rgba(255,255,255,.018),transparent_22%)]" />

      <header className="absolute inset-x-0 top-0 z-30 border-b border-white/[0.07] bg-[#07090b]/94 px-3 py-2.5 backdrop-blur-md sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Brain map view">
            {MAPS_BRAIN_VIEWS.map(option => (
              <button key={option.id} type="button" role="tab" aria-selected={view === option.id} onClick={() => selectView(option.id)} className={`shrink-0 border-b px-2 py-1 text-[11px] uppercase tracking-[0.16em] transition ${view === option.id ? 'border-orange-400 text-orange-200' : 'border-transparent text-zinc-600 hover:text-zinc-300'}`}>
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <div className="relative hidden w-36 md:block">
              <label>
                <span className="sr-only">Search system map</span>
                <Search size={11} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input value={query} onChange={event => setQuery(event.target.value)} placeholder="label, path, note" className="w-full border border-white/[0.08] bg-black/20 py-1 pl-6 pr-2 text-[11px] text-zinc-300 outline-none placeholder:text-zinc-700 focus:border-orange-400/50" />
              </label>
              {searchResults.length > 0 && (
                <div className="absolute right-0 top-[calc(100%+5px)] w-64 border border-white/[0.1] bg-[#090b0e]/98 p-1 shadow-2xl">
                  {searchResults.map(node => (
                    <button key={node.id} type="button" onClick={() => { flyTo(node.id); setQuery(''); }} className="flex w-full items-center justify-between gap-3 px-2 py-1.5 text-left text-[11px] text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100">
                      <span className="truncate">{node.label}</span><span className="shrink-0 text-[7px] uppercase text-zinc-700">{KIND_LABEL[node.kind]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={() => setShowNames(value => !value)} aria-pressed={showNames} title="Toggle node names" className={`border p-1.5 transition ${showNames ? 'border-orange-400/45 text-orange-200' : 'border-white/[0.08] text-zinc-600 hover:text-zinc-300'}`}><Type size={11} /></button>
            <button type="button" onClick={() => setMotion(value => !value)} aria-pressed={motion} title="Toggle orbit motion" className={`border p-1.5 transition ${motion ? 'border-orange-400/45 text-orange-200' : 'border-white/[0.08] text-zinc-600 hover:text-zinc-300'}`}>{motion ? <Pause size={11} /> : <Play size={11} />}</button>
            <button type="button" onClick={fitView} title="Fit graph" className="border border-white/[0.08] p-1.5 text-zinc-600 transition hover:text-zinc-300"><LocateFixed size={11} /></button>
            <button type="button" onClick={reset} title="Reset map" className="border border-white/[0.08] p-1.5 text-zinc-600 transition hover:text-zinc-300"><RotateCcw size={11} /></button>
            <button type="button" onClick={() => void toggleFullscreen()} title={isFullscreen ? 'Exit fullscreen' : 'Full screen map'} className="border border-white/[0.08] p-1.5 text-zinc-600 transition hover:text-zinc-300">{isFullscreen ? <Minimize2 size={11} /> : <Maximize2 size={11} />}</button>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2 overflow-x-auto border-t border-white/[0.04] pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="shrink-0 text-[8px] uppercase tracking-[0.18em] text-zinc-600">{filterActive ? `${matchingCount} highlighted` : `${graph.nodes.length} nodes · ${graph.links.length} links`}</span>
          <span className="h-3 w-px shrink-0 bg-white/[0.08]" />
          <button type="button" onClick={() => setAreaFilter('all')} className={`shrink-0 border px-2 py-0.5 text-[8px] uppercase tracking-wider ${areaFilter === 'all' ? 'border-zinc-500 text-zinc-200' : 'border-white/[0.08] text-zinc-600'}`}>All areas</button>
          {areas.map(area => (
            <button key={area.area} type="button" onClick={() => setAreaFilter(areaFilter === area.area ? 'all' : area.area)} className={`flex shrink-0 items-center gap-1.5 border px-2 py-0.5 text-[8px] uppercase tracking-wider transition ${areaFilter === area.area ? 'border-white/25 text-zinc-100' : 'border-white/[0.07] text-zinc-600 hover:text-zinc-300'}`}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: area.color }} />{area.area} {area.count}
            </button>
          ))}
        </div>

        <div className="mt-1.5 flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="mr-1 shrink-0 text-[8px] uppercase tracking-[0.2em] text-zinc-700">Kind</span>
          {(['all', 'area', 'memory', 'skill', 'routine', 'run'] as const).map(kind => (
            <button key={kind} type="button" onClick={() => setKindFilter(kind)} className={`shrink-0 border px-2 py-0.5 text-[8px] uppercase tracking-wider transition ${kindFilter === kind ? 'border-orange-400/40 text-orange-200' : 'border-transparent text-zinc-700 hover:text-zinc-400'}`}>
              {kind === 'all' ? 'All' : KIND_LABEL[kind]}
            </button>
          ))}
        </div>
      </header>

      {view === 'orbit' && suppliedGraph ? <div className="absolute inset-x-0 bottom-8 top-36"><Suspense fallback={<p role="status">Loading 3D orbit…</p>}><SecondBrainOrbit3D key={sceneRevision} graph={graph} matchingIds={matchingIds} selectedId={selectedNodeId} onSelect={setSelectedNodeId} motion={motion} showNames={showNames} /></Suspense></div> : <svg viewBox={viewBox} className="absolute inset-0 z-10 h-full w-full" role="img" aria-label={`${view} view of the ${suppliedGraph ? 'workspace document' : 'configured system'} map`}>
        <defs>
          <radialGradient id="mapsCoreGlow"><stop offset="0%" stopColor="#FFCCB1" /><stop offset="32%" stopColor="#FF6B2C" /><stop offset="100%" stopColor="#FF481B" stopOpacity="0" /></radialGradient>
          <filter id="mapsSelectedGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>

        {view === 'rings' && MAPS_LAYER_ORDER.map(layer => {
          const radius = MAPS_LAYER_RADIUS[layer];
          return (
            <g key={layer}>
              <ellipse cx={MAPS_FRAME.cx} cy={MAPS_FRAME.cy} rx={radius * (compact ? 0.72 : 1)} ry={radius * 0.76} fill="none" stroke="rgba(255,255,255,.095)" strokeWidth="0.7" />
              <text x={MAPS_FRAME.cx} y={MAPS_FRAME.cy - radius * 0.76 - 7} textAnchor="middle" fill="rgba(255,255,255,.30)" fontSize="6.5" letterSpacing="1.2">{LAYER_LABEL[layer].toUpperCase()}</text>
            </g>
          );
        })}
        {view === 'circle' && <ellipse cx={MAPS_FRAME.cx} cy={MAPS_FRAME.cy} rx={292 * (compact ? 0.72 : 1)} ry="256" fill="none" stroke="rgba(255,255,255,.13)" strokeWidth="0.8" />}
        {view === 'orbit' && (
          <g fill="none" stroke="rgba(255,255,255,.075)" strokeWidth="0.7">
            <ellipse cx={MAPS_FRAME.cx} cy={MAPS_FRAME.cy} rx={246 * (compact ? 0.72 : 1)} ry="226" />
            <ellipse cx={MAPS_FRAME.cx} cy={MAPS_FRAME.cy} rx={246 * (compact ? 0.72 : 1)} ry="70" strokeDasharray="2 7" />
            <ellipse cx={MAPS_FRAME.cx} cy={MAPS_FRAME.cy} rx={95 * (compact ? 0.72 : 1)} ry="226" strokeDasharray="2 7" />
          </g>
        )}
        {view === 'timeline' && (
          <g>
            <line x1="175" x2="930" y1="350" y2="350" stroke="rgba(255,255,255,.14)" strokeWidth="0.8" />
            <text x="175" y="176" fill="rgba(255,255,255,.56)" fontSize="8" letterSpacing="1.5">ROUTINE RUNS BY DAY</text>
            <text x="175" y="399" fill="rgba(255,255,255,.56)" fontSize="8" letterSpacing="1.5">FILES BY LAST CHANGE</text>
            {timelineRunDays.length === 0
              ? <text x="250" y="245" fill="rgba(255,255,255,.24)" fontSize="7.5" letterSpacing="1">NO VERIFIED RUN TIMESTAMPS · UNDATED ITEMS BELOW</text>
              : timelineRunDays.map((day, index) => <text key={day} x={250 + (index / Math.max(1, timelineRunDays.length - 1)) * 650} y="192" textAnchor="middle" fill="rgba(255,255,255,.28)" fontSize="6.5">{formatDay(day)}</text>)}
            {timelineFileDays.length === 0
              ? <text x="250" y="465" fill="rgba(255,255,255,.24)" fontSize="7.5" letterSpacing="1">CHANGE TIMESTAMPS UNAVAILABLE · UNDATED ITEMS BELOW</text>
              : timelineFileDays.map((day, index) => <text key={day} x={250 + (index / Math.max(1, timelineFileDays.length - 1)) * 650} y="414" textAnchor="middle" fill="rgba(255,255,255,.28)" fontSize="6.5">{formatDay(day)}</text>)}
            <text x="175" y="286" fill="rgba(255,255,255,.18)" fontSize="6.5" letterSpacing="1">NO DATE</text>
            <text x="175" y="509" fill="rgba(255,255,255,.18)" fontSize="6.5" letterSpacing="1">NO DATE</text>
          </g>
        )}
        {view === 'areas' && centroids.map(area => (
          <g key={area.area}>
            <circle cx={area.x} cy={area.y} r={36 + Math.sqrt(area.count) * 8} fill={area.color} fillOpacity="0.018" stroke={area.color} strokeOpacity="0.16" strokeDasharray="2 5" />
            <text x={area.x} y={area.y - 48 - Math.sqrt(area.count) * 4} textAnchor="middle" fill={area.color} fillOpacity="0.8" fontSize="7" letterSpacing="1.2">{area.area.toUpperCase()}</text>
          </g>
        ))}
        {view === 'links' && centroids.map(area => (
          <text key={area.area} x={area.x} y={area.y - 34} textAnchor="middle" fill={area.color} fillOpacity="0.5" fontSize="6.5" letterSpacing="1.1">{area.area.toUpperCase()}</text>
        ))}

        <g fill="none">
          {graphLinks.map(link => {
            const source = points.get(link.source);
            const target = points.get(link.target);
            if (!source || !target) return null;
            const active = activeNodeId === link.source || activeNodeId === link.target;
            const filterMatch = matchingIds.has(link.source) && matchingIds.has(link.target);
            const muted = (activeNodeId && !active) || (filterActive && !filterMatch);
            const baseOpacity = view === 'links' ? 0.3 : view === 'circle' ? 0.15 : view === 'orbit' ? 0.13 : 0.08;
            return <path key={link.id} d={edgePath(source, target, view)} stroke={active ? '#FF9A64' : '#C7CAD1'} strokeOpacity={muted ? 0.015 : active ? 0.9 : baseOpacity} strokeWidth={active ? 1.25 : view === 'links' ? 0.72 : 0.55} vectorEffect="non-scaling-stroke" />;
          })}
        </g>

        {graph.nodes.filter(node => node.id !== graph.coreNodeId).sort((a, b) => (points.get(a.id)?.z || 0) - (points.get(b.id)?.z || 0)).map(node => {
          const point = points.get(node.id);
          if (!point) return null;
          const selected = selectedNodeId === node.id;
          const hovered = hoveredNodeId === node.id;
          const inFocus = (!activeNeighbors || activeNeighbors.has(node.id)) && (!filterActive || matchingIds.has(node.id));
          const depthOpacity = view === 'orbit' ? 0.42 + ((point.z + 1) / 2) * 0.58 : 1;
          return (
            <g key={node.id} className="cursor-pointer outline-none" opacity={inFocus ? depthOpacity : 0.08} filter={selected || hovered ? 'url(#mapsSelectedGlow)' : undefined} onMouseEnter={() => setHoveredNodeId(node.id)} onMouseLeave={() => setHoveredNodeId(null)} onFocus={() => setHoveredNodeId(node.id)} onBlur={() => setHoveredNodeId(null)} onClick={() => setSelectedNodeId(node.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedNodeId(node.id); } }} tabIndex={0} role="button" aria-label={`Open ${node.label} details`}>
              <circle cx={point.x} cy={point.y} r="13" fill="transparent" />
              <NodeGlyph node={node} point={point} selected={selected} />
              {(showNames || selected || hovered) && <text x={point.x + 9} y={point.y - 8} fill={selected || hovered ? '#FFF7F1' : 'rgba(255,255,255,.58)'} fontSize="7" letterSpacing="0.3" paintOrder="stroke" stroke="#07090b" strokeWidth="2.6">{node.label.length > 25 ? `${node.label.slice(0, 24)}…` : node.label}</text>}
            </g>
          );
        })}

        <CoreOrb motion={motion && view === 'orbit'} />
        <text x={MAPS_FRAME.cx} y="618" textAnchor="middle" fill="rgba(255,255,255,.20)" fontSize="6.5" letterSpacing="1.4">{suppliedGraph ? 'WORKSPACE DOCUMENTS · SAME CATEGORIES IN 2D & 3D' : 'SAME GOVERNED GRAPH · SIX STRUCTURAL PROJECTIONS'}</text>
      </svg>}

      <div className="pointer-events-none absolute bottom-4 left-4 z-20 hidden text-[8px] uppercase tracking-[0.17em] text-zinc-700 sm:block">{suppliedGraph ? 'Workspace index · no agent activity implied' : 'Configured graph · no runtime activity implied'}</div>

      {selectedNode && (
        <aside className="absolute bottom-4 right-4 z-30 w-[min(300px,calc(100%-2rem))] border border-white/[0.11] bg-[#090b0e]/96 p-3 shadow-2xl backdrop-blur-xl" aria-label="Selected map node">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0"><p className="text-[8px] uppercase tracking-[0.18em]" style={{ color: selectedNode.areaColor }}>{selectedNode.area} · {KIND_LABEL[selectedNode.kind]}</p><h2 className="mt-1 truncate text-[11px] font-semibold text-zinc-100">{selectedNode.label}</h2></div>
            <button type="button" onClick={() => setSelectedNodeId(null)} className="p-1 text-zinc-600 hover:text-white" aria-label="Close node details">×</button>
          </div>
          {selectedNode.note && <p className="mt-2 line-clamp-3 text-[10px] leading-relaxed text-zinc-500">{selectedNode.note}</p>}
          {selectedNode.path && <p className="mt-2 truncate border-l border-white/[0.08] pl-2 text-[8px] text-zinc-600">{selectedNode.path}</p>}
          <div className="mt-3 flex items-center justify-between border-t border-white/[0.08] pt-2 text-[11px]"><span className="text-zinc-600">Configured relationships</span><span className="text-zinc-300">{selectedNode.degree}</span></div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {!(view === 'orbit' && suppliedGraph) && <button type="button" onClick={() => flyTo(selectedNode.id)} className="inline-flex items-center gap-1 border border-white/[0.08] px-2 py-1 text-[8px] uppercase tracking-wider text-zinc-400 hover:text-white"><LocateFixed size={9} /> Fly to</button>}
            {selectedNode.path && <button type="button" onClick={() => void copyPath(selectedNode)} className="inline-flex items-center gap-1 border border-white/[0.08] px-2 py-1 text-[8px] uppercase tracking-wider text-zinc-400 hover:text-white"><Copy size={9} /> {copiedNodeId === selectedNode.id ? 'Copied' : 'Copy path'}</button>}
            {selectedNode.path && <a href={selectedNode.path} className="inline-flex items-center gap-1 border border-orange-400/20 px-2 py-1 text-[8px] uppercase tracking-wider text-orange-300 hover:text-orange-200"><ExternalLink size={9} /> Open</a>}
          </div>
        </aside>
      )}
    </div>
  );
}
