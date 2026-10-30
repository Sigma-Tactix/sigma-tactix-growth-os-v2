import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  HelpCircle,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '@/src/lib/api';
import { useWorkspace } from '@/src/contexts/WorkspaceContext';
import { cn } from '@/src/lib/utils';
import { splitChatBlocks } from '@/src/lib/chatBlocks';
import { ChatBlockView } from '@/src/components/ui';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function renderMessageContent(content: string, key: string) {
  const chunks = splitChatBlocks(content);
  return (
    <div key={key} className="space-y-1">
      {chunks.map((chunk, i) =>
        chunk.kind === 'text' ? (
          <p key={`t-${i}`} className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
            {chunk.text}
          </p>
        ) : (
          <ChatBlockView key={`b-${i}`} block={chunk.block} />
        )
      )}
    </div>
  );
}

export default function AIChatbot() {
  const { currentWorkspace } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am Tactix AI, your onboarding specialist. How can I help you set up your Sigmatactix account today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const requestGeneration = useRef(0);

  useEffect(() => {
    requestGeneration.current += 1;
    setMessages([{ role: 'assistant', content: 'How can I help you set up this workspace?' }]);
    setInput('');
    setIsLoading(false);
    return () => { requestGeneration.current += 1; };
  }, [currentWorkspace.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    const generation = requestGeneration.current;

    try {
      const response = await apiFetch('/api/workspace/onboarding-chat', {
        method: 'POST',
        body: JSON.stringify({ messages: [...messages, userMessage].slice(-20) }),
      });
      const data = await response.json();
      if (generation !== requestGeneration.current) return;
      if (!response.ok || !data.text) throw new Error(data.error || 'Chat is unavailable. Please try again.');
      const assistantMessage: Message = { role: 'assistant', content: data.text };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      if (generation !== requestGeneration.current) return;
      setMessages(prev => [...prev, { role: 'assistant', content: error instanceof Error ? error.message : 'Chat is unavailable. Please try again.' }]);
    } finally {
      if (generation === requestGeneration.current) setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        aria-label="Open Tactix help"
        className="fixed bottom-8 right-8 w-16 h-16 bg-[var(--sigma-accent)] rounded-full flex items-center justify-center text-[var(--sigma-on-primary)] shadow-2xl z-50 amber-glow group"
      >
        <MessageSquare size={28} className="group-hover:rotate-12 transition-transform" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-[var(--sigma-canvas)]" />
      </motion.button>

      {/* Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-[var(--sigma-surface)] border-l border-[var(--sigma-border-strong)] z-[60] shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-[var(--sigma-border)] bg-[var(--sigma-surface)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-[var(--sigma-primary-subtle)] border border-[var(--sigma-primary)]/25 flex items-center justify-center">
                      <Sparkles size={20} className="text-[var(--sigma-accent)]" />
                   </div>
                   <div>
                      <h3 className="text-lg font-bold text-[var(--sigma-text)] tracking-tight">Tactix <span className="text-[var(--sigma-accent)]">AI</span></h3>
                      <div className="flex items-center gap-1.5">
                         <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                         <span className="text-[10px] text-[var(--sigma-text-muted)] font-mono uppercase tracking-widest">Active Assistant</span>
                      </div>
                   </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-[var(--sigma-surface-subtle)] rounded-lg text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)] transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Messages Container */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar"
              >
                {messages.map((m, idx) => (
                  <motion.div
                    key={`msg-${idx}-${m.role}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-4",
                      m.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      m.role === 'user' ? "bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)]" : "bg-[var(--sigma-primary-subtle)] border border-[var(--sigma-primary)]/25"
                    )}>
                      {m.role === 'user' ? <User size={16} className="text-[var(--sigma-text-muted)]" /> : <Bot size={16} className="text-[var(--sigma-accent)]" />}
                    </div>
                    <div className={cn(
                      "max-w-[85%] p-4 rounded-2xl leading-relaxed",
                      m.role === 'user'
                        ? "bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border-strong)] text-[var(--sigma-text)] rounded-tr-none text-sm"
                        : "bg-[var(--sigma-surface)] border border-[var(--sigma-border)] text-zinc-300 rounded-tl-none"
                    )}>
                      {m.role === 'assistant'
                        ? renderMessageContent(m.content, `inner-${idx}`)
                        : m.content}
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <div key="loader" className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-[var(--sigma-primary-subtle)] border border-[var(--sigma-primary)]/25 flex items-center justify-center shrink-0">
                      <Bot size={16} className="text-[var(--sigma-accent)]" />
                    </div>
                    <div className="bg-[var(--sigma-surface)] border border-[var(--sigma-border)] p-4 rounded-2xl rounded-tl-none">
                      <Loader2 size={16} className="text-[var(--sigma-accent)] animate-spin" />
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="px-6 py-2 flex gap-2 overflow-x-auto no-scrollbar border-t border-[var(--sigma-border)]">
                 {[
                   { label: 'Connect Ads', icon: Settings },
                   { label: 'Setup Profile', icon: User },
                   { label: 'Help', icon: HelpCircle }
                 ].map((action) => (
                   <button
                     key={action.label}
                     onClick={() => setInput(action.label)}
                     className="px-3 py-1.5 rounded-full bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)] text-[11px] font-bold uppercase tracking-widest text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)] hover:border-[var(--sigma-border-strong)] transition-all whitespace-nowrap flex items-center gap-2"
                   >
                     <action.icon size={10} /> {action.label}
                   </button>
                 ))}
              </div>

              {/* Input */}
              <div className="p-6 bg-[var(--sigma-surface)] border-t border-[var(--sigma-border)]">
                 <div className="relative">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSend()}
                      aria-label="Message to Tactix"
                      maxLength={4000}
                      placeholder="Type a message to Tactix..."
                      className="w-full bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)] rounded-xl py-4 pl-4 pr-14 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--sigma-accent)]/50 transition-all placeholder:text-zinc-600 text-[var(--sigma-text)]"
                    />
                    <button
                      onClick={handleSend}
                      aria-label="Send message"
                      disabled={isLoading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[var(--sigma-accent)] rounded-lg flex items-center justify-center text-[var(--sigma-on-primary)] hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                      <Send size={18} />
                    </button>
                 </div>
                 <p className="text-xs text-[var(--sigma-text-muted)] text-center mt-4">Setup guidance. Verify AI suggestions before acting.</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
