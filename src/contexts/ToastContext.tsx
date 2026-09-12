import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  XCircle, 
  X, 
  Database, 
  RefreshCw, 
  ShieldCheck, 
  Layers, 
  ChevronDown, 
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

export type ToastType = 'success' | 'info' | 'warning' | 'error';
export type ToastCategory = 'SYNC' | 'BACKUP' | 'AGENT' | 'SYSTEM' | 'SECURITY';

export interface ToastItem {
  id: string;
  type: ToastType;
  category?: ToastCategory;
  title: string;
  message?: string;
  details?: string;
  timestamp: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export type ToastOptions = Omit<ToastItem, 'id' | 'timestamp'> & {
  duration?: number;
  timestamp?: string;
};

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (options: ToastOptions) => string;
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;
  // Convenience helpers
  notifySuccess: (title: string, message?: string, options?: Partial<ToastOptions>) => string;
  notifyInfo: (title: string, message?: string, options?: Partial<ToastOptions>) => string;
  notifyWarning: (title: string, message?: string, options?: Partial<ToastOptions>) => string;
  notifyError: (title: string, message?: string, options?: Partial<ToastOptions>) => string;
  notifySyncSuccess: (pipelineName: string, detailText?: string) => string;
  notifyBackupSuccess: (vaultsCount?: number, recordsCount?: number, detailText?: string) => string;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const dismissToast = useCallback((id: string) => {
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 0);
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const clearAllToasts = useCallback(() => {
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current.clear();
    setTimeout(() => {
      setToasts([]);
    }, 0);
  }, []);

  const showToast = useCallback((options: ToastOptions): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const newToast: ToastItem = {
      id,
      type: options.type,
      category: options.category || 'SYSTEM',
      title: options.title,
      message: options.message,
      details: options.details,
      timestamp: options.timestamp || timeString,
      duration: options.duration ?? 5000,
      action: options.action,
    };

    // Defer state update to next microtask/tick to guarantee no render collisions
    setTimeout(() => {
      setToasts(prev => [newToast, ...prev.slice(0, 5)]); // limit to 6 visible toasts
    }, 0);

    const duration = options.duration ?? 5000;
    if (duration > 0) {
      const timer = setTimeout(() => {
        dismissToast(id);
      }, duration);
      timersRef.current.set(id, timer);
    }

    return id;
  }, [dismissToast]);

  const notifySuccess = useCallback((title: string, message?: string, options?: Partial<ToastOptions>) => {
    return showToast({
      type: 'success',
      title,
      message,
      category: 'SYSTEM',
      ...options
    });
  }, [showToast]);

  const notifyInfo = useCallback((title: string, message?: string, options?: Partial<ToastOptions>) => {
    return showToast({
      type: 'info',
      title,
      message,
      category: 'SYSTEM',
      ...options
    });
  }, [showToast]);

  const notifyWarning = useCallback((title: string, message?: string, options?: Partial<ToastOptions>) => {
    return showToast({
      type: 'warning',
      title,
      message,
      category: 'SYSTEM',
      ...options
    });
  }, [showToast]);

  const notifyError = useCallback((title: string, message?: string, options?: Partial<ToastOptions>) => {
    return showToast({
      type: 'error',
      title,
      message,
      category: 'SYSTEM',
      ...options
    });
  }, [showToast]);

  const notifySyncSuccess = useCallback((pipelineName: string, detailText?: string) => {
    return showToast({
      type: 'success',
      category: 'SYNC',
      title: `${pipelineName} Synchronized`,
      message: 'Data pipeline stream successfully verified and committed into Second Brain Vaults.',
      details: detailText || 'Ingested latest delta records with zero schema validation anomalies. Vectors re-indexed.',
      duration: 5500
    });
  }, [showToast]);

