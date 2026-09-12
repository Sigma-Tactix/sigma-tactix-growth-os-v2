import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { useTutorial } from '@/src/contexts/TutorialContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { TUTORIAL_PHASES } from '@/src/data/tutorialSteps';
import { cn } from '@/src/lib/utils';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 10; // px padding around the spotlight target

export default function TutorialOverlay() {
  const {
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    nextStep,
    prevStep,
    skipTutorial,
    completeTutorial,
  } = useTutorial();

  const navigate = useNavigate();
  const location = useLocation();
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  // Navigate to the correct route when step changes
  useEffect(() => {
    if (!isActive || !currentStep) return;
    if (location.pathname !== currentStep.route) {
      navigate(currentStep.route);
    }
  }, [currentStep?.id, isActive]);

  // Measure target element position (re-runs on scroll/resize)
  const measureTarget = useCallback(() => {
    if (!currentStep) { setTargetRect(null); return; }
    const el = document.querySelector(`[data-tutorial-id="${currentStep.targetId}"]`);
    if (!el) { setTargetRect(null); return; }
    const r = el.getBoundingClientRect();
    setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [currentStep?.targetId]);

  // RAF loop for smooth rect tracking
  useEffect(() => {
    if (!isActive) { setTargetRect(null); return; }
    let id: number;
    const loop = () => {
      measureTarget();
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [isActive, measureTarget]);

  // Position tooltip relative to target
  useEffect(() => {
    if (!targetRect || !tooltipRef.current) return;
    const tt = tooltipRef.current.getBoundingClientRect();
    const pos = currentStep?.position ?? 'bottom';
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top = 0;
    let left = 0;
    const GAP = 16;

    if (pos === 'bottom') {
      top = targetRect.top + targetRect.height + PADDING + GAP;
      left = targetRect.left + targetRect.width / 2 - tt.width / 2;
    } else if (pos === 'top') {
      top = targetRect.top - PADDING - GAP - tt.height;
      left = targetRect.left + targetRect.width / 2 - tt.width / 2;
    } else if (pos === 'right') {
      top = targetRect.top + targetRect.height / 2 - tt.height / 2;
      left = targetRect.left + targetRect.width + PADDING + GAP;
    } else if (pos === 'left') {
      top = targetRect.top + targetRect.height / 2 - tt.height / 2;
      left = targetRect.left - PADDING - GAP - tt.width;
    }

    // Clamp to viewport
    left = Math.max(12, Math.min(left, vw - tt.width - 12));
    top = Math.max(12, Math.min(top, vh - tt.height - 12));

    setTooltipPos({ top, left });
  }, [targetRect, currentStep?.position]);

  if (!isActive || !currentStep) return null;

  const phase = TUTORIAL_PHASES.find(p => p.key === currentStep.phase);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const progressPct = ((currentStepIndex) / (totalSteps - 1)) * 100;

  // SVG clip path: full screen with a rounded-rect hole cut at target
  const r = targetRect;
  const pad = PADDING;
  const hole = r
    ? `M 0 0 H ${window.innerWidth} V ${window.innerHeight} H 0 Z ` +
      `M ${r.left - pad} ${r.top - pad} ` +
      `a 12 12 0 0 1 12 -12 ` +
      `H ${r.left + r.width + pad - 12} ` +
      `a 12 12 0 0 1 12 12 ` +
      `V ${r.top + r.height + pad - 12} ` +
      `a 12 12 0 0 1 -12 12 ` +
      `H ${r.left - pad + 12} ` +
      `a 12 12 0 0 1 -12 -12 Z`
    : `M 0 0 H ${window.innerWidth} V ${window.innerHeight} H 0 Z`;

  return createPortal(
    <AnimatePresence>
      {isActive && (
        <>
          {/* ── Backdrop with spotlight hole ── */}
          <motion.div
            key="overlay-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[9000] pointer-events-none"
          >
            <svg
              width="100%"
              height="100%"
              className="absolute inset-0 w-full h-full"
              style={{ pointerEvents: 'none' }}
            >
              <defs>
                <clipPath id="tut-spotlight-clip" clipPathUnits="userSpaceOnUse">
                  <path d={hole} fillRule="evenodd" />
                </clipPath>
              </defs>
              <rect
                x="0" y="0"
                width="100%" height="100%"
                fill="rgba(0,0,0,0.72)"
                clipPath="url(#tut-spotlight-clip)"
                style={{ pointerEvents: 'none' }}
              />
            </svg>

            {/* Pulsing border around target */}
            {r && (
              <motion.div
                key={currentStep.id + '-border'}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="absolute rounded-xl pointer-events-none"
                style={{
                  top: r.top - pad,
                  left: r.left - pad,
                  width: r.width + pad * 2,
                  height: r.height + pad * 2,
                  border: `2px solid ${phase?.color ?? '#f59e0b'}`,
                  boxShadow: `0 0 20px 4px ${phase?.color ?? '#f59e0b'}55`,
                }}
              >
                {currentStep.pulse && (
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                    style={{ border: `2px solid ${phase?.color ?? '#f59e0b'}`, borderRadius: 12 }}
                  />
                )}
              </motion.div>
            )}
          </motion.div>

          {/* Clickable blocker (allows clicks only inside spotlight) */}
          <div
            className="fixed inset-0 z-[9001]"
            style={{ pointerEvents: 'none' }}
          />

          {/* ── Tooltip Card ── */}
          <motion.div
            ref={tooltipRef}
            key={currentStep.id}
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed z-[9100] w-[360px] max-w-[calc(100vw-24px)]"
            style={{ top: tooltipPos.top, left: tooltipPos.left }}
          >
            <div
              className="relative rounded-2xl border overflow-hidden shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, #0f0f10 0%, #131317 100%)',
                borderColor: `${phase?.color ?? '#f59e0b'}55`,
              }}
            >
              {/* Glow blob */}
              <div
                className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none"
                style={{ background: phase?.color ?? '#f59e0b' }}
              />

              {/* Phase badge + close */}
              <div className="flex items-center justify-between px-5 pt-4 pb-0">
                <span
                  className="text-[10px] font-mono font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
                  style={{
                    background: `${phase?.color ?? '#f59e0b'}22`,
                    color: phase?.color ?? '#f59e0b',
                    border: `1px solid ${phase?.color ?? '#f59e0b'}44`,
                  }}
                >
                  {currentStep.phaseLabel}
                </span>

                <button
                  onClick={skipTutorial}
                  className="p-1.5 rounded-lg text-zinc-600 hover:text-white hover:bg-white/10 transition-all"
                  title="Pause tutorial"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Title + Body */}
              <div className="px-5 pt-3 pb-4">
                <h3 className="text-white font-bold text-sm leading-snug mb-2">
                  {currentStep.title}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  {currentStep.body}
                </p>
              </div>

              {/* Progress bar */}
              <div className="mx-5 mb-3 h-1 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.4 }}
                  style={{ background: `linear-gradient(90deg, ${phase?.color ?? '#f59e0b'}, ${phase?.color ?? '#f59e0b'}cc)` }}
                />
              </div>

              {/* Step counter + nav buttons */}
              <div className="flex items-center justify-between px-5 pb-4 pt-1">
                <span className="text-[10px] font-mono text-zinc-500">
                  Step {currentStepIndex + 1} / {totalSteps}
                </span>

                <div className="flex items-center gap-2">
                  {!isFirstStep && (
                    <button
                      onClick={prevStep}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 text-xs font-mono text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <ArrowLeft size={12} /> Back
                    </button>
                  )}

                  <button
                    onClick={isLastStep ? completeTutorial : nextStep}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bold text-xs font-mono text-black transition-all"
                    style={{ background: phase?.color ?? '#f59e0b' }}
                  >
                    {isLastStep ? (
                      <><CheckCircle2 size={13} /> {currentStep.nextLabel ?? 'Complete'}</>
                    ) : (
                      <>{currentStep.nextLabel ?? 'Next'} <ArrowRight size={12} /></>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Phase dot nav */}
            <div className="flex items-center justify-center gap-1.5 mt-2">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === currentStepIndex ? 16 : 5,
                    height: 5,
                    background: i <= currentStepIndex
                      ? (phase?.color ?? '#f59e0b')
                      : 'rgba(255,255,255,0.12)',
                  }}
                />
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
