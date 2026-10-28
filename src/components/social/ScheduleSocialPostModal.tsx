import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Send,
  FileEdit,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  Share2,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button, Badge } from '@/src/components/ui';
import { useToast } from '@/src/contexts/ToastContext';
import {
  fetchSocialChannels,
  fetchSocialStatus,
  scheduleSocialPost,
  draftSocialPost,
  publishSocialPost,
} from '@/src/lib/socialDistributionApi';
import type { SocialChannel, SocialDistributionProviderStatus, SocialPublishResult } from '@/src/server/providers/socialDistribution/types';

export interface ScheduleSocialPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent: string;
  mediaUrls?: string[];
  title?: string;
  campaignId?: string;
  onSuccess?: (result: SocialPublishResult) => void;
}

export function ScheduleSocialPostModal({
  isOpen,
  onClose,
  initialContent,
  mediaUrls = [],
  title,
  campaignId,
  onSuccess,
}: ScheduleSocialPostModalProps) {
  const { notifySuccess, notifyError } = useToast();
  const [content, setContent] = useState(initialContent);
  const [channels, setChannels] = useState<SocialChannel[]>([]);
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
  const [status, setStatus] = useState<SocialDistributionProviderStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionType, setActionType] = useState<'schedule' | 'draft' | 'immediate'>('schedule');

  // Default schedule: 2 hours in future
  const defaultDate = new Date(Date.now() + 2 * 3600 * 1000);
  const [scheduleDateTime, setScheduleDateTime] = useState(
    defaultDate.toISOString().slice(0, 16)
  );

  useEffect(() => {
    if (!isOpen) return;
    setContent(initialContent);

    // Fetch channels and provider status
    Promise.all([fetchSocialChannels(), fetchSocialStatus()])
      .then(([channelsRes, statusRes]) => {
        if (channelsRes.success && channelsRes.channels) {
          setChannels(channelsRes.channels);
          // Default: select the first 2 connected channels
          const initialSelected = channelsRes.channels
            .filter((c) => c.connected)
            .slice(0, 2)
            .map((c) => c.id);
          setSelectedChannelIds(initialSelected.length > 0 ? initialSelected : [channelsRes.channels[0]?.id || 'chan-li-01']);
        }
        if (statusRes.success && statusRes.status) {
          setStatus(statusRes.status);
        }
      })
      .catch((err) => {
        console.warn('Could not load social channels:', err);
      });
  }, [isOpen, initialContent]);

  const toggleChannel = (id: string) => {
    setSelectedChannelIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      notifyError('Validation Error', 'Post content cannot be empty.');
      return;
    }
    if (selectedChannelIds.length === 0) {
      notifyError('Validation Error', 'Select at least one destination channel.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        content: content.trim(),
        channels: selectedChannelIds,
        media: mediaUrls.map((url) => ({
          url,
          type: url.endsWith('.mp4') ? ('video' as const) : ('image' as const),
        })),
        title,
        campaignId,
        scheduledFor: actionType === 'schedule' ? new Date(scheduleDateTime).toISOString() : undefined,
      };

      let res: { success: boolean; result: SocialPublishResult };
      if (actionType === 'draft') {
        res = await draftSocialPost(payload);
        notifySuccess(
          'Post Drafted',
          `Draft parked in social scheduler (ID: ${res.result.id}).`
        );
      } else if (actionType === 'immediate') {
        res = await publishSocialPost(payload);
        notifySuccess(
          'Post Dispatched',
          `Published immediately to ${res.result.targetChannels.length} channel(s) (ID: ${res.result.id}).`
        );
      } else {
        res = await scheduleSocialPost(payload);
        notifySuccess(
          'Post Scheduled',
          `Job recorded in distribution ledger for ${new Date(scheduleDateTime).toLocaleString()} (ID: ${res.result.id}).`
        );
      }

      if (onSuccess) {
        onSuccess(res.result);
      }
      onClose();
    } catch (err: any) {
      notifyError('Dispatch Failed', err?.message || 'Could not dispatch post');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="sigma-modal w-full max-w-xl p-6 md:p-8 space-y-5 rounded-3xl bg-[#0F0E0D] border border-white/10 shadow-2xl relative max-h-[90vh] overflow-y-auto text-zinc-200"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Schedule via Social Hub</span>
                  <Badge variant={status?.mode === 'live' ? 'success' : 'neutral'} size="xs">
                    {status?.mode === 'live' ? 'Live Gateway' : 'Offline Mock'}
                  </Badge>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Multi-channel distribution with automated ledger recording.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Destination Channels */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-300">
              Select Destination Channels ({selectedChannelIds.length} selected)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {channels.map((chan) => {
                const isSelected = selectedChannelIds.includes(chan.id);
                return (
                  <button
                    key={chan.id}
                    type="button"
                    onClick={() => toggleChannel(chan.id)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-amber-500/50 bg-amber-500/10 text-white'
                        : 'border-white/5 bg-white/[0.03] text-zinc-400 hover:border-white/15'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-amber-400 bg-amber-400 text-black'
                          : 'border-zinc-600 bg-transparent'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold truncate capitalize">{chan.name}</div>
                      <div className="text-[10px] text-zinc-500 truncate font-mono">
                        {chan.handle || chan.platform}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Post Content */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-300">
              Post Content / Accompanying Copy
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="sigma-input w-full px-3.5 py-2.5 text-xs font-mono leading-relaxed resize-none rounded-xl bg-black/40 border border-white/10"
              placeholder="Post text with hashtags..."
            />
          </div>

          {/* Media Attachments Preview */}
          {mediaUrls.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs">
              <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5 mb-2">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                Attached Media Assets ({mediaUrls.length})
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {mediaUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="h-14 w-14 rounded-lg border border-white/10 bg-black/50 overflow-hidden shrink-0 flex items-center justify-center text-[10px] text-zinc-500 font-mono"
                  >
                    {url.endsWith('.mp4') ? 'VIDEO' : <img src={url} alt={`attachment-${idx}`} className="h-full w-full object-cover" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Mode & Schedule Time */}
          <div className="space-y-3 pt-1 border-t border-white/10">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActionType('schedule')}
                className={`flex-1 py-1.5 text-xs font-mono font-semibold rounded-lg border transition-all ${
                  actionType === 'schedule'
                    ? 'border-amber-500/60 bg-amber-500/15 text-amber-300'
                    : 'border-white/5 bg-transparent text-zinc-400'
                }`}
              >
                Schedule Slot
              </button>
              <button
                type="button"
                onClick={() => setActionType('draft')}
                className={`flex-1 py-1.5 text-xs font-mono font-semibold rounded-lg border transition-all ${
                  actionType === 'draft'
                    ? 'border-amber-500/60 bg-amber-500/15 text-amber-300'
                    : 'border-white/5 bg-transparent text-zinc-400'
                }`}
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => setActionType('immediate')}
                className={`flex-1 py-1.5 text-xs font-mono font-semibold rounded-lg border transition-all ${
                  actionType === 'immediate'
                    ? 'border-amber-500/60 bg-amber-500/15 text-amber-300'
                    : 'border-white/5 bg-transparent text-zinc-400'
                }`}
              >
                Publish Now
              </button>
            </div>

            {actionType === 'schedule' && (
              <div className="flex items-center gap-2 rounded-xl bg-black/40 border border-white/10 p-2.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <input
                  type="datetime-local"
                  value={scheduleDateTime}
                  onChange={(e) => setScheduleDateTime(e.target.value)}
                  className="bg-transparent text-xs text-white outline-none w-full font-mono"
                />
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <Button variant="secondary" size="md" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              leftIcon={actionType === 'draft' ? <FileEdit className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            >
              {actionType === 'draft'
                ? 'Save Draft'
                : actionType === 'immediate'
                ? 'Publish Now'
                : 'Confirm Schedule'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