  const notifyBackupSuccess = useCallback((vaultsCount: number = 10, recordsCount: number = 42, detailText?: string) => {
    return showToast({
      type: 'success',
      category: 'BACKUP',
      title: 'Second Brain Backup Completed Successfully',
      message: `Full cryptographic snapshot of all ${vaultsCount} Vaults (${recordsCount} records, 1,536-dim vector indices) verified and saved.`,
      details: detailText || 'Encrypted JSON snapshot created with SHA-256 integrity hash verification.',
      duration: 6500
    });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{
      toasts,
      showToast,
      dismissToast,
      clearAllToasts,
      notifySuccess,
      notifyInfo,
      notifyWarning,
      notifyError,
      notifySyncSuccess,
      notifyBackupSuccess
    }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastContainer({ 
  toasts, 
  onDismiss 
}: { 
  toasts: ToastItem[]; 
  onDismiss: (id: string) => void; 
}) {
  return (
    <div 
      aria-live="polite" 
      className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-md w-full pointer-events-none px-4 sm:px-0"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <ToastCard key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastCard({ 
  toast, 
  onDismiss 
}: { 
  key?: string;
  toast: ToastItem; 
  onDismiss: () => void; 
}) {
  const [showDetails, setShowDetails] = useState(false);

  const getIcon = () => {
    if (toast.category === 'BACKUP') {
      return <Database size={18} className="text-emerald-400 shrink-0" />;
    }
    if (toast.category === 'SYNC') {
      return <RefreshCw size={18} className="text-emerald-400 shrink-0" />;
    }
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle size={18} className="text-amber-400 shrink-0" />;
      case 'error':
        return <XCircle size={18} className="text-rose-400 shrink-0" />;
      case 'info':
      default:
        return <Info size={18} className="text-cyan-400 shrink-0" />;
    }
  };

  const getBorderAndBg = () => {
    switch (toast.type) {
      case 'success':
        return 'border-emerald-500/30 bg-zinc-950/95 shadow-[0_10px_35px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20';
      case 'warning':
        return 'border-amber-500/30 bg-zinc-950/95 shadow-[0_10px_35px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/20';
      case 'error':
        return 'border-rose-500/30 bg-zinc-950/95 shadow-[0_10px_35px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/20';
      case 'info':
      default:
        return 'border-cyan-500/30 bg-zinc-950/95 shadow-[0_10px_35px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/20';
    }
  };

  const getCategoryBadge = () => {
    switch (toast.category) {
      case 'BACKUP':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'SYNC':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'AGENT':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'SECURITY':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      default:
        return 'bg-white/10 text-zinc-300 border-white/10';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9, transition: { duration: 0.2 } }}
      className={cn(
        "pointer-events-auto rounded-2xl border p-4 backdrop-blur-xl relative overflow-hidden transition-all",
        getBorderAndBg()
      )}
    >
      {/* Top accent bar */}
      <div 
        className={cn(
          "absolute top-0 left-0 right-0 h-1",
          toast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500' :
          toast.type === 'warning' ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500' :
          toast.type === 'error' ? 'bg-gradient-to-r from-rose-500 via-pink-400 to-rose-500' :
          'bg-gradient-to-r from-cyan-500 via-blue-400 to-cyan-500'
        )} 
      />

      <div className="flex items-start gap-3 mt-0.5">
        <div className="p-2 rounded-xl bg-white/5 border border-white/10 shrink-0 mt-0.5">
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-1">
            {toast.category && (
              <span className={cn(
                "text-[9px] font-mono uppercase px-2 py-0.5 rounded font-black border tracking-wider",
                getCategoryBadge()
              )}>
                {toast.category === 'BACKUP' ? 'Second Brain Backup' :
                 toast.category === 'SYNC' ? 'Pipeline Sync' : toast.category}
              </span>
            )}
            <span className="text-[10px] font-mono text-zinc-500 ml-auto">
              {toast.timestamp}
            </span>
          </div>

          <h4 className="text-xs font-bold text-white leading-snug tracking-tight">
            {toast.title}
          </h4>

          {toast.message && (
            <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed font-sans">
              {toast.message}
            </p>
          )}

          {toast.details && (
            <div className="mt-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-[10px] font-mono text-zinc-400 hover:text-white transition-colors flex items-center gap-1 uppercase tracking-wider"
              >
                <span>{showDetails ? 'Hide Verification Trace' : 'View Verification Trace'}</span>
                {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>

              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-1.5 p-2.5 rounded-lg bg-black/60 border border-white/10 text-[10px] font-mono text-zinc-400 leading-relaxed break-all"
                  >
                    {toast.details}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {toast.action && (
            <div className="mt-2.5 pt-2 border-t border-white/5">
              <button
                onClick={toast.action.onClick}
                className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1"
              >
                <span>{toast.action.label}</span>
                <ExternalLink size={10} />
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onDismiss}
          className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 -mr-1 -mt-1"
          aria-label="Dismiss notification"
        >
          <X size={14} />
        </button>
      </div>

      {/* Auto-dismiss countdown bar */}
      {toast.duration && toast.duration > 0 && (
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: toast.duration / 1000, ease: 'linear' }}
          style={{ originX: 0 }}
          className={cn(
            "absolute bottom-0 left-0 right-0 h-0.5",
            toast.type === 'success' ? 'bg-emerald-400/40' :
            toast.type === 'warning' ? 'bg-amber-400/40' :
            toast.type === 'error' ? 'bg-rose-400/40' : 'bg-cyan-400/40'
          )}
        />
      )}
    </motion.div>
  );
}
