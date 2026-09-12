import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { TUTORIAL_STEPS, TOTAL_TUTORIAL_STEPS, TutorialStep } from '@/src/data/tutorialSteps';

const TUTORIAL_STORAGE_KEY = 'sigmatactix_tutorial_state';

interface TutorialState {
  isActive: boolean;
  currentStepIndex: number;
  completedSteps: number[];
  hasEverStarted: boolean;
  isCompleted: boolean;
}

interface TutorialContextType extends TutorialState {
  currentStep: TutorialStep | null;
  totalSteps: number;
  startTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  resetTutorial: () => void;
  goToStep: (index: number) => void;
}

const defaultState: TutorialState = {
  isActive: false,
  currentStepIndex: 0,
  completedSteps: [],
  hasEverStarted: false,
  isCompleted: false,
};

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TutorialState>(() => {
    try {
      const stored = localStorage.getItem(TUTORIAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Restore persistent fields but always start with overlay closed
        return { ...defaultState, ...parsed, isActive: false };
      }
    } catch {
      // ignore
    }
    return defaultState;
  });

  // Persist non-volatile state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify({
        currentStepIndex: state.currentStepIndex,
        completedSteps: state.completedSteps,
        hasEverStarted: state.hasEverStarted,
        isCompleted: state.isCompleted,
      }));
    } catch {
      // ignore
    }
  }, [state.currentStepIndex, state.completedSteps, state.hasEverStarted, state.isCompleted]);

  const currentStep = state.isActive && state.currentStepIndex < TOTAL_TUTORIAL_STEPS
    ? TUTORIAL_STEPS[state.currentStepIndex]
    : null;

  const startTutorial = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: true,
      hasEverStarted: true,
      isCompleted: false,
    }));
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => {
      const nextIndex = prev.currentStepIndex + 1;
      const nowCompleted = [...new Set([...prev.completedSteps, prev.currentStepIndex])];
      if (nextIndex >= TOTAL_TUTORIAL_STEPS) {
        return { ...prev, isActive: false, isCompleted: true, completedSteps: nowCompleted, currentStepIndex: 0 };
      }
      return { ...prev, currentStepIndex: nextIndex, completedSteps: nowCompleted };
    });
  }, []);

  const prevStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStepIndex: Math.max(0, prev.currentStepIndex - 1),
    }));
  }, []);

  const skipTutorial = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false,
    }));
  }, []);

  const completeTutorial = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false,
      isCompleted: true,
      completedSteps: Array.from({ length: TOTAL_TUTORIAL_STEPS }, (_, i) => i),
      currentStepIndex: 0,
    }));
  }, []);

  const resetTutorial = useCallback(() => {
    setState({ ...defaultState });
    try { localStorage.removeItem(TUTORIAL_STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < TOTAL_TUTORIAL_STEPS) {
      setState(prev => ({ ...prev, currentStepIndex: index, isActive: true }));
    }
  }, []);

  return (
    <TutorialContext.Provider value={{
      ...state,
      currentStep,
      totalSteps: TOTAL_TUTORIAL_STEPS,
      startTutorial,
      nextStep,
      prevStep,
      skipTutorial,
      completeTutorial,
      resetTutorial,
      goToStep,
    }}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error('useTutorial must be used inside TutorialProvider');
  return ctx;
}
