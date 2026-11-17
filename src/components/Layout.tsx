import React, { useState, useRef, useEffect, useMemo } from 'react';

import { NavLink, useLocation, useNavigate } from 'react-router-dom';

import { 

  LayoutDashboard, 

  Database, 

  Sparkles, 

  CalendarClock, 

  Users, 

  Search, 

  Bell, 

  Settings, 

  ChevronRight,

  Menu,

  X,

  CreditCard,

  RefreshCw,

  ShieldCheck,

  UserCircle,

  FileBarChart,

  Bot,

  ClipboardCheck,

  Workflow,

  Zap,

  Lock,

  Layers,

  CheckCircle2,

  Activity,

  AlertTriangle,

  Globe,

  Crosshair,

  PenTool,

  Megaphone,

  Send,

  Ear,

  GraduationCap,

  Building,

  ChevronDown,

  Plus,

  Mail,

  Target,

  BarChart3,

  Image as ImageIcon,

  Video,

  Share2,

  FileText,

  Wifi,

  Trophy,

  Swords,

  BrainCircuit,

} from 'lucide-react';

import { cn } from '@/src/lib/utils';

import { motion, AnimatePresence } from 'motion/react';

import { useUser, UserRole } from '@/src/contexts/UserContext';

import { useWorkspace } from '@/src/contexts/WorkspaceContext';
import { useVanta } from '@/src/contexts/VantaContext';

import AIChatbot from '@/src/components/AIChatbot';

import ClientOnboardingWizard from '@/src/components/ClientOnboardingWizard';

import EcosystemStatusBar from '@/src/components/EcosystemStatusBar';

import LivingSystemSidebarWidget from '@/src/components/LivingSystemSidebarWidget';

import TutorialHUD from '@/src/components/tutorial/TutorialHUD';

import { useTutorial } from '@/src/contexts/TutorialContext';

import ThemeToggle from '@/src/components/ui/ThemeToggle';

import VantaHeaderIndicator from '@/src/components/vanta/VantaHeaderIndicator';

import VantaTranscriptDrawer from '@/src/components/vanta/VantaTranscriptDrawer';

import VantaCompactDock from '@/src/components/vanta/VantaCompactDock';

import SigmaTactixLogo from '@/src/components/brand/SigmaTactixLogo';

import Button from '@/src/components/ui/Button';

import { isVantaReleaseEnabled, resolveVantaNavigationTarget, VANTA_GATED_BADGE } from '@/src/lib/vantaFeatureFlag';

import { isDemoSeedEnabled } from '@/src/lib/demoSeed';

import { useActionQueue } from '@/src/lib/actionQueueStore';



interface NavSection {

  title: string;

  items: {

    label: string;

    href: string;

    icon: any;

    roles: UserRole[];

    badge?: string;

  }[];

}



const developmentEnv = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env;

const vantaNavigationTarget = resolveVantaNavigationTarget({

  releaseEnabled: isVantaReleaseEnabled(),

  development: developmentEnv?.DEV === true,

});



// The Living System entry point is always discoverable. When the VANTA release

// gate is off (and not in a dev preview) it still shows — with a "Gated" badge

// — so the surface and the 2D/3D system map are not mistaken for "missing" or

// "broken"; opening it explains exactly what to enable.

const vantaNavigationItems: NavSection['items'] = [

  {

    label: 'Living System',

    href: (vantaNavigationTarget?.href ?? '/living-system') as string,

    icon: BrainCircuit,

    roles: ['ADMIN', 'SUB_ADMIN', 'USER'],

    badge: vantaNavigationTarget?.badge ?? VANTA_GATED_BADGE,

  },

];



