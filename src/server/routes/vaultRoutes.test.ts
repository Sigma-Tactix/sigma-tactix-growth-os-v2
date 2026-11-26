import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createVaultRouter } from './vaultRoutes.js';

// --- multer: the shared instance is a real middleware; stand it in so tests
// --- can inject a file (or none) per request.
let fileFixture: any = null;
vi.mock('../multerUpload.js', () => ({
  upload: {
    single: () => (_req: any, _res: any, next: any) => {
      if (fileFixture) _req.file = fileFixture;
      next();
    },
  },
}));
vi.mock('../../lib/secondBrainDocuments.js', () => ({
  canonicalDocumentVaultId: vi.fn((v: string) => (v === 'brand' ? 'brandVault' : v === 'general' ? 'marketingVault' : v)),
}));
vi.mock('../../lib/rag.js', () => ({
  saveDocument: vi.fn(),
  searchDocuments: vi.fn(),
}));

import { canonicalDocumentVaultId } from '../../lib/secondBrainDocuments.js';
import { saveDocument, searchDocuments } from '../../lib/rag.js';

// --- fakes -----------------------------------------------------------------

function makeDb(overrides: any = {}) {
  return {
    settings: {},
    secondBrain: { uploadedFiles: [] },
    ...overrides,
  } as any;
}

function makeDeps(db: any, overrides: any = {}) {
  return {
    getDB: vi.fn(async () => db),
    saveDB: vi.fn(async () => {}),
    getGeminiClient: vi.fn(() => ({ models: { generateContent: async () => ({ text: '{}' }) } })),
    resolveEffectiveGeminiKey: vi.fn(async () => undefined),
    ...overrides,
  };
}

function makeSb(overrides: any = {}) {
  const storageTable: any[] = [];
  const storage = {
    from: vi.fn((bucket: string) => ({
      upload: vi.fn(async (_p: string, _b: any, _o: any) => ({ error: null })),
      createSignedUrl: vi.fn(async () => ({ data: { signedUrl: 'https://signed.example/f' }, error: null })),
      remove: vi.fn(async () => ({ error: null })),
    })),
  };
  const from = vi.fn((table: string) => {
    const b: any = {};
    for (const m of ['select', 'eq', 'order', 'maybeSingle', 'delete', 'limit', 'insert', 'update']) b[m] = () => b;
    b.then = (onF: any, onR: any) =>
      Promise.resolve(
        overrides[`from:${table}`] ?? { data: table === 'documents' ? [] : undefined, error: null },
      ).then(onF, onR);
    return b;
  });
  const sb: any = { storage, from, _storageTable: storageTable };
  return sb;
}

function makeRes(sb: any, wsId = 'ws-1') {
  const res: any = {
    statusCode: 200,
    jsonData: null,
    locals: { sb, wsId, userId: 'user-1' },
    status(code: number) { res.statusCode = code; return res; },
    json(data: any) { res.jsonData = data; return res; },
  };
  return res;
}

function makeFile(name = 'note.txt', content = 'hello world', overrides: any = {}) {
  return {
    originalname: name,
    buffer: Buffer.from(content, 'utf8'),
    size: Buffer.byteLength(content, 'utf8'),
    mimetype: 'text/plain',
    ...overrides,
  };
}

// Routes carry the multer middleware as their first layer; walk the whole
// route stack and await async layers (same convention as the other routers).
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

