import { Router, Request, Response } from 'express';
import { Type } from '@google/genai';
import path from 'path';
import crypto from 'crypto';

export interface VantaRouterDeps {
  expensiveLimiter: any;
  callerIsOwnerOrAdmin: (res: Response) => Promise<boolean>;
  getVantaSettings: (res: Response) => Promise<any>;
  normalizeVantaLocalBaseUrl: (url: string) => string;
  describeVantaProviderError: (err: any) => string;
  resolveEffectiveGeminiKey: (res: Response) => Promise<string>;
  resolveEffectiveGeminiModel: (res: Response) => Promise<string>;
  getGeminiClient: (key: string) => any;
  getDB: (res: Response) => Promise<any>;
  searchDocuments: (sb: any, wsId: string, query: string, opts: any) => Promise<any[]>;
  vantaUpload: any;
  vantaLocalContexts: Map<string, any>;
  pruneVantaLocalContexts: () => void;
  extractVantaLocalText: (file: any) => Promise<string>;
  VANTA_SYSTEM_INSTRUCTION: string;
  classifyVantaVerification: (configured: boolean, verifiedAt?: string | null, now?: number) => any;
  buildVantaPromptContext: (workspace: any, decisionRuntime?: any) => string;
  parseVantaModelOutput: (text: string) => any;
  vantaMessageRequest: any;
  vantaConversationRequest: any;
  vantaShareRequest: any;
  vantaMemoryRequest: any;
  vantaVoiceSettingsRequest?: any;
  getDecisionRuntimeStatus: () => Promise<any>;
  decisionTraceToVantaContext: (trace: Record<string, any>) => string;
}

