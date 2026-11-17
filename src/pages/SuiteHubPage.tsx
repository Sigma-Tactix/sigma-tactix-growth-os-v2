import React, { lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, Layers } from 'lucide-react';
import { Tabs } from '@/src/components/ui';
import { cn } from '@/src/lib/utils';
import { SUITE_HUBS, MEASUREMENT_MODULE, type SuiteHub as SuiteHubDef, type SuiteModule } from '@/src/data/suiteHubConfig';

/**
 * Unified Digital Marketing Suite hubs.
 *
 * Each hub (e.g. `/suite/creative`) is ONE workspace: the consolidated modules
 * mount here as tabs, reusing the existing module pages so all of their logic,
 * state and APIs are untouched. `/suite/attribution` is a single module and is
 * linked directly in navigation (no wrapper).
 *
 * A tab selection can be shared via ?tab=<moduleId> so deep links keep working
 * with the old module routes' intent.
 */

const MODULE_PAGES: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  '/attribution': lazy(() => import('@/src/pages/AttributionRoiPage')),
  '/content': lazy(() => import('@/src/pages/EditorialContentPage')),
  '/image-studio': lazy(() => import('@/src/pages/ImageStudioPage')),
  '/video-studio': lazy(() => import('@/src/pages/VideoStudioPage')),
  '/social-carousels': lazy(() => import('@/src/pages/SocialCarouselsPage')),
  '/social-listening': lazy(() => import('@/src/pages/SocialListeningPage')),
  '/seo-aeo': lazy(() => import('@/src/pages/SeoAeoPage')),
  '/cro-studio': lazy(() => import('@/src/pages/CroStudioPage')),
  '/intake': lazy(() => import('@/src/pages/IntakeEngine')),
  '/outreach': lazy(() => import('@/src/pages/OutreachLeadsPage')),
  '/paid-ads': lazy(() => import('@/src/pages/PaidAdsPage')),
  '/email-marketing': lazy(() => import('@/src/pages/EmailMarketingPage')),
  '/competitors': lazy(() => import('@/src/pages/CompetitorResearchPage')),
  '/market-simulator': lazy(() => import('@/src/pages/MarketSimulatorPage')),
};

function ModulePage({ module }: { module: SuiteModule }) {
  const Page = MODULE_PAGES[module.href];
  if (!Page) {
    return (
      <div className="sigma-card p-8 text-sm text-[var(--sigma-text-soft)]">
        Module workspace pending for {module.label}.
      </div>
    );
  }
  return (
    <Suspense
      fallback={
        <div className="sigma-panel min-h-[40vh] animate-pulse" aria-label={`Loading ${module.label}`} />
      }
    >
      <Page />
    </Suspense>
  );
}

export default function SuiteHubPage({ hubId }: { hubId: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const hub = (Object.values(SUITE_HUBS) as SuiteHubDef[]).find((h) => h.id === hubId);

  // Single-module measurement hub — direct link, no wrapper chrome.
  if (hubId === 'attribution') {
    return <ModulePage module={MEASUREMENT_MODULE} />;
  }
  if (!hub) {
    return (
      <div className="sigma-card p-8 text-sm text-[var(--sigma-text-soft)]">
        Unknown suite module. Open <code className="font-mono">/suite/creative</code> to start.
      </div>
    );
  }

  // The URL (?tab=<moduleId>) is the single source of truth for the active tab,
  // so browser back/forward and cross-hub deep links always resolve to a tab
  // that matches the address bar. Only a ?tab value that names a module OF THIS
  // hub wins; a stale or foreign ?tab falls back to the hub's first module
  // instead of silently driving the view.
  const activeModule =
    hub.modules.find((m) => m.id === searchParams.get('tab')) || hub.modules[0];

  return (
    <div className="space-y-8 sm:space-y-10 pb-16">
      <div className="sigma-page-header p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--sigma-primary)] font-semibold">
                {hub.department}
              </span>
              <span className="text-[var(--sigma-text-muted)] text-xs">•</span>
              <span className="text-xs font-mono text-[var(--sigma-text-muted)]">DEPARTMENT HUB</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-[-0.015em] text-[var(--sigma-text)]">
              {hub.title}
            </h1>
            <p className="max-w-2xl text-sm text-[var(--sigma-text-muted)] leading-relaxed">
              {hub.tagline}
            </p>
          </div>
          <div className="hidden shrink-0 items-center gap-2 rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)] px-3.5 py-2 text-xs font-mono text-[var(--sigma-text-muted)] sm:flex">
            <Layers size={14} className="text-[var(--sigma-primary)]" />
            <span>{hub.modules.length} workspaces in 1 hub</span>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-[var(--sigma-border)]">
          <Tabs
            tabs={hub.modules.map((m) => ({
              id: m.id,
              label: m.label,
              badge: m.badge,
              icon: <m.icon size={14} />,
            }))}
            activeTab={activeModule.id}
            onChange={(id) => {
              // Keep the URL the single source of truth. The module's own route
              // is preserved so deep links into sub-workspaces still resolve.
              const params = new URLSearchParams(searchParams);
              params.set('tab', id);
              setSearchParams(params, { replace: true });
            }}
          />
        </div>
      </div>

      {/* Module Workspace Canvas: Generous breathing room without restrictive unpadded outer border */}
      <div role="tabpanel" aria-label={activeModule.label} className="space-y-8 pt-2">
        <ModulePage module={activeModule} />
      </div>

      <div className="sigma-card flex items-center gap-3 rounded-2xl p-5 text-xs text-[var(--sigma-text-muted)]">
        <Building2 size={16} className="shrink-0 text-[var(--sigma-primary)]" />
        <span className="leading-relaxed">
          Consolidated space: the global marketing department “{hub.department}” maps to the{' '}
          {hub.modules.length} workspaces above. The standalone routes (e.g. {hub.modules[0].href}) still
          work, so existing deep links and generated reports are unaffected.
        </span>
      </div>
    </div>
  );
}
