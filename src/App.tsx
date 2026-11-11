/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from '@/src/components/Layout';
import Dashboard from '@/src/pages/Dashboard';
import { UserProvider } from '@/src/contexts/UserContext';
import { ToastProvider } from '@/src/contexts/ToastContext';
import { WorkspaceProvider } from '@/src/contexts/WorkspaceContext';
import { TutorialProvider } from '@/src/contexts/TutorialContext';
import TutorialOverlay from '@/src/components/tutorial/TutorialOverlay';
import AuthGate from '@/src/components/AuthGate';
import { VantaProvider } from '@/src/contexts/VantaContext';
import { isVantaReleaseEnabled } from '@/src/lib/vantaFeatureFlag';
import { AppearanceProvider } from '@/src/contexts/AppearanceContext';

const Scheduler = lazy(() => import('@/src/pages/Scheduler'));
const AIExplorer = lazy(() => import('@/src/pages/AIExplorer'));
const DataSources = lazy(() => import('@/src/pages/DataSources'));
const Reports = lazy(() => import('@/src/pages/Reports'));
const Tenants = lazy(() => import('@/src/pages/Tenants'));
const ArchitectureViewer = lazy(() => import('@/src/pages/ArchitectureViewer'));
const SecondBrain = lazy(() => import('@/src/pages/SecondBrain'));
const IntakeEngine = lazy(() => import('@/src/pages/IntakeEngine'));
const GrowthDiagnostics = lazy(() => import('@/src/pages/GrowthDiagnostics'));
const AgentCockpit = lazy(() => import('@/src/pages/AgentCockpit'));
const LivingSystemPage = lazy(() => import('@/src/pages/LivingSystemPage'));
const SeoAeoPage = lazy(() => import('@/src/pages/SeoAeoPage'));
const CompetitorResearchPage = lazy(() => import('@/src/pages/CompetitorResearchPage'));
const MarketSimulatorPage = lazy(() => import('@/src/pages/MarketSimulatorPage'));
const PaidAdsPage = lazy(() => import('@/src/pages/PaidAdsPage'));
const OutreachLeadsPage = lazy(() => import('@/src/pages/OutreachLeadsPage'));
const SocialListeningPage = lazy(() => import('@/src/pages/SocialListeningPage'));
const MarketingTeamLearningsPage = lazy(() => import('@/src/pages/MarketingTeamLearningsPage'));
const EditorialContentPage = lazy(() => import('@/src/pages/EditorialContentPage'));
const SocialCarouselsPage = lazy(() => import('@/src/pages/SocialCarouselsPage'));
const ImageStudioPage = lazy(() => import('@/src/pages/ImageStudioPage'));
const VideoStudioPage = lazy(() => import('@/src/pages/VideoStudioPage'));
const EmailMarketingPage = lazy(() => import('@/src/pages/EmailMarketingPage'));
const CroStudioPage = lazy(() => import('@/src/pages/CroStudioPage'));
const AttributionRoiPage = lazy(() => import('@/src/pages/AttributionRoiPage'));
const AgentReachPage = lazy(() => import('@/src/pages/AgentReachPage'));
const VantaPreviewLab = lazy(() => import('@/src/pages/VantaPreviewLab'));
const SuiteHubPage = lazy(() => import('@/src/pages/SuiteHubPage'));

function RouteFallback() {
  return <div className="min-h-[40vh] animate-pulse rounded-2xl border border-white/5 bg-white/[0.02]" aria-label="Loading page" />;
}

