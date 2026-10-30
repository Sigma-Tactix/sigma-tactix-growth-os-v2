import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useWorkspace } from './WorkspaceContext';
import { useToast } from './ToastContext';
import { apiFetch } from '@/src/lib/api';
import {
  attachVantaLocalFiles,
  createVantaConversation,
  deleteVantaConversation,
  getVantaMessages,
  getVantaStatus,
  listVantaConversations,
  saveVantaMemory,
  shareVantaConversation,
  streamVantaMessage,
  synthesizeVantaSpeech,
  transcribeVantaAudio,
  dispatchVantaProposal,
} from '@/src/lib/vantaApi';
import type { VantaConversationSummary } from '@/src/lib/vantaApi';
import {
  buildVantaTopology,
  createVantaState,
  vantaReducer,
  type VantaMessage,
  type VantaTopologyFocus,
} from '@/src/lib/vanta';
import type { WorkspaceData } from '@/src/types';

interface LocalContextItem { id: string; name: string; size: number }

interface VantaContextValue {
  retrieval: { count: number; method: string } | null;
  state: ReturnType<typeof createVantaState>;
  messages: Array<VantaMessage & { memorySuggestion?: string; topologyEntityIds?: string[] }>;
  conversations: VantaConversationSummary[];
  conversationId: string | null;
  topology: VantaTopologyFocus;
  fullTopology: VantaTopologyFocus;
  topologyExpanded: boolean;
  setTopologyExpanded: (expanded: boolean) => void;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  dockOpen: boolean;
  setDockOpen: (open: boolean) => void;
  transcriptOpen: boolean;
  setTranscriptOpen: (open: boolean) => void;
  localContexts: LocalContextItem[];
  send: (content: string, speakReply?: boolean) => Promise<void>;
  attachFiles: (files: File[]) => Promise<void>;
  startListening: () => Promise<void>;
  stopListening: () => void;
  playMessage: (message: VantaMessage) => Promise<void>;
  approveMemory: (content: string, sourceMessageId?: string) => Promise<void>;
  dispatchProposal: (proposal: NonNullable<VantaMessage['proposal']>) => Promise<void>;
  toggleInspect: () => void;
  stop: () => void;
  refreshStatus: () => Promise<void>;
  newConversation: () => void;
  loadConversation: (id: string) => Promise<void>;
  setConversationShared: (shared: boolean) => Promise<void>;
  deleteCurrentConversation: () => Promise<void>;
}

const VantaContext = createContext<VantaContextValue | undefined>(undefined);

function pcmToAudioBuffer(context: AudioContext, base64: string, sampleRate = 24_000) {
  const bytes = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
  const view = new DataView(bytes.buffer);
  const frameCount = Math.floor(bytes.byteLength / 2);
  const buffer = context.createBuffer(1, frameCount, sampleRate);
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < frameCount; index += 1) channel[index] = view.getInt16(index * 2, true) / 32768;
  return buffer;
}

