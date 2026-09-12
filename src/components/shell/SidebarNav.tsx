import React from 'react';
import { motion } from 'motion/react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { GROWTH_MODULES, PREFERENCES, type NavItem, type TabId } from './navigation';
import { SPRING } from '../../lib/motion';

interface SidebarNavProps {
  activeTab: TabId;
  onSelect: (tab: TabId) => void;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  isModuleUnlocked: (moduleKey: string) => boolean;
  badges: Partial<Record<TabId, React.ReactNode>>;
  /** Rendered under the module list — the "no active plan" notice. */
  notice?: React.ReactNode;
  /** Rendered pinned to the bottom — the current-plan panel. */
  footer?: React.ReactNode;
}

function NavRow({
  item, isActive, isCollapsed, badge, onSelect,
}: {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  badge?: React.ReactNode;
  onSelect: (tab: TabId) => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      aria-current={isActive ? 'page' : undefined}
      title={isCollapsed ? item.label : undefined}
      className={`relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-button text-xs font-semibold cursor-pointer transition-colors duration-150 ${
        isActive
          ? 'text-white'
          : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 active:bg-neutral-100'
      }`}
    >
      {/*
        The active pill is a single shared layout element rather than a background on
        each button, so switching tabs slides it between rows instead of cutting. The
        layoutId is what ties the two positions together; MotionConfig neutralises the
        slide for anyone who asked for reduced motion.
      */}
      {isActive && (
        <motion.span
          layoutId="sidebar-active-pill"
          transition={SPRING.soft}
          className="absolute inset-0 rounded-button bg-black shadow-xs"
        />
      )}
      <span className="relative flex items-center gap-2.5 min-w-0">
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{item.label}</span>
      </span>
      {badge !== undefined && (
        <span
          className={`relative text-[10px] px-2 py-0.5 rounded-button tabular-nums ${
            isActive ? 'bg-neutral-800 text-white' : 'bg-neutral-50 text-neutral-900 border border-neutral-300'
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

/**
 * The cockpit's primary navigation.
 *
 * Extracted from a ~325-line block inside App.tsx that rendered twenty hand-written
 * buttons and sat inside an <aside> with no <nav> anywhere in the document — the
 * whole shell was 504 divs and zero landmarks.
 *
 * Two orange icons were dropped in the move (90-Day Roadmap, OS Simulation Center).
 * The spec reserves the accent for a single CTA per viewport, and two tinted icons in
 * a twenty-row list is not that job; the active pill already carries the emphasis.
 */
export default function SidebarNav({
  activeTab, onSelect, isCollapsed, onToggleCollapsed,
  isModuleUnlocked, badges, notice, footer,
}: SidebarNavProps) {
  const visibleModules = GROWTH_MODULES.filter(
    item => !item.moduleKey || isModuleUnlocked(item.moduleKey)
  );

  return (
    <aside
      className={`relative bg-white border-r border-neutral-300 flex flex-col gap-1.5 shrink-0 md:overflow-y-auto transition-all duration-200 ${
        isCollapsed
          ? 'w-full md:w-[68px] p-3 [&_span]:hidden [&_p]:hidden [&_button]:justify-center'
          : 'w-full md:w-64 p-5'
      }`}
    >
      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="hidden md:flex items-center justify-center self-end mb-2 p-1.5 rounded-button text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer"
      >
        {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
      </button>

      <nav aria-label="Growth modules" className="contents">
        <p className="text-[11px] tracking-wider text-neutral-500 font-semibold uppercase px-3 mb-2 font-display">
          Growth Modules
        </p>
        {visibleModules.map(item => (
          <NavRow
            key={item.id}
            item={item}
            isActive={activeTab === item.id}
            isCollapsed={isCollapsed}
            badge={item.badge ? badges[item.id] : undefined}
            onSelect={onSelect}
          />
        ))}
      </nav>

      {notice}

      <div className="border-t border-neutral-100 my-3" />

      <nav aria-label="Preferences" className="contents">
        <p className="text-[11px] tracking-wider text-neutral-500 font-semibold uppercase px-3 mb-2 font-display">
          Preferences
        </p>
        {PREFERENCES.map(item => (
          <NavRow
            key={item.id}
            item={item}
            isActive={activeTab === item.id}
            isCollapsed={isCollapsed}
            onSelect={onSelect}
          />
        ))}
      </nav>

      {footer}
    </aside>
  );
}
