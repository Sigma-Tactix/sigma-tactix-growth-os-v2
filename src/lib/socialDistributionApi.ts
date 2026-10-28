import { apiFetch } from './api';
import type {
  SocialChannel,
  SocialDistributionProviderStatus,
  SocialPostPayload,
  SocialPublishResult,
} from '../server/providers/socialDistribution/types';

export async function fetchSocialStatus(): Promise<{ success: boolean; status: SocialDistributionProviderStatus }> {
  const res = await apiFetch('/api/social/status');
  if (!res.ok) {
    throw new Error(`Failed to fetch social distribution status: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchSocialChannels(): Promise<{ success: boolean; channels: SocialChannel[] }> {
  const res = await apiFetch('/api/social/channels');
  if (!res.ok) {
    throw new Error(`Failed to fetch social channels: ${res.statusText}`);
  }
  return res.json();
}

export async function scheduleSocialPost(
  payload: SocialPostPayload,
): Promise<{ success: boolean; result: SocialPublishResult }> {
  const res = await apiFetch('/api/social/schedule', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData.error || `Failed to schedule social post: ${res.statusText}`);
  }
  return res.json();
}

export async function draftSocialPost(
  payload: SocialPostPayload,
): Promise<{ success: boolean; result: SocialPublishResult }> {
  const res = await apiFetch('/api/social/draft', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData.error || `Failed to draft social post: ${res.statusText}`);
  }
  return res.json();
}

export async function publishSocialPost(
  payload: SocialPostPayload,
): Promise<{ success: boolean; result: SocialPublishResult }> {
  const res = await apiFetch('/api/social/publish', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData.error || `Failed to publish social post: ${res.statusText}`);
  }
  return res.json();
}