const navSections: NavSection[] = [

  {

    title: 'Growth OS Overview',

    items: [

      { label: 'Executive Dashboard', href: '/', icon: LayoutDashboard, roles: ['ADMIN', 'SUB_ADMIN', 'USER'] },

      { label: 'Growth Diagnostics', href: '/diagnostics', icon: ClipboardCheck, roles: ['ADMIN', 'SUB_ADMIN', 'USER'], badge: 'Health Audit' },

      { label: 'Second Brain Vaults', href: '/vaults', icon: Database, roles: ['ADMIN', 'SUB_ADMIN', 'USER'] },

      ...vantaNavigationItems,

    ]

  },

  {

    title: 'Digital Marketing Suite',

    items: [

      { label: 'Creative Studio', href: '/suite/creative', icon: FileText, roles: ['ADMIN', 'SUB_ADMIN', 'USER'], badge: 'Text · Image · Video' },

      { label: 'Social Publishing Hub', href: '/suite/social', icon: Share2, roles: ['ADMIN', 'SUB_ADMIN', 'USER'], badge: 'Publish + Listen' },

      { label: 'Search & Conversion', href: '/suite/search', icon: Globe, roles: ['ADMIN', 'SUB_ADMIN', 'USER'], badge: 'SEO · AEO · CRO' },

      { label: 'Demand Engine', href: '/suite/demand', icon: Zap, roles: ['ADMIN', 'SUB_ADMIN', 'USER'], badge: 'Inbound + Outbound' },

      { label: 'Paid & Retention', href: '/suite/paid', icon: Megaphone, roles: ['ADMIN', 'SUB_ADMIN', 'USER'], badge: 'Ads + Email' },

      { label: 'Market Intelligence', href: '/suite/intelligence', icon: Trophy, roles: ['ADMIN', 'SUB_ADMIN', 'USER'], badge: 'Competitors + MiroFish' },

      { label: 'Attribution & Blended CAC', href: '/suite/attribution', icon: BarChart3, roles: ['ADMIN', 'SUB_ADMIN', 'USER'] },

    ]

  },

  {

    title: 'Autonomous AI Operations',

    items: [

      { label: 'Agent Cockpit & Approvals', href: '/agents', icon: Bot, roles: ['ADMIN', 'SUB_ADMIN'] },

      { label: 'Agent Reach Router', href: '/agent-reach', icon: Wifi, roles: ['ADMIN', 'SUB_ADMIN', 'USER'], badge: '15 Channels' },

      { label: 'Report Scheduler', href: '/scheduler', icon: CalendarClock, roles: ['ADMIN', 'SUB_ADMIN'] },

      { label: 'Executive Reports', href: '/reports', icon: FileBarChart, roles: ['ADMIN', 'SUB_ADMIN', 'USER'] },

    ]

  },

  {

    title: 'Platform & Infrastructure',

    items: [

      { label: 'Connectors & Integrations', href: '/connectors', icon: Database, roles: ['ADMIN', 'SUB_ADMIN', 'USER'], badge: 'Pipelines' },

      { label: 'Admin Command Center', href: '/tenants', icon: Users, roles: ['ADMIN'] },

      { label: 'System Topology & Harness', href: '/harness', icon: Layers, roles: ['ADMIN', 'SUB_ADMIN'] },

      { label: 'Architecture Viewer', href: '/architecture', icon: Workflow, roles: ['ADMIN', 'SUB_ADMIN', 'USER'] },

    ]

  }

];



