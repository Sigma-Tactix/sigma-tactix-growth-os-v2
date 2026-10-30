import React, { useState } from 'react';
import {
  Users,
  Compass,
  MapPin,
  Smartphone,
  Monitor,
  Target,
  BrainCircuit,
  CheckCircle2,
  Zap,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Sparkles,
  Award,
  Clock,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import {
  DEMOGRAPHICS_AGE_DATA,
  DEMOGRAPHICS_GENDER_DATA,
  DEMOGRAPHICS_GEOMETRO_DATA,
  DEMOGRAPHICS_DEVICE_DATA,
  PSYCHOGRAPHICS_PERSONAS,
  PSYCHOGRAPHICS_INTENT_TIERS,
  PSYCHOGRAPHICS_BEHAVIORAL_CLUSTERS,
  PersonaProfile
} from '@/src/data/executiveReportsData';

export default function AudienceSegmentationView({ className }: { className?: string }) {
  const [activeSegmentTab, setActiveSegmentTab] = useState<'demographics' | 'psychographics'>('demographics');
  const [selectedPersona, setSelectedPersona] = useState<PersonaProfile>(PSYCHOGRAPHICS_PERSONAS[0]);

  return (
    <div className={cn("bg-surface border border-white/10 rounded-2xl p-6 lg:p-8 shadow-2xl space-y-6", className)}>
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users size={18} className="text-accent" />
            <h3 className="text-xl font-bold silver-text tracking-tight">
              Audience & ICP Intelligence Segmentation
            </h3>
            <span className="px-2 py-0.5 rounded bg-secondary/15 text-secondary text-[10px] font-mono font-bold border border-secondary/30">
              Customer Vault Vectors
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Granular demographic distributions and psychological buyer personas synthesized to maximize media efficiency and sales velocity.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="sigma-segmented font-mono">
          <button
            onClick={() => setActiveSegmentTab('demographics')}
            className={cn(
              "sigma-segment flex items-center gap-2",
              activeSegmentTab === 'demographics'
                ? "sigma-segment-active"
                : ""
            )}
          >
            <Compass size={13} />
            <span>Demographics</span>
          </button>

          <button
            onClick={() => setActiveSegmentTab('psychographics')}
            className={cn(
              "sigma-segment flex items-center gap-2",
              activeSegmentTab === 'psychographics'
                ? "sigma-segment-active"
                : ""
            )}
          >
            <BrainCircuit size={13} />
            <span>Psychographics & ICP</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* DEMOGRAPHICS VIEW */}
      {/* ==================================================================== */}
      {activeSegmentTab === 'demographics' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Row: Age Distribution & Gender Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Age Brackets Table & Bar Progress */}
            <div className="lg:col-span-8 p-5 bg-black/30 border border-white/5 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                    Age Bracket Breakdown
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">(Share of Conversions & AOV)</span>
                </div>
                <span className="text-[10px] font-mono text-accent">Core Peak: 25–44 Years</span>
              </div>

              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="text-[10px] text-muted uppercase border-b border-white/5">
                    <tr>
                      <th className="pb-2 font-bold">Age Bracket</th>
                      <th className="pb-2 font-bold">Share of Conv</th>
                      <th className="pb-2 font-bold text-right">Users</th>
                      <th className="pb-2 font-bold text-right">Avg Order / Deal</th>
                      <th className="pb-2 font-bold text-right">CAC</th>
                      <th className="pb-2 font-bold text-right">ROAS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {DEMOGRAPHICS_AGE_DATA.map((item) => (
                      <tr key={item.range} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 font-bold text-white flex items-center gap-2">
                          <span>{item.range}</span>
                          {item.shareOfConversions > 30 && (
                            <span className="px-1.5 py-0.2 rounded bg-accent/20 text-accent text-[11px] font-bold">
                              Primary
                            </span>
                          )}
                        </td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className="h-full bg-accent rounded-full"
                                style={{ width: `${item.shareOfConversions * 2}%` }}
                              />
                            </div>
                            <span className="text-zinc-200">{item.shareOfConversions}%</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-right text-zinc-300">{item.users.toLocaleString()}</td>
                        <td className="py-2.5 text-right font-bold text-white">${item.aov}</td>
                        <td className="py-2.5 text-right text-zinc-300">${item.cac.toFixed(2)}</td>
                        <td className="py-2.5 text-right font-bold text-emerald-400">{item.roas.toFixed(2)}x</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Gender & Decision-Maker Ratio */}
            <div className="lg:col-span-4 p-5 bg-black/30 border border-white/5 rounded-xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                    Decision-Maker Split
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">B2B Weighted</span>
                </div>

                <div className="space-y-4 pt-4">
                  {DEMOGRAPHICS_GENDER_DATA.map((g) => (
                    <div key={g.gender} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-zinc-300">{g.gender}</span>
                        <span className="text-white font-bold">{g.percentage}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-secondary rounded-full"
                          style={{ width: `${g.percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                        <span>{g.conversions} Conversions</span>
                        <span>{g.revShare}% Revenue Share</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg text-[11px] font-mono text-zinc-400">
                <span className="text-accent font-bold">Insight:</span> Combined technical and marketing leadership represents 94.6% of all deal activations.
              </div>
            </div>
          </div>

          {/* Bottom Row: Top Geographic Metros & Device Platforms */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Top Geographic Metros */}
            <div className="lg:col-span-7 p-5 bg-black/30 border border-white/5 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-accent" />
                  <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                    Top High-Converting Metros
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">Tier-1 Concentrated</span>
              </div>

              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="text-[10px] text-muted uppercase border-b border-white/5">
                    <tr>
                      <th className="pb-2 font-bold">Metropolitan Area</th>
                      <th className="pb-2 font-bold text-right">Conv</th>
                      <th className="pb-2 font-bold text-right">Revenue</th>
                      <th className="pb-2 font-bold text-right">ROAS</th>
                      <th className="pb-2 font-bold text-right">CPA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {DEMOGRAPHICS_GEOMETRO_DATA.map((geo) => (
                      <tr key={geo.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 font-bold text-white flex items-center gap-2">
                          <span className="text-sm">{geo.flag}</span>
                          <div>
                            <span className="text-zinc-200 block text-xs">{geo.metro}</span>
                            <span className="text-[10px] text-zinc-500">{geo.region}, {geo.country}</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-right text-emerald-400 font-bold">{geo.conversions}</td>
                        <td className="py-2.5 text-right text-white font-bold">${geo.revenue.toLocaleString()}</td>
                        <td className="py-2.5 text-right text-accent font-bold">{geo.roas.toFixed(2)}x</td>
                        <td className="py-2.5 text-right text-zinc-300">${geo.cpa.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Device & Platform Split */}
            <div className="lg:col-span-5 p-5 bg-black/30 border border-white/5 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <Monitor size={14} className="text-secondary" />
                  <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                    Platform & Operating System
                  </span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">Desktop Dominant (64.3%)</span>
              </div>

              <div className="space-y-3 pt-2">
                {DEMOGRAPHICS_DEVICE_DATA.map((d) => (
                  <div key={d.platform} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-white font-bold flex items-center gap-2">
                        {d.deviceType === 'Desktop' ? <Monitor size={13} className="text-secondary" /> : <Smartphone size={13} className="text-accent" />}
                        {d.platform}
                      </span>
                      <span className="text-accent font-bold">{d.share}% Share</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-zinc-400 pt-1 border-t border-white/5">
                      <div>Conv Rate: <strong className="text-emerald-400">{d.convRate}%</strong></div>
                      <div className="text-right">ROAS: <strong className="text-white">{d.roas.toFixed(2)}x</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* PSYCHOGRAPHICS & ICP PERSONAS VIEW */}
      {/* ==================================================================== */}
      {activeSegmentTab === 'psychographics' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Persona Selection Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PSYCHOGRAPHICS_PERSONAS.map((p) => {
              const isSelected = selectedPersona.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPersona(p)}
                  className={cn(
                    "p-4 rounded-xl text-left border transition-all space-y-1.5 relative overflow-hidden",
                    isSelected
                      ? "bg-accent/15 border-accent shadow-lg"
                      : "bg-black/40 border-white/10 hover:border-white/20"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent">
                      {p.shareOfLeads}% of Leads
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      LTV: ${(p.projectedLtv / 1000).toFixed(0)}k
                    </span>
                  </div>
                  <div className="font-bold text-white font-sans text-sm">{p.name}</div>
                  <div className="text-[11px] text-zinc-400 truncate">{p.role}</div>
                </button>
              );
            })}
          </div>

          {/* Selected Persona Deep Dive Card */}
          <div className="p-6 bg-black/40 border border-accent/40 rounded-2xl shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold text-white font-sans">{selectedPersona.name}</h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-mono font-bold border border-accent/30">
                    {selectedPersona.techAdoption}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">{selectedPersona.role} • {selectedPersona.subtitle}</p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-right">
                  <span className="text-[10px] text-muted block uppercase">Projected LTV</span>
                  <span className="text-sm font-bold text-emerald-400">${selectedPersona.projectedLtv.toLocaleString()}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-right">
                  <span className="text-[10px] text-muted block uppercase">Sales Velocity</span>
                  <span className="text-sm font-bold text-white">{selectedPersona.salesVelocityDays} Days</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-right">
                  <span className="text-[10px] text-muted block uppercase">Sentiment Index</span>
                  <span className="text-sm font-bold text-accent">{selectedPersona.sentimentScore}/100</span>
                </div>
              </div>
            </div>

            {/* Persona Attributes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <span className="text-[10px] uppercase text-accent font-bold tracking-wider block flex items-center gap-1.5">
                  <Target size={12} /> Primary Motivation
                </span>
                <p className="text-zinc-300 font-sans text-xs leading-relaxed">
                  {selectedPersona.primaryMotivation}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <span className="text-[10px] uppercase text-rose-400 font-bold tracking-wider block flex items-center gap-1.5">
                  <ShieldCheck size={12} /> Core Pain Point & Attribution Fog
                </span>
                <p className="text-zinc-300 font-sans text-xs leading-relaxed">
                  {selectedPersona.corePainPoint}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <span className="text-[10px] uppercase text-emerald-400 font-bold tracking-wider block flex items-center gap-1.5">
                  <Zap size={12} /> High-Probability Buying Trigger
                </span>
                <p className="text-zinc-300 font-sans text-xs leading-relaxed">
                  {selectedPersona.buyingTrigger}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <span className="text-[10px] uppercase text-amber-400 font-bold tracking-wider block flex items-center gap-1.5">
                  <Clock size={12} /> Primary Objection Vector
                </span>
                <p className="text-zinc-300 font-sans text-xs leading-relaxed">
                  {selectedPersona.objectionVector}
                </p>
              </div>
            </div>

            {/* Channel Affinities */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5 text-xs font-mono">
              <span className="text-[10px] uppercase text-muted tracking-wider">Dominant Touchpoints:</span>
              {selectedPersona.channelAffinity.map(ch => (
                <span key={ch} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300 text-xs">
                  {ch}
                </span>
              ))}
            </div>
          </div>

          {/* Intent Tiers & Behavioral Clusters Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Buyer Intent Tiers */}
            <div className="lg:col-span-6 p-5 bg-black/30 border border-white/5 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                  Buyer Intent Tiers
                </span>
                <span className="text-[10px] font-mono text-accent">Real-Time Scoring</span>
              </div>

              <div className="space-y-3">
                {PSYCHOGRAPHICS_INTENT_TIERS.map((t) => (
                  <div key={t.tier} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-white font-bold">{t.tier}</span>
                      <span className="text-accent font-bold">{t.percentage}% of Traffic</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                      {t.description}
                    </p>
                    <div className="flex justify-between text-[10px] font-mono text-zinc-400 pt-1 border-t border-white/5">
                      <span>Avg Deal: <strong className="text-white">${t.avgDealSize.toLocaleString()}</strong></span>
                      <span>Conv Rate: <strong className="text-emerald-400">{t.conversionRate}%</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Behavioral Clusters */}
            <div className="lg:col-span-6 p-5 bg-black/30 border border-white/5 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                  Behavioral Engagement Clusters
                </span>
                <span className="text-[10px] font-mono text-secondary">Second Brain Telemetry</span>
              </div>

              <div className="space-y-3">
                {PSYCHOGRAPHICS_BEHAVIORAL_CLUSTERS.map((b) => (
                  <div key={b.cluster} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold">{b.cluster}</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[11px] font-bold uppercase",
                        b.conversionLikelihood === 'Very High' ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" :
                        b.conversionLikelihood === 'High' ? "bg-accent/15 text-accent border border-accent/30" :
                        "bg-white/10 text-zinc-300"
                      )}>
                        {b.conversionLikelihood} Intent
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-sans">
                      {b.description}
                    </p>
                    <div className="text-[10px] text-secondary pt-1 flex items-center gap-1">
                      <ArrowRight size={10} /> Key Action: {b.topAction}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