describe('Vault Routes', () => {
  beforeEach(() => {
    fileFixture = null;
    vi.mocked(canonicalDocumentVaultId).mockClear();
    vi.mocked(saveDocument).mockClear();
    vi.mocked(searchDocuments).mockClear();
    process.env.GEMINI_API_KEY = '';
  });

  it('POST /settings/skills/upload: the 400 ladder, then a 200 that persists the skill content', async () => {
    const db = makeDb();
    const sb = makeSb();
    const deps = makeDeps(db);
    const router = createVaultRouter(deps);
    const req = { method: 'POST', url: '/settings/skills/upload', params: {}, body: {}, query: {} };

    fileFixture = null;
    let res = makeRes(sb);
    await invoke(router, 'POST', '/settings/skills/upload', req, res);
    expect(res.statusCode).toBe(400); // no file

    fileFixture = makeFile();
    res = makeRes(sb);
    await invoke(router, 'POST', '/settings/skills/upload', { ...req, body: {} }, res);
    expect(res.statusCode).toBe(400); // no moduleKey

    fileFixture = makeFile('skill.pdf', 'x');
    res = makeRes(sb);
    await invoke(router, 'POST', '/settings/skills/upload', { ...req, body: { moduleKey: 'agents' } }, res);
    expect(res.statusCode).toBe(400); // not .md/.txt

    fileFixture = makeFile('skill.md', '   ');
    res = makeRes(sb);
    await invoke(router, 'POST', '/settings/skills/upload', { ...req, body: { moduleKey: 'agents' } }, res);
    expect(res.statusCode).toBe(400); // empty

    fileFixture = makeFile('brief.md', '# Lead brief');
    res = makeRes(sb);
    await invoke(router, 'POST', '/settings/skills/upload', { ...req, body: { moduleKey: 'agents', name: 'My Skill' } }, res);
    expect(res.statusCode).toBe(200);
    const skill = db.settings.skills[0];
    expect(skill.name).toBe('My Skill');
    expect(skill.content).toBe('# Lead brief');
    expect(skill.moduleKey).toBe('agents');
    expect(skill.fileName).toBe('brief.md');
    expect(deps.saveDB).toHaveBeenCalled();
  });

  it('POST /vault/upload: 415 for quarantined spreadsheets, 409 on duplicate sha256, 500 on storage error', async () => {
    const sb = makeSb();
    const req = { method: 'POST', url: '/vault/upload', params: {}, body: { vaultId: 'brand' }, query: {} };

    fileFixture = null;
    const db = makeDb();
    const router = createVaultRouter(makeDeps(db));
    let res = makeRes(sb);
    await invoke(router, 'POST', '/vault/upload', req, res);
    expect(res.statusCode).toBe(400);

    fileFixture = makeFile('book.xlsx', 'x', { mimetype: 'application/vnd.ms-excel' });
    res = makeRes(sb);
    await invoke(router, 'POST', '/vault/upload', req, res);
    expect(res.statusCode).toBe(415);
    expect(res.jsonData.code).toBe('SPREADSHEET_INGESTION_QUARANTINED');

    // duplicate detection: same content → same sha256
    fileFixture = makeFile('same.txt', 'dup-content');
    const dbDup = makeDb();
    dbDup.secondBrain.uploadedFiles = [{ sha256: require('crypto').createHash('sha256').update('dup-content').digest('hex'), id: 'f-0' }];
    res = makeRes(sb);
    await invoke(createVaultRouter(makeDeps(dbDup)), 'POST', '/vault/upload', req, res);
    expect(res.statusCode).toBe(409);
    expect(res.jsonData.code).toBe('DUPLICATE_FILE');

    fileFixture = makeFile('doc.txt', 'brand text');
    const dbOk = makeDb();
    vi.mocked(canonicalDocumentVaultId).mockImplementation((v: string) => (v === 'brand' ? 'brandVault' : v));
    res = makeRes(sb);
    await invoke(createVaultRouter(makeDeps(dbOk)), 'POST', '/vault/upload', req, res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.file.vaultId).toBe('brandVault');
    expect(res.jsonData.file.status).toBe('Processing'); // no RAG doc in this fake
    expect(res.jsonData.file.sha256).toHaveLength(64);
  });

  it('POST /vault/upload: a saved RAG document flips status to Indexed/Stored', async () => {
    const sb = makeSb();
    const db = makeDb();
    vi.mocked(saveDocument).mockResolvedValueOnce('doc-1');
    // the `documents` read after saveDocument: first call returns no row (not yet embedded)
    sb.from.mockImplementation((table: string) => {
      const b: any = {};
      for (const m of ['select', 'eq', 'order', 'maybeSingle']) b[m] = () => b;
      b.then = (onF: any) => Promise.resolve({ data: table === 'documents' ? { embedding: null } : undefined, error: null }).then(onF);
      return b;
    });
    const res = makeRes(sb);
    fileFixture = makeFile('plan.md', 'plan text');
    await invoke(createVaultRouter(makeDeps(db)), 'POST', '/vault/upload', { method: 'POST', url: '/vault/upload', params: {}, body: { vaultId: 'general' }, query: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.file.status).toBe('Stored'); // doc saved, embedding not yet
    expect(saveDocument).toHaveBeenCalledTimes(1);
    expect(vi.mocked(saveDocument).mock.calls[0][1].sourceModule).toBe('brain_upload');
  });

  it('GET /vault/documents: maps rows + joins the uploaded-file record', async () => {
    const sb = makeSb();
    sb.from.mockImplementation(() => {
      const b: any = {};
      for (const m of ['select', 'eq', 'order']) b[m] = () => b;
      b.then = (onF: any) => Promise.resolve({
        data: [
          { id: 'd1', vault_id: 'brandVault', source_module: 'brain_upload', file_name: 'a.txt', storage_path: 's/a', mime_type: 'text/plain', size_bytes: 3, content_text: 'x', embedding: [1], created_at: '2026-01-01' },
          { id: 'd2', vault_id: 'brandVault', source_module: 'connector', file_name: 'b.txt', storage_path: 's/b', mime_type: 'text/plain', size_bytes: 3, content_text: 'y', embedding: null, created_at: '2026-01-02' },
        ],
        error: null,
      }).then(onF);
      return b;
    });
    const db = makeDb();
    db.secondBrain.uploadedFiles = [{ id: 'f-9', documentId: 'd2' }];
    const res = makeRes(sb);
    await invoke(createVaultRouter(makeDeps(db)), 'GET', '/vault/documents', { method: 'GET', url: '/vault/documents', params: {}, query: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.documents[0]).toMatchObject({ id: 'd1', vectorIndexed: true, uploadedFileId: null });
    expect(res.jsonData.documents[1]).toMatchObject({ id: 'd2', vectorIndexed: false, uploadedFileId: 'f-9' });
  });

  it('POST /vault/search: 400 for empty or >2000-char queries, 200 delegates to searchDocuments', async () => {
    vi.mocked(searchDocuments).mockResolvedValueOnce([{ id: "m1", fileName: "a.txt", vaultId: "marketingVault", sourceModule: "brain_upload", contentText: "x", similarity: 0.9 }]);
    const sb = makeSb();
    const db = makeDb();
    const router = createVaultRouter(makeDeps(db));
    const req = { method: 'POST', url: '/vault/search', params: {}, query: {} };

    let res = makeRes(sb);
    await invoke(router, 'POST', '/vault/search', { ...req, body: {} }, res);
    expect(res.statusCode).toBe(400);

    res = makeRes(sb);
    await invoke(router, 'POST', '/vault/search', { ...req, body: { query: 'a'.repeat(2001) } }, res);
    expect(res.statusCode).toBe(400);

    res = makeRes(sb);
    await invoke(router, 'POST', '/vault/search', { ...req, body: { query: '  pricing  ' } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.matches).toEqual([{ id: "m1", fileName: "a.txt", vaultId: "marketingVault", sourceModule: "brain_upload", contentText: "x", similarity: 0.9 }]);
    expect(searchDocuments).toHaveBeenCalledWith(sb, 'ws-1', 'pricing', { topK: 6 });
  });

  it('POST /vault/analyze-document: 415 for spreadsheets, 400 when no text, 200 with the heuristic fallback (no key)', async () => {
    const sb = makeSb();
    const db = makeDb();
    const req = { method: 'POST', url: '/vault/analyze-document', params: {}, query: {} };

    // Fresh object per call: the multer mock sets req.file on whatever object
    // it is handed, so a shared req would leak files across sub-cases.
    fileFixture = makeFile('data.xlsx', 'x', { mimetype: 'application/vnd.ms-excel' });
    let res = makeRes(sb);
    await invoke(createVaultRouter(makeDeps(db)), 'POST', '/vault/analyze-document', { ...req, body: {} }, res);
    expect(res.statusCode).toBe(415);

    fileFixture = makeFile('empty.txt', '   ');
    res = makeRes(sb);
    await invoke(createVaultRouter(makeDeps(db)), 'POST', '/vault/analyze-document', { ...req, body: {} }, res);
    expect(res.statusCode).toBe(400);

    // pasted-text path with no Gemini key → deterministic heuristic result
    fileFixture = null;
    res = makeRes(sb);
    await invoke(
      createVaultRouter(makeDeps(db)),
      'POST', '/vault/analyze-document',
      { ...req, body: { text: '# Q4 Pricing Strategy\nRaise prices for premium tier.', fileName: 'pricing.md' } },
      res,
    );
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.analysis.title).toContain('Q4 Pricing Strategy');
    expect(res.jsonData.analysis.classification).toBeTruthy();
    expect(res.jsonData.analysis.tags).toEqual(expect.arrayContaining(['Strategy']));
  });

  it('POST /vault/analyze-document: a live Gemini result overrides the heuristic', async () => {
    const sb = makeSb();
    const db = makeDb();
    const deps = makeDeps(db, {
      resolveEffectiveGeminiKey: vi.fn(async () => 'live-key'),
      getGeminiClient: vi.fn(() => ({
        models: { generateContent: async () => ({ text: JSON.stringify({ title: 'Tuned Title', summary: 'The summary.', tags: ['#a', 'b'], classification: 'AUDIT_DIAGNOSTIC' }) }) },
      })),
    });
    const res = makeRes(sb);
    fileFixture = makeFile('audit.txt', 'audit findings text');
    await invoke(createVaultRouter(deps), 'POST', '/vault/analyze-document', { method: 'POST', url: '/vault/analyze-document', params: {}, body: {}, query: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.analysis.title).toBe('Tuned Title');
    expect(res.jsonData.analysis.tags).toEqual(['a', 'b']);
  });

  it('GET /vault/files/:fileId/url: 404 for unknown / pre-migration files, 500 on signed-URL failure, 200 on success', async () => {
    const db = makeDb();
    db.secondBrain.uploadedFiles = [{ id: 'f-1', storagePath: 'ws-1/brandVault/f-1-x.txt' }];
    const sbOk = makeSb();
    let res = makeRes(sbOk);
    await invoke(createVaultRouter(makeDeps(db)), 'GET', '/vault/files/:fileId/url', { method: 'GET', url: '/vault/files/nope/url', params: { fileId: 'nope' }, query: {} }, res);
    expect(res.statusCode).toBe(404);

    db.secondBrain.uploadedFiles.push({ id: 'f-2' }); // no storagePath → pre-migration
    res = makeRes(sbOk);
    await invoke(createVaultRouter(makeDeps(db)), 'GET', '/vault/files/:fileId/url', { method: 'GET', url: '/vault/files/f-2/url', params: { fileId: 'f-2' }, query: {} }, res);
    expect(res.statusCode).toBe(404);

    res = makeRes(sbOk);
    await invoke(createVaultRouter(makeDeps(db)), 'GET', '/vault/files/:fileId/url', { method: 'GET', url: '/vault/files/f-1/url', params: { fileId: 'f-1' }, query: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.url).toBe('https://signed.example/f');
  });

  it('DELETE /vault/files/:fileId: removes the storage object + documents row, then the metadata entry', async () => {
    const db = makeDb();
    db.secondBrain.uploadedFiles = [{ id: 'f-1', storagePath: 'ws-1/x.txt', documentId: 'doc-1' }];
    const sb = makeSb();
    const deps = makeDeps(db);
    const res = makeRes(sb);
    await invoke(createVaultRouter(deps), 'DELETE', '/vault/files/:fileId', { method: 'DELETE', url: '/vault/files/f-1', params: { fileId: 'f-1' }, body: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(db.secondBrain.uploadedFiles).toHaveLength(0);
    expect(deps.saveDB).toHaveBeenCalled();

    const res2 = makeRes(sb);
    await invoke(createVaultRouter(deps), 'DELETE', '/vault/files/:fileId', { method: 'DELETE', url: '/vault/files/ghost', params: { fileId: 'ghost' }, body: {} }, res2);
    expect(res2.statusCode).toBe(404);
  });

  it('factory shape: 7 scoped route layers; the 3 file routes carry the multer layer', () => {
    const router: any = createVaultRouter(makeDeps(makeDb()));
    const routeLayers = router.stack.filter((l: any) => l.route);
    expect(routeLayers).toHaveLength(7);
    for (const l of routeLayers) {
      expect(l.route.path).toMatch(/^\/(settings\/skills\/upload|vault\/(upload|documents|search|analyze-document|files\/:fileId(\/url)?))$/);
    }
    const withMulter = routeLayers.filter((l: any) => ['/settings/skills/upload', '/vault/upload', '/vault/analyze-document'].includes(l.route.path));
    for (const l of withMulter) expect(l.route.stack).toHaveLength(2); // [multer single, handler]
    const plain = routeLayers.filter((l: any) => !['/settings/skills/upload', '/vault/upload', '/vault/analyze-document'].includes(l.route.path));
    for (const l of plain) expect(l.route.stack).toHaveLength(1);
  });
});
