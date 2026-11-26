import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createReportsRouter } from './reportsRoutes.js';

vi.mock('../../lib/reportSnapshot.js', () => ({
  validateReportSnapshot: vi.fn(),
}));
vi.mock('../../lib/reportArtifactPipeline.js', () => ({
  reportArtifactRepository: {
    storeArtifact: vi.fn(),
    storeBundle: vi.fn(),
    getArtifactForWorkspace: vi.fn(),
  },
  renderSnapshotToPDF: vi.fn(),
  renderSnapshotToPPTX: vi.fn(),
  renderSnapshotToXLSX: vi.fn(),
  generateReportArtifactBundle: vi.fn(),
}));

import { validateReportSnapshot } from '../../lib/reportSnapshot.js';
import {
  reportArtifactRepository,
  renderSnapshotToPDF,
  renderSnapshotToPPTX,
  renderSnapshotToXLSX,
  generateReportArtifactBundle,
} from '../../lib/reportArtifactPipeline.js';

// --- fakes ------------------------------------------------------------------

function makeSb(overrides: any = {}) {
  const from = vi.fn((table: string) => {
    const b: any = {};
    for (const m of ['select', 'order', 'insert', 'delete', 'eq', 'single']) b[m] = () => b;
    b.then = (onF: any) =>
      Promise.resolve(overrides[`from:${table}`] ?? { data: undefined, error: null }).then(onF);
    return b;
  });
  return { from } as any;
}

function makeRes(sb: any, overrides: any = {}) {
  const res: any = {
    statusCode: 200,
    jsonData: null,
    sent: null,
    headers: {} as Record<string, any>,
    locals: { sb, wsId: 'ws-1' },
    ...overrides,
    status(code: number) { res.statusCode = code; return res; },
    json(data: any) { res.jsonData = data; return res; },
    setHeader(k: string, v: any) { res.headers[k] = v; return res; },
    send(body: any) { res.sent = body; return res; },
  };
  return res;
}

function makeReq(overrides: any = {}) {
  return { method: 'GET', url: '/', params: {}, query: {}, body: {}, ...overrides };
}

// Walk every layer of the route stack (the requireModule tier gate on the 4
// gated routes; the download route has none) and await async layers.
async function invoke(router: any, method: string, path: string, req: any, res: any) {
  const layer = router.stack.find((s: any) => s.route?.path === path && s.route?.methods?.[method.toLowerCase()]);
  expect(layer, `route layer for ${method} ${path}`).toBeDefined();
  const stack = layer.route.stack;
  for (let i = 0; i < stack.length; i++) {
    let nextCalled = false;
    const maybeP = stack[i].handle(req, res, () => { nextCalled = true; });
    if (maybeP && typeof maybeP.then === 'function') await maybeP;
    if (!nextCalled) return;
  }
}

const noOpGate = (_req: any, _res: any, next: any) => next();
function makeRouter(sb: any) {
  return createReportsRouter({ requireModule: vi.fn(() => noOpGate) });
}

const validSnapshot = { id: 'snap-1', workspaceId: 'ws-other', metrics: [] } as any;