function VantaRoute() {
  const location = useLocation();
  const fidelityLab = new URLSearchParams(location.search).has('vantaLab');

  if (isVantaReleaseEnabled() || fidelityLab) return <LivingSystemPage />;

  return (
    <main className="flex min-h-[65vh] items-center justify-center rounded-3xl border border-orange-500/15 bg-[#050302] p-6">
      <section className="max-w-xl rounded-2xl border border-white/10 bg-white/[0.025] p-8 text-center">
        <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-orange-300">VANTA release gate</p>
        <h1 className="mt-3 text-2xl font-black text-white">Living System is gated in this build</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          VANTA (the neural core and the 2D/3D system map) is intentionally held until its database
          migration, provider verification and visual acceptance checks pass. To run it on this
          machine:
        </p>
        <ol className="mt-4 space-y-2 rounded-xl border border-white/10 bg-black/30 p-4 text-left text-xs leading-relaxed text-zinc-300">
          <li><span className="font-mono text-orange-300">1.</span> Apply VANTA migration <span className="font-mono">0015_vanta_conversations.sql</span> to the configured Supabase database.</li>
          <li><span className="font-mono text-orange-300">2.</span> Set a verified Gemini key in <span className="font-mono">.env</span> (<span className="font-mono">GEMINI_API_KEY</span>) or Admin → AI Model Config.</li>
          <li><span className="font-mono text-orange-300">3.</span> Add <span className="font-mono">VITE_VANTA_ENABLED="true"</span> to <span className="font-mono">.env</span> and restart <span className="font-mono">npm run dev</span>.</li>
          <li><span className="font-mono text-orange-300">4.</span> In development only, append <span className="font-mono">?vantaLab=1</span> to <span className="font-mono">/living-system</span> for the fidelity preview.</li>
        </ol>
        <p className="mt-4 text-[11px] text-zinc-500">
          See <span className="font-mono">.env.example</span> (VANTA release gate) and{' '}
          <span className="font-mono">docs/module-health-audit</span> F-003 for the acceptance criteria.
        </p>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <AppearanceProvider>
    <AuthGate>
      <UserProvider>
        <ToastProvider>
          <WorkspaceProvider>
            <TutorialProvider>
            <BrowserRouter>
              <VantaProvider>
              <Layout>
                <Suspense fallback={<RouteFallback />}>
                <Routes>
                  {/* Growth OS Overview */}
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/diagnostics" element={<GrowthDiagnostics />} />
                  <Route path="/vaults" element={<SecondBrain />} />

                  {/* Digital Marketing Suite (Dedicated Modules) */}
                  {/* Consolidated suite hubs — see src/data/suiteHubConfig.ts */}
                  <Route path="/suite/creative" element={<SuiteHubPage hubId="creative" />} />
                  <Route path="/suite/social" element={<SuiteHubPage hubId="social" />} />
                  <Route path="/suite/search" element={<SuiteHubPage hubId="search" />} />
                  <Route path="/suite/demand" element={<SuiteHubPage hubId="demand" />} />
                  <Route path="/suite/paid" element={<SuiteHubPage hubId="paid" />} />
                  <Route path="/suite/intelligence" element={<SuiteHubPage hubId="intelligence" />} />
                  <Route path="/suite/attribution" element={<SuiteHubPage hubId="attribution" />} />
                  <Route path="/suite" element={<Navigate to="/suite/creative" replace />} />
                  <Route path="/seo-aeo" element={<SeoAeoPage />} />
                  <Route path="/paid-ads" element={<PaidAdsPage />} />
                  <Route path="/content" element={<EditorialContentPage />} />
                  <Route path="/social-carousels" element={<SocialCarouselsPage />} />
                  <Route path="/image-studio" element={<ImageStudioPage />} />
                  <Route path="/video-studio" element={<VideoStudioPage />} />
                  <Route path="/email-marketing" element={<EmailMarketingPage />} />
                  <Route path="/cro-studio" element={<CroStudioPage />} />
                  <Route path="/intake" element={<IntakeEngine />} />
                  <Route path="/outreach" element={<OutreachLeadsPage />} />
                  <Route path="/social-listening" element={<SocialListeningPage />} />
                  <Route path="/attribution" element={<AttributionRoiPage />} />
                  <Route path="/competitors" element={<CompetitorResearchPage />} />
                  <Route path="/market-simulator" element={<MarketSimulatorPage />} />

                  {/* Backwards Compatibility / Secondary Views */}
                  <Route path="/content-engine" element={<EditorialContentPage />} />
                  <Route path="/connectors" element={<DataSources />} />
                  <Route path="/data-sources" element={<DataSources />} />
                  <Route path="/sources" element={<DataSources />} />
                  <Route path="/learnings" element={<MarketingTeamLearningsPage />} />
                  <Route path="/explorer" element={<AIExplorer />} />
                  <Route path="/living-system" element={<VantaRoute />} />

                  {/* Isolated preview lab for Vanta polish — does NOT touch production */}
                  <Route path="/vanta-lab" element={<VantaPreviewLab />} />

                  {/* Autonomous Swarm Execution */}
                  <Route path="/agents" element={<AgentCockpit />} />
                  <Route path="/agent-reach" element={<AgentReachPage />} />
                  <Route path="/scheduler" element={<Scheduler />} />
                  <Route path="/reports" element={<Reports />} />

                  {/* Platform & Infrastructure */}
                  <Route path="/architecture" element={<ArchitectureViewer />} />
                  <Route path="/tenants" element={<Tenants />} />
                  <Route path="/admin" element={<Navigate to="/tenants" replace />} />
                  <Route path="/harness" element={<Tenants defaultTab="HARNESS_VIEW" />} />
                  <Route path="/models" element={<Tenants defaultTab="AI_CONFIG" />} />
                  <Route path="/prompts" element={<Tenants defaultTab="SYSTEM_PROMPTS" />} />
                  <Route path="/skills" element={<Tenants defaultTab="SKILLS_MCP" />} />
                  <Route path="/cron" element={<Tenants defaultTab="CRON_JOBS" />} />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                </Suspense>
              </Layout>
              <TutorialOverlay />
              </VantaProvider>
            </BrowserRouter>
            </TutorialProvider>
          </WorkspaceProvider>
        </ToastProvider>
      </UserProvider>
    </AuthGate>
    </AppearanceProvider>
  );
}
