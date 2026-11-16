/**
 * TEMPORARY dev-only harness (no Supabase session needed) used to visually
 * verify the app shell (topbar logo + theme toggle). Renders the same
 * provider stack as App.tsx but replaces AuthGate with a fake signed-in user
 * so Layout + routes mount without credentials.
 *
 * Entry: preview-harness.html (root). Deleted after verification.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/ibm-plex-sans';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import '@fontsource/ibm-plex-mono/latin-600.css';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import './index.css';

import { AppearanceProvider } from '@/src/contexts/AppearanceContext';
import { UserProvider } from '@/src/contexts/UserContext';
import { ToastProvider } from '@/src/contexts/ToastContext';
import { WorkspaceProvider } from '@/src/contexts/WorkspaceContext';
import { TutorialProvider } from '@/src/contexts/TutorialContext';
import { VantaProvider } from '@/src/contexts/VantaContext';
import Layout from '@/src/components/Layout';
import Dashboard from '@/src/pages/Dashboard';

const GrowthDiagnostics = lazy(() => import('@/src/pages/GrowthDiagnostics'));
const SecondBrain = lazy(() => import('@/src/pages/SecondBrain'));
const SuiteHubPage = lazy(() => import('@/src/pages/SuiteHubPage'));

function SuiteHubRouteWrapper() {
  const { hubId = 'creative' } = useParams<{ hubId: string }>();
  return <SuiteHubPage hubId={hubId} />;
}

const el = document.getElementById('root');

export function mountHarness() {
  if (!el) return;
  createRoot(el).render(
    <StrictMode>
      <AppearanceProvider>
        <UserProvider>
          <ToastProvider>
            <WorkspaceProvider>
              <TutorialProvider>
                <BrowserRouter>
                  <VantaProvider>
                    <Layout>
                      <Suspense fallback={<div className="min-h-[40vh] animate-pulse" />}>
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/diagnostics" element={<GrowthDiagnostics />} />
                          <Route path="/vaults" element={<SecondBrain />} />
                          <Route path="/suite" element={<Navigate to="/suite/creative" replace />} />
                          <Route path="/suite/:hubId" element={<SuiteHubRouteWrapper />} />
                          <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                      </Suspense>
                    </Layout>
                  </VantaProvider>
                </BrowserRouter>
              </TutorialProvider>
            </WorkspaceProvider>
          </ToastProvider>
        </UserProvider>
      </AppearanceProvider>
    </StrictMode>
  );
}

mountHarness();