export function VantaProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(vantaReducer, undefined, () => createVantaState());
  const [retrieval, setRetrieval] = useState<{ count: number; method: string } | null>(null);
  const sendingRef = useRef(false);
  const [messages, setMessages] = useState<VantaContextValue['messages']>([]);
  const [conversations, setConversations] = useState<VantaConversationSummary[]>([]);
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [dockOpen, setDockOpen] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [localContexts, setLocalContexts] = useState<LocalContextItem[]>([]);
  const [focusedEntityIds, setFocusedEntityIds] = useState<string[]>([]);
  const [topologyExpanded, setTopologyExpanded] = useState(false);
  const { currentWorkspaceId } = useWorkspace();
  const { notifyError, notifyInfo, notifySuccess } = useToast();
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserFrameRef = useRef<number | null>(null);
  const recordingTimeoutRef = useRef<number | null>(null);
  const requestAbortRef = useRef<AbortController | null>(null);
  const speechSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const speakAfterResponseRef = useRef(false);

  const fullTopology = useMemo(
    () => buildVantaTopology(workspaceData, state.provider.decisionRuntime),
    [state.provider.decisionRuntime, workspaceData],
  );
  const topology = useMemo(() => {
    if (topologyExpanded) return fullTopology;
    if (!focusedEntityIds.length) return { nodes: fullTopology.nodes.slice(0, 1), edges: [] };
    const ids = new Set(['core-vanta', ...focusedEntityIds]);
    return {
      nodes: fullTopology.nodes.filter(node => ids.has(node.id)),
      edges: fullTopology.edges.filter(edge => ids.has(edge.from) && ids.has(edge.to)),
    };
  }, [focusedEntityIds, fullTopology, topologyExpanded]);

  const refreshStatus = useCallback(async () => {
    try {
      dispatch({ type: 'PROVIDER_STATUS', status: await getVantaStatus() });
    } catch {
      dispatch({ type: 'PROVIDER_STATUS', status: { configured: false, verified: false, voiceAvailable: false, label: 'Status unavailable' } });
    }
  }, []);

  useEffect(() => {
    let active = true;
    requestAbortRef.current?.abort();
    setRetrieval(null);
    dispatch({ type: 'RESET' });
    setConversationId(null);
    setMessages([]);
    setConversations([]);
    setLocalContexts([]);
    Promise.allSettled([
      getVantaStatus(),
      apiFetch('/api/workspace').then(async response => {
        if (!response.ok) throw new Error('Workspace unavailable');
        return response.json() as Promise<WorkspaceData>;
      }),
    ]).then(([statusResult, workspaceResult]) => {
      if (!active) return;
      if (statusResult.status === 'fulfilled') dispatch({ type: 'PROVIDER_STATUS', status: statusResult.value });
      else dispatch({ type: 'PROVIDER_STATUS', status: { configured: false, verified: false, voiceAvailable: false, label: 'Status unavailable' } });
      if (workspaceResult.status === 'fulfilled') setWorkspaceData(workspaceResult.value);
      else setWorkspaceData(null);
      if (statusResult.status === 'fulfilled' && statusResult.value.verified) {
        void listVantaConversations().then(items => { if (active) setConversations(items); }).catch(() => undefined);
      }
    });
    return () => { active = false; };
  }, [currentWorkspaceId]);

  useEffect(() => () => {
    requestAbortRef.current?.abort();
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach(track => track.stop());
    if (analyserFrameRef.current !== null) cancelAnimationFrame(analyserFrameRef.current);
    if (recordingTimeoutRef.current !== null) window.clearTimeout(recordingTimeoutRef.current);
    void audioContextRef.current?.close();
    try { speechSourceRef.current?.stop(); } catch { /* already stopped */ }
  }, []);

  const ensureConversation = useCallback(async (signal: AbortSignal) => {
    if (conversationId) return conversationId;
    const conversation = await createVantaConversation(undefined, signal);
    signal.throwIfAborted();
    setConversationId(conversation.id);
    setConversations(previous => [conversation, ...previous]);
    return conversation.id;
  }, [conversationId]);

  const playText = useCallback(async (text: string) => {
    if (!state.provider.voiceAvailable) {
      notifyInfo('Voice unavailable', 'The reply remains in the transcript. Verify a voice provider to enable speech.');
      return;
    }
    try {
      dispatch({ type: 'SPEECH_STARTED' });
      const audio = await synthesizeVantaSpeech(text);
      const context = audioContextRef.current && audioContextRef.current.state !== 'closed'
        ? audioContextRef.current
        : new AudioContext();
      audioContextRef.current = context;
      await context.resume();
      const buffer = audio.mimeType.includes('pcm')
        ? pcmToAudioBuffer(context, audio.audioBase64, Number(audio.mimeType.match(/rate=(\d+)/)?.[1] || 24_000))
        : await context.decodeAudioData(Uint8Array.from(atob(audio.audioBase64), char => char.charCodeAt(0)).buffer);
      const source = context.createBufferSource();
      try { speechSourceRef.current?.stop(); } catch { /* prior source already stopped */ }
      speechSourceRef.current = source;
      const analyser = context.createAnalyser();
      analyser.fftSize = 128;
      source.buffer = buffer;
      source.connect(analyser);
      analyser.connect(context.destination);
      const samples = new Uint8Array(analyser.frequencyBinCount);
      const updateAmplitude = () => {
        analyser.getByteFrequencyData(samples);
        dispatch({ type: 'AUDIO_AMPLITUDE', value: samples.reduce((sum, value) => sum + value, 0) / samples.length / 255 });
        analyserFrameRef.current = requestAnimationFrame(updateAmplitude);
      };
      updateAmplitude();
      source.onended = () => {
        if (analyserFrameRef.current !== null) cancelAnimationFrame(analyserFrameRef.current);
        dispatch({ type: 'SPEECH_FINISHED' });
        speechSourceRef.current = null;
      };
      source.start();
    } catch (error) {
      dispatch({ type: 'WARNING', message: 'Speech playback failed; the text response is still available.' });
      notifyError('Voice playback failed', error instanceof Error ? error.message : 'Text remains available.');
    }
  }, [notifyError, notifyInfo, state.provider.voiceAvailable]);

  const send = useCallback(async (content: string, speakReply = false) => {
    const prompt = content.trim();
    if (!prompt || sendingRef.current) return;
    if (!state.provider.verified) {
      notifyError('VANTA is not verified', 'An owner or admin must verify the configured provider before conversation is enabled.');
      return;
    }
    const controller = new AbortController();
    requestAbortRef.current = controller;
    try {
      sendingRef.current = true;
      setRetrieval(null);
      dispatch({ type: 'PROMPT_ACCEPTED' });
      const id = await ensureConversation(controller.signal);
      controller.signal.throwIfAborted();
      const optimistic: VantaMessage = {
        id: `local-${Date.now()}`,
        conversationId: id,
        role: 'user',
        content: prompt,
        evidence: [],
        createdAt: new Date().toISOString(),
      };
      setMessages(previous => [...previous, optimistic]);
      setTranscriptOpen(true);
      speakAfterResponseRef.current = speakReply;

      await streamVantaMessage(id, prompt, localContexts.map(item => item.id), {
        onRetrieval: setRetrieval,
        onState: phase => {
          if (phase === 'error') dispatch({ type: 'FAILED', message: 'VANTA request failed.' });
        },
        onMessage: message => {
          setMessages(previous => [...previous, message]);
          setFocusedEntityIds(message.topologyEntityIds || []);
          dispatch({ type: 'RESPONSE_READY', hasProposal: Boolean(message.proposal) });
          if (speakAfterResponseRef.current) void playText(message.content);
        },
      }, controller.signal);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        dispatch({ type: 'WARNING', message: 'Request cancelled.' });
        return;
      }
      const message = error instanceof Error ? error.message : 'VANTA request failed.';
      dispatch({ type: 'FAILED', message });
      notifyError('VANTA request failed', message);
    } finally {
      sendingRef.current = false;
    }
  }, [ensureConversation, localContexts, notifyError, playText, state.provider.verified]);

  const attachFiles = useCallback(async (files: File[]) => {
    if (!files.length) return;
    try {
      const attached = await attachVantaLocalFiles(files);
      setLocalContexts(previous => [...previous, ...attached]);
      notifySuccess('Session context attached', `${attached.length} file${attached.length === 1 ? '' : 's'} will be discarded after the session window.`);
    } catch (error) {
      notifyError('Attachment failed', error instanceof Error ? error.message : 'The selected files could not be attached.');
    }
  }, [notifyError, notifySuccess]);

  const startListening = useCallback(async () => {
    if (!state.provider.voiceAvailable) {
      notifyInfo('Voice unavailable', 'Verify the configured voice provider first. Text input remains available.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = event => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        try {
          const transcript = await transcribeVantaAudio(new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' }));
          await send(transcript, true);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Transcription failed.';
          dispatch({ type: 'FAILED', message });
          notifyError('Transcription failed', message);
        }
      };
      const context = new AudioContext();
      audioContextRef.current = context;
      const analyser = context.createAnalyser();
      analyser.fftSize = 128;
      context.createMediaStreamSource(stream).connect(analyser);
      const samples = new Uint8Array(analyser.frequencyBinCount);
      const updateAmplitude = () => {
        analyser.getByteTimeDomainData(samples);
        const value = Math.sqrt(samples.reduce((sum, sample) => sum + ((sample - 128) / 128) ** 2, 0) / samples.length);
        dispatch({ type: 'AUDIO_AMPLITUDE', value: Math.min(1, value * 4) });
        analyserFrameRef.current = requestAnimationFrame(updateAmplitude);
      };
      updateAmplitude();
      recorder.start(250);
      recordingTimeoutRef.current = window.setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
        if (analyserFrameRef.current !== null) cancelAnimationFrame(analyserFrameRef.current);
        recordingTimeoutRef.current = null;
        dispatch({ type: 'VOICE_STOPPED' });
        notifyInfo('Voice capture stopped', 'Push-to-talk clips are limited to 60 seconds.');
      }, 60_000);
      dispatch({ type: 'VOICE_STARTED' });
    } catch (error) {
      const message = error instanceof DOMException && error.name === 'NotAllowedError' ? 'Microphone access was denied.' : 'Microphone is unavailable.';
      dispatch({ type: 'WARNING', message });
      notifyError('Cannot start listening', message);
    }
  }, [notifyError, notifyInfo, send, state.provider.voiceAvailable]);

  const stopListening = useCallback(() => {
    if (recordingTimeoutRef.current !== null) {
      window.clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    if (analyserFrameRef.current !== null) cancelAnimationFrame(analyserFrameRef.current);
    dispatch({ type: 'VOICE_STOPPED' });
  }, []);

  const approveMemory = useCallback(async (content: string, sourceMessageId?: string) => {
    try {
      dispatch({ type: 'AWAITING_CONFIRMATION' });
      await saveVantaMemory(content, sourceMessageId);
      dispatch({ type: 'ACTION_OPENED' });
      notifySuccess('Memory approved', 'VANTA can use this durable memory in future grounded answers.');
    } catch (error) {
      notifyError('Memory was not saved', error instanceof Error ? error.message : 'Approval failed.');
    }
  }, [notifyError, notifySuccess]);

  const dispatchProposal = useCallback(async (proposal: NonNullable<VantaMessage['proposal']>) => {
    try {
      dispatch({ type: 'AWAITING_CONFIRMATION' });
      const result = await dispatchVantaProposal(proposal);
      dispatch({ type: 'ACTION_OPENED' });
      notifySuccess('Mission queued for approval', `${result.task.agentName} · ${result.dispatchPlan['executionSubAgentIds'] ? 'bounded plan' : 'focused plan'}. An owner or admin must approve it before execution.`);
    } catch (error) {
      dispatch({ type: 'WARNING', message: 'Mission was not queued.' });
      notifyError('Mission was not queued', error instanceof Error ? error.message : 'Dispatch failed.');
      throw error;
    }
  }, [notifyError, notifySuccess]);

  const loadConversation = useCallback(async (id: string) => {
    try {
      setMessages(await getVantaMessages(id));
      setConversationId(id);
      setTranscriptOpen(true);
    } catch (error) {
      notifyError('Conversation unavailable', error instanceof Error ? error.message : 'This conversation could not be loaded.');
    }
  }, [notifyError]);

  const setConversationShared = useCallback(async (shared: boolean) => {
    if (!conversationId) return;
    try {
      await shareVantaConversation(conversationId, shared);
      setConversations(previous => previous.map(item => item.id === conversationId ? { ...item, visibility: shared ? 'workspace' : 'private' } : item));
      notifySuccess(shared ? 'Conversation shared' : 'Conversation made private', shared ? 'Workspace members can now read this conversation.' : 'Only you can read this conversation.');
    } catch (error) {
      notifyError('Sharing was not changed', error instanceof Error ? error.message : 'The conversation could not be updated.');
    }
  }, [conversationId, notifyError, notifySuccess]);

  const deleteCurrentConversation = useCallback(async () => {
    if (!conversationId) return;
    try {
      await deleteVantaConversation(conversationId);
      setConversations(previous => previous.filter(item => item.id !== conversationId));
      setConversationId(null);
      setMessages([]);
      notifySuccess('Conversation deleted');
    } catch (error) {
      notifyError('Conversation was not deleted', error instanceof Error ? error.message : 'Deletion failed.');
    }
  }, [conversationId, notifyError, notifySuccess]);

  const value = useMemo<VantaContextValue>(() => ({
    state,
    retrieval,
    messages,
    conversations,
    conversationId,
    topology,
    fullTopology,
    topologyExpanded,
    setTopologyExpanded,
    selectedNodeId,
    setSelectedNodeId,
    dockOpen,
    setDockOpen,
    transcriptOpen,
    setTranscriptOpen,
    localContexts,
    send,
    attachFiles,
    startListening,
    stopListening,
    playMessage: message => playText(message.content),
    approveMemory,
    dispatchProposal,
    refreshStatus,
    newConversation: () => { setConversationId(null); setMessages([]); setFocusedEntityIds([]); },
    loadConversation,
    setConversationShared,
    deleteCurrentConversation,
    toggleInspect: () => dispatch({ type: state.inspectMode ? 'INSPECT_FINISHED' : 'INSPECT_STARTED' }),
    stop: () => {
      requestAbortRef.current?.abort();
      try { speechSourceRef.current?.stop(); } catch { /* already stopped */ }
      speechSourceRef.current = null;
      dispatch({ type: 'RESET' });
    },
  }), [approveMemory, attachFiles, conversationId, conversations, deleteCurrentConversation, dockOpen, fullTopology, loadConversation, localContexts, messages, playText, refreshStatus, selectedNodeId, send, setConversationShared, startListening, state, retrieval, stopListening, topology, topologyExpanded, transcriptOpen]);

  return <VantaContext.Provider value={value}>{children}</VantaContext.Provider>;
}

export function useVanta() {
  const context = useContext(VantaContext);
  if (!context) throw new Error('useVanta must be used within a VantaProvider');
  return context;
}
