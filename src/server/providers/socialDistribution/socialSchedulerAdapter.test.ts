import { afterEach, describe, expect, it, vi } from 'vitest';
import { SocialSchedulerAdapter } from './socialSchedulerAdapter.js';
const linkedIn = { id: 'li', identifier: 'linkedin-page', name: 'Company page' };
const instagram = { id: 'ig', identifier: 'instagram-standalone', name: 'Instagram' };
const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6ZBsAAAAASUVORK5CYII=';
const adapter = () => new SocialSchedulerAdapter({ apiKey: 'fixture-key', apiUrl: 'https://postiz.example/public/v1' });
afterEach(() => vi.unstubAllGlobals());
function responses(...data: unknown[]) {
  const mock = vi.fn();
  for (const value of data) mock.mockResolvedValueOnce(Response.json(value));
  vi.stubGlobal('fetch', mock); return mock;
}

describe('Postiz public API contract', () => {
  it('has no sample connections when unconfigured', async () => {
    const provider = new SocialSchedulerAdapter({ apiKey: '' });
    expect(await provider.getStatus()).toMatchObject({ configured: false, active: false, mode: 'unavailable', connectedChannelsCount: 0 });
    expect(await provider.getChannels()).toEqual([]);
  });
  it.each(['createDraft', 'schedulePost', 'publishNow'] as const)('rejects %s without credentials', async method => {
    await expect(new SocialSchedulerAdapter({ apiKey: '' })[method]({ content: 'Fixture', channels: ['li'], scheduledFor: '2099-01-01T12:00:00Z' })).rejects.toThrow('Connect a social');
  });
  it('counts only supported, enabled connections', async () => {
    responses([linkedIn, { ...instagram, disabled: true }, { id: 'x', identifier: 'x' }]);
    expect(await adapter().getStatus()).toMatchObject({ active: true, connectedChannelsCount: 1 });
  });
  it('maps actual provider identifiers and disabled state', async () => {
    responses([linkedIn, { ...instagram, disabled: true }]);
    expect(await adapter().getChannels()).toMatchObject([{ id: 'li', platform: 'linkedin', connected: true }, { id: 'ig', platform: 'instagram', connected: false }]);
  });
  it('sends the documented API-key header and post shape, retaining the provider receipt', async () => {
    const mock = responses([linkedIn], [{ postId: 'receipt-li', integration: 'li' }]);
    const result = await adapter().schedulePost({ content: 'Fixture', channels: ['li'], scheduledFor: '2099-01-01T12:00:00Z' });
    expect(result).toMatchObject({ success: true, status: 'scheduled', id: 'receipt-li' });
    expect(mock.mock.calls[1][0]).toBe('https://postiz.example/public/v1/posts');
    expect(mock.mock.calls[1][1].headers.Authorization).toBe('fixture-key');
    expect(JSON.parse(mock.mock.calls[1][1].body)).toMatchObject({ type: 'schedule', date: '2099-01-01T12:00:00Z', posts: [{ integration: { id: 'li' }, value: [{ content: 'Fixture', image: [] }], settings: { __type: 'linkedin-page' } }] });
  });
  it('keeps immediate acceptance pending until publication is observed', async () => {
    responses([linkedIn], [{ postId: 'receipt-li', integration: 'li' }]);
    expect(await adapter().publishNow({ content: 'Fixture', channels: ['li'] })).toMatchObject({ success: true, status: 'queued', channelResults: [{ status: 'pending', postId: 'receipt-li' }] });
  });
  it('uses draft mode for drafts', async () => {
    const mock = responses([linkedIn], [{ postId: 'draft-li', integration: 'li' }]);
    expect((await adapter().createDraft({ content: 'Fixture', channels: ['li'] })).status).toBe('drafted');
    expect(JSON.parse(mock.mock.calls[1][1].body).type).toBe('draft');
  });
  it('uploads a generated image before creating an Instagram post', async () => {
    const mock = responses([instagram], { id: 'media-id', path: 'https://uploads.postiz.com/image.png' }, [{ postId: 'receipt-ig', integration: 'ig' }]);
    const result = await adapter().publishNow({ content: 'Fixture', channels: ['ig'], media: [{ url: `data:image/png;base64,${png}`, type: 'image', altText: 'Product' }] });
    expect(result.success).toBe(true);
    expect(mock.mock.calls[1][0]).toBe('https://postiz.example/public/v1/upload');
    expect(mock.mock.calls[1][1].body).toBeInstanceOf(FormData);
    expect(JSON.parse(mock.mock.calls[2][1].body)).toMatchObject({ type: 'now', posts: [{ settings: { __type: 'instagram-standalone', post_type: 'post' }, value: [{ image: [{ id: 'media-id', path: 'https://uploads.postiz.com/image.png', alt: 'Product' }] }] }] });
  });
  it('uploads public media URLs before sending their provider IDs', async () => {
    const mock = responses([linkedIn], { id: 'media-id', path: 'https://uploads.postiz.com/image.png' }, [{ postId: 'receipt-li', integration: 'li' }]);
    expect((await adapter().publishNow({ content: 'Fixture', channels: ['li'], media: [{ url: 'https://cdn.example/image.png', type: 'image' }] })).success).toBe(true);
    expect(mock.mock.calls[1][0]).toBe('https://postiz.example/public/v1/upload-from-url');
  });
  it.each([{ connections: [{ ...linkedIn, disabled: true }] }, { connections: [] }])('does not post to missing or disabled connections: %j', async ({ connections }) => {
    const mock = responses(connections);
    expect((await adapter().publishNow({ content: 'Fixture', channels: ['li'] })).success).toBe(false);
    expect(mock).toHaveBeenCalledTimes(1);
  });
  it('requires media for Instagram', async () => {
    const mock = responses([instagram]);
    expect((await adapter().publishNow({ content: 'Fixture', channels: ['ig'] })).error).toContain('require an image');
    expect(mock).toHaveBeenCalledTimes(1);
  });
  it('rejects an empty or malformed receipt', async () => {
    responses([linkedIn], {});
    expect((await adapter().publishNow({ content: 'Fixture', channels: ['li'] })).error).toContain('no complete receipt');
  });
  it('preserves partial provider receipts without claiming complete success', async () => {
    responses([linkedIn, { id: 'li-two', identifier: 'linkedin' }], [{ postId: 'receipt-li', integration: 'li' }]);
    const result = await adapter().publishNow({ content: 'Fixture', channels: ['li', 'li-two'] });
    expect(result.success).toBe(false); expect(result.channelResults[0]).toMatchObject({ status: 'pending', postId: 'receipt-li' });
    expect(result.channelResults[1].status).toBe('failed');
  });
  it('does not expose provider error bodies or fabricate connections on errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => new Response('private upstream detail', { status: 401 })));
    expect(await adapter().getChannels()).toEqual([]);
    expect(await adapter().getStatus()).toMatchObject({ active: false, connectedChannelsCount: 0 });
    expect((await adapter().publishNow({ content: 'Fixture', channels: ['li'] })).error).toBe('Social scheduler responded with HTTP 401.');
  });
  it('rejects past schedules and empty selections without a request', async () => {
    const mock = responses();
    await expect(adapter().schedulePost({ content: 'Fixture', channels: ['li'], scheduledFor: '2020-01-01T00:00:00Z' })).rejects.toThrow('future');
    await expect(adapter().publishNow({ content: 'Fixture', channels: [] })).rejects.toThrow('Select a connected');
    expect(mock).not.toHaveBeenCalled();
  });
});
