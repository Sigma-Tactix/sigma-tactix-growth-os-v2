import React, { Suspense, useMemo } from 'react';
import { ThinkingOrb } from 'thinking-orbs';
import { BorderBeam } from 'border-beam';
import type { VantaPhase, VantaTopologyFocus } from '@/src/lib/vanta';
import VantaSynapticBrainOrb from './VantaSynapticBrainOrb';
import { isWebGLAvailable } from '@/src/lib/webglDetection';

interface VantaOrbProps {
  phase: VantaPhase;
  amplitude?: number;
  inspectMode?: boolean;
  topology?: VantaTopologyFocus;
  selectedNodeId?: string | null;
  onSelectNode?: (id: string) => void;
  className?: string;
  compact?: boolean;
}

const PHASE_COLOR: Record<VantaPhase, string> = {
  offline: '#B83E18',
  idle: '#FF481B',
  listening: '#4F7CFF',
  transcribing: '#38BDF8',
  thinking: '#FF7A34',
  speaking: '#FFF7ED',
  inspecting: '#35C9A5',
  proposing: '#F59E0B',
  awaiting_confirmation: '#F59E0B',
  success: '#35C9A5',
  warning: '#F59E0B',
  error: '#EF4444',
};

/**
 * Map Vanta phases → ThinkingOrb states (used for compact widget & 2D fallback).
 */
const ORB_STATE_MAP: Record<VantaPhase, string> = {
  offline: 'breathing',
  idle: 'breathing',
  listening: 'listening',
  transcribing: 'connecting',
  thinking: 'searching',
  speaking: 'composing',
  inspecting: 'weaving',
  proposing: 'solving',
  awaiting_confirmation: 'shaping',
  success: 'working',
  warning: 'shaping',
  error: 'shaping',
};

export default function VantaOrb({
  phase,
  amplitude = 0,
  inspectMode = false,
  topology,
  selectedNodeId = null,
  onSelectNode,
  className = '',
  compact = false,
}: VantaOrbProps) {
  const hasWebGL = useMemo(() => isWebGLAvailable(), []);

  // When compact or WebGL is not available, render the lightweight 2D ThinkingOrb
  if (compact || !hasWebGL) {
    const color = PHASE_COLOR[phase];
    const isProcessing = ['thinking', 'transcribing', 'inspecting', 'speaking'].includes(phase);
    const orbState = ORB_STATE_MAP[phase] as any;
    const orbSize = compact ? 20 : 64;
    const speed = phase === 'offline' ? 0.3 : isProcessing ? 1.2 + amplitude * 0.4 : 0.6 + amplitude * 0.3;

    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,#1a0803_0%,#080301_52%,#020101_100%)] ${className}`}
        role="img"
        aria-label={`VANTA neural core, ${phase.replace('_', ' ')}`}
      >
        {/* Radial phase-color glow behind the orb */}
        <div
          className="absolute inset-0 transition-all duration-700"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${color}20 0%, transparent 65%)`,
          }}
        />

        {/* The ThinkingOrb with a BorderBeam wrapper */}
        <BorderBeam
          size={compact ? 'sm' : 'md'}
          colorVariant="mono"
          strength={isProcessing ? 0.8 : 0.15}
          active={phase !== 'offline'}
          theme="dark"
        >
          <div
            className="relative flex items-center justify-center rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm"
            style={{
              width: compact ? 80 : 200,
              height: compact ? 80 : 200,
              padding: compact ? 12 : 40,
            }}
          >
            <div
              className="absolute inset-0 rounded-3xl transition-all duration-700"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${color}18 0%, transparent 70%)`,
              }}
            />
            <ThinkingOrb
              state={orbState}
              size={orbSize}
              speed={speed}
              paused={phase === 'offline'}
            />
          </div>
        </BorderBeam>

        {/* Edge vignette */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_38%,rgba(0,0,0,.54)_100%)]" />
      </div>
    );
  }

  // Full-stage 3D Synaptic Brain Orb matching the 5 reference frames & Second Brain Vault layers
  return (
    <Suspense
      fallback={
        <div className={`relative flex items-center justify-center bg-[#020101] ${className}`}>
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        </div>
      }
    >
      <VantaSynapticBrainOrb
        phase={phase}
        audioLevel={amplitude}
        selectedNodeId={selectedNodeId}
        onSelectNode={onSelectNode}
        topology={topology}
        className={className}
        interactive={true}
      />
    </Suspense>
  );
}

export { PHASE_COLOR };
