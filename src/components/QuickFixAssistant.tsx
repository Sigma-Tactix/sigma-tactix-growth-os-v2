import React, { useState } from 'react';
import { 
  Wrench, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ArrowRight, 
  ExternalLink, 
  ShieldAlert,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/src/contexts/ToastContext';

export interface QuickFixData {
  id: string;
  name: string;
  codename?: string;
  severity: 'WARNING' | 'CRITICAL' | 'AWAITING_APPROVAL';
  issueSummary: string;
  rootCause: string;
  actionableSteps: string[];
  quickFixLabel: string;
  targetRoute?: string;
  vaultAffected?: string;
  onApplyFix?: () => void;
}

interface QuickFixAssistantProps {
  data: QuickFixData;
  children: React.ReactNode;
  side?: 'left' | 'right' | 'top' | 'bottom';
  className?: string;
}

export default function QuickFixAssistant({
  data,
  children,
  side = 'right',
  className
}: QuickFixAssistantProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [isFixed, setIsFixed] = useState(false);
  const navigate = useNavigate();
  const { notifySuccess } = useToast();

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFixing(true);

    setTimeout(() => {
      setIsFixing(false);
      setIsFixed(true);
      if (data.onApplyFix) {
        data.onApplyFix();
      }
      notifySuccess(
        'Mitigation Applied',
        `Autonomous fix executed for ${data.codename || data.name}. System health restored to OPERATIONAL.`,
        { category: 'SYSTEM' }
      );
    }, 750);
  };

  const getPositionClasses = () => {
    switch (side) {
      case 'left':
        return 'right-full mr-3 top-1/2 -translate-y-1/2';
      case 'top':
        return 'bottom-full mb-3 left-1/2 -translate-y-0 -translate-x-1/2';
      case 'bottom':
        return 'top-full mt-3 left-1/2 -translate-x-1/2';
      case 'right':
      default:
        return 'left-full ml-3 top-1/2 -translate-y-1/2';
    }
  };

  const isCritical = data.severity === 'CRITICAL';

  return (
    <div 
      className={cn("relative inline-flex items-center", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: side === 'top' ? 4 : side === 'bottom' ? -4 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-50 w-84 sm:w-96 rounded-2xl shadow-2xl p-4 text-left pointer-events-auto border backdrop-blur-2xl",
              getPositionClasses(),
              isCritical
                ? "bg-[#140608]/95 border-rose-500/40 shadow-rose-950/50"
                : "bg-[#140f06]/95 border-amber-500/40 shadow-amber-950/50"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border",
                  isCritical 
                    ? "bg-rose-500/20 border-rose-500/30 text-rose-400" 
                    : "bg-amber-500/20 border-amber-500/30 text-amber-400"
                )}>
                  <Wrench size={16} className="animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white leading-tight">
                      {data.name}
                    </span>
                    {data.codename && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-zinc-300 font-bold">
                        {data.codename}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                    <span className={cn(
                      "font-bold",
                      isCritical ? "text-rose-400" : "text-amber-400"
                    )}>
                      {isCritical ? 'CRITICAL MITIGATION' : 'QUICK FIX ASSISTANT'}
                    </span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-zinc-400">Immediate Action</span>
                  </div>
                </div>
              </div>

              <span className={cn(
                "text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded border shrink-0",
                isCritical
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                  : "bg-amber-500/20 text-amber-300 border-amber-500/30"
              )}>
                {data.severity}
              </span>
            </div>

            {/* Root Cause & Summary */}
            <div className="space-y-2 mb-3">
              <div className="text-xs text-zinc-200 font-sans leading-snug">
                <strong className={isCritical ? "text-rose-300" : "text-amber-300"}>Diagnosis: </strong>
                {data.issueSummary}
              </div>

              <div className="bg-black/40 rounded-xl p-2.5 border border-white/5 text-[11px] font-mono text-zinc-400 leading-tight">
                <span className="text-muted uppercase text-[9px] block mb-0.5">Root Cause Telemetry:</span>
                {data.rootCause}
              </div>
            </div>

            {/* Actionable Steps Checklist */}
            <div className="space-y-1.5 mb-4">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted font-bold flex items-center gap-1">
                <Sparkles size={11} className="text-accent" />
                Actionable Mitigation Protocol:
              </div>
              <div className="bg-black/30 rounded-xl p-2.5 border border-white/5 space-y-1.5">
                {data.actionableSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs font-mono text-zinc-300">
                    <span className={cn(
                      "w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5",
                      isCritical ? "bg-rose-500/20 text-rose-300" : "bg-amber-500/20 text-amber-300"
                    )}>
                      {idx + 1}
                    </span>
                    <span className="leading-tight flex-1">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
              {data.targetRoute && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(data.targetRoute!);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-mono transition-all flex items-center gap-1"
                >
                  <span>Open Tool</span>
                  <ExternalLink size={12} />
                </button>
              )}

              <button
                onClick={handleApply}
                disabled={isFixing || isFixed}
                className={cn(
                  "flex-1 px-3 py-1.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg",
                  isFixed 
                    ? "bg-green-500/20 text-green-300 border border-green-500/40" 
                    : isCritical
                      ? "bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/30"
                      : "bg-accent hover:opacity-90 text-background amber-glow"
                )}
              >
                {isFixing ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Applying Patch...</span>
                  </>
                ) : isFixed ? (
                  <>
                    <CheckCircle2 size={13} className="text-green-400" />
                    <span>Resolved & Live</span>
                  </>
                ) : (
                  <>
                    <Zap size={13} />
                    <span>{data.quickFixLabel}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
