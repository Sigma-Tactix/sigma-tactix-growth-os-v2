import React, { useState } from 'react';
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
  Wifi
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useUser, UserRole } from '@/src/contexts/UserContext';
import { useWorkspace } from '@/src/contexts/WorkspaceContext';
import AIChatbot from '@/src/components/AIChatbot';
import ClientOnboardingWizard from '@/src/components/ClientOnboardingWizard';
import EcosystemStatusBar from '@/src/components/EcosystemStatusBar';
import LivingSystemSidebarWidget from '@/src/components/LivingSystemSidebarWidget';
import TutorialHUD from '@/src/components/tutorial/TutorialHUD';
import { useTutorial } from '@/src/contexts/TutorialContext';
import ThemeToggle from '@/src/components/ui/ThemeToggle';
import VantaHeaderIndicator from '@/src/components/vanta/VantaHeaderIndicator';
import VantaTranscriptDrawer from '@/src/components/vanta/VantaTranscriptDrawer';
import SigmaTactixLogo from '@/src/components/brand/SigmaTactixLogo';
import Button from '@/src/components/ui/Button';

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

const navSections: NavSection[] = [
  {
    title: 'Growth OS Overview',
    items: [
      { label: 'Executive Dashboard', href: '/', icon: LayoutDashboard, roles: ['ADMIN', 'SUB_ADMIN', 'USER'] },
      { label: 'Growth Diagnostics', href: '/diagnostics', icon: ClipboardCheck, roles: ['ADMIN', 'SUB_ADMIN', 'USER'], badge: 'Health Audit' },
      { label: 'Second Brain Vaults', href: '/vaults', icon: Database, roles: ['ADMIN', 'SUB_ADMIN', 'USER'] },
    ]
  },
  {
    title: 'Digital Marketing Suite',
    items: [
      { label: 'SEO & AEO Authority', href: '/seo-aeo', icon: Globe, roles: ['ADMIN', 'SUB_ADMIN', 'USER'], badge: 'GSC + AI' },
      { label: 'Performance Ads & ROAS', href: '/paid-ads', icon: Megaphone, roles: ['ADMIN', 'SUB_ADMIN', 'USER'] },
      { label: 'Editorial Content Engine', href: '/content', icon: FileText, roles: ['ADMIN', 'SUB_ADMIN', 'USER'] },
      { label: 'Social & Carousels', href: '/social-carousels', icon: Share2, roles: ['ADMIN', 'SUB_ADMIN', 'USER'], badge: 'LinkedIn' },
      { label: 'AI Creative Image Studio', href: '/image-studio', icon: ImageIcon, roles: ['ADMIN', 'SUB_ADMIN', 'USER'], badge: 'Flux Pro' },
      { label: 'Video & Motion Studio', href: '/video-studio', icon: Video, roles: ['ADMIN', 'SUB_ADMIN', 'USER'], badge: 'Remotion' },
      { label: 'Email & Lifecycle', href: '/email-marketing', icon: Mail, roles: ['ADMIN', 'SUB_ADMIN', 'USER'] },
      { label: 'CRO & Landing Pages', href: '/cro-studio', icon: Target, roles: ['ADMIN', 'SUB_ADMIN', 'USER'] },
      { label: 'Inbound Leads & WhatsApp', href: '/intake', icon: Zap, roles: ['ADMIN', 'SUB_ADMIN', 'USER'], badge: 'Sub-60s' },
      { label: 'Cold Outreach & ABM', href: '/outreach', icon: Send, roles: ['ADMIN', 'SUB_ADMIN', 'USER'] },
      { label: 'Social Listening & Radar', href: '/social-listening', icon: Ear, roles: ['ADMIN', 'SUB_ADMIN', 'USER'] },
      { label: 'Attribution & Blended CAC', href: '/attribution', icon: BarChart3, roles: ['ADMIN', 'SUB_ADMIN', 'USER'] },
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

  const handleQuickSearchSelect = (href: string) => {
    navigate(href);
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  const allNavItems = navSections.flatMap(s => s.items);
  const searchResults = searchQuery.trim() 
    ? allNavItems.filter(i => i.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const isDigitalMarketingRoute = [
    '/seo-aeo', '/paid-ads', '/content', '/content-engine', '/social-carousels',
    '/image-studio', '/video-studio', '/email-marketing', '/cro-studio', '/intake',
    '/outreach', '/social-listening', '/attribution',
  ].includes(location.pathname);

  return (
    <div className="sigma-app flex min-h-[100dvh] bg-background overflow-hidden selection:bg-accent/20 selection:text-zinc-950">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="sigma-shell relative z-20 flex flex-col border-r"
      >
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center px-1">
            <SigmaTactixLogo
              variant={isSidebarOpen ? 'full' : 'mark'}
              size={isSidebarOpen ? 'md' : 30}
              onClick={() => navigate('/')}
            />
          </div>

          {/* Living System: 1 separate element on left hand side bar far above everything */}
          <LivingSystemSidebarWidget isSidebarOpen={isSidebarOpen} />

          {/* Quick Stats Pill */}
          {isSidebarOpen && (
            <div className="space-y-2">
              <div 
                onClick={() => navigate('/vaults')}
                className="px-3 py-2 bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)] rounded-xl flex items-center justify-between group hover:border-[var(--sigma-border-strong)] transition-all cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  <div className="truncate">
                    <div className="text-xs font-semibold text-[var(--sigma-text)] truncate">Second Brain Core</div>
                    <div className="text-[10px] text-[var(--sigma-text-muted)] truncate">Open workspace evidence</div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-[var(--sigma-text-muted)] group-hover:text-[var(--sigma-text)] transition-transform group-hover:translate-x-0.5" />
              </div>

              {/* Ecosystem Live Status Trigger Bar */}
              <div 
                onClick={() => {
                  setIsEcosystemStatusOpen(true);
                  setIsEcosystemStatusDocked(true);
                }}
                className={cn(
                  "px-3 py-2 rounded-xl flex items-center justify-between group transition-all cursor-pointer border text-xs shadow-xs",
                  isEcosystemStatusOpen && isEcosystemStatusDocked
                    ? "bg-[#ff481b] text-white border-[#ff481b] font-semibold"
                    : "bg-[var(--sigma-surface-subtle)] border-[var(--sigma-border)] hover:border-[var(--sigma-border-strong)] text-[var(--sigma-text)]"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Activity size={14} className={cn("shrink-0", isEcosystemStatusOpen && isEcosystemStatusDocked ? "text-white" : "text-[#ff481b]")} />
                  <div className="truncate">
                    <div className="font-semibold truncate flex items-center gap-1.5">
                      <span>Ecosystem Status</span>
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.2 rounded font-medium",
                        isEcosystemStatusOpen && isEcosystemStatusDocked ? "bg-black/20 text-white" : "bg-emerald-500/15 text-emerald-400"
                      )}>VERIFIED</span>
                    </div>
                    <div className={cn(
                      "text-[10px] truncate",
                      isEcosystemStatusOpen && isEcosystemStatusDocked ? "text-white/80" : "text-[var(--sigma-text-muted)]"
                    )}>Verified telemetry evidence</div>
                  </div>
                </div>
                <ChevronRight size={13} className={cn("transition-transform group-hover:translate-x-0.5", isEcosystemStatusOpen && isEcosystemStatusDocked ? "text-white" : "text-[var(--sigma-text-muted)] group-hover:text-[var(--sigma-text)]")} />
              </div>
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
              className="relative p-2.5 mx-auto bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)] hover:border-[var(--sigma-border-strong)] rounded-xl flex items-center justify-center text-[#ff481b] transition-all group cursor-pointer"
            >
              <Activity size={16} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
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
                  <div className="px-3 text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--sigma-text-muted)] font-semibold mb-1 opacity-70">
                    {section.title}
                  </div>
                )}
                {sectionItems.map((item) => {
                  const isActive = location.pathname === item.href;
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
                          <div className="w-1.5 h-1.5 rounded-full bg-[#ff481b] shrink-0" />
                        )}
                        <item.icon size={16} className={cn("shrink-0 transition-colors", isActive ? "text-[#ff481b]" : "text-[var(--sigma-text-muted)] group-hover:text-[var(--sigma-text)]" )}/>
                        {isSidebarOpen && (
                          <span className="font-medium whitespace-nowrap truncate tracking-tight">
                            {item.label}
                          </span>
                        )}
                      </div>

                      {isSidebarOpen && item.badge && (
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-md font-medium tracking-tight",
                          isActive ? "bg-[#ff481b]/15 text-[#ff481b]" : "bg-[var(--sigma-surface-subtle)] text-[var(--sigma-text-muted)] border border-[var(--sigma-border)]"
                        )}>
                          {item.badge}
                        </span>
                      )}

                      {/* Active Indicator for collapsed mode */}
                      {isActive && !isSidebarOpen && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#ff481b] rounded-l-full" />
                      )}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="px-4 py-4 border-t border-white/5 space-y-2">
          <button 
            onClick={toggleSidebar}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-muted hover:text-zinc-950 hover:bg-zinc-100 transition-all group"
          >
            <div className="w-6 flex justify-center">
               <ChevronRight 
                 size={18} 
                 className={cn("transition-transform duration-300", isSidebarOpen && "rotate-180")}
               />
            </div>
            {isSidebarOpen && <span className="font-bold text-[10px] uppercase tracking-widest text-zinc-400 group-hover:text-white">Collapse Sidebar</span>}
          </button>
        </div>
      </motion.aside>

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
        <header className="sigma-topbar h-16 border-b flex items-center justify-between px-4 lg:px-8 backdrop-blur-md z-30 sticky top-0">
          {/* Quick Search */}
          <div className="flex items-center gap-4 flex-1 max-w-md relative">
             <div className="w-full relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--sigma-text-muted)] group-focus-within:text-[#ff481b] transition-colors" size={15} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  placeholder="Search features, vaults, diagnostics..."
                  className="w-full h-9 pl-9 pr-12 bg-[var(--sigma-surface-subtle)] text-[var(--sigma-text)] placeholder:text-[var(--sigma-text-muted)] border border-[var(--sigma-border)] rounded-xl text-xs font-sans focus:outline-none focus:border-[#ff481b] focus:ring-2 focus:ring-[#ff481b]/15 transition-all"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium text-[var(--sigma-text-muted)] bg-[var(--sigma-surface)] border border-[var(--sigma-border)] rounded-md shadow-2xs">
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
                       <res.icon size={14} className="text-[#ff481b]" />
                       <span className="font-semibold">{res.label}</span>
                     </div>
                     <span className="text-[10px] font-mono text-[var(--sigma-text-muted)]">{res.href}</span>
                   </button>
                 ))}
               </div>
             )}
          </div>

          {/* Active Workspace / Client Enclave Switcher */}
          <div className="relative" data-tutorial-id="tut-workspace-switcher">
             <button
               onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
               className="sigma-control flex items-center gap-2 px-3 py-1.5 text-xs group cursor-pointer"
               title="Active Sovereign Client Enclave"
             >
               <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
               <Building size={13} className="text-[#ff481b]" />
               <span className="sigma-text font-semibold max-w-[130px] truncate">{currentWorkspace.name}</span>
               <span className="px-1.5 py-0.2 rounded bg-[#ff481b]/15 text-[10px] uppercase font-bold text-[#ff481b] border border-[#ff481b]/30">
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
                  <div className="px-3 py-2 border-b sigma-divider flex items-center justify-between text-[10px] font-mono uppercase text-[var(--sigma-text-muted)] font-bold">
                     <span>Client Enclaves ({workspaces.length})</span>
                     <span className="text-emerald-400">Isolated</span>
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
                             ? "bg-[#ff481b]/10 border border-[#ff481b]/30 text-[#ff481b] font-semibold"
                             : ""
                         )}
                       >
                         <div className="space-y-0.5 truncate pr-2">
                           <div className="flex items-center gap-2">
                             {currentWorkspace.id === ws.id && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                             <span className="truncate">{ws.name}</span>
                           </div>
                           <div className="text-[10px] text-[var(--sigma-text-muted)]">{ws.domain}</div>
                         </div>
                         <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[var(--sigma-surface-subtle)] text-[#ff481b] border border-[var(--sigma-border)] shrink-0">
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
                       className="w-full flex items-center justify-center gap-1.5 py-2 bg-[#ff481b]/10 hover:bg-[#ff481b] text-[#ff481b] hover:text-white border border-[#ff481b]/30 rounded-xl text-xs font-semibold uppercase transition-all cursor-pointer"
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
          <div className="flex items-center gap-3">
            {/* Guided 4-Phase Autonomous Growth Loop Quick Bar */}
            <div data-tutorial-id="tut-playbook-bar" className="hidden xl:flex items-center gap-1 p-1 bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)] rounded-xl text-[11px] font-sans">
              <span className="px-2 text-[var(--sigma-text-muted)] font-semibold uppercase tracking-wider text-[9px] font-mono">PLAYBOOK:</span>
              {[
                { label: 'DIAGNOSE', step: '1', href: '/diagnostics', match: (p: string) => p === '/diagnostics' },
                { label: 'CAPTURE & CRM', step: '2', href: '/outreach', match: (p: string) => p === '/outreach' },
                { label: 'DEMAND SWARMS', step: '3', href: '/content-engine', match: (p: string) => p === '/content-engine' || p === '/paid-ads' || p === '/seo-aeo' },
                { label: 'REVENUE CORE', step: '4', href: '/living-system', match: (p: string) => p === '/living-system' || p === '/reports' },
              ].map((item) => {
                const isSelected = item.match(location.pathname);
                return (
                  <button
                    key={item.step}
                    onClick={() => navigate(item.href)}
                    className={cn(
                      "px-2.5 py-1 font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer outline-none",
                      isSelected
                        ? "bg-[var(--sigma-surface)] text-[var(--sigma-text)] font-semibold border border-[var(--sigma-border-strong)] shadow-xs"
                        : "text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)] hover:bg-[var(--sigma-surface)]/50"
                    )}
                  >
                    <span className={cn("text-[10px] font-mono", isSelected ? "text-[#ff481b] font-bold" : "opacity-60")}>{item.step}.</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Start / Resume / Replay Tutorial CTA */}
            {!isActive && (
              <button
                onClick={startTutorial}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 text-[11px] font-medium transition-all cursor-pointer"
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
            >
              Onboard Client
            </Button>

            {/* VANTA Neural Core Header Status & Drawer Summoner */}
            <VantaHeaderIndicator />

            {/* Ecosystem Status Header Pill */}
            <button 
              onClick={() => {
                setIsEcosystemStatusOpen(true);
                setIsEcosystemStatusDocked(true);
              }}
              className={cn(
                "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer",
                isEcosystemStatusOpen && isEcosystemStatusDocked
                  ? "bg-[#ff481b] text-white border-[#ff481b] font-semibold shadow-xs"
                  : "bg-[var(--sigma-surface-subtle)] border-[var(--sigma-border)] text-[var(--sigma-text)] hover:border-[var(--sigma-border-strong)]"
              )}
            >
              <Activity size={13} className={isEcosystemStatusOpen && isEcosystemStatusDocked ? "text-white" : "text-[#ff481b]"} />
              <span className="hidden md:inline">Ecosystem:</span>
              <span className={cn(
                "px-1.5 py-0.2 rounded text-[10px] font-bold font-mono",
                isEcosystemStatusOpen && isEcosystemStatusDocked ? "bg-black/20 text-white" : "bg-emerald-500/15 text-emerald-400"
              )}>VERIFIED</span>
            </button>

            <ThemeToggle />
            <div className="h-5 w-px sigma-divider border-l mx-0.5" />
            
            {/* Role Switcher */}
            <div className="relative group/role">
               <button className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)] rounded-xl text-xs font-medium text-[var(--sigma-text)] hover:border-[var(--sigma-border-strong)] transition-all cursor-pointer">
                  <ShieldCheck size={14} className="text-[#ff481b]" />
                  <span>{role}</span>
               </button>
               <div className="absolute top-full right-0 mt-2 w-44 sigma-menu p-1.5 hidden group-hover/role:block shadow-xl z-[100]">
                  {(['ADMIN', 'SUB_ADMIN', 'USER'] as UserRole[]).map((r) => (
                    <button 
                      key={r}
                      onClick={() => setRole(r)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-xs transition-all cursor-pointer",
                        role === r ? "bg-[#ff481b]/15 text-[#ff481b] font-semibold" : "text-[var(--sigma-text-soft)] hover:bg-[var(--sigma-surface-subtle)] hover:text-[var(--sigma-text)]"
                      )}
                    >
                      {r}
                    </button>
                  ))}
               </div>
            </div>

            {/* Notifications Button */}
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)] relative p-2 rounded-xl hover:bg-[var(--sigma-surface-subtle)] transition-all cursor-pointer"
              >
                <Bell size={17} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ff481b] rounded-full border-2 border-[var(--sigma-surface)]" />
              </button>

              {/* Notifications Dropdown */}
              {isNotificationsOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 sigma-menu p-4 shadow-xl z-50 space-y-3">
                  <div className="flex items-center justify-between border-b sigma-divider pb-2">
                    <span className="text-xs font-semibold text-[var(--sigma-text)]">System Alerts</span>
                    <span className="text-[10px] font-mono font-bold text-[#ff481b] bg-[#ff481b]/10 px-1.5 py-0.5 rounded">3 New</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div 
                      onClick={() => { navigate('/agents'); setIsNotificationsOpen(false); }}
                      className="p-2.5 rounded-xl bg-[#ff481b]/10 border border-[#ff481b]/20 cursor-pointer hover:bg-[#ff481b]/15 transition-all"
                    >
                      <div className="font-semibold text-[var(--sigma-text)]">HITL Approval Required</div>
                      <div className="text-[11px] text-[var(--sigma-text-muted)] mt-0.5">Performance Re-allocator proposed $6,200 shift</div>
                    </div>
                    <div 
                      onClick={() => { navigate('/diagnostics'); setIsNotificationsOpen(false); }}
                      className="p-2.5 rounded-xl bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)] cursor-pointer hover:bg-[var(--sigma-surface-raised)] transition-all"
                    >
                      <div className="font-semibold text-[var(--sigma-text)]">Growth Diagnostic Completed</div>
                      <div className="text-[11px] text-[var(--sigma-text-muted)] mt-0.5">Overall Growth Score: 78/100</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar */}
            <div 
              onClick={() => navigate('/tenants')}
              className="w-8 h-8 rounded-full border border-[var(--sigma-border-strong)] p-0.5 hover:border-[#ff481b] transition-all cursor-pointer"
              title="Tenant Control"
            >
              <img 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
                alt="Avatar"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
          </div>
        </header>

        {/* Tutorial HUD — visible during active tutorial and on completion */}
        <TutorialHUD />

        {/* Page Container */}
        <main className={cn(
          "flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-10",
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

        {/* Guided Client Onboarding Wizard */}
        <ClientOnboardingWizard 
          isOpen={isOnboardingOpen}
          onClose={() => setIsOnboardingOpen(false)}
          onComplete={(clientData) => {
            const newWs = provisionWorkspace(clientData);
            setIsOnboardingOpen(false);
            navigate('/diagnostics');
          }}
        />
      </div>
    </div>
  );
}
