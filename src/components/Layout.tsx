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
  FileText
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

  return (
    <div className="flex h-screen bg-background overflow-hidden selection:bg-accent/30 selection:text-white">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="relative z-20 flex flex-col border-r border-white/5 bg-[#09090B]"
      >
        <div className="p-5 flex flex-col gap-4">
          <button
            type="button"
            aria-label="Sigma Tactix home"
            onClick={() => navigate('/')}
            className="flex items-center gap-3 px-2 text-left cursor-pointer group rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
             <div className="relative w-9 h-10 shrink-0 overflow-hidden">
                <img src="/brand/sigma-tactix-mark.png" alt="" width="1563" height="1563" className="absolute w-[100px] max-w-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
             </div>
             {isSidebarOpen && (
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="flex flex-col"
               >
                 <span className="text-lg font-heading font-black tracking-tighter amber-text">
                   Sigma Tactix
                 </span>
                 <span className="text-[9px] font-mono text-muted uppercase tracking-widest -mt-1">
                   Growth OS
                 </span>
               </motion.div>
             )}
          </button>

          {/* Living System: 1 separate element on left hand side bar far above everything */}
          <LivingSystemSidebarWidget isSidebarOpen={isSidebarOpen} />

          {/* Quick Stats Pill */}
          {isSidebarOpen && (
            <div className="space-y-2">
              <div 
                onClick={() => navigate('/vaults')}
                className="px-3.5 py-2.5 bg-white/[0.03] border border-white/5 rounded-xl flex items-center justify-between group hover:border-accent/30 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <div className="truncate">
                    <div className="text-xs font-bold text-white truncate">Second Brain Core</div>
                    <div className="text-[9px] text-muted font-mono uppercase tracking-wider truncate">10 Vaults Synced</div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-muted group-hover:text-white transition-transform group-hover:translate-x-0.5" />
              </div>

              {/* Ecosystem Live Status Trigger Bar */}
              <div 
                onClick={() => {
                  setIsEcosystemStatusOpen(true);
                  setIsEcosystemStatusDocked(true);
                }}
                className={cn(
                  "px-3.5 py-2.5 rounded-xl flex items-center justify-between group transition-all cursor-pointer border",
                  isEcosystemStatusOpen && isEcosystemStatusDocked
                    ? "bg-accent text-background border-accent font-black amber-glow"
                    : "bg-gradient-to-r from-accent/15 via-white/[0.03] to-transparent border-accent/30 hover:border-accent text-white"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative">
                    <Activity size={15} className={cn(isEcosystemStatusOpen && isEcosystemStatusDocked ? "text-background" : "text-accent animate-pulse")} />
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  </div>
                  <div className="truncate">
                    <div className={cn(
                      "text-xs font-bold truncate flex items-center gap-1.5",
                      isEcosystemStatusOpen && isEcosystemStatusDocked ? "text-background" : "text-white"
                    )}>
                      <span>Ecosystem Status</span>
                      <span className={cn(
                        "text-[8px] font-mono px-1 py-0.2 rounded font-bold",
                        isEcosystemStatusOpen && isEcosystemStatusDocked ? "bg-black/20 text-background" : "bg-green-500/20 text-green-400"
                      )}>94% UP</span>
                    </div>
                    <div className={cn(
                      "text-[9px] font-mono truncate",
                      isEcosystemStatusOpen && isEcosystemStatusDocked ? "text-background/80" : "text-amber-300/90"
                    )}>2 Need Attention • Fixes</div>
                  </div>
                </div>
                <ChevronRight size={13} className={cn("transition-transform group-hover:translate-x-0.5", isEcosystemStatusOpen && isEcosystemStatusDocked ? "text-background" : "text-accent")} />
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
              title="Ecosystem Live Status (94% UP • 2 Issues)"
              className="relative p-2.5 mx-auto bg-white/5 border border-accent/30 hover:border-accent rounded-xl flex items-center justify-center text-accent transition-all group"
            >
              <Activity size={18} className="animate-pulse" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 border border-black animate-ping" />
            </button>
          )}
        </div>

        {/* Navigation List grouped by layer */}
        <nav className="flex-1 px-3 py-2 space-y-6 overflow-y-auto custom-scrollbar">
          {navSections.map((section, sIdx) => {
            const sectionItems = section.items.filter(item => item.roles.includes(role));
            if (sectionItems.length === 0) return null;

            return (
              <div key={sIdx} className="space-y-1">
                {isSidebarOpen && (
                  <div className="px-3 text-[9px] font-mono uppercase tracking-[0.25em] text-muted/60 font-bold mb-1.5">
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
                        "flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                        isActive 
                          ? "bg-accent text-background font-black amber-glow shadow-md" 
                          : "text-muted hover:text-white hover:bg-white/5"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <item.icon size={18} className={cn("shrink-0 transition-colors", isActive ? "text-background" : "text-muted group-hover:text-white" )}/>
                        {isSidebarOpen && (
                          <span className="text-xs font-bold whitespace-nowrap truncate tracking-tight">
                            {item.label}
                          </span>
                        )}
                      </div>

                      {isSidebarOpen && item.badge && (
                        <span className={cn(
                          "text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase",
                          isActive ? "bg-black/20 text-background" : "bg-white/5 text-zinc-400 group-hover:text-white"
                        )}>
                          {item.badge}
                        </span>
                      )}

                      {/* Active Indicator for collapsed mode */}
                      {isActive && !isSidebarOpen && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent rounded-l-full shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
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
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-muted hover:text-white hover:bg-white/5 transition-all group"
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
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-background/50 backdrop-blur-md z-30 sticky top-0">
          {/* Quick Search */}
          <div className="flex items-center gap-4 flex-1 max-w-lg relative">
             <div className="w-full relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors" size={16} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  placeholder="Search features, vaults, diagnostics, or architecture..."
                  className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-xs font-mono text-zinc-200 focus:outline-none focus:ring-1 focus:ring-accent/50 focus:bg-white/[0.08] transition-all"
                />
             </div>

             {/* Search Dropdown Results */}
             {isSearchFocused && searchResults.length > 0 && (
               <div className="absolute top-full left-0 right-0 mt-2 bg-[#09090B] border border-white/10 rounded-xl p-2 shadow-2xl z-50 space-y-1">
                 {searchResults.map((res) => (
                   <button
                     key={res.href}
                     onClick={() => handleQuickSearchSelect(res.href)}
                     className="w-full flex items-center justify-between p-2.5 rounded-lg text-left hover:bg-white/5 text-xs text-zinc-200 transition-colors"
                   >
                     <div className="flex items-center gap-2">
                       <res.icon size={14} className="text-accent" />
                       <span className="font-bold">{res.label}</span>
                     </div>
                     <span className="text-[10px] font-mono text-muted">{res.href}</span>
                   </button>
                 ))}
               </div>
             )}
          </div>

          {/* Active Workspace / Client Enclave Switcher */}
          <div className="relative" data-tutorial-id="tut-workspace-switcher">
             <button
               onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
               className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-xs font-mono group cursor-pointer"
               title="Active Sovereign Client Enclave"
             >
               <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
               <Building size={13} className="text-accent" />
               <span className="font-bold text-white max-w-[130px] truncate">{currentWorkspace.name}</span>
               <span className="px-1.5 py-0.5 rounded bg-accent/15 text-[9px] uppercase font-bold text-accent border border-accent/30">
                 {currentWorkspace.tier}
               </span>
               <ChevronDown size={12} className="text-muted group-hover:text-white transition-colors" />
             </button>

             {/* Dropdown Menu */}
             <AnimatePresence>
               {isWorkspaceDropdownOpen && (
                 <motion.div
                   initial={{ opacity: 0, y: 5 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: 5 }}
                   className="absolute top-full left-0 mt-2 w-72 bg-[#09090B] border border-white/15 rounded-2xl p-2 shadow-2xl z-50 space-y-1 backdrop-blur-xl"
                 >
                   <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between text-[10px] font-mono uppercase text-muted font-bold">
                     <span>Client Enclaves ({workspaces.length})</span>
                     <span className="text-emerald-400">Isolated</span>
                   </div>

                   <div className="max-h-60 overflow-y-auto space-y-1">
                     {workspaces.map((ws) => (
                       <button
                         key={ws.id}
                         onClick={() => {
                           switchWorkspace(ws.id);
                           setIsWorkspaceDropdownOpen(false);
                         }}
                         className={cn(
                           "w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-mono transition-all",
                           currentWorkspace.id === ws.id
                             ? "bg-accent/15 border border-accent/30 text-white font-bold"
                             : "hover:bg-white/5 text-zinc-300"
                         )}
                       >
                         <div className="space-y-0.5 truncate pr-2">
                           <div className="flex items-center gap-2">
                             {currentWorkspace.id === ws.id && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                             <span className="truncate">{ws.name}</span>
                           </div>
                           <div className="text-[10px] text-muted">{ws.domain}</div>
                         </div>
                         <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-black/40 text-accent shrink-0">
                           {ws.tier}
                         </span>
                       </button>
                     ))}
                   </div>

                   <div className="pt-2 border-t border-white/5">
                     <button
                       onClick={() => {
                         setIsWorkspaceDropdownOpen(false);
                         setIsOnboardingOpen(true);
                       }}
                       className="w-full flex items-center justify-center gap-1.5 py-2 bg-accent/10 hover:bg-accent text-accent hover:text-background border border-accent/30 rounded-xl text-xs font-mono font-bold uppercase transition-all"
                     >
                       <Plus size={12} />
                       <span>Onboard New Client</span>
                     </button>
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
           </div>

          {/* Right Header Navigation & Actions */}
          <div className="flex items-center gap-4">
            {/* Guided 4-Phase Autonomous Growth Loop Quick Bar */}
            <div data-tutorial-id="tut-playbook-bar" className="hidden lg:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5 font-mono text-[10px]">
              <span className="px-2 text-zinc-500 font-bold uppercase tracking-wider text-[9px]">PLAYBOOK:</span>
              <button 
                onClick={() => navigate('/diagnostics')}
                className={cn(
                  "px-2.5 py-1.5 font-bold tracking-wider uppercase rounded-lg transition-all flex items-center gap-1 cursor-pointer",
                  location.pathname === '/diagnostics' ? "text-background bg-accent font-black amber-glow" : "text-muted hover:text-white"
                )}
                title="Stage 1: Audit Leaks & Ingest Second Brain"
              >
                <span className="opacity-60">1.</span> DIAGNOSE
              </button>

              <button 
                onClick={() => navigate('/outreach')}
                className={cn(
                  "px-2.5 py-1.5 font-bold tracking-wider uppercase rounded-lg transition-all flex items-center gap-1 cursor-pointer",
                  location.pathname === '/outreach' ? "text-background bg-accent font-black amber-glow" : "text-muted hover:text-white"
                )}
                title="Stage 2: Native Lead Pipeline & Conversion Dock"
              >
                <span className="opacity-60">2.</span> CAPTURE & CRM
              </button>

              <button 
                onClick={() => navigate('/content-engine')}
                className={cn(
                  "px-2.5 py-1.5 font-bold tracking-wider uppercase rounded-lg transition-all flex items-center gap-1 cursor-pointer",
                  location.pathname === '/content-engine' || location.pathname === '/paid-ads' || location.pathname === '/seo-aeo' ? "text-background bg-accent font-black amber-glow" : "text-muted hover:text-white"
                )}
                title="Stage 3: Autonomous Demand Generation (SEO, Content, Ads)"
              >
                <span className="opacity-60">3.</span> DEMAND SWARMS
              </button>

              <button 
                onClick={() => navigate('/living-system')}
                className={cn(
                  "px-2.5 py-1.5 font-bold tracking-wider uppercase rounded-lg transition-all flex items-center gap-1 cursor-pointer",
                  location.pathname === '/living-system' || location.pathname === '/reports' ? "text-background bg-accent font-black amber-glow" : "text-muted hover:text-white"
                )}
                title="Stage 4: Living Ultron/Jarvis Neural Core & Attribution Dossier"
              >
                <span className="opacity-60">4.</span> REVENUE CORE
              </button>
            </div>

            {/* Start / Resume / Replay Tutorial CTA */}
            {!isActive && (
              <button
                onClick={startTutorial}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-white text-[10px] font-mono font-bold uppercase tracking-wider transition-all"
                title={hasEverStarted ? (isCompleted ? "Replay Guided Tutorial" : "Resume Guided Tutorial") : "Start Guided Tutorial"}
              >
                <GraduationCap size={13} />
                <span>{hasEverStarted ? (isCompleted ? "Replay Tutorial" : "Resume Tutorial") : "Start Tutorial"}</span>
              </button>
            )}

            {/* Guided Onboarding Wizard Action */}
            <button
              data-tutorial-id="tut-onboard-btn"
              onClick={() => setIsOnboardingOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-accent/40 bg-accent/15 hover:bg-accent hover:text-background text-accent text-[10px] font-mono font-black tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(245,158,11,0.15)] group"
            >
              <Sparkles size={13} className="text-accent group-hover:text-background transition-colors animate-pulse" />
              <span>Onboard Client</span>
            </button>

            {/* Ecosystem Status Header Pill */}
            <button 
              onClick={() => {
                setIsEcosystemStatusOpen(true);
                setIsEcosystemStatusDocked(true);
              }}
              className={cn(
                "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-mono font-bold tracking-wider uppercase transition-all",
                isEcosystemStatusOpen && isEcosystemStatusDocked
                  ? "bg-accent text-background border-accent font-black shadow-md amber-glow"
                  : "bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:border-accent/40"
              )}
            >
              <Activity size={13} className={isEcosystemStatusOpen && isEcosystemStatusDocked ? "text-background" : "text-accent animate-pulse"} />
              <span className="hidden md:inline">Ecosystem Status:</span>
              <span className={cn(
                "px-1 py-0.5 rounded text-[9px] font-bold",
                isEcosystemStatusOpen && isEcosystemStatusDocked ? "bg-black/20 text-background" : "bg-amber-500/20 text-amber-300"
              )}>94% UP (2 Issues)</span>
            </button>

            <div className="h-6 w-px bg-white/10 mx-1" />
            
            {/* Role Switcher */}
            <div className="relative group/role">
               <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono font-bold tracking-widest uppercase text-accent hover:border-accent/40 transition-all">
                  <ShieldCheck size={14} /> {role}
               </button>
               <div className="absolute top-full right-0 mt-2 w-48 bg-[#09090B] border border-white/10 rounded-xl p-2 hidden group-hover/role:block shadow-2xl z-[100]">
                  {(['ADMIN', 'SUB_ADMIN', 'USER'] as UserRole[]).map((r) => (
                    <button 
                      key={r}
                      onClick={() => setRole(r)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all",
                        role === r ? "bg-accent/10 amber-text font-black" : "text-muted hover:bg-white/5 hover:text-white"
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
                className="text-muted hover:text-white relative p-2 rounded-xl hover:bg-white/5 transition-all"
              >
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full border-2 border-background animate-pulse" />
              </button>

              {/* Notifications Dropdown */}
              {isNotificationsOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-[#09090B] border border-white/10 rounded-2xl p-4 shadow-2xl z-50 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-bold text-white">System Alerts</span>
                    <span className="text-[10px] font-mono text-accent">3 New</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div 
                      onClick={() => { navigate('/agents'); setIsNotificationsOpen(false); }}
                      className="p-2.5 rounded-xl bg-accent/10 border border-accent/20 cursor-pointer hover:bg-accent/20 transition-all"
                    >
                      <div className="font-bold text-amber-200">HITL Approval Required</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">Performance Re-allocator proposed $6,200 shift</div>
                    </div>
                    <div 
                      onClick={() => { navigate('/diagnostics'); setIsNotificationsOpen(false); }}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-all"
                    >
                      <div className="font-bold text-white">Growth Diagnostic Completed</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">Overall Growth Score: 78/100</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar */}
            <div 
              onClick={() => navigate('/tenants')}
              className="w-8 h-8 rounded-full border border-accent/30 p-0.5 hover:scale-105 transition-transform cursor-pointer" 
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
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">
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
