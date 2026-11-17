import { apiFetch } from './api';
import { describe, expect, it, vi } from 'vitest';
import {
  shouldUseVantaWebResearch,
  streamVantaMessage,
  deleteVantaLocalFile,
  inspectVantaLocalFile,
} from './vantaApi';

vi.mock('./api', () => ({ apiFetch: vi.fn() }));

describe('VANTA local file management', () => {
  it('calls DELETE /api/workspace/vanta/local-context/:id', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(new Response(JSON.stringify({ success: true, removed: 'test-id' })));
    await expect(deleteVantaLocalFile('test-id')).resolves.toBeUndefined();
    expect(apiFetch).toHaveBeenCalledWith('/api/workspace/vanta/local-context/test-id', { method: 'DELETE' });
  });

  it('calls GET /api/workspace/vanta/local-context/:id and returns file metadata', async () => {
    const payload = { id: 'test-id', name: 'sample.txt', size: 100, snippet: 'Hello', expiresAt: 123456789 };
    vi.mocked(apiFetch).mockResolvedValueOnce(new Response(JSON.stringify(payload)));
    const res = await inspectVantaLocalFile('test-id');
    expect(res).toEqual(payload);
    expect(apiFetch).toHaveBeenCalledWith('/api/workspace/vanta/local-context/test-id');
  });
});

describe('VANTA response stream', () => {
  it('fails clearly when the connection closes before a completed reply', async () => {
    vi.mocked(apiFetch).mockResolvedValue(new Response('event: state\ndata: {"phase":"thinking"}\n\n'));
    await expect(streamVantaMessage('one', 'hello', [], {})).rejects.toThrow('before a reply');
  });
  it('delivers retrieval status and a completed message across split frames', async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('event: retrieval\ndata: {"count":2,"method":"semantic"}\n'));
        controller.enqueue(encoder.encode('\nevent: message\ndata: {"id":"reply","content":"answer"}\n\n'));
        controller.close();
      }
    });
    vi.mocked(apiFetch).mockResolvedValue(new Response(body));
    const onRetrieval = vi.fn(), onMessage = vi.fn();
    await streamVantaMessage('one', 'hello', [], { onRetrieval, onMessage });
    expect(onRetrieval).toHaveBeenCalledWith({ count: 2, method: 'semantic' });
    expect(onMessage).toHaveBeenCalledWith({ id: 'reply', content: 'answer' });
  });
});

describe('VANTA web research routing', () => {
  it('does not route document citation requests to the web', () => {
    expect(shouldUseVantaWebResearch('Summarize Second Brain documents with citations.')).toBe(false);
  });

  it('keeps workspace-only questions inside workspace evidence', () => {
    expect(shouldUseVantaWebResearch('Summarize the current Sigma workspace evidence.')).toBe(false);
  });

  it('enables web research only when the request explicitly calls for external research', () => {
    expect(shouldUseVantaWebResearch('Search the web for recent news and include citations.')).toBe(true);
    expect(shouldUseVantaWebResearch('Use online sources for this comparison.')).toBe(true);
  });
});
