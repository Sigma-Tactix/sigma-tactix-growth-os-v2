import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html, Line, OrbitControls } from '@react-three/drei';
import type { MapsBrainGraph } from '@/src/lib/mapsBrainOrbit';

class OrbitBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p role="status" className="p-6">3D rendering is unavailable. Choose Rings or Areas for the 2D view.</p> : this.props.children; }
}

type Position = [number, number, number];
export default function SecondBrainOrbit3D({ graph, matchingIds, selectedId, onSelect, motion, showNames }: {
  graph: MapsBrainGraph; matchingIds: Set<string>; selectedId: string | null;
  onSelect: (id: string) => void; motion: boolean; showNames: boolean;
}) {
  const positions = useMemo(() => {
    const points = new Map<string, Position>([[graph.coreNodeId, [0, 0, 0]]]);
    const areas = [...new Set(graph.nodes.filter(node => node.id !== graph.coreNodeId).map(node => node.area))].sort();
    areas.forEach((area, index) => {
      const angle = index / areas.length * Math.PI * 2;
      const center: Position = [Math.cos(angle) * 5, Math.sin(angle * 2) * 1.3, Math.sin(angle) * 5];
      const members = graph.nodes.filter(node => node.area === area && node.id !== graph.coreNodeId);
      members.forEach((node, offset) => {
        const theta = offset * 2.39996;
        const radius = node.kind === 'area' ? 0 : 0.6 + Math.sqrt(offset) * 0.23;
        points.set(node.id, [center[0] + Math.cos(theta) * radius, center[1] + Math.sin(theta) * radius, center[2] + Math.sin(theta * 0.7) * radius]);
      });
    });
    return points;
  }, [graph]);
  return (
    <OrbitBoundary><Canvas camera={{ position: [0, 6, 15], fov: 48 }} dpr={[1, 1.5]} frameloop={motion ? 'always' : 'demand'} fallback={<div role="status">3D unavailable. Choose Rings or Areas for the 2D view.</div>}>
      <ambientLight intensity={1.8} />
      <pointLight position={[3, 5, 6]} intensity={35} />
      {[0, Math.PI / 3, -Math.PI / 3].map(angle => <mesh key={angle} rotation={[Math.PI / 2, angle, 0]}><torusGeometry args={[6.6, 0.012, 6, 100]} /><meshBasicMaterial color="#64748b" transparent opacity={0.3} /></mesh>)}
      {graph.links.map(link => {
        const source = positions.get(link.source), target = positions.get(link.target);
        return source && target ? <Line key={link.id} points={[source, target]} color="#94A3B8" transparent opacity={matchingIds.has(link.source) && matchingIds.has(link.target) ? 0.24 : 0.025} lineWidth={0.7} /> : null;
      })}
      {graph.nodes.map(node => <group key={node.id} position={positions.get(node.id)}>
        <mesh onClick={event => { event.stopPropagation(); onSelect(node.id); }} scale={node.id === graph.coreNodeId ? 0.55 : selectedId === node.id ? 0.24 : node.kind === 'area' ? 0.19 : 0.11}>
          {node.kind === 'memory' || node.kind === 'skill' ? <octahedronGeometry /> : node.kind === 'routine' ? <boxGeometry /> : <sphereGeometry args={[1, 16, 12]} />}
          <meshStandardMaterial color={node.areaColor} emissive={node.areaColor} emissiveIntensity={selectedId === node.id ? 1.5 : 0.4} transparent opacity={matchingIds.has(node.id) ? 1 : 0.08} />
        </mesh>
        {(node.id === graph.coreNodeId || selectedId === node.id || (showNames && matchingIds.has(node.id))) && <Html center distanceFactor={14} position={[0, node.id === graph.coreNodeId ? 0.85 : 0.35, 0]} style={{ pointerEvents: 'none', whiteSpace: 'nowrap', color: node.areaColor, fontSize: 11 }}>{node.id === graph.coreNodeId ? 'VANTA' : node.label}</Html>}
      </group>)}
      <OrbitControls makeDefault autoRotate={motion} autoRotateSpeed={0.35} enableDamping minDistance={3} maxDistance={30} />
    </Canvas></OrbitBoundary>
  );
}