export function createVantaRouter(deps: VantaRouterDeps): Router {
  const router = Router();
  const {
    expensiveLimiter,
    callerIsOwnerOrAdmin,
    getVantaSettings,
    normalizeVantaLocalBaseUrl,
    describeVantaProviderError,
    resolveEffectiveGeminiKey,
    resolveEffectiveGeminiModel,
    getGeminiClient,
    getDB,
    searchDocuments,
    vantaUpload,
    vantaLocalContexts,
    pruneVantaLocalContexts,
    extractVantaLocalText,
    VANTA_SYSTEM_INSTRUCTION,
    classifyVantaVerification,
    buildVantaPromptContext,
    parseVantaModelOutput,
    vantaMessageRequest,
    vantaConversationRequest,
    vantaShareRequest,
    vantaMemoryRequest,
    vantaVoiceSettingsRequest,
    getDecisionRuntimeStatus,
    decisionTraceToVantaContext,
  } = deps;

  // GET /status
  router.get('/status', async (_req: Request, res: Response) => {
    const key = (await resolveEffectiveGeminiKey(res)) || process.env.GEMINI_API_KEY;
    const settings = await getVantaSettings(res);
    const configured = Boolean(key || settings?.text_provider === 'lmstudio' || settings?.text_provider === 'ollama');
    const verification = classifyVantaVerification(configured, settings?.provider_verified_at);
    const voiceConfigured = settings?.voice_provider === 'local' ? Boolean(settings.voice_config?.baseUrl) : Boolean(key);
    const voiceVerification = classifyVantaVerification(voiceConfigured, settings?.voice_verified_at);
    const decisionRuntime = await getDecisionRuntimeStatus();
    res.json({
      ...verification,
      voiceAvailable: voiceVerification.verified,
      provider: settings?.text_provider || 'gemini',
      model: settings?.text_model || (await resolveEffectiveGeminiModel(res)),
      decisionRuntime,
    });
  });

  // GET /settings
  router.get('/settings', async (_req: Request, res: Response) => {
    const settings = await getVantaSettings(res);
    res.json({
      voice: {
        provider: settings?.voice_provider || 'gemini',
        baseUrl: settings?.voice_config?.baseUrl || '',
        sttModel: settings?.voice_config?.sttModel || '',
        ttsModel: settings?.voice_config?.ttsModel || '',
        voice: settings?.voice_config?.voice || '',
        verified: Boolean(settings?.voice_verified_at),
        verifiedAt: settings?.voice_verified_at || null,
      },
    });
  });

  // PUT /settings/voice
  router.put('/settings/voice', async (req: Request, res: Response) => {
    if (!(await callerIsOwnerOrAdmin(res))) {
      res.status(403).json({ error: 'Only an owner or admin can configure VANTA voice.' });
      return;
    }
    const parsed = vantaVoiceSettingsRequest.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid voice settings.' });
      return;
    }
    const config = parsed.data.provider === 'local' ? {
      baseUrl: normalizeVantaLocalBaseUrl(parsed.data.baseUrl!),
      sttModel: parsed.data.sttModel || 'whisper-1',
      ttsModel: parsed.data.ttsModel || 'tts-1',
      voice: parsed.data.voice || 'alloy',
    } : {};
    const { error } = await res.locals.sb.from('vanta_settings').upsert({
      workspace_id: res.locals.wsId,
      voice_provider: parsed.data.provider,
      voice_config: config,
      voice_verified_at: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'workspace_id' });
    if (error) {
      res.status(500).json({ error: 'Voice settings could not be saved.' });
      return;
    }
    res.json({ success: true, voice: { provider: parsed.data.provider, ...config, verified: false } });
  });

  // POST /voice/verify
  router.post('/voice/verify', expensiveLimiter, async (_req: Request, res: Response) => {
    if (!(await callerIsOwnerOrAdmin(res))) {
      res.status(403).json({ error: 'Only an owner or admin can verify VANTA voice.' });
      return;
    }
    const settings = await getVantaSettings(res);
    const provider = settings?.voice_provider || 'gemini';
    try {
      if (provider === 'local') {
        const baseUrl = settings?.voice_config?.baseUrl;
        if (!baseUrl) throw new Error('Local endpoint is not configured');
        const response = await fetch(`${normalizeVantaLocalBaseUrl(baseUrl)}/v1/models`, { signal: AbortSignal.timeout(5000) });
        if (!response.ok) throw new Error(`Local endpoint returned ${response.status}`);
      } else {
        const key = (await resolveEffectiveGeminiKey(res)) || process.env.GEMINI_API_KEY;
        if (!key) throw new Error('Gemini is not configured');
        const response = await getGeminiClient(key).models.generateContent({
          model: process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts',
          contents: [{ parts: [{ text: 'Say: VANTA voice verified.' }] }],
          config: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } } as any,
        });
        if (!(response as any).candidates?.[0]?.content?.parts?.some((part: any) => part.inlineData?.data)) throw new Error('No audio returned');
      }
      const verifiedAt = new Date().toISOString();
      const { error } = await res.locals.sb.from('vanta_settings').upsert({ workspace_id: res.locals.wsId, voice_verified_at: verifiedAt, updated_at: verifiedAt }, { onConflict: 'workspace_id' });
      if (error) throw error;
      res.json({ success: true, provider, verified: true, verifiedAt });
    } catch (error) {
      res.status(502).json({ error: `Voice verification failed. ${describeVantaProviderError(error)}` });
    }
  });

  // POST /provider/verify
  router.post('/provider/verify', expensiveLimiter, async (_req: Request, res: Response) => {
    if (!(await callerIsOwnerOrAdmin(res))) {
      res.status(403).json({ error: 'Only an owner or admin can verify VANTA providers.' });
      return;
    }
    const key = (await resolveEffectiveGeminiKey(res)) || process.env.GEMINI_API_KEY;
    if (!key) {
      res.status(503).json({ error: 'Configure Gemini before verifying VANTA.' });
      return;
    }
    try {
      const settings = await getVantaSettings(res);
      const model = settings?.text_model || await resolveEffectiveGeminiModel(res);
      const response = await getGeminiClient(key).models.generateContent({ model, contents: 'Reply with exactly VANTA_OK.' });
      if (!response.text?.includes('VANTA_OK')) throw new Error('Unexpected verification response');
      const now = new Date().toISOString();
      const { error } = await res.locals.sb.from('vanta_settings').upsert({
        workspace_id: res.locals.wsId,
        text_provider: 'gemini',
        text_model: model,
        provider_verified_at: now,
        updated_at: now,
      }, { onConflict: 'workspace_id' });
      if (error) throw error;
      res.json({ success: true, verified: true, verifiedAt: now, provider: 'gemini', model });
    } catch (err) {
      res.status(502).json({ error: describeVantaProviderError(err) });
    }
  });

  // GET /conversations
  router.get('/conversations', async (_req: Request, res: Response) => {
    const { data, error } = await res.locals.sb
      .from('vanta_conversations')
      .select('id,title,visibility,created_by,expires_at,created_at,updated_at')
      .eq('workspace_id', res.locals.wsId)
      .gt('expires_at', new Date().toISOString())
      .order('updated_at', { ascending: false });
    if (error) {
      res.status(500).json({ error: 'Conversation history is unavailable.' });
      return;
    }
    res.json({ conversations: data || [] });
  });

  // POST /conversations
  router.post('/conversations', async (req: Request, res: Response) => {
    const parsed = vantaConversationRequest.safeParse(req.body || {});
    if (!parsed.success) {
      res.status(400).json({ error: 'Conversation title must be under 121 characters.' });
      return;
    }
    const { data, error } = await res.locals.sb.from('vanta_conversations').insert({
      workspace_id: res.locals.wsId,
      created_by: res.locals.userId,
      title: parsed.data.title || 'New VANTA conversation',
    }).select('id,title,visibility,expires_at,created_at,updated_at').single();
    if (error) {
      res.status(500).json({ error: 'VANTA could not create a conversation.' });
      return;
    }
    res.status(201).json({ conversation: data });
  });

  // GET /conversations/:id/messages
  router.get('/conversations/:id/messages', async (req: Request, res: Response) => {
    const { data: readableConversation } = await res.locals.sb
      .from('vanta_conversations')
      .select('id')
      .eq('workspace_id', res.locals.wsId)
      .eq('id', req.params.id)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    if (!readableConversation) {
      res.status(404).json({ error: 'Conversation not found or expired.' });
      return;
    }
    const { data, error } = await res.locals.sb
      .from('vanta_messages')
      .select('id,conversation_id,role,content,evidence,proposal,memory_suggestion,created_at')
      .eq('workspace_id', res.locals.wsId)
      .eq('conversation_id', req.params.id)
      .order('created_at', { ascending: true });
    if (error) {
      res.status(404).json({ error: 'Conversation not found.' });
      return;
    }
    res.json({ messages: data || [] });
  });

  // PATCH /conversations/:id/share
  router.patch('/conversations/:id/share', async (req: Request, res: Response) => {
    const parsed = vantaShareRequest.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'shared must be a boolean.' });
      return;
    }
    const { data, error } = await res.locals.sb.from('vanta_conversations')
      .update({ visibility: parsed.data.shared ? 'workspace' : 'private', updated_at: new Date().toISOString() })
      .eq('workspace_id', res.locals.wsId).eq('id', req.params.id)
      .select('id,visibility').maybeSingle();
    if (error || !data) {
      res.status(404).json({ error: 'Only the conversation owner can change sharing.' });
      return;
    }
    res.json({ conversation: data });
  });

  // DELETE /conversations/:id
  router.delete('/conversations/:id', async (req: Request, res: Response) => {
    const { error } = await res.locals.sb.from('vanta_conversations')
      .delete().eq('workspace_id', res.locals.wsId).eq('id', req.params.id);
    if (error) {
      res.status(404).json({ error: 'Conversation not found or not owned by you.' });
      return;
    }
    res.json({ success: true });
  });

  // POST /conversations/:id/messages
  router.post('/conversations/:id/messages', expensiveLimiter, async (req: Request, res: Response) => {
    const parsed = vantaMessageRequest.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Provide a message under 4,001 characters and no more than 12 local context items.' });
      return;
    }
    const { data: conversation } = await res.locals.sb.from('vanta_conversations')
      .select('id,created_by').eq('workspace_id', res.locals.wsId).eq('id', req.params.id)
      .gt('expires_at', new Date().toISOString()).maybeSingle();
    if (!conversation || conversation.created_by !== res.locals.userId) {
      res.status(404).json({ error: 'Conversation not found or is read-only.' });
      return;
    }
    const key = (await resolveEffectiveGeminiKey(res)) || process.env.GEMINI_API_KEY;
    const { data: settings } = await res.locals.sb.from('vanta_settings')
      .select('text_provider,text_model,provider_verified_at').eq('workspace_id', res.locals.wsId).maybeSingle();
    if (!key || !classifyVantaVerification(Boolean(key), settings?.provider_verified_at).verified) {
      res.status(503).json({ error: 'VANTA is configured but not verified. Ask an owner or admin to verify the provider.' });
      return;
    }

    const { data: userMessage, error: insertError } = await res.locals.sb.from('vanta_messages').insert({
      workspace_id: res.locals.wsId,
      conversation_id: conversation.id,
      created_by: res.locals.userId,
      role: 'user',
      content: parsed.data.content,
    }).select('id').single();
    if (insertError) {
      res.status(500).json({ error: 'VANTA could not save the message.' });
      return;
    }

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    const send = (event: string, payload: unknown) => res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
    send('state', { phase: 'thinking' });

    try {
      pruneVantaLocalContexts();
      const workspace = await getDB(res);
      const [historyResult, memoryResult, ragMatches, decisionRuntime, decisionTraceResult] = await Promise.all([
        res.locals.sb.from('vanta_messages').select('role,content').eq('conversation_id', conversation.id).order('created_at', { ascending: false }).limit(12),
        res.locals.sb.from('vanta_memories').select('id,content,visibility').eq('workspace_id', res.locals.wsId).order('updated_at', { ascending: false }).limit(12),
        searchDocuments(res.locals.sb, res.locals.wsId, parsed.data.content, { topK: 5 }).catch(() => []),
        getDecisionRuntimeStatus(),
        res.locals.sb.from('decision_traces')
          .select('id,operation,authoritative_engine,selected_value,confidence,probabilities,requires_hitl,policy_override,shadow_provider,shadow_decision,duration_ms,created_at')
          .eq('workspace_id', res.locals.wsId)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);
      const localContexts = parsed.data.localContextIds
        .map((id: string) => vantaLocalContexts.get(id))
        .filter((context: any) => Boolean(context && context.workspaceId === res.locals.wsId && context.userId === res.locals.userId));
      const evidenceContext = [
        buildVantaPromptContext(workspace, decisionRuntime),
        `[APPROVED MEMORIES]\n${(memoryResult.data || []).map((memory: any) => `${memory.id}: ${memory.content}`).join('\n') || 'none'}`,
        `[SECOND BRAIN RETRIEVAL]\n${ragMatches.map((match: any) => `${match.id} (${match.fileName}, ${match.vaultId}): ${(match.contentText || '').slice(0, 1800)}`).join('\n') || 'none'}`,
        `[SESSION LOCAL CONTEXT]\n${localContexts.map((context: any) => `${context.id} (${context.name}): ${context.text.slice(0, 4000)}`).join('\n') || 'none'}`,
        `[RECENT DECISION TRACES]\n${decisionTraceResult.error
          ? 'unavailable: decision trace storage is not deployed or readable'
          : (decisionTraceResult.data || []).map((trace: any) => decisionTraceToVantaContext(trace)).join('\n') || 'none'}`,
      ].join('\n\n');

      const history = [...(historyResult.data || [])].reverse().map((message: any) => `${message.role}: ${message.content}`).join('\n');
      const model = settings.text_model || await resolveEffectiveGeminiModel(res);
      const response = await getGeminiClient(key).models.generateContent({
        model,
        contents: `${evidenceContext}\n\n[RECENT CONVERSATION]\n${history}\n\n[USER REQUEST]\n${parsed.data.content}`,
        config: {
          systemInstruction: VANTA_SYSTEM_INSTRUCTION,
          maxOutputTokens: 1800,
          responseMimeType: parsed.data.useWeb ? undefined : 'application/json',
          responseSchema: parsed.data.useWeb ? undefined : {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              evidence: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    sourceType: { type: Type.STRING, enum: ['workspace', 'vault', 'document', 'web', 'local'] },
                    title: { type: Type.STRING },
                    excerpt: { type: Type.STRING },
                    href: { type: Type.STRING },
                    entityId: { type: Type.STRING },
                    observedAt: { type: Type.STRING },
                  },
                  required: ['id', 'sourceType', 'title'],
                },
              },
              memorySuggestion: { type: Type.STRING },
              topologyEntityIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['text', 'evidence'],
          },
          tools: parsed.data.useWeb ? [{ googleSearch: {} }] : undefined,
        } as any,
      });
      const output = parseVantaModelOutput(response.text || '');
      const groundingChunks = (response as any).candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const webEvidence = groundingChunks
        .map((chunk: any, index: number) => chunk.web?.uri ? ({
          id: `web-${index + 1}`,
          sourceType: 'web',
          title: chunk.web.title || chunk.web.uri,
          href: chunk.web.uri,
          observedAt: new Date().toISOString(),
        }) : null)
        .filter(Boolean);
      const evidence = [...output.evidence, ...webEvidence].slice(0, 12);
      const { data: assistantMessage, error: assistantError } = await res.locals.sb.from('vanta_messages').insert({
        workspace_id: res.locals.wsId,
        conversation_id: conversation.id,
        created_by: res.locals.userId,
        role: 'assistant',
        content: output.text,
        evidence,
        proposal: output.proposal || null,
        memory_suggestion: output.memorySuggestion || null,
        provider: 'gemini',
        model,
      }).select('id,created_at').single();
      if (assistantError) throw assistantError;
      await res.locals.sb.from('vanta_conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversation.id);
      send('state', { phase: output.proposal ? 'proposing' : 'success' });
      const chunks = output.text.match(/.{1,80}(?:\s|$)/g) || [output.text];
      for (const chunk of chunks) send('text-delta', { text: chunk });
      send('message', {
        id: assistantMessage.id,
        conversationId: conversation.id,
        role: 'assistant',
        content: output.text,
        evidence,
        proposal: output.proposal,
        memorySuggestion: output.memorySuggestion,
        topologyEntityIds: output.topologyEntityIds,
        createdAt: assistantMessage.created_at,
        userMessageId: userMessage.id,
      });
      send('done', { ok: true });
      res.end();
    } catch (err) {
      console.error('VANTA message failed:', err);
      send('state', { phase: 'error' });
      send('error', { error: describeVantaProviderError(err) });
      res.end();
    }
  });

  // POST /memories
  router.post('/memories', async (req: Request, res: Response) => {
    const parsed = vantaMemoryRequest.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Provide an approved memory under 2,001 characters.' });
      return;
    }
    const { data, error } = await res.locals.sb.from('vanta_memories').insert({
      workspace_id: res.locals.wsId,
      created_by: res.locals.userId,
      source_message_id: parsed.data.sourceMessageId || null,
      content: parsed.data.content,
      visibility: parsed.data.shared ? 'workspace' : 'private',
    }).select('id,content,visibility,created_at').single();
    if (error) {
      res.status(500).json({ error: 'VANTA could not save the approved memory.' });
      return;
    }
    res.status(201).json({ memory: data });
  });

  // DELETE /memories/:id
  router.delete('/memories/:id', async (req: Request, res: Response) => {
    const { error } = await res.locals.sb.from('vanta_memories').delete()
      .eq('workspace_id', res.locals.wsId).eq('id', req.params.id);
    if (error) {
      res.status(404).json({ error: 'Memory not found or not owned by you.' });
      return;
    }
    res.json({ success: true });
  });

  // POST /local-context
  router.post('/local-context', vantaUpload.array('files', 12), async (req: Request, res: Response) => {
    const files = ((req as any).files || []) as Express.Multer.File[];
    if (!files.length) {
      res.status(400).json({ error: 'Select at least one supported file.' });
      return;
    }
    pruneVantaLocalContexts();
    const attached = [];
    for (const file of files) {
      try {
        const text = await extractVantaLocalText(file);
        const id = crypto.randomUUID();
        vantaLocalContexts.set(id, {
          id,
          workspaceId: res.locals.wsId,
          userId: res.locals.userId,
          name: path.basename(file.originalname),
          text,
          expiresAt: Date.now() + 60 * 60 * 1000,
        });
        attached.push({ id, name: path.basename(file.originalname), size: file.size, expiresInMinutes: 60 });
      } catch (err) {
        res.status(415).json({ error: err instanceof Error ? err.message : 'Unsupported local context.' });
        return;
      }
    }
    res.status(201).json({ attached });
  });

  // POST /voice/transcribe
  router.post('/voice/transcribe', expensiveLimiter, vantaUpload.single('audio'), async (req: Request, res: Response) => {
    const audio = (req as any).file as Express.Multer.File | undefined;
    if (!audio) {
      res.status(400).json({ error: 'An audio clip is required.' });
      return;
    }
    try {
      const settings = await getVantaSettings(res);
      if (!classifyVantaVerification(true, settings?.voice_verified_at).verified) {
        res.status(503).json({ error: 'Voice transcription is configured but not verified.' });
        return;
      }
      if (settings.voice_provider === 'local') {
        const config = settings.voice_config || {};
        if (!config.baseUrl) throw new Error('Local voice endpoint is not configured');
        const form = new FormData();
        form.append('file', new Blob([audio.buffer], { type: audio.mimetype || 'audio/webm' }), audio.originalname || 'vanta-request.webm');
        form.append('model', config.sttModel || 'whisper-1');
        form.append('response_format', 'json');
        const localResponse = await fetch(`${normalizeVantaLocalBaseUrl(config.baseUrl)}/v1/audio/transcriptions`, { method: 'POST', body: form, signal: AbortSignal.timeout(60_000) });
        const localPayload = await localResponse.json().catch(() => ({})) as any;
        if (!localResponse.ok || typeof localPayload.text !== 'string') throw new Error(`Local STT returned ${localResponse.status}`);
        res.json({ transcript: localPayload.text.trim(), provider: 'local' });
        return;
      }
      const key = (await resolveEffectiveGeminiKey(res)) || process.env.GEMINI_API_KEY;
      if (!key) throw new Error('Gemini voice is not configured');
      const response = await getGeminiClient(key).models.generateContent({
        model: await resolveEffectiveGeminiModel(res),
        contents: [{ role: 'user', parts: [
          { inlineData: { mimeType: audio.mimetype || 'audio/webm', data: audio.buffer.toString('base64') } },
          { text: 'Transcribe this audio exactly. Return only the transcript.' },
        ] }],
      });
      const transcript = response.text?.trim();
      if (!transcript) throw new Error('Empty transcription');
      res.json({ transcript, provider: 'gemini' });
    } catch {
      res.status(502).json({ error: 'VANTA could not transcribe this audio.' });
    }
  });

  // POST /voice/speak
  router.post('/voice/speak', expensiveLimiter, async (req: Request, res: Response) => {
    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    if (!text || text.length > 4000) {
      res.status(400).json({ error: 'Provide text under 4,001 characters.' });
      return;
    }
    try {
      const settings = await getVantaSettings(res);
      if (!classifyVantaVerification(true, settings?.voice_verified_at).verified) {
        res.status(503).json({ error: 'Voice synthesis is configured but not verified.' });
        return;
      }
      if (settings.voice_provider === 'local') {
        const config = settings.voice_config || {};
        if (!config.baseUrl) throw new Error('Local voice endpoint is not configured');
        const localResponse = await fetch(`${normalizeVantaLocalBaseUrl(config.baseUrl)}/v1/audio/speech`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: config.ttsModel || 'tts-1', voice: config.voice || 'alloy', input: text, response_format: 'wav' }),
          signal: AbortSignal.timeout(60_000),
        });
        if (!localResponse.ok) throw new Error(`Local TTS returned ${localResponse.status}`);
        const bytes = Buffer.from(await localResponse.arrayBuffer());
        res.json({ audioBase64: bytes.toString('base64'), mimeType: localResponse.headers.get('content-type') || 'audio/wav', provider: 'local' });
        return;
      }
      const key = (await resolveEffectiveGeminiKey(res)) || process.env.GEMINI_API_KEY;
      if (!key) throw new Error('Gemini voice is not configured');
      const response = await getGeminiClient(key).models.generateContent({
        model: process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text: `Speak calmly, concisely, and authoritatively as VANTA: ${text}` }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        } as any,
      });
      const audioData = (response as any).candidates?.[0]?.content?.parts?.find((part: any) => part.inlineData)?.inlineData;
      if (!audioData?.data) throw new Error('No audio returned');
      res.json({ audioBase64: audioData.data, mimeType: audioData.mimeType || 'audio/pcm;rate=24000', provider: 'gemini' });
    } catch {
      res.status(502).json({ error: 'VANTA could not synthesize speech. Text remains available.' });
    }
  });

  return router;
}
