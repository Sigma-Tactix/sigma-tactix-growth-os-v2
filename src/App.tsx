/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/src/components/Layout';
import Dashboard from '@/src/pages/Dashboard';
import Scheduler from '@/src/pages/Scheduler';
import AIExplorer from '@/src/pages/AIExplorer';
import DataSources from '@/src/pages/DataSources';
import Reports from '@/src/pages/Reports';
import Tenants from '@/src/pages/Tenants';
import ArchitectureViewer from '@/src/pages/ArchitectureViewer';
import SecondBrain from '@/src/pages/SecondBrain';
import IntakeEngine from '@/src/pages/IntakeEngine';
import GrowthDiagnostics from '@/src/pages/GrowthDiagnostics';
import AgentCockpit from '@/src/pages/AgentCockpit';
import LivingSystemPage from '@/src/pages/LivingSystemPage';
import SeoAeoPage from '@/src/pages/SeoAeoPage';
import CompetitorResearchPage from '@/src/pages/CompetitorResearchPage';
import ContentEnginePage from '@/src/pages/ContentEnginePage';
import PaidAdsPage from '@/src/pages/PaidAdsPage';
import OutreachLeadsPage from '@/src/pages/OutreachLeadsPage';
import SocialListeningPage from '@/src/pages/SocialListeningPage';
import MarketingTeamLearningsPage from '@/src/pages/MarketingTeamLearningsPage';
import EditorialContentPage from '@/src/pages/EditorialContentPage';
import SocialCarouselsPage from '@/src/pages/SocialCarouselsPage';
import ImageStudioPage from '@/src/pages/ImageStudioPage';
import VideoStudioPage from '@/src/pages/VideoStudioPage';
import EmailMarketingPage from '@/src/pages/EmailMarketingPage';
import CroStudioPage from '@/src/pages/CroStudioPage';
import AttributionRoiPage from '@/src/pages/AttributionRoiPage';
import { UserProvider } from '@/src/contexts/UserContext';
import { ToastProvider } from '@/src/contexts/ToastContext';
import { WorkspaceProvider } from '@/src/contexts/WorkspaceContext';
import { TutorialProvider } from '@/src/contexts/TutorialContext';
import TutorialOverlay from '@/src/components/tutorial/TutorialOverlay';

export default function App() {
  return (
    <UserProvider>
      <ToastProvider>
        <WorkspaceProvider>
          <TutorialProvider>
            <BrowserRouter>
              <Layout>
                <Routes>
                  {/* Growth OS Overview */}
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/diagnostics" element={<GrowthDiagnostics />} />
                  <Route path="/vaults" element={<SecondBrain />} />

                  {/* Digital Marketing Suite (Dedicated Modules) */}
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

                  {/* Backwards Compatibility / Secondary Views */}
                  <Route path="/content-engine" element={<EditorialContentPage />} />
                  <Route path="/connectors" element={<DataSources />} />
                  <Route path="/data-sources" element={<DataSources />} />
                  <Route path="/sources" element={<DataSources />} />
                  <Route path="/learnings" element={<MarketingTeamLearningsPage />} />
                  <Route path="/explorer" element={<AIExplorer />} />
                  <Route path="/living-system" element={<LivingSystemPage />} />

                  {/* Autonomous Swarm Execution */}
                  <Route path="/agents" element={<AgentCockpit />} />
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
              </Layout>
              <TutorialOverlay />
            </BrowserRouter>
          </TutorialProvider>
        </WorkspaceProvider>
      </ToastProvider>
    </UserProvider>
  );
}
