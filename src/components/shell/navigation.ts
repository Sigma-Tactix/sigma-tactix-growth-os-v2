import {
  Brain, Briefcase, Compass, FileText, Globe, LineChart, Link, Map, Megaphone,
  Search, Settings, Shield, Sparkles, TrendingUp, UserCheck, Users, Zap, Eye,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Every destination in the cockpit.
 */
export type TabId =
  | 'overview' | 'roadmap' | 'brain' | 'hologram' | 'growth' | 'uiux' | 'analytics' | 'content'
  | 'performance' | 'reporting' | 'authority' | 'crm' | 'competitors' | 'social'
  | 'agents' | 'simulation' | 'workspace' | 'integrations' | 'settings' | 'admin'
  | 'help';

export interface NavItem {
  id: TabId;
  label: string;
  icon: LucideIcon;
  /**
   * Entitlement key checked against `isModuleUnlocked`. Omitted means always visible —
   * the dashboard, the roadmap and everything under Preferences are not gated.
   */
  moduleKey?: string;
  /** Slot for a live count rendered on the right of the row. */
  badge?: 'growthScore' | 'contentCount';
}

export const GROWTH_MODULES: NavItem[] = [
  { id: 'hologram',    label: '🧬 Growth Matrix',        icon: Zap },
  { id: 'overview',    label: 'Diagnostic Dashboard',  icon: TrendingUp, badge: 'growthScore' },
  { id: 'roadmap',     label: '90-Day Roadmap',        icon: Map },
  { id: 'brain',       label: 'Second Brain / Vault',  icon: Brain,      moduleKey: 'brain' },
  { id: 'growth',      label: 'Growth Audit Engine',   icon: Sparkles,   moduleKey: 'growth' },
  { id: 'uiux',        label: 'UI/UX Audit Lab',       icon: Compass,    moduleKey: 'uiux' },
  { id: 'content',     label: 'Creative Command',      icon: FileText,   moduleKey: 'content', badge: 'contentCount' },
  { id: 'performance', label: 'Performance Marketing', icon: Zap,        moduleKey: 'performance' },
  { id: 'reporting',   label: 'Reporting & Analytics', icon: LineChart,  moduleKey: 'reporting' },
  { id: 'authority',   label: 'Authority & SEO',       icon: Globe,      moduleKey: 'authority' },
  { id: 'crm',         label: 'CRM',                   icon: Briefcase,  moduleKey: 'crm' },
  { id: 'competitors', label: 'Competitor Analysis',   icon: Search,     moduleKey: 'competitors' },
  { id: 'social',      label: 'Social Listening',      icon: Megaphone,  moduleKey: 'social' },
  { id: 'agents',      label: 'Agentic AI Cockpit',    icon: UserCheck,  moduleKey: 'agents' },
  { id: 'simulation',  label: 'OS Simulation Center',  icon: Zap,        moduleKey: 'simulation' },
];

export const PREFERENCES: NavItem[] = [
  { id: 'workspace',    label: 'Workspace & Team', icon: Users },
  { id: 'integrations', label: 'Integrations',     icon: Link },
  { id: 'settings',     label: 'Settings',         icon: Settings },
  { id: 'admin',        label: 'Admin Panel',      icon: Shield },
];
