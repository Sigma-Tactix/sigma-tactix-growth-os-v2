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

/**
 * Conservative mock-mode decision: only a confirmed `live` status may be
 * celebrated. unavailable AND an unloaded status (null) are treated as mock —
 * a fresh open of the modal hasn't fetched status yet, and celebrating before
 * knowing is how fake "scheduled" toasts got shipped.
 */
export function shouldTreatAsMock(status: SocialDistributionProviderStatus | null): boolean {
  return status?.mode !== 'live';
}

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
  const { notifySuccess, notifyWarning, notifyError } = useToast();
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

      if (shouldTreatAsMock(status)) throw new Error('Connect a publishing provider first.');
      const res = actionType === 'draft'
        ? await draftSocialPost(payload)
        : actionType === 'immediate'
          ? await publishSocialPost(payload)
          : await scheduleSocialPost(payload);
      if (!res.success || !res.result.success) {
        throw new Error(res.result.error || 'The publishing provider did not accept the post.');
      }
      const confirmed = res.result.status === 'published';
      notifySuccess(
        actionType === 'draft' ? 'Draft saved' : actionType === 'schedule' ? 'Post scheduled' : confirmed ? 'Post published' : 'Post submitted',
        actionType === 'immediate' && !confirmed
          ? 'The provider accepted the post. Publication is awaiting confirmation.'
          : `Provider receipt: ${res.result.id}`
      );

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
      <div className="sigma-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="sigma-modal w-full max-w-xl p-6 md:p-8 space-y-5 relative max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[var(--sigma-border)] pb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-2xl bg-[var(--sigma-primary-subtle)] border border-[var(--sigma-primary)]/30 text-[var(--sigma-primary)] shrink-0">
                <Share2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-[var(--sigma-text)] flex items-center gap-2 flex-wrap">
                  <span>Schedule via Social Hub</span>
                  <Badge variant={status?.mode === 'live' ? 'success' : status === null ? 'neutral' : 'warning'} size="xs">
                    {status === null
                      ? 'Loading status'
                      : status.mode === 'live'
                        ? 'Live Gateway'
                        : 'No provider connected'}
                  </Badge>
                </h3>
                <p className="text-xs text-[var(--sigma-text-muted)] mt-0.5">
                  Multi-channel distribution with ledger recording — scheduled jobs stay queued until a live gateway executes them.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="sigma-icon-button"
              aria-label="Close schedule dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Destination Channels */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[var(--sigma-text-soft)]">
              Select Destination Channels ({selectedChannelIds.length} selected)
            </label>
            {channels.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--sigma-border-strong)] p-4 text-xs text-[var(--sigma-text-muted)] space-y-1">
                <p className="font-medium text-[var(--sigma-text-soft)]">No distribution channels available.</p>
                <p>Channel credentials are not connected yet — open the Social Distribution Gateway in Connector Hub to link LinkedIn or X channels before scheduling.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {channels.map((chan) => {
                  const isSelected = selectedChannelIds.includes(chan.id);
                  return (
                    <button
                      key={chan.id}
                      type="button"
                      onClick={() => toggleChannel(chan.id)}
                      aria-pressed={isSelected}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all min-w-0 ${
                        isSelected
                          ? 'border-[var(--sigma-primary)]/50 bg-[var(--sigma-primary-subtle)] text-[var(--sigma-text)]'
                          : 'border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)] text-[var(--sigma-text-muted)] hover:border-[var(--sigma-border-strong)]'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'border-[var(--sigma-primary)] bg-[var(--sigma-primary)] text-[var(--sigma-inverse-text)]'
                            : 'border-[var(--sigma-border-strong)] bg-transparent'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3 h-3" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold truncate capitalize">{chan.name}</div>
                        <div className="text-[10px] text-[var(--sigma-text-muted)] truncate font-mono">
                          {chan.handle || chan.platform}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Post Content */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[var(--sigma-text-soft)]">
              Post Content / Accompanying Copy
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="sigma-input w-full px-3.5 py-2.5 text-xs font-mono leading-relaxed resize-none rounded-xl"
              placeholder="Post text with hashtags..."
            />
          </div>

          {/* Media Attachments Preview */}
          {mediaUrls.length > 0 && (
            <div className="rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)] p-3 text-xs">
              <span className="text-[11px] font-semibold text-[var(--sigma-text-soft)] flex items-center gap-1.5 mb-2">
                <Layers className="w-3.5 h-3.5 text-amber-accent" />
                Attached Media Assets ({mediaUrls.length})
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {mediaUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="h-14 w-14 rounded-lg border border-[var(--sigma-border-strong)] bg-[var(--sigma-surface)] overflow-hidden shrink-0 flex items-center justify-center text-[10px] text-[var(--sigma-text-muted)] font-mono"
                  >
                    {url.endsWith('.mp4') ? 'VIDEO' : <img src={url} alt={`attachment-${idx}`} className="h-full w-full object-cover" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Mode & Schedule Time */}
          <div className="space-y-3 pt-1 border-t border-[var(--sigma-border)]">
            <div role="tablist" aria-label="Post action" className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                role="tab"
                aria-selected={actionType === 'schedule'}
                onClick={() => setActionType('schedule')}
                className={`flex-1 min-w-24 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  actionType === 'schedule'
                    ? 'border-[var(--sigma-primary)]/50 bg-[var(--sigma-primary-subtle)] text-[var(--sigma-text)]'
                    : 'border-[var(--sigma-border)] text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)]'
                }`}
              >
                Schedule Slot
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={actionType === 'draft'}
                onClick={() => setActionType('draft')}
                className={`flex-1 min-w-24 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  actionType === 'draft'
                    ? 'border-[var(--sigma-primary)]/50 bg-[var(--sigma-primary-subtle)] text-[var(--sigma-text)]'
                    : 'border-[var(--sigma-border)] text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)]'
                }`}
              >
                Save Draft
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={actionType === 'immediate'}
                onClick={() => setActionType('immediate')}
                className={`flex-1 min-w-24 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  actionType === 'immediate'
                    ? 'border-[var(--sigma-primary)]/50 bg-[var(--sigma-primary-subtle)] text-[var(--sigma-text)]'
                    : 'border-[var(--sigma-border)] text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)]'
                }`}
              >
                Publish Now
              </button>
            </div>

            {actionType === 'schedule' && (
              <div className="flex items-center gap-2 rounded-xl bg-[var(--sigma-surface-subtle)] border border-[var(--sigma-border)] p-2.5">
                <Clock className="w-4 h-4 text-amber-accent shrink-0" />
                <input
                  type="datetime-local"
                  aria-label="Schedule date and time"
                  value={scheduleDateTime}
                  onChange={(e) => setScheduleDateTime(e.target.value)}
                  className="bg-transparent text-xs text-[var(--sigma-text)] outline-none w-full min-w-0 font-mono"
                />
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--sigma-border)]">
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