export default function Layout({ children }: { children: React.ReactNode }) {

  const { role, setRole, isSidebarOpen, toggleSidebar } = useUser();

  const { currentWorkspace, workspaces, switchWorkspace, provisionWorkspace } = useWorkspace();
  const { dockOpen, setDockOpen } = useVanta();

  const { startTutorial, isActive, hasEverStarted, isCompleted } = useTutorial();

  const location = useLocation();

  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');

  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const [isEcosystemStatusOpen, setIsEcosystemStatusOpen] = useState(false);

  const [isEcosystemStatusDocked, setIsEcosystemStatusDocked] = useState(false);

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);

  const [isPlaybookDropdownOpen, setIsPlaybookDropdownOpen] = useState(false);

  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

  const roleMenuRef = useRef<HTMLDivElement>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const notificationsRef = useRef<HTMLDivElement>(null);

  const { items: queueItems, stats: queueStats } = useActionQueue();



  // The bell menu is driven by the real Action Queue store — no fixture alerts.

  // Only items awaiting operator attention surface here; RUNNING items are not

  // actionable from the shell.

  const notificationItems = useMemo(

    () => queueItems.filter(i => i.status === 'PENDING_APPROVAL' || i.status === 'ALERT'),

    [queueItems],

  );

  const hasUnreadNotifications = queueStats.pendingCount + queueStats.alertCount > 0;



  // Back the ⌘K / Ctrl+K hint on the quick-search field: it focuses the input.

  useEffect(() => {

    const onKeyDown = (e: KeyboardEvent) => {

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {

        e.preventDefault();

        searchInputRef.current?.focus();

        searchInputRef.current?.select();

      } else if (e.altKey && e.key.toLowerCase() === 'v') {

        e.preventDefault();

        setDockOpen(!dockOpen);

      }

    };

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);

  }, [dockOpen, setDockOpen]);



  // Notifications menu: close on outside-click and Escape (click-toggle, not hover)

  useEffect(() => {

    if (!isNotificationsOpen) return;

    const onPointerDown = (e: MouseEvent) => {

      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {

        setIsNotificationsOpen(false);

      }

    };

    const onKeyDown = (e: KeyboardEvent) => {

      if (e.key === 'Escape') setIsNotificationsOpen(false);

    };

    document.addEventListener('mousedown', onPointerDown);

    document.addEventListener('keydown', onKeyDown);

    return () => {

      document.removeEventListener('mousedown', onPointerDown);

      document.removeEventListener('keydown', onKeyDown);

    };

  }, [isNotificationsOpen]);



  const handleQuickSearchSelect = (href: string) => {

    navigate(href);

    setSearchQuery('');

    setIsSearchFocused(false);

  };



  // Close the role menu on outside-click and Escape (it is a click-toggle, not hover)

  useEffect(() => {

    if (!isRoleMenuOpen) return;

    const onPointerDown = (e: MouseEvent) => {

      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {

        setIsRoleMenuOpen(false);

      }

    };

    const onKeyDown = (e: KeyboardEvent) => {

      if (e.key === 'Escape') setIsRoleMenuOpen(false);

    };

    document.addEventListener('mousedown', onPointerDown);

    document.addEventListener('keydown', onKeyDown);

    return () => {

      document.removeEventListener('mousedown', onPointerDown);

      document.removeEventListener('keydown', onKeyDown);

    };

  }, [isRoleMenuOpen]);



  const allNavItems = navSections.flatMap(s => s.items);

  const searchResults = searchQuery.trim() 

    ? allNavItems.filter(i => i.label.toLowerCase().includes(searchQuery.toLowerCase()))

    : [];



  const isDigitalMarketingRoute =

    location.pathname.startsWith('/suite') ||

    ['/seo-aeo', '/paid-ads', '/content', '/content-engine', '/social-carousels',

     '/image-studio', '/video-studio', '/email-marketing', '/cro-studio', '/intake',

     '/outreach', '/social-listening', '/attribution', '/competitors', '/market-simulator'

    ].includes(location.pathname);



  return (

    <div className="sigma-app flex min-h-[100dvh] bg-background overflow-hidden selection:bg-accent/20 selection:text-[var(--sigma-text)]">

      {isSidebarOpen && (

        <button

          type="button"

          aria-label="Close navigation"

          onClick={toggleSidebar}

          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[2px] md:hidden"

        />

      )}



      {/* Sidebar */}

      <aside

        className={cn(

          "sigma-shell fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col border-r transition-[transform,width] duration-200 md:relative md:inset-auto md:z-20",

          isSidebarOpen ? "translate-x-0 md:w-[280px]" : "-translate-x-full md:w-20 md:translate-x-0"

        )}

      >

        <div className="p-4 flex flex-col gap-4">

          <div className="flex items-center justify-between px-1">

            <SigmaTactixLogo

              variant={isSidebarOpen ? 'full' : 'mark'}

              size={isSidebarOpen ? 'md' : 30}

              onClick={() => navigate('/')}

            />

            <button

              type="button"

              aria-label="Close navigation"

              onClick={toggleSidebar}

              className="rounded-lg p-2 text-[var(--sigma-text-muted)] hover:bg-[var(--sigma-surface-subtle)] hover:text-[var(--sigma-text)] md:hidden"

            >

              <X size={18} />

            </button>

          </div>



          {/* Living System: 1 separate element on left hand side bar far above everything */}

          <LivingSystemSidebarWidget isSidebarOpen={isSidebarOpen} />



          {/* Quick Stats Pill */}

          {isSidebarOpen && (

            <div className="space-y-2">

              <button

                type="button"

                onClick={() => navigate('/vaults')}

                aria-label="Second Brain Core: open workspace evidence"

                className="px-3 py-2 bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)] rounded-xl flex items-center justify-between group hover:border-[var(--sigma-border-strong)] transition-all cursor-pointer shadow-xs text-left w-full"

              >

                <div className="flex items-center gap-2.5 min-w-0">

                  <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" aria-hidden="true" />

                  <div className="truncate">

                    <div className="text-xs font-semibold text-[var(--sigma-text)] truncate">Second Brain Core</div>

                    <div className="text-[11px] text-[var(--sigma-text-muted)] truncate">Open workspace evidence</div>

                  </div>

                </div>

                <ChevronRight size={14} className="text-[var(--sigma-text-muted)] group-hover:text-[var(--sigma-text)] transition-transform group-hover:translate-x-0.5" />

              </button>



              {/* Ecosystem Live Status Trigger Bar */}

              <button

                type="button"

                onClick={() => {

                  setIsEcosystemStatusOpen(true);

                  setIsEcosystemStatusDocked(true);

                }}

                aria-pressed={isEcosystemStatusOpen && isEcosystemStatusDocked}

                aria-label="Open ecosystem status evidence"

                className={cn(

                  "w-full px-3 py-2 rounded-xl flex items-center justify-between group transition-all cursor-pointer border text-xs shadow-xs",

                  isEcosystemStatusOpen && isEcosystemStatusDocked

                    ? "bg-[var(--sigma-primary)] text-[var(--sigma-on-primary)] border-[var(--sigma-primary)] font-semibold"

                    : "bg-[var(--sigma-surface-subtle)] border-[var(--sigma-border)] hover:border-[var(--sigma-border-strong)] text-[var(--sigma-text)]"

                )}

              >

                <div className="flex items-center gap-2.5 min-w-0">

                  <Activity size={14} className={cn("shrink-0", isEcosystemStatusOpen && isEcosystemStatusDocked ? "text-[var(--sigma-on-primary)]" : "text-[var(--sigma-primary)]")} />

                  <div className="truncate">

                    <div className="font-semibold truncate flex items-center gap-1.5">

                      <span>Ecosystem Status</span>

                      <span className={cn(

                        "text-[11px] px-1.5 py-0.2 rounded font-medium",

                        isEcosystemStatusOpen && isEcosystemStatusDocked ? "bg-[var(--sigma-inverse)]/20 text-[var(--sigma-on-primary)]" : "bg-[var(--sigma-surface)] text-[var(--sigma-text-soft)]"

                      )}>STATUS</span>

                    </div>

                    <div className={cn(

                      "text-[11px] truncate",

                      isEcosystemStatusOpen && isEcosystemStatusDocked ? "text-[var(--sigma-on-primary)]/80" : "text-[var(--sigma-text-muted)]"

                    )}>Runtime evidence and checks</div>

                  </div>

                </div>

                <ChevronRight size={13} className={cn("transition-transform group-hover:translate-x-0.5", isEcosystemStatusOpen && isEcosystemStatusDocked ? "text-[var(--sigma-on-primary)]" : "text-[var(--sigma-text-muted)] group-hover:text-[var(--sigma-text)]")} />

              </button>

            </div>

          )}



          {/* Collapsed sidebar trigger icon */}

          {!isSidebarOpen && (

            <button

              onClick={() => {

                setIsEcosystemStatusOpen(true);

                setIsEcosystemStatusDocked(true);

              }}

              title="Review ecosystem status evidence"

              className="relative p-2.5 mx-auto bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)] hover:border-[var(--sigma-border-strong)] rounded-xl flex items-center justify-center text-[var(--sigma-primary)] transition-all group cursor-pointer"

            >

              <Activity size={16} />

              {/* A steady green reads as "healthy" and would fabricate a signal at

                  the outermost surface of the status system. In a real workspace the

                  panel honestly reports "Not checked", so the dot is neutral; it is

                  green only in demo mode, where sample telemetry actually exists. */}

              <span className={cn(

                "absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full",

                isDemoSeedEnabled() ? "bg-emerald-400" : "bg-[var(--sigma-text-muted)] opacity-60"

              )} />

            </button>

          )}

        </div>



        {/* Navigation List grouped by layer */}

        <nav className="flex-1 px-3 py-2 space-y-5 overflow-y-auto custom-scrollbar">

          {navSections.map((section, sIdx) => {

            const sectionItems = section.items.filter(item => item.roles.includes(role));

            if (sectionItems.length === 0) return null;



            return (

              <div key={sIdx} className="space-y-1">

                {isSidebarOpen && (

                  <div className="px-3 text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--sigma-text-muted)] font-semibold mb-1 opacity-70">

                    {section.title}

                  </div>

                )}

                {sectionItems.map((item) => {

                  const itemPathname = item.href.split('?')[0];

                  const isActive = location.pathname === itemPathname;

                  return (

                    <NavLink

                      key={item.href}

                      to={item.href}

                      className={cn(

                        "flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-150 group relative select-none",

                        isActive 

                          ? "bg-[var(--sigma-surface-raised)] text-[var(--sigma-text)] font-semibold border border-[var(--sigma-border-strong)] shadow-xs"

                          : "text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)] hover:bg-[var(--sigma-surface-subtle)]"

                      )}

                    >

                      <div className="flex items-center gap-2.5 min-w-0">

                        {isActive && (

                          <div className="w-1.5 h-1.5 rounded-full bg-[var(--sigma-primary)] shrink-0" />

                        )}

                        <item.icon size={16} className={cn("shrink-0 transition-colors", isActive ? "text-[var(--sigma-primary)]" : "text-[var(--sigma-text-muted)] group-hover:text-[var(--sigma-text)]" )}/>

                        {isSidebarOpen && (

                          <span className="font-medium whitespace-nowrap truncate tracking-tight">

                            {item.label}

                          </span>

                        )}

                      </div>



                      {isSidebarOpen && item.badge && (

                        <span className={cn(

                          "text-[11px] px-1.5 py-0.5 rounded-md font-medium tracking-tight",

                          isActive ? "bg-[var(--sigma-primary)]/15 text-[var(--sigma-primary)]" : "bg-[var(--sigma-surface-subtle)] text-[var(--sigma-text-muted)] border border-[var(--sigma-border)]"

                        )}>

                          {item.badge}

                        </span>

                      )}



                      {/* Active Indicator for collapsed mode */}

                      {isActive && !isSidebarOpen && (

                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[var(--sigma-primary)] rounded-l-full" />

                      )}

                    </NavLink>

                  );

                })}

              </div>

            );

          })}

        </nav>



        {/* Sidebar Footer */}

        <div className="px-4 py-4 border-t border-[var(--sigma-border)] space-y-2">

          <button

            type="button"

            onClick={toggleSidebar}

            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)] hover:bg-[var(--sigma-surface-subtle)] transition-all group cursor-pointer"

          >

            <div className="w-6 flex justify-center">

               <ChevronRight

                 size={18}

                 className={cn("transition-transform duration-300", isSidebarOpen && "rotate-180")}

               />

            </div>

            {isSidebarOpen && <span className="font-bold text-[11px] uppercase tracking-widest text-[var(--sigma-text-muted)] group-hover:text-[var(--sigma-text)]">Collapse Sidebar</span>}

          </button>

        </div>

      </aside>



      {/* Persistent Left-Side Ecosystem Status Bar (Docked or Slide-over) */}

      <EcosystemStatusBar 

        isOpen={isEcosystemStatusOpen}

        isDocked={isEcosystemStatusDocked}

        onClose={() => setIsEcosystemStatusOpen(false)}

        onToggleDock={() => setIsEcosystemStatusDocked(!isEcosystemStatusDocked)}

      />



      {/* Main Content Area */}

      <div className="flex-1 flex flex-col min-w-0 relative bg-background">

        {/* Navbar */}

        <header className="sigma-topbar h-16 border-b flex items-center justify-between gap-2 px-3 md:px-4 lg:px-8 backdrop-blur-md z-30 sticky top-0">

          <button

            type="button"

            aria-label="Open navigation"

            onClick={toggleSidebar}

            className="shrink-0 rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)] p-2 text-[var(--sigma-text)] md:hidden"

          >

            <Menu size={18} />

          </button>



          {/* Brand mark — top-left anchor for the app header */}

          <SigmaTactixLogo

            variant="mark"

            size={30}

            onClick={() => navigate('/')}

            className="shrink-0 md:mr-2"

          />



          {/* Quick Search */}

          <div className="hidden md:flex items-center gap-4 flex-1 max-w-xs 2xl:max-w-md relative">

             <div className="w-full relative group">

                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--sigma-text-muted)] group-focus-within:text-[var(--sigma-primary)] transition-colors" size={15} />

                <input

                  ref={searchInputRef}

                  type="text"

                  value={searchQuery}

                  onChange={(e) => setSearchQuery(e.target.value)}

                  onFocus={() => setIsSearchFocused(true)}

                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}

                  placeholder="Search features, vaults, diagnostics..."

                  className="w-full h-9 pl-9 pr-12 bg-[var(--sigma-surface-subtle)] text-[var(--sigma-text)] placeholder:text-[var(--sigma-text-muted)] border border-[var(--sigma-border)] rounded-xl text-xs font-sans focus:outline-none focus:border-[var(--sigma-primary)] focus:ring-2 focus:ring-[var(--sigma-primary)]/15 transition-all"

                />

                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">

                  <kbd className="px-1.5 py-0.5 text-[11px] font-mono font-medium text-[var(--sigma-text-muted)] bg-[var(--sigma-surface)] border border-[var(--sigma-border)] rounded-md shadow-2xs">

                    ⌘K

                  </kbd>

                </div>

             </div>



             {/* Search Dropdown Results */}

             {isSearchFocused && searchResults.length > 0 && (

               <div className="sigma-menu absolute top-full left-0 right-0 mt-2 p-1.5 z-50 space-y-1">

                 {searchResults.map((res) => (

                   <button

                     key={res.href}

                     onClick={() => handleQuickSearchSelect(res.href)}

                     className="sigma-menu-item w-full flex items-center justify-between p-2 text-left text-xs cursor-pointer"

                   >

                     <div className="flex items-center gap-2">

                       <res.icon size={14} className="text-[var(--sigma-primary)]" />

                       <span className="font-semibold">{res.label}</span>

                     </div>

                     <span className="text-[11px] font-mono text-[var(--sigma-text-muted)]">{res.href}</span>

                   </button>

                 ))}

               </div>

             )}

          </div>



          {/* Active Workspace / Client Enclave Switcher */}

          <div className="relative hidden sm:block" data-tutorial-id="tut-workspace-switcher">

             <button

               onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}

               className="sigma-control flex items-center gap-2 px-3 py-1.5 text-xs group cursor-pointer"

               title="Active Sovereign Client Enclave"

             >

               <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />

               <Building size={13} className="text-[var(--sigma-primary)]" />

               <span className="sigma-text font-semibold max-w-[130px] truncate">{currentWorkspace.name}</span>

               <span className="px-1.5 py-0.2 rounded bg-[var(--sigma-primary)]/15 text-[11px] uppercase font-bold text-[var(--sigma-primary)] border border-[var(--sigma-primary)]/30">

                 {currentWorkspace.tier}

               </span>

               <ChevronDown size={12} className="text-[var(--sigma-text-muted)] transition-colors" />

             </button>



             {/* Dropdown Menu */}

             <AnimatePresence>

               {isWorkspaceDropdownOpen && (

                 <motion.div

                   initial={{ opacity: 0, y: 5 }}

                   animate={{ opacity: 1, y: 0 }}

                   exit={{ opacity: 0, y: 5 }}

                   className="sigma-menu absolute top-full left-0 mt-2 w-72 p-2 z-50 space-y-1 shadow-xl"

                 >

                  <div className="px-3 py-2 border-b sigma-divider flex items-center justify-between text-[11px] font-mono uppercase text-[var(--sigma-text-muted)] font-bold">

                     <span>Client Enclaves ({workspaces.length})</span>

                     <span className="text-emerald-accent">Isolated</span>

                   </div>



                   <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">

                     {workspaces.map((ws) => (

                       <button

                         key={ws.id}

                         onClick={() => {

                           switchWorkspace(ws.id);

                           setIsWorkspaceDropdownOpen(false);

                         }}

                         className={cn(

                           "sigma-menu-item w-full flex items-center justify-between p-2.5 text-left text-xs cursor-pointer",

                           currentWorkspace.id === ws.id

                             ? "bg-[var(--sigma-primary)]/10 border border-[var(--sigma-primary)]/30 text-[var(--sigma-primary)] font-semibold"

                             : ""

                         )}

                       >

                         <div className="space-y-0.5 truncate pr-2">

                           <div className="flex items-center gap-2">

                             {currentWorkspace.id === ws.id && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}

                             <span className="truncate">{ws.name}</span>

                           </div>

                           <div className="text-[11px] text-[var(--sigma-text-muted)]">{ws.domain}</div>

                         </div>

                         <span className="text-[11px] font-mono uppercase px-1.5 py-0.5 rounded bg-[var(--sigma-surface-subtle)] text-[var(--sigma-primary)] border border-[var(--sigma-border)] shrink-0">

                           {ws.tier}

                         </span>

                       </button>

                     ))}

                   </div>



                   <div className="pt-2 border-t sigma-divider">

                     <button

                       onClick={() => {

                         setIsWorkspaceDropdownOpen(false);

                         setIsOnboardingOpen(true);

                       }}

                       className="w-full flex items-center justify-center gap-1.5 py-2 bg-[var(--sigma-primary)]/10 hover:bg-[var(--sigma-primary)] text-[var(--sigma-primary)] hover:text-[var(--sigma-on-primary)] border border-[var(--sigma-primary)]/30 rounded-xl text-xs font-semibold uppercase transition-all cursor-pointer"

                     >

                       <Plus size={13} />

                       <span>Onboard New Client</span>

                     </button>

                   </div>

                 </motion.div>

               )}

             </AnimatePresence>

           </div>



          {/* Right Header Navigation & Actions */}

          <div className="ml-auto flex min-w-0 items-center gap-2 md:gap-3">

            {/* Compact guided workflow */}

            <div data-tutorial-id="tut-playbook-bar" className="relative hidden lg:block">

              <button

                type="button"

                aria-haspopup="menu"

                aria-expanded={isPlaybookDropdownOpen}

                onClick={() => setIsPlaybookDropdownOpen((open) => !open)}

                className="sigma-control flex items-center gap-2 px-3 py-1.5 text-xs font-semibold"

              >

                Playbook <ChevronDown size={13} className={cn('transition-transform', isPlaybookDropdownOpen && 'rotate-180')} />

              </button>

              {isPlaybookDropdownOpen && (

                <div role="menu" className="sigma-menu absolute right-0 top-full z-50 mt-2 w-64 p-2 shadow-xl">

                  {[

                    { label: 'Diagnose', description: 'Assess the current state', step: '1', href: '/diagnostics' },

                    { label: 'Capture & CRM', description: 'Build and qualify demand', step: '2', href: '/outreach' },

                    { label: 'Demand execution', description: 'Create content and campaigns', step: '3', href: '/content-engine' },

                    { label: 'Revenue review', description: 'Review delivery and outcomes', step: '4', href: '/reports' },

                  ].map((item) => (

                    <button key={item.step} role="menuitem" onClick={() => { navigate(item.href); setIsPlaybookDropdownOpen(false); }} className="sigma-menu-item flex w-full items-start gap-3 p-3 text-left">

                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--sigma-primary-subtle)] text-xs font-bold text-[var(--sigma-primary)]">{item.step}</span>

                      <span><span className="block text-sm font-semibold text-[var(--sigma-text)]">{item.label}</span><span className="mt-0.5 block text-xs text-[var(--sigma-text-muted)]">{item.description}</span></span>

                    </button>

                  ))}

                </div>

              )}

            </div>



            {/* Start / Resume / Replay Tutorial CTA */}

            {!isActive && (

              <button

                onClick={startTutorial}

                className="hidden 2xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--sigma-accent)]/30 bg-[var(--sigma-accent)]/10 hover:bg-[var(--sigma-accent)]/20 text-[var(--sigma-accent)] hover:text-[var(--sigma-accent)]/80 text-[11px] font-medium transition-all cursor-pointer"

                title={hasEverStarted ? (isCompleted ? "Replay Guided Tutorial" : "Resume Guided Tutorial") : "Start Guided Tutorial"}

              >

                <GraduationCap size={14} />

                <span>{hasEverStarted ? (isCompleted ? "Replay Tutorial" : "Resume Tutorial") : "Tutorial"}</span>

              </button>

            )}



            {/* Guided Onboarding Wizard Action */}

            <Button

              data-tutorial-id="tut-onboard-btn"

              onClick={() => setIsOnboardingOpen(true)}

              variant="primary"

              size="sm"

              leftIcon={<Sparkles size={13} />}

              className="hidden sm:inline-flex"

            >

              New client

            </Button>



            {/* VANTA Neural Core Header Status & Drawer Summoner */}

            <div className="hidden 2xl:block">

              <VantaHeaderIndicator />

            </div>



            {/* Ecosystem Status Header Pill */}

            <button 

              onClick={() => {

                setIsEcosystemStatusOpen(true);

                setIsEcosystemStatusDocked(true);

              }}

              className={cn(

                "hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer",

                isEcosystemStatusOpen && isEcosystemStatusDocked

                  ? "bg-[var(--sigma-primary)] text-[var(--sigma-on-primary)] border-[var(--sigma-primary)] font-semibold shadow-xs"

                  : "bg-[var(--sigma-surface-subtle)] border-[var(--sigma-border)] text-[var(--sigma-text)] hover:border-[var(--sigma-border-strong)]"

              )}

            >

              <Activity size={13} className={isEcosystemStatusOpen && isEcosystemStatusDocked ? "text-[var(--sigma-on-primary)]" : "text-[var(--sigma-primary)]"} />

              <span className="hidden 2xl:inline">Ecosystem</span>

              <span className={cn(

                "px-1.5 py-0.2 rounded text-[11px] font-bold font-mono",

                isEcosystemStatusOpen && isEcosystemStatusDocked ? "bg-[var(--sigma-inverse)]/20 text-[var(--sigma-on-primary)]" : "bg-[var(--sigma-surface)] text-[var(--sigma-text-soft)]"

              )}>STATUS</span>

            </button>



            <ThemeToggle />

            <div className="hidden h-5 w-px sigma-divider border-l mx-0.5 sm:block" />

            

            {/* Role Switcher — click-toggle (was hover-only, which fails WCAG 2.1.1) */}

            <div ref={roleMenuRef} className="relative hidden 2xl:block">

               <button

                type="button"

                onClick={() => setIsRoleMenuOpen(open => !open)}

                aria-haspopup="menu"

                aria-expanded={isRoleMenuOpen}

                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)] rounded-xl text-xs font-medium text-[var(--sigma-text)] hover:border-[var(--sigma-border-strong)] transition-all cursor-pointer"

              >

                  <ShieldCheck size={14} className="text-[var(--sigma-primary)]" />

                  <span>{role}</span>

                  <ChevronDown size={12} className={cn('transition-transform', isRoleMenuOpen && 'rotate-180')} />

               </button>

               {isRoleMenuOpen && (

                <div role="menu" className="absolute top-full right-0 mt-2 w-44 sigma-menu p-1.5 shadow-xl z-[100]">

                  {(['ADMIN', 'SUB_ADMIN', 'USER'] as UserRole[]).map((r) => (

                    <button

                      key={r}

                      role="menuitemradio"

                      aria-checked={role === r}

                      onClick={() => { setRole(r); setIsRoleMenuOpen(false); }}

                      className={cn(

                        "w-full text-left px-3 py-2 rounded-lg text-xs transition-all cursor-pointer",

                        role === r ? "bg-[var(--sigma-primary)]/15 text-[var(--sigma-primary)] font-semibold" : "text-[var(--sigma-text-soft)] hover:bg-[var(--sigma-surface-subtle)] hover:text-[var(--sigma-text)]"

                      )}

                    >

                      {r}

                    </button>

                  ))}

                </div>

               )}

            </div>



            {/* Notifications Button — driven by the real Action Queue store */}

            <div ref={notificationsRef} className="relative">

              <button

                type="button"

                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}

                aria-haspopup="menu"

                aria-expanded={isNotificationsOpen}

                aria-label="System notifications"

                className="text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)] relative p-2 rounded-xl hover:bg-[var(--sigma-surface-subtle)] transition-all cursor-pointer"

              >

                <Bell size={17} aria-hidden="true" />

                {hasUnreadNotifications && (

                  <span

                    className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--sigma-primary)] rounded-full border-2 border-[var(--sigma-surface)]"

                    aria-label={`${notificationItems.length} items need attention`}

                  />

                )}

              </button>



              {/* Notifications Dropdown */}

              {isNotificationsOpen && (

                <div role="menu" className="absolute top-full right-0 mt-2 w-80 sigma-menu p-3 shadow-xl z-50 space-y-2">

                  <div className="flex items-center justify-between border-b sigma-divider pb-2 px-1">

                    <span className="text-xs font-semibold text-[var(--sigma-text)]">Action Queue</span>

                    <span className={cn(

                      "text-[11px] font-mono font-bold px-1.5 py-0.5 rounded",

                      notificationItems.length > 0

                        ? "text-[var(--sigma-primary)] bg-[var(--sigma-primary)]/10"

                        : "text-[var(--sigma-text-muted)] bg-[var(--sigma-surface-subtle)]"

                    )}>

                      {notificationItems.length > 0 ? `${notificationItems.length} open` : 'Up to date'}

                    </span>

                  </div>

                  {notificationItems.length === 0 ? (

                    <p className="px-1 py-3 text-xs leading-relaxed text-[var(--sigma-text-muted)]">

                      Nothing needs operator attention. Pending approvals and module alerts from the Action Queue will appear here.

                    </p>

                  ) : (

                    <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-1.5">

                      {notificationItems.slice(0, 8).map(item => {

                        const ItemIcon = item.moduleIcon ?? Globe;

                        return (

                          <button

                            key={item.id}

                            type="button"

                            role="menuitem"

                            onClick={() => { navigate(item.moduleRoute); setIsNotificationsOpen(false); }}

                            className={cn(

                              "w-full p-2.5 rounded-xl border cursor-pointer transition-all text-left",

                              item.status === 'PENDING_APPROVAL'

                                ? "bg-[var(--sigma-primary)]/10 border-[var(--sigma-primary)]/20 hover:bg-[var(--sigma-primary)]/15"

                                : "bg-[var(--sigma-surface-subtle)] border-[var(--sigma-border)] hover:bg-[var(--sigma-surface-raised)]"

                            )}

                          >

                            <div className="flex items-center gap-2 min-w-0">

                              <ItemIcon size={13} className={item.status === 'ALERT' ? "text-amber-accent shrink-0" : "text-[var(--sigma-primary)] shrink-0"} />

                              <span className="text-xs font-semibold text-[var(--sigma-text)] truncate">{item.title}</span>

                            </div>

                            <div className="mt-1 pl-5 text-[11px] leading-snug text-[var(--sigma-text-muted)] line-clamp-2">{item.summary}</div>

                            <div className="mt-1 pl-5 flex items-center gap-1.5 text-[11px] font-mono text-[var(--sigma-text-muted)]">

                              <span className="uppercase font-bold">

                                {item.status === 'PENDING_APPROVAL' ? 'Awaiting HITL approval' : 'Module alert'}

                              </span>

                              <span className="opacity-40">·</span>

                              <span>{item.timestamp}</span>

                            </div>

                          </button>

                        );

                      })}

                      {notificationItems.length > 8 && (

                        <button

                          type="button"

                          onClick={() => { navigate('/agents'); setIsNotificationsOpen(false); }}

                          className="w-full py-1.5 text-[11px] font-mono text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)] transition-all cursor-pointer"

                        >

                          View the remaining {notificationItems.length - 8} in the Action Queue

                        </button>

                      )}

                    </div>

                  )}

                  <div className="px-1 pt-1 border-t sigma-divider">

                    <button

                      type="button"

                      role="menuitem"

                      onClick={() => { navigate('/agents'); setIsNotificationsOpen(false); }}

                      className="w-full py-1.5 text-[11px] font-mono text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)] transition-all cursor-pointer"

                    >

                      Open Agent Cockpit &amp; Approvals

                    </button>

                  </div>

                </div>

              )}

            </div>



            {/* User Avatar */}

            <button

              type="button"

              onClick={() => navigate('/tenants')}

              className="w-8 h-8 rounded-full border border-[var(--sigma-border-strong)] p-0.5 hover:border-[var(--sigma-primary)] transition-all cursor-pointer"

              aria-label="Tenant Control: manage workspaces and access"

            >

              <img

                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"

                alt=""

                className="w-full h-full object-cover rounded-full"

              />

            </button>

          </div>

        </header>



        {/* Tutorial HUD — visible during active tutorial and on completion */}

        <TutorialHUD />



        {/* Page Container */}

        <main className={cn(

          "flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-10 sigma-app-view",

          isDigitalMarketingRoute && "sigma-marketing-suite"

        )}>

          <motion.div

            key={location.pathname}

            initial={{ opacity: 0, y: 8 }}

            animate={{ opacity: 1, y: 0 }}

            transition={{ duration: 0.25 }}

          >

            {children}

          </motion.div>

        </main>

        

        {/* AI Assistant Chatbot */}

        <AIChatbot />



        {/* VANTA Neural Core Slide-out Intelligence Drawer */}

        <VantaTranscriptDrawer />



        {/* VANTA compact command dock — self-gated (dockOpen + /living-system),

            opened by the Living System sidebar widget's "Open VANTA" controls */}

        <VantaCompactDock />



        {/* Guided Client Onboarding Wizard */}

        <ClientOnboardingWizard 

          isOpen={isOnboardingOpen}

          onClose={() => setIsOnboardingOpen(false)}

          onComplete={async (clientData) => {

            try {

              await provisionWorkspace(clientData);

              setIsOnboardingOpen(false);

              navigate('/diagnostics');

            } catch (err: any) {

              console.error('Failed to provision workspace enclave:', err);

            }

          }}

        />

      </div>

    </div>

  );

}



