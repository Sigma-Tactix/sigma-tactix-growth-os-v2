import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, RotateCcw, CheckCircle2 } from 'lucide-react';
import { useTutorial } from '@/src/contexts/TutorialContext';
import { TUTORIAL_PHASES } from '@/src/data/tutorialSteps';
import { cn } from '@/src/lib/utils';

export default function TutorialHUD() {
  const {
    isActive,
    isCompleted,
    currentStepIndex,
    totalSteps,
    currentStep,
    skipTutorial,
    startTutorial,
    resetTutorial,
    hasEverStarted,
  } = useTutorial();

  const phase = TUTORIAL_PHASES.find(p => p.key === currentStep?.phase);

  // Completed state banner
  if (isCompleted) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          className="h-10 shrink-0 flex items-center justify-between px-6 border-b border-emerald-500/20"
          style={{ background: 'linear-gradient(90deg, #052a1a 0%, #071c15 100%)' }}
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 size={15} className="text-emerald-400" />
            <span className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider">
              Tutorial Complete — Growth Loop Active
            </span>
          </div>
          <button
            onClick={resetTutorial}
            className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 hover:text-white transition-all px-2 py-1 rounded-lg hover:bg-white/5"
          >
            <RotateCcw size={11} /> Restart
          </button>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Active tutorial HUD
  if (isActive && currentStep) {
    const progressPct = (currentStepIndex / (totalSteps - 1)) * 100;

    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-10 shrink-0 flex items-center gap-4 px-6 border-b border-white/5 relative overflow-hidden"
        style={{ background: 'linear-gradient(90deg, #0d0d0e 0%, #111113 100%)' }}
      >
        {/* Animated progress fill */}
        <motion.div
          className="absolute inset-0 origin-left"
          animate={{ scaleX: progressPct / 100 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{ background: `${phase?.color ?? '#f59e0b'}11`, transformOrigin: 'left' }}
        />

        {/* Phase label */}
        <span
          className="text-[10px] font-mono font-black uppercase tracking-widest shrink-0 z-10"
          style={{ color: phase?.color ?? '#f59e0b' }}
        >
          {currentStep.phaseLabel}
        </span>

        {/* Phase dots */}
        <div className="flex items-center gap-1.5 z-10">
          {TUTORIAL_PHASES.map((ph, i) => {
            const phaseStepIndices = ph.steps as readonly number[];
            const isDone = phaseStepIndices.every(si => si < currentStepIndex);
            const isCurrent = phaseStepIndices.includes(currentStepIndex);
            return (
              <div
                key={ph.key}
                className="flex items-center gap-1"
                title={ph.label}
              >
                <div
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: isCurrent ? 20 : 8,
                    height: 8,
                    background: isDone
                      ? '#10b981'
                      : isCurrent
                        ? ph.color
                        : 'rgba(255,255,255,0.1)',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Step fraction */}
        <span className="text-[10px] font-mono text-zinc-500 z-10 ml-auto">
          Step <span className="font-bold text-zinc-300">{currentStepIndex + 1}</span> / {totalSteps}
        </span>

        {/* Skip */}
        <button
          onClick={skipTutorial}
          className="flex items-center gap-1 text-[10px] font-mono text-zinc-600 hover:text-white transition-all z-10 px-2 py-1 rounded-lg hover:bg-white/5 shrink-0"
        >
          <X size={10} /> Pause
        </button>
      </motion.div>
    );
  }

  // Restart prompt (tutorial was started but then paused)
  if (hasEverStarted && !isCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-10 shrink-0 flex items-center justify-between px-6 border-b border-white/5"
        style={{ background: '#0d0d0e' }}
      >
        <div className="flex items-center gap-2">
          <BookOpen size={13} className="text-amber-400" />
          <span className="text-[10px] font-mono text-zinc-400">Tutorial paused at step {currentStepIndex + 1}</span>
        </div>
        <button
          onClick={startTutorial}
          className="text-[10px] font-mono font-bold text-amber-400 hover:text-white border border-amber-500/30 hover:border-amber-400 px-3 py-1 rounded-lg transition-all hover:bg-amber-500/10"
        >
          Resume Tutorial →
        </button>
      </motion.div>
    );
  }

  return null;
}
