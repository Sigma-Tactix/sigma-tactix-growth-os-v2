export type SocialPlatform =
  | 'linkedin'
  | 'twitter'
  | 'instagram'
  | 'youtube'
  | 'threads'
  | 'bluesky'
  | 'facebook'
  | 'tiktok'
  | 'pinterest'
  | 'webhook';

export interface SocialChannel {
  id: string;
  name: string;
  platform: SocialPlatform;
  handle?: string;
  avatarUrl?: string;
  connected: boolean;
  status: 'active' | 'expired' | 'rate_limited' | 'error';
}

export interface SocialPostMedia {
  url: string;
  type: 'image' | 'video' | 'document';
  thumbnailUrl?: string;
  altText?: string;
}

export interface SocialPostPayload {
  content: string;
  channels: string[];
  media?: SocialPostMedia[];
  title?: string;
  scheduledFor?: string; // ISO 8601
  campaignId?: string;
  missionId?: string;
  requiresApproval?: boolean;
  tags?: string[];
}

export interface ChannelPublishOutcome {
  channelId: string;
  platform: SocialPlatform;
  status: 'success' | 'pending' | 'failed';
  postId?: string;
  postUrl?: string;
  error?: string;
}

export interface SocialPublishResult {
  success: boolean;
  id: string;
  status: 'published' | 'queued' | 'scheduled' | 'drafted' | 'failed';
  scheduledFor?: string;
  targetChannels: string[];
  channelResults: ChannelPublishOutcome[];
  error?: string;
  timestamp: string;
}

export interface SocialDistributionProviderStatus {
  configured: boolean;
  active: boolean;
  endpointUrl?: string;
  connectedChannelsCount: number;
  supportedPlatforms: SocialPlatform[];
  mode: 'live' | 'unavailable';
}

export interface SocialDistributionProvider {
  getStatus(): Promise<SocialDistributionProviderStatus>;
  getChannels(): Promise<SocialChannel[]>;
  createDraft(payload: SocialPostPayload): Promise<SocialPublishResult>;
  schedulePost(payload: SocialPostPayload): Promise<SocialPublishResult>;
  publishNow(payload: SocialPostPayload): Promise<SocialPublishResult>;
}
