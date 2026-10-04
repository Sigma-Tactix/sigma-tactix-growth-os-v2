import { apiFetch } from './api';
import type { VantaMessage, VantaProviderStatus } from './vanta';
import type { AgentTask } from '../types';

export interface VantaConversationSummary {
  id: string;
  title: string;
  visibility: 'private' | 'workspace';
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface VantaStreamHandlers {
  onState?: (phase: string) => void;
  onDelta?: (text: string) => void;
  onMessage?: (message: VantaMessage & { memorySuggestion?: string; topologyEntityIds?: string[] }) => void;
}

export function shouldUseVantaWebResearch(content: string): boolean {
  return /\b(search (?:the )?web|search online|web research|internet research|latest news|recent news|online sources?|web sources?|citations?)\b/i.test(content);
}

async function jsonOrThrow<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `VANTA request failed (${response.status})`);
  return data as T;
}

export async function getVantaStatus(): Promise<VantaProviderStatus> {
  return jsonOrThrow(await apiFetch('/api/workspace/vanta/status'));
}

export async function verifyVantaTextProvider(): Promise<void> {
  await jsonOrThrow(await apiFetch('/api/workspace/vanta/provider/verify', { method: 'POST' }));
}

export interface VantaVoiceSettings {
  provider: 'gemini' | 'local';
  baseUrl?: string;
  sttModel?: string;
  ttsModel?: string;
  voice?: string;
  verified?: boolean;
  verifiedAt?: string | null;
}

export async function getVantaVoiceSettings(): Promise<VantaVoiceSettings> {
  const data = await jsonOrThrow<{ voice: VantaVoiceSettings }>(await apiFetch('/api/workspace/vanta/settings'));
  return data.voice;
}

export async function saveVantaVoiceSettings(settings: VantaVoiceSettings): Promise<void> {
  await jsonOrThrow(await apiFetch('/api/workspace/vanta/settings/voice', { method: 'PUT', body: JSON.stringify(settings) }));
}

export async function verifyVantaVoiceProvider(): Promise<void> {
  await jsonOrThrow(await apiFetch('/api/workspace/vanta/voice/verify', { method: 'POST' }));
}

export async function createVantaConversation(title?: string): Promise<VantaConversationSummary> {
  const data = await jsonOrThrow<{ conversation: VantaConversationSummary }>(await apiFetch('/api/workspace/vanta/conversations', {
    method: 'POST', body: JSON.stringify(title ? { title } : {}),
  }));
  return data.conversation;
}

export async function listVantaConversations(): Promise<VantaConversationSummary[]> {
  const data = await jsonOrThrow<{ conversations: VantaConversationSummary[] }>(await apiFetch('/api/workspace/vanta/conversations'));
  return data.conversations;
}

export async function shareVantaConversation(conversationId: string, shared: boolean): Promise<void> {
  await jsonOrThrow(await apiFetch(`/api/workspace/vanta/conversations/${conversationId}/share`, {
    method: 'PATCH', body: JSON.stringify({ shared }),
  }));
}

export async function deleteVantaConversation(conversationId: string): Promise<void> {
  await jsonOrThrow(await apiFetch(`/api/workspace/vanta/conversations/${conversationId}`, { method: 'DELETE' }));
}

export async function getVantaMessages(conversationId: string): Promise<VantaMessage[]> {
  const data = await jsonOrThrow<{ messages: Array<any> }>(await apiFetch(`/api/workspace/vanta/conversations/${conversationId}/messages`));
  return data.messages.map(message => ({
    id: message.id,
    conversationId: message.conversation_id,
    role: message.role,
    content: message.content,
    evidence: message.evidence || [],
    proposal: message.proposal || undefined,
    createdAt: message.created_at,
  }));
}

export async function streamVantaMessage(
  conversationId: string,
  content: string,
  localContextIds: string[],
  handlers: VantaStreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const response = await apiFetch(`/api/workspace/vanta/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content, localContextIds, useWeb: shouldUseVantaWebResearch(content) }),
    signal,
  });
  if (!response.ok || !response.body) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'VANTA response stream is unavailable.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split('\n\n');
    buffer = frames.pop() || '';
    for (const frame of frames) {
      let event = 'message';
      let data = '';
      for (const line of frame.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        if (line.startsWith('data:')) data += line.slice(5).trim();
      }
      if (!data) continue;
      const payload = JSON.parse(data);
      if (event === 'state') handlers.onState?.(payload.phase);
      if (event === 'text-delta') handlers.onDelta?.(payload.text);
      if (event === 'message') handlers.onMessage?.(payload);
      if (event === 'error') throw new Error(payload.error || 'VANTA request failed.');
    }
  }
}

export async function attachVantaLocalFiles(files: File[]): Promise<Array<{ id: string; name: string; size: number }>> {
  const form = new FormData();
  files.forEach(file => form.append('files', file));
  const data = await jsonOrThrow<{ attached: Array<{ id: string; name: string; size: number }> }>(
    await apiFetch('/api/workspace/vanta/local-context', { method: 'POST', body: form }),
  );
  return data.attached;
}

export async function transcribeVantaAudio(blob: Blob): Promise<string> {
  const form = new FormData();
  form.append('audio', blob, 'vanta-request.webm');
  const data = await jsonOrThrow<{ transcript: string }>(
    await apiFetch('/api/workspace/vanta/voice/transcribe', { method: 'POST', body: form }),
  );
  return data.transcript;
}

export async function synthesizeVantaSpeech(text: string): Promise<{ audioBase64: string; mimeType: string }> {
  return jsonOrThrow(await apiFetch('/api/workspace/vanta/voice/speak', {
    method: 'POST', body: JSON.stringify({ text }),
  }));
}

export async function saveVantaMemory(content: string, sourceMessageId?: string): Promise<void> {
  await jsonOrThrow(await apiFetch('/api/workspace/vanta/memories', {
    method: 'POST', body: JSON.stringify({ content, sourceMessageId, shared: false }),
  }));
}

export async function dispatchVantaProposal(proposal: NonNullable<VantaMessage['proposal']>): Promise<{ task: AgentTask; dispatchPlan: Record<string, unknown> }> {
  return jsonOrThrow(await apiFetch('/api/workspace/missions/dispatch', {
    method: 'POST',
    body: JSON.stringify({ proposal }),
  }));
}