describe('Reports Routes', () => {
  beforeEach(() => {
    vi.mocked(validateReportSnapshot).mockClear();
    vi.mocked(renderSnapshotToPDF).mockClear();
    vi.mocked(renderSnapshotToPPTX).mockClear();
    vi.mocked(renderSnapshotToXLSX).mockClear();
    vi.mocked(generateReportArtifactBundle).mockClear();
    vi.mocked((reportArtifactRepository as any).storeArtifact).mockClear();
    vi.mocked((reportArtifactRepository as any).storeBundle).mockClear();
    vi.mocked((reportArtifactRepository as any).getArtifactForWorkspace).mockClear();
  });

  it('route shape: the 4 reporting routes carry the tier gate; the artifact download has none (as inline)', () => {
    const router: any = createReportsRouter({ requireModule: vi.fn(() => noOpGate) });
    const layers = router.stack.filter((l: any) => l.route);
    expect(layers).toHaveLength(5);
    const gated = layers.filter((l: any) => l.route.path !== '/reports/artifact/:hash/download');
    expect(gated).toHaveLength(4);
    for (const l of gated) expect(l.route.stack).toHaveLength(2); // [requireModule, handler]
    const download = layers.find((l: any) => l.route.path === '/reports/artifact/:hash/download');
    expect(download.route.stack).toHaveLength(1); // [handler] — no tier gate
  });

  it('the tier gate is always requested with the "reporting" module', () => {
    const requireModule = vi.fn((mod: string) => noOpGate);
    const router = createReportsRouter({ requireModule });
    // the download route has no gate, so exactly 4 gate layers are registered
    const gatedLayers = (router as any).stack.filter(
      (l: any) => l.route && l.route.path !== '/reports/artifact/:hash/download',
    );
    expect(gatedLayers).toHaveLength(4);
    for (const l of gatedLayers) {
      const gate = l.route.stack[0];
      // invoke the gate to prove it delegates to the "reporting" module
      gate.handle({}, {}, () => {});
    }
    expect(requireModule).toHaveBeenCalledTimes(4);
    for (const [a] of vi.mocked(requireModule).mock.calls) expect(a).toBe('reporting');
  });

  it('GET /reports: lists saved_reports ordered by created_at desc; 500 surfaces the supabase error', async () => {
    const sb = makeSb({ 'from:saved_reports': { data: [{ id: 'r1' }, { id: 'r2' }], error: null } });
    let res = makeRes(sb);
    await invoke(makeRouter(sb), 'GET', '/reports', makeReq({ method: 'GET' }), res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toEqual({ success: true, reports: [{ id: 'r1' }, { id: 'r2' }] });

    const sbErr = makeSb({ 'from:saved_reports': { data: null, error: { message: 'RLS denied' } } });
    res = makeRes(sbErr);
    await invoke(makeRouter(sbErr), 'GET', '/reports', makeReq({ method: 'GET' }), res);
    expect(res.statusCode).toBe(500);
    expect(res.jsonData.error).toBe('RLS denied');
  });

  it('POST /reports: 400 without a name; 200 persists with defaults (empty blocks, Last 30 Days)', async () => {
    const sb = makeSb();
    let res = makeRes(sb);
    await invoke(makeRouter(sb), 'POST', '/reports', makeReq({ method: 'POST', body: {} }), res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error).toBe('Report name is required');

    const inserted: any = {};
    const sb2 = makeSb({ 'from:saved_reports': { data: { id: 'r9', ...inserted }, error: null } });
    const sbFromSpy = vi.fn((table: string) => {
      const b: any = {};
      b.select = () => b;
      b.order = () => b;
      b.delete = () => b;
      b.eq = () => b;
      b.insert = vi.fn((payload: any) => { Object.assign(inserted, payload); return b; });
      b.single = vi.fn(() => b);
      b.then = (onF: any) => Promise.resolve({ data: { id: 'r9' }, error: null }).then(onF);
      return b;
    });
    const sb3: any = { from: sbFromSpy };
    res = makeRes(sb3, { locals: { sb: sb3, wsId: 'ws-1' } });
    await invoke(createReportsRouter({ requireModule: vi.fn(() => noOpGate) }), 'POST', '/reports',
      makeReq({ method: 'POST', body: { name: '  Q2 Review  ' } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toEqual({ success: true, report: { id: 'r9' } });
    expect(inserted).toEqual({ workspace_id: 'ws-1', name: 'Q2 Review', blocks: [], date_range: 'Last 30 Days' });
  });

  it('DELETE /reports/:id: deletes by id (RLS scopes the workspace); 500 surfaces the error', async () => {
    const sb = makeSb();
    let res = makeRes(sb);
    await invoke(makeRouter(sb), 'DELETE', '/reports/:id', makeReq({ method: 'DELETE', params: { id: 'r1' } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toEqual({ success: true });

    const sbErr = makeSb({ 'from:saved_reports': { data: null, error: { message: 'not found' } } });
    res = makeRes(sbErr);
    await invoke(makeRouter(sbErr), 'DELETE', '/reports/:id', makeReq({ method: 'DELETE', params: { id: 'r1' } }), res);
    expect(res.statusCode).toBe(500);
    expect(res.jsonData.error).toBe('not found');
  });

  it('POST /reports/snapshot/render: the 4 format branches each persist + answer with the download URL', async () => {
    vi.mocked(validateReportSnapshot).mockReturnValue(validSnapshot);
    vi.mocked(generateReportArtifactBundle).mockResolvedValueOnce({
      bundleHash: 'b-1', snapshotId: 'snap-1',
      pdf: { artifactHash: 'h-pdf', byteSize: 1, filename: 'r.pdf' },
      pptx: { artifactHash: 'h-pptx', byteSize: 2, filename: 'r.pptx' },
      xlsx: { artifactHash: 'h-xlsx', byteSize: 3, filename: 'r.xlsx' },
    } as any);
    vi.mocked(renderSnapshotToPPTX).mockResolvedValueOnce({
      artifactHash: 'h-p', byteSize: 9, filename: 'deck.pptx', metadata: { slideCount: 7 },
    } as any);
    vi.mocked(renderSnapshotToXLSX).mockResolvedValueOnce({
      artifactHash: 'h-x', byteSize: 8, filename: 'book.xlsx', metadata: { sheetCount: 4 },
    } as any);
    vi.mocked(renderSnapshotToPDF).mockResolvedValueOnce({
      artifactHash: 'h-d', byteSize: 7, filename: 'rep.pdf', metadata: { pageCount: 3 },
    } as any);
    const sb = makeSb();

    // bundle
    let res = makeRes(sb);
    await invoke(makeRouter(sb), 'POST', '/reports/snapshot/render',
      makeReq({ method: 'POST', body: { snapshot: validSnapshot, format: 'bundle' } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toMatchObject({
      success: true,
      bundleHash: 'b-1',
      artifacts: {
        pdf: { downloadUrl: '/api/workspace/reports/artifact/h-pdf/download' },
        pptx: { downloadUrl: '/api/workspace/reports/artifact/h-pptx/download' },
        xlsx: { downloadUrl: '/api/workspace/reports/artifact/h-xlsx/download' },
      },
    });
    expect((reportArtifactRepository as any).storeBundle).toHaveBeenCalledWith(expect.objectContaining({ bundleHash: 'b-1' }));

    // pptx
    res = makeRes(sb);
    await invoke(makeRouter(sb), 'POST', '/reports/snapshot/render',
      makeReq({ method: 'POST', body: { snapshot: validSnapshot, format: 'pptx', brand: 'acme' } }), res);
    expect(res.jsonData).toMatchObject({ format: 'pptx', slideCount: 7, artifactHash: 'h-p' });
    expect((reportArtifactRepository as any).storeArtifact).toHaveBeenCalledWith(expect.objectContaining({ artifactHash: 'h-p' }), 'ws-1', 'snap-1');

    // xlsx
    res = makeRes(sb);
    await invoke(makeRouter(sb), 'POST', '/reports/snapshot/render',
      makeReq({ method: 'POST', body: { snapshot: validSnapshot, format: 'xlsx' } }), res);
    expect(res.jsonData).toMatchObject({ format: 'xlsx', sheetCount: 4 });

    // default (no format) → PDF
    res = makeRes(sb);
    await invoke(makeRouter(sb), 'POST', '/reports/snapshot/render',
      makeReq({ method: 'POST', body: { snapshot: validSnapshot } }), res);
    expect(res.jsonData).toMatchObject({ format: 'pdf', pageCount: 3, downloadUrl: '/api/workspace/reports/artifact/h-d/download' });
    expect(renderSnapshotToPDF).toHaveBeenCalledWith(validSnapshot, undefined);
  });

  it('POST /reports/snapshot/render: an invalid snapshot is an honest 400, nothing stored', async () => {
    vi.mocked(validateReportSnapshot).mockImplementation(() => { throw new Error('snapshot missing required metrics'); });
    const sb = makeSb();
    const res = makeRes(sb);
    await invoke(makeRouter(sb), 'POST', '/reports/snapshot/render',
      makeReq({ method: 'POST', body: { snapshot: { bogus: true }, format: 'pdf' } }), res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error).toBe('snapshot missing required metrics');
    expect((reportArtifactRepository as any).storeArtifact).not.toHaveBeenCalled();
    expect((reportArtifactRepository as any).storeBundle).not.toHaveBeenCalled();
  });

  it('GET /reports/artifact/:hash/download: 404 not_found, 403 forbidden, 200 streams with attachment headers', async () => {
    const sb = makeSb();
    vi.mocked((reportArtifactRepository as any).getArtifactForWorkspace).mockReset();

    vi.mocked((reportArtifactRepository as any).getArtifactForWorkspace)
      .mockReturnValue({ status: 'not_found', error: 'Unknown artifact hash' } as any);
    let res = makeRes(sb);
    await invoke(makeRouter(sb), 'GET', '/reports/artifact/:hash/download',
      makeReq({ method: 'GET', params: { hash: 'h-x' } }), res);
    expect(res.statusCode).toBe(404);
    expect(res.jsonData).toEqual({ error: 'Unknown artifact hash' });

    vi.mocked((reportArtifactRepository as any).getArtifactForWorkspace)
      .mockReturnValue({ status: 'forbidden', error: 'Artifact belongs to another workspace' } as any);
    res = makeRes(sb);
    await invoke(makeRouter(sb), 'GET', '/reports/artifact/:hash/download',
      makeReq({ method: 'GET', params: { hash: 'h-x' } }), res);
    expect(res.statusCode).toBe(403);

    const buffer = Buffer.from('%PDF-1.4');
    vi.mocked((reportArtifactRepository as any).getArtifactForWorkspace)
      .mockReturnValue({
        status: 'ok' as any,
        artifact: { mime: 'application/pdf', filename: 'rep.pdf', byteSize: buffer.length, buffer },
      } as any);
    res = makeRes(sb);
    await invoke(makeRouter(sb), 'GET', '/reports/artifact/:hash/download',
      makeReq({ method: 'GET', params: { hash: 'h-d' } }), res);
    expect(res.sent).toBe(buffer);
    expect(res.headers['Content-Type']).toBe('application/pdf');
    expect(res.headers['Content-Disposition']).toBe('attachment; filename="rep.pdf"');
    expect(res.headers['Content-Length']).toBe(buffer.length);
    // the workspace id comes from the authenticated res.locals
    expect((reportArtifactRepository as any).getArtifactForWorkspace).toHaveBeenLastCalledWith('h-d', 'ws-1');

    // no authenticated workspace → the ?workspaceId query fallback is used
    vi.mocked((reportArtifactRepository as any).getArtifactForWorkspace).mockReset();
    vi.mocked((reportArtifactRepository as any).getArtifactForWorkspace)
      .mockReturnValue({
        status: 'ok' as any,
        artifact: { mime: 'text/plain', filename: 'a.txt', byteSize: 1, buffer: Buffer.from('a') },
      } as any);
    const resNoWs = makeRes(makeSb(), { locals: { sb: makeSb(), wsId: '' } });
    await invoke(makeRouter(resNoWs.locals.sb), 'GET', '/reports/artifact/:hash/download',
      makeReq({ method: 'GET', params: { hash: 'h-e' }, query: { workspaceId: 'ws-q' } }), resNoWs);
    expect((reportArtifactRepository as any).getArtifactForWorkspace).toHaveBeenLastCalledWith('h-e', 'ws-q');
  });
});
