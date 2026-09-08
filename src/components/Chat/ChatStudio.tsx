import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Mic,
  MicOff,
  Volume2,
  Pause,
  
  Square,
  Loader2,
  ArrowUp, 
  Copy, 
  Check, 
  ThumbsUp, 
  ThumbsDown, 
  FileText, 
  FileSpreadsheet, 
  X,
  FileCheck,
  Plus,
  Brain,
  Zap,
  AlertCircle,
  Sparkles,
  GitFork,
  Database,
  CheckCheck,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { DocumentItem, ChatMessage, SourceCitation, UserProfile } from '../../types';
import { chatApi } from '../../services/chatApi';
import { voiceApi, VoiceProfile } from '../../services/voiceApi';
import './ChatStudio.css';

export function formatISTDateTime(dateInput?: string | number | Date): string {
  if (!dateInput) {
    dateInput = new Date();
  }
  const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';

  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };

  const formatted = new Intl.DateTimeFormat('en-IN', options).format(d);
  return `${formatted} IST`;
}

// Normalizes markdown formatting (e.g. table pipes)
export function formatMarkdownContent(rawText: string): string {
  if (!rawText) return '';
  return rawText.replace(/\|\|\s*\|?/g, '|\n| ');
}

// Custom Markdown Components for external links opening in a new tab
const markdownComponents = {
  a: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    let validHref = href || '';
    if (
      validHref &&
      !validHref.startsWith('http://') &&
      !validHref.startsWith('https://') &&
      !validHref.startsWith('mailto:') &&
      !validHref.startsWith('tel:') &&
      !validHref.startsWith('#')
    ) {
      validHref = `https://${validHref}`;
    }
    return (
      <a
        href={validHref}
        target="_blank"
        rel="noopener noreferrer"
        className="chat-link-highlight"
        {...props}
      >
        {children}
        <ExternalLink size={11} className="link-ext-icon" />
      </a>
    );
  }
};

interface ChatStudioProps {
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onSessionCreated?: (session: { id: string; title: string }) => void;
  onSessionTitleUpdated?: (sessionId: string, title: string) => void;
  onNavigateToIngestion: () => void;
  docCount: number;
  documents?: DocumentItem[];
  onOpenCommandPalette: () => void;
  userProfile?: UserProfile | null;
  selectedModel?: string;
  customApiKey?: string;
  customBaseUrl?: string;
  onOpenModelModal?: () => void;
}

// Fast in-memory & localStorage session cache (0ms instant route switching, stale-while-revalidate)
const sessionMemoryCache: Record<string, ChatMessage[]> = {};

export function getCachedSessionMessages(sessionId: string): ChatMessage[] | null {
  if (!sessionId) return null;
  if (sessionMemoryCache[sessionId] && sessionMemoryCache[sessionId].length > 0) {
    return sessionMemoryCache[sessionId];
  }
  try {
    const raw = localStorage.getItem(`noesis_chat_${sessionId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        sessionMemoryCache[sessionId] = parsed;
        return parsed;
      }
    }
  } catch (e) {}
  return null;
}

export function setCachedSessionMessages(sessionId: string, msgs: ChatMessage[]) {
  if (!sessionId || !Array.isArray(msgs)) return;
  sessionMemoryCache[sessionId] = msgs;
  try {
    localStorage.setItem(`noesis_chat_${sessionId}`, JSON.stringify(msgs));
  } catch (e) {}
}

export function evictSessionCache(sessionId?: string) {
  if (sessionId) {
    delete sessionMemoryCache[sessionId];
    try { localStorage.removeItem(`noesis_chat_${sessionId}`); } catch (e) {}
  } else {
    for (const key of Object.keys(sessionMemoryCache)) {
      delete sessionMemoryCache[key];
    }
  }
}

export default function ChatStudio({ 
  currentSessionId,
  onSelectSession,
  onSessionCreated,
  onSessionTitleUpdated,
  onNavigateToIngestion, 
  docCount, 
  documents = [], 
  onOpenCommandPalette,
  userProfile,
  selectedModel = 'inbuilt',
  customApiKey = '',
  customBaseUrl = '',
  onOpenModelModal
}: ChatStudioProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return getCachedSessionMessages(currentSessionId) || [];
  });
  const [input, setInput] = useState<string>('');
  // In-Chat Document Selector & @Mention State
  const [taggedDocuments, setTaggedDocuments] = useState<DocumentItem[]>([]);
  const [isDocMentionOpen, setIsDocMentionOpen] = useState<boolean>(false);
  const [docMentionQuery, setDocMentionQuery] = useState<string>('');
  const [docMentionIndex, setDocMentionIndex] = useState<number>(0);
  const mentionDropdownRef = useRef<HTMLDivElement>(null);

  // Voice STT & TTS States
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | number | null>(null);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState<string | number | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(() => {
    return parseFloat(localStorage.getItem('noesis_voice_speed') || '1.0');
  });
  const [selectedVoice, setSelectedVoice] = useState<string>(() => {
    return localStorage.getItem('noesis_selected_voice') || 'en-US-ChristopherNeural';
  });
  const [availableVoices, setAvailableVoices] = useState<VoiceProfile[]>([]);
  const [showVoiceMenu, setShowVoiceMenu] = useState<boolean>(false);
  const [loadingAudioMsgId, setLoadingAudioMsgId] = useState<string | number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    voiceApi.getVoices().then((voices) => {
      if (voices && voices.length > 0) setAvailableVoices(voices);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current.src = '';
        activeAudioRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleToggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];
        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
          setIsRecording(false);
          setIsTranscribing(true);
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          stream.getTracks().forEach((track) => track.stop());

          try {
            const transcript = await voiceApi.transcribeAudio(audioBlob);
            if (transcript && transcript.trim()) {
              setInput((prev) => (prev ? `${prev} ${transcript.trim()}` : transcript.trim()));
            }
          } catch (err) {
            console.error('STT transcription error:', err);
          } finally {
            setIsTranscribing(false);
          }
        };

        mediaRecorderRef.current = recorder;
        recorder.start(250);
        setIsRecording(true);
      } catch (err) {
        console.error('Failed to access microphone:', err);
        alert('Microphone access is required for voice typing.');
      }
    }
  };

  const handleCycleSpeed = () => {
    const speeds = [0.8, 1.0, 1.25, 1.5, 2.0];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    setPlaybackSpeed(newSpeed);
    localStorage.setItem('noesis_voice_speed', String(newSpeed));
    if (activeAudioRef.current) {
      activeAudioRef.current.playbackRate = newSpeed;
    }
  };

  const handleToggleSpeak = (msgId: string | number, text: string) => {
    // If currently playing or loading this message, stop and cancel immediately
    if (playingMessageId === msgId || loadingAudioMsgId === msgId) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current.src = '';
        activeAudioRef.current = null;
      }
      setPlayingMessageId(null);
      setLoadingAudioMsgId(null);
      return;
    }

    // Stop any previously playing audio
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.src = '';
      activeAudioRef.current = null;
    }

    const cleanedText = voiceApi.cleanText(text);
    if (!cleanedText) {
      setLoadingAudioMsgId(null);
      setPlayingMessageId(null);
      return;
    }

    setLoadingAudioMsgId(msgId);
    setPlayingMessageId(null);

    try {
      // Direct stream URL connects to FastAPI Edge-TTS stream with LRU audio caching
      const streamUrl = voiceApi.getStreamUrl(text, selectedVoice);
      const audio = new Audio(streamUrl);
      audio.playbackRate = playbackSpeed;
      audio.preload = 'auto';

      audio.onplay = () => {
        setLoadingAudioMsgId(null);
        setPlayingMessageId(msgId);
      };

      audio.onplaying = () => {
        setLoadingAudioMsgId(null);
        setPlayingMessageId(msgId);
      };

      audio.onended = () => {
        setPlayingMessageId(null);
        setLoadingAudioMsgId(null);
        activeAudioRef.current = null;
      };

      audio.onerror = (e) => {
        console.error('Edge-TTS playback error:', e);
        setPlayingMessageId(null);
        setLoadingAudioMsgId(null);
        activeAudioRef.current = null;
      };

      activeAudioRef.current = audio;
      audio.play().catch((err) => {
        console.error('Audio play invocation error:', err);
        setPlayingMessageId(null);
        setLoadingAudioMsgId(null);
        activeAudioRef.current = null;
      });
    } catch (err) {
      console.error('TTS stream initialization failed:', err);
      setPlayingMessageId(null);
      setLoadingAudioMsgId(null);
    }
  };

  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingText, setStreamingText] = useState<string>('');
  const [streamingCitations, setStreamingCitations] = useState<SourceCitation[]>([]);
  const [activeNodeStatus, setActiveNodeStatus] = useState<{ node: string; message: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | string | null>(null);
  const [activeSource, setActiveSource] = useState<SourceCitation | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // 360Â° Interactive Cursor / Touch Rotation Physics
  const [rotX, setRotX] = useState<number>(0);
  const [rotY, setRotY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; rotX: number; rotY: number }>({ x: 0, y: 0, rotX: 0, rotY: 0 });

  // User input history
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [tempDraft, setTempDraft] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingSessionIdRef = useRef<string | null>(null);

  // Load session messages when currentSessionId changes (stale-while-revalidate)
  useEffect(() => {
    // If a stream is active for this session, do not fetch from DB and overwrite live state
    if (streamingSessionIdRef.current && streamingSessionIdRef.current === currentSessionId) {
      return;
    }

    if (!currentSessionId) {
      setMessages([]);
      setStreamingText('');
      setStreamingCitations([]);
      setActiveNodeStatus(null);
      setErrorMessage(null);
      setIsLoadingHistory(false);
      return;
    }

    // 1. Instant Cache Render (0ms transition without jarring loading spinner)
    const cached = getCachedSessionMessages(currentSessionId);
    if (cached && cached.length > 0) {
      setMessages(cached);
      setIsLoadingHistory(false);
    } else {
      setMessages([]);
      setIsLoadingHistory(true);
    }

    let isSubscribed = true;
    setErrorMessage(null);

    // 2. Background Revalidation from Backend
    chatApi.getSession(currentSessionId)
      .then((data) => {
        if (isSubscribed) {
          if (data && Array.isArray(data.messages)) {
            setMessages(data.messages);
            setCachedSessionMessages(currentSessionId, data.messages);
          } else if (!cached) {
            setMessages([]);
          }
        }
      })
      .catch((err) => {
        if (isSubscribed) {
          console.error('Error fetching session history:', err);
          if (!cached) {
            setErrorMessage('Could not load conversation history.');
          }
        }
      })
      .finally(() => {
        if (isSubscribed) {
          setIsLoadingHistory(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [currentSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeNodeStatus, streamingText]);

  // Global Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenCommandPalette();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenCommandPalette]);

  // 360Â° Interactive Rotation Handlers (Mouse & Touch)
  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'clientX' in e ? e.clientX : e.touches?.[0]?.clientX ?? 0;
    const clientY = 'clientY' in e ? e.clientY : e.touches?.[0]?.clientY ?? 0;
    dragStartRef.current = { x: clientX, y: clientY, rotX, rotY };
  };

  const handlePointerMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'clientX' in e ? e.clientX : (e as TouchEvent).touches?.[0]?.clientX ?? 0;
    const clientY = 'clientY' in e ? e.clientY : (e as TouchEvent).touches?.[0]?.clientY ?? 0;
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    
    setRotY(dragStartRef.current.rotY + deltaX * 0.95);
    setRotX(dragStartRef.current.rotX - deltaY * 0.95);
  }, [isDragging]);

  useEffect(() => {
    const onUp = () => setIsDragging(false);
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (isDragging) {
        handlePointerMove(e);
      }
    };
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove);
    return () => {
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
    };
  }, [isDragging, handlePointerMove]);

  // User time-based greeting
  const greetingInfo = useMemo(() => {
    const hour = new Date().getHours();
    let timeGreeting = "Good morning";
    if (hour >= 12 && hour < 17) {
      timeGreeting = "Good afternoon";
    } else if (hour >= 17 || hour < 4) {
      timeGreeting = "Good evening";
    }

    const rawName = userProfile?.name || (userProfile?.email ? userProfile.email.split('@')[0] : '');
    const firstName = rawName.trim() ? rawName.trim().split(' ')[0] : '';
    return {
      timeGreeting,
      displayName: firstName || 'there',
    };
  }, [userProfile]);

  // Dynamically compute suggestions directly based on uploaded documents
  interface SuggestionCard {
    icon: React.ReactNode;
    badgeColor: string;
    title: string;
    subtitle: string;
    query: string;
  }

  const dynamicSuggestionCards: SuggestionCard[] = useMemo(() => {
    if (!documents || documents.length === 0) {
      return [
        {
          icon: <FileText size={15} className="badge-icon-rose" />,
          badgeColor: "rose",
          title: "Upload & Ingest",
          subtitle: "Attach PDFs, spreadsheets, or docs to query",
          query: "What types of documents can I upload and analyze in Noesis?"
        },
        {
          icon: <FileSpreadsheet size={15} className="badge-icon-emerald" />,
          badgeColor: "emerald",
          title: "Analyze Tables",
          subtitle: "Extract structured tables and tabular figures",
          query: "How do you extract and reason over structured tables in documents?"
        },
        {
          icon: <Sparkles size={15} className="badge-icon-amber" />,
          badgeColor: "amber",
          title: "Grounded Synthesis",
          subtitle: "Synthesize insights with verifiable source citations",
          query: "How do source citations and grounded verification work in this assistant?"
        },
        {
          icon: <Brain size={15} className="badge-icon-indigo" />,
          badgeColor: "indigo",
          title: "pgvector Search",
          subtitle: "Learn how neural retrieval and reranking works",
          query: "How does the pgvector neural retrieval pipeline work in Noesis?"
        }
      ];
    }

    const cards: SuggestionCard[] = [];

    documents.slice(0, 4).forEach((doc, idx) => {
      const isPdf = doc.format === 'PDF' || doc.name.toLowerCase().endsWith('.pdf');
      const isSheet = doc.format === 'Excel' || doc.format === 'CSV' || doc.name.toLowerCase().endsWith('.xlsx') || doc.name.toLowerCase().endsWith('.csv');
      const cleanName = doc.name.replace(/\.[^/.]+$/, "");

      if (isPdf) {
        if (idx % 2 === 0) {
          cards.push({
            icon: <FileText size={15} className="badge-icon-rose" />,
            badgeColor: "rose",
            title: `Summarize ${cleanName}`,
            subtitle: "Executive overview & main conclusions",
            query: `Provide an executive summary and key findings of ${doc.name}`
          });
        } else {
          cards.push({
            icon: <Sparkles size={15} className="badge-icon-amber" />,
            badgeColor: "amber",
            title: `Key Facts in ${cleanName}`,
            subtitle: "Extract core metrics, figures & takeaways",
            query: `What are the most important facts, metrics, and figures mentioned in ${doc.name}?`
          });
        }
      } else if (isSheet) {
        cards.push({
          icon: <FileSpreadsheet size={15} className="badge-icon-emerald" />,
          badgeColor: "emerald",
          title: `Analyze ${cleanName}`,
          subtitle: "Calculate trends, rows & tabular figures",
          query: `Analyze and extract the key data points and tabular numbers from ${doc.name}`
        });
      } else {
        cards.push({
          icon: <FileCheck size={15} className="badge-icon-cyan" />,
          badgeColor: "cyan",
          title: `Explore ${cleanName}`,
          subtitle: "Synthesize topics and sections",
          query: `Explain the core concepts and topics discussed in ${doc.name}`
        });
      }
    });

    if (documents.length > 1 && cards.length < 4) {
      cards.push({
        icon: <GitFork size={15} className="badge-icon-indigo" />,
        badgeColor: "indigo",
        title: "Cross-Document Insights",
        subtitle: `Compare themes across all ${documents.length} files`,
        query: "Compare and synthesize the main themes across all my uploaded documents"
      });
    }

    // Always ensure exactly 4 cards for a balanced 2x2 grid
    if (cards.length === 3 && documents.length >= 1) {
      const primaryDoc = documents[0];
      cards.push({
        icon: <HelpCircle size={15} className="badge-icon-cyan" />,
        badgeColor: "cyan",
        title: `Q&A on ${primaryDoc.name.replace(/\.[^/.]+$/, "")}`,
        subtitle: "Ask targeted questions on this document",
        query: `What are the most notable findings and critical points from ${primaryDoc.name}?`
      });
    }

    const fallbacks: SuggestionCard[] = [
      {
        icon: <Brain size={15} className="badge-icon-indigo" />,
        badgeColor: "indigo",
        title: "Semantic Analysis",
        subtitle: "Synthesize insights across all indexed passages",
        query: "Provide a comprehensive summary of all uploaded documents."
      },
      {
        icon: <FileSpreadsheet size={15} className="badge-icon-emerald" />,
        badgeColor: "emerald",
        title: "Tabular Metrics",
        subtitle: "Extract figures, statistics & tabular data",
        query: "Extract and list all quantitative figures and tables found in the documents."
      },
      {
        icon: <Sparkles size={15} className="badge-icon-amber" />,
        badgeColor: "amber",
        title: "Key Highlights",
        subtitle: "Discover high-priority facts & findings",
        query: "What are the most essential takeaways from my knowledge base?"
      }
    ];

    let fbIdx = 0;
    while (cards.length < 4 && fbIdx < fallbacks.length) {
      cards.push(fallbacks[fbIdx]);
      fbIdx++;
    }

    return cards.slice(0, 4);
  }, [documents]);

  const getNodeDisplay = (nodeName: string): { label: string; icon: React.ReactNode } => {
    const name = nodeName.toLowerCase();
    if (name.includes('summariz')) {
      return { label: 'Context Summarization', icon: <Brain size={13} /> };
    }
    if (name.includes('rout')) {
      return { label: 'Query Intent Routing', icon: <GitFork size={13} /> };
    }
    if (name.includes('retriev')) {
      return { label: 'Vector & Keyword Retrieval', icon: <Database size={13} /> };
    }
    if (name.includes('grad')) {
      return { label: 'Relevance Grading & Verification', icon: <CheckCheck size={13} /> };
    }
    if (name.includes('generat')) {
      return { label: 'Stateful Synthesis', icon: <Sparkles size={13} /> };
    }
    return { label: `Processing (${nodeName})`, icon: <Zap size={13} /> };
  };

  
    const getDocName = (d: any): string => {
    return d?.fileName || d?.filename || d?.name || d?.document_name || 'Document';
  };

  const filteredMentionDocs = useMemo(() => {
    if (!docMentionQuery) return documents;
    const q = docMentionQuery.toLowerCase();
    return documents.filter(d => getDocName(d).toLowerCase().includes(q));
  }, [documents, docMentionQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    const lastAtPos = val.lastIndexOf('@');
    if (lastAtPos !== -1 && (lastAtPos === 0 || val[lastAtPos - 1] === ' ')) {
      const mentionText = val.slice(lastAtPos + 1);
      if (!mentionText.includes(' ')) {
        setDocMentionQuery(mentionText);
        setIsDocMentionOpen(true);
        setDocMentionIndex(0);
        return;
      }
    }
    setIsDocMentionOpen(false);
  };

  const handleTagDocument = (doc: DocumentItem) => {
    if (!taggedDocuments.some(d => d.id === doc.id)) {
      setTaggedDocuments(prev => [...prev, doc]);
    }
    const lastAtPos = input.lastIndexOf('@');
    if (lastAtPos !== -1) {
      const before = input.slice(0, lastAtPos);
      setInput(before.trim() ? before + ' ' : '');
    }
    setIsDocMentionOpen(false);
    inputRef.current?.focus();
  };

  const handleRemoveTag = (docId: number) => {
    setTaggedDocuments(prev => prev.filter(d => d.id !== docId));
  };

  const handleSend = async (e?: React.FormEvent | null, overridePrompt?: string) => {
    e?.preventDefault();
    const queryToSend = overridePrompt || input.trim();
    if (!queryToSend || isStreaming) return;

    setInputHistory(prev => [queryToSend, ...prev]);
    setHistoryIndex(-1);
    setTempDraft('');
    setErrorMessage(null);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: queryToSend,
      taggedDocs: taggedDocuments.map(d => getDocName(d)),
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTaggedDocuments([]); // Auto-clear tagged document chip upon sending
    setIsStreaming(true);
    setStreamingText('');
    setStreamingCitations([]);
    setActiveNodeStatus({ node: 'router', message: 'Analyzing query intent...' });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let accumulatedText = '';
    let accumulatedCitations: SourceCitation[] = [];
    let activeSession = currentSessionId;
    streamingSessionIdRef.current = activeSession || 'STREAMING_NEW';

    try {
      // Map tagged documents to integer IDs, or filename string if ID is non-numeric
      const docIdsToSend = taggedDocuments
        .map(d => {
          const num = Number(d.id);
          if (!isNaN(num) && num > 0) return num;
          return getDocName(d);
        })
        .filter(Boolean);

      await chatApi.streamChat({
        question: queryToSend,
        sessionId: activeSession || null,
        documentIds: docIdsToSend.length > 0 ? (docIdsToSend as any) : null,
        modelName: selectedModel === 'inbuilt' ? undefined : selectedModel,
        apiKey: customApiKey || undefined,
        modelProvider: selectedModel === 'inbuilt' ? 'inbuilt' : undefined,
        signal: controller.signal,
        onMetadata: (meta) => {
          if (meta.session_id) {
            activeSession = meta.session_id;
            streamingSessionIdRef.current = meta.session_id;
            window.history.replaceState(null, '', `/c/${meta.session_id}`);
            onSelectSession(meta.session_id);
            if (onSessionCreated) {
              onSessionCreated({
                id: meta.session_id,
                title: meta.title || queryToSend.slice(0, 32)
              });
            }
          }
        },
        onNodeStatus: (status) => {
          const display = getNodeDisplay(status.node);
          setActiveNodeStatus({
            node: status.node,
            message: status.thought || status.message || display.label
          });
        },
        onToken: (token) => {
          accumulatedText += token;
          setStreamingText(accumulatedText);
          setActiveNodeStatus(null);
        },
        onCitations: (citations) => {
          accumulatedCitations = citations;
          setStreamingCitations(citations);
        },
        onDone: (data) => {
          if (data?.title && activeSession && onSessionTitleUpdated) {
            onSessionTitleUpdated(activeSession, data.title);
          }
        },
        onError: (err) => {
          console.error('Chat stream failed:', err);
          setErrorMessage(err.message || 'Failed to receive response from backend.');
        }
      });

      // Stream completed successfully, save final AI message into state and update session cache
      if (accumulatedText.trim()) {
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          type: 'ai',
          content: accumulatedText,
          sources: accumulatedCitations.length > 0 ? accumulatedCitations : undefined,
          createdAt: new Date().toISOString()
        };
        setMessages(prev => {
          const nextMsgs = [...prev, aiMsg];
          if (activeSession) {
            setCachedSessionMessages(activeSession, nextMsgs);
          }
          return nextMsgs;
        });
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Unhandled stream error:', err);
        setErrorMessage(err.message || 'Connection error with RAG backend.');
      }
    } finally {
      setIsStreaming(false);
      setStreamingText('');
      setStreamingCitations([]);
      setActiveNodeStatus(null);
      abortControllerRef.current = null;
      streamingSessionIdRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isDocMentionOpen && filteredMentionDocs.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setDocMentionIndex(prev => (prev + 1) % filteredMentionDocs.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setDocMentionIndex(prev => (prev - 1 + filteredMentionDocs.length) % filteredMentionDocs.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleTagDocument(filteredMentionDocs[docMentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setIsDocMentionOpen(false);
        return;
      }
    }
    if (e.key === 'ArrowUp') {
      if (inputHistory.length === 0) return;
      if (historyIndex === -1) {
        setTempDraft(input);
        const nextIndex = 0;
        setHistoryIndex(nextIndex);
        setInput(inputHistory[nextIndex]);
      } else if (historyIndex < inputHistory.length - 1) {
        const nextIndex = historyIndex + 1;
        setHistoryIndex(nextIndex);
        setInput(inputHistory[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      if (historyIndex > 0) {
        const prevIndex = historyIndex - 1;
        setHistoryIndex(prevIndex);
        setInput(inputHistory[prevIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput(tempDraft);
      }
    }
  };

  const copyText = (text: string, id: number | string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="chatgpt-canvas-root">
      {/* Full-width scroll area (scrollbar at the far right edge of the screen) */}
      <div className="chatgpt-scroll-area">
        <div className="chatgpt-messages-viewport">
        {isLoadingHistory ? (
          <div className="chatgpt-hero-empty anim-fade-in">
            <div className="node-spinner-ring" style={{ width: '28px', height: '28px', borderWidth: '3px' }}></div>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Loading conversation history...</span>
          </div>
        ) : messages.length === 0 && !isStreaming ? (
          /* Symmetrical 4-Plane Gyroscopic Solar System */
          <div className="chatgpt-hero-empty anim-fade-in">
            {/* 3D Multi-Shell Solar Gyroscopic System with 360Â° Drag & Touch Control */}
            <div 
              className={`neural-3d-scene ${isDragging ? 'is-dragging' : ''}`}
              onMouseDown={handlePointerDown}
              onTouchStart={handlePointerDown}
              data-tooltip="Click and drag with mouse or touch to rotate 360Â° in 3D"
            >
              {/* Central Volumetric 3D Sphere (Static) */}
              <div className="volumetric-3d-sphere">
                <Brain size={22} className="sphere-brain-hologram" />
              </div>

              {/* Interactive 3D Rotator Wrapper */}
              <div 
                className="interactive-3d-rotator"
                style={{
                  transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`
                }}
              >
                <div className="neural-3d-floating-system">
                  {/* 1. Horizontal Equatorial Ring */}
                  <div className="gyro-3d-ring gyro-equatorial">
                    <div className="planet-revolver rev-eq">
                      <div className="orbit-planet">
                        <div className="sub-moon-orbit moon-orbit-eq">
                          <div className="sub-moon"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. +45Â° Tilted Ring */}
                  <div className="gyro-3d-ring gyro-tilt-pos">
                    <div className="planet-revolver rev-pos">
                      <div className="orbit-planet">
                        <div className="sub-moon-orbit moon-orbit-pos">
                          <div className="sub-moon"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. -45Â° Tilted Ring */}
                  <div className="gyro-3d-ring gyro-tilt-neg">
                    <div className="planet-revolver rev-neg">
                      <div className="orbit-planet">
                        <div className="sub-moon-orbit moon-orbit-neg">
                          <div className="sub-moon"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. 90Â° Polar Ring */}
                  <div className="gyro-3d-ring gyro-polar-90">
                    <div className="planet-revolver rev-polar">
                      <div className="orbit-planet">
                        <div className="sub-moon-orbit moon-orbit-polar">
                          <div className="sub-moon"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floor Shadow */}
              <div className="neural-3d-floor-shadow"></div>
            </div>

            <div className="hero-greeting-container anim-slide-up">
              <h1 className="chatgpt-hero-prompt">What can I help with?</h1>
              <span className="hero-salutation-text">
                {greetingInfo.timeGreeting}, {greetingInfo.displayName} • Select a prompt below or ask anything
              </span>
            </div>

            {/* Dynamic Suggestion Cards Grid (Always 2x2 Complete) */}
            <div className="hero-suggestions-grid anim-slide-up">
              {dynamicSuggestionCards.map((card, idx) => (
                <button 
                  key={idx} 
                  className="suggestion-tile-card"
                  onClick={() => handleSend(null, card.query)}
                >
                  <div className={`tile-icon-box badge-${card.badgeColor}`}>
                    {card.icon}
                  </div>
                  <div className="tile-text-box">
                    <span className="tile-title">{card.title}</span>
                    <span className="tile-subtitle">{card.subtitle}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`chatgpt-msg-row ${msg.type} anim-slide-up`}>
              {msg.type === 'user' ? (
                <div className="user-message-group anim-slide-up">
                  <div className="user-message-bubble">
                    {(msg as any).taggedDocs && (msg as any).taggedDocs.length > 0 && (
                      <div className="user-attached-docs-row">
                        {(msg as any).taggedDocs.map((docName: string, idx: number) => (
                          <span key={idx} className="user-attached-doc-badge">
                            <FileText size={11} className="text-indigo-400" />
                            <span className="user-attached-doc-text">{docName}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="user-message-text">{msg.content}</div>
                  </div>
                  <div className="user-actions-row">
                    <span className="msg-timestamp">{formatISTDateTime(msg.createdAt)}</span>
                    <button 
                      className={`action-icon-btn user-copy-btn ${copiedId === msg.id ? 'is-copied' : ''}`} 
                      onClick={() => copyText(msg.content, msg.id)}
                      data-tooltip="Copy question"
                    >
                      {copiedId === msg.id ? <Check size={12} className="text-accent" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="ai-message-card anim-slide-up">
                  {/* Formatted Content */}
                  <div className="ai-markdown-body">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={markdownComponents}
                    >
                      {formatMarkdownContent(msg.content)}
                    </ReactMarkdown>
                  </div>

                  {/* Sleek Numbered Citation Pills */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="sources-container">
                      {msg.sources.map((src, sIdx) => (
                        <button 
                          key={src.id || sIdx} 
                          className="perplexity-source-pill"
                          onClick={() => setActiveSource(src)}
                          data-tooltip={`View passage from ${src.fileName}`}
                        >
                          <span className="source-num-badge">{sIdx + 1}</span>
                          <FileText size={11} className="source-file-icon" />
                          <span className="source-name-text">{src.fileName}</span>
                          {src.page && <span className="source-page-text">• {src.page}</span>}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Action Icons */}
                  <div className="ai-actions-row">
                    <span className="msg-timestamp">{formatISTDateTime(msg.createdAt)}</span>
                    {(msg.modelName || msg.modelProvider) && (
                      <span className="msg-model-badge" title={`Synthesized by ${msg.modelName || msg.modelProvider}`}>
                        <Sparkles size={11} className="inline mr-1 text-indigo-400" />
                        {msg.modelName || msg.modelProvider}
                      </span>
                    )}
                    <button 
                      className={`action-icon-btn ${copiedId === msg.id ? 'is-copied' : ''}`} 
                      onClick={() => copyText(msg.content, msg.id)}
                      data-tooltip="Copy response"
                    >
                      {copiedId === msg.id ? <Check size={13} className="text-accent" /> : <Copy size={13} />}
                    </button>
                    {/* TTS Voice Speaker / Pause Button */}
                    <button 
                      className={`action-icon-btn voice-tts-btn ${playingMessageId === msg.id ? 'is-speaking' : ''} ${loadingAudioMsgId === msg.id ? 'is-loading' : ''}`}
                      onClick={() => handleToggleSpeak(msg.id, msg.content)}
                      data-tooltip={loadingAudioMsgId === msg.id ? 'Buffering neural voice...' : playingMessageId === msg.id ? 'Pause audio' : 'Listen to response (Neural Voice)'}
                    >
                      {loadingAudioMsgId === msg.id ? (
                        <Loader2 size={14} className="animate-spin text-indigo-400" />
                      ) : playingMessageId === msg.id ? (
                        <Pause size={14} strokeWidth={2.5} className="text-indigo-400" />
                      ) : (
                        <Volume2 size={15} strokeWidth={2.2} />
                      )}
                    </button>

                    {/* Playback Speed Controller Pill */}
                    {playingMessageId === msg.id && (
                      <button
                        type="button"
                        className="playback-speed-pill anim-pop-in"
                        onClick={handleCycleSpeed}
                        data-tooltip="Playback Speed: Click to cycle (0.8x, 1x, 1.25x, 1.5x, 2x)"
                      >
                        {playbackSpeed}x
                      </button>
                    )}
                    <button className="action-icon-btn" data-tooltip="Good response"><ThumbsUp size={14} /></button>
                    <button className="action-icon-btn" data-tooltip="Bad response"><ThumbsDown size={14} /></button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {/* Live LangGraph Node Status & Real-time Streaming State */}
        {isStreaming && (
          <div className="chatgpt-msg-row ai anim-slide-up">
            <div className="ai-message-card">
              {/* Dynamic Live LangGraph Neural Pipeline Reasoning Beam */}
              {activeNodeStatus && (
                <div className="neural-reasoning-beam anim-slide-up">
                  <div className="neural-beam-orb">
                    <div className="orb-pulse-ring"></div>
                    <div className="orb-inner-core"></div>
                  </div>
                  
                  <div className="neural-wave-bars">
                    <span className="wave-bar bar-1"></span>
                    <span className="wave-bar bar-2"></span>
                    <span className="wave-bar bar-3"></span>
                    <span className="wave-bar bar-4"></span>
                  </div>

                  <div className="reasoning-node-tag">
                    <span className="reasoning-node-icon">
                      {getNodeDisplay(activeNodeStatus.node).icon}
                    </span>
                    <span className="reasoning-node-name">{activeNodeStatus.node}</span>
                  </div>

                  <span className="reasoning-shimmer-text">
                    {activeNodeStatus.message}
                  </span>
                </div>
              )}

              {/* Streaming Tokens */}
              {streamingText && (
                <div className="ai-markdown-body">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {formatMarkdownContent(streamingText)}
                  </ReactMarkdown>
                  <span className="typing-cursor"></span>
                </div>
              )}

              {/* Streaming Citations */}
              {streamingCitations.length > 0 && (
                <div className="sources-container anim-fade-in">
                  {streamingCitations.map((src, sIdx) => (
                    <button 
                      key={src.id || sIdx} 
                      className="perplexity-source-pill"
                      onClick={() => setActiveSource(src)}
                      data-tooltip={`View passage from ${src.fileName}`}
                    >
                      <span className="source-num-badge">{sIdx + 1}</span>
                      <FileText size={11} className="source-file-icon" />
                      <span className="source-name-text">{src.fileName}</span>
                      {src.page && <span className="source-page-text">• {src.page}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="chat-error-banner anim-slide-up">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>

      {/* Floating Bottom Console */}
      <div className="chatgpt-input-wrapper">
        {/* Autocomplete @mention Popover */}
        {isDocMentionOpen && filteredMentionDocs.length > 0 && (
          <div ref={mentionDropdownRef} className="doc-mention-popover anim-slide-up">
            <div className="doc-mention-header">
              <Sparkles size={13} className="text-indigo-400" />
              <span>Tag a Document to Scope Search</span>
            </div>
            <div className="doc-mention-list">
              {filteredMentionDocs.map((doc, idx) => (
                <div
                  key={doc.id}
                  className={`doc-mention-item ${idx === docMentionIndex ? 'selected' : ''}`}
                  onClick={() => handleTagDocument(doc)}
                  onMouseEnter={() => setDocMentionIndex(idx)}
                >
                  <div className="doc-mention-icon">
                    <FileText size={15} />
                  </div>
                  <div className="doc-mention-info">
                    <div className="doc-mention-title">{getDocName(doc)}</div>
                    <div className="doc-mention-meta">
                      {doc.format || doc.fileType || 'PDF'}{doc.size ? ` • ${doc.size}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ChatGPT Input Bar with Inside Attachment Chips */}
        <form className="chatgpt-input-bar anim-slide-up" onSubmit={(e) => handleSend(e)}>
          <button
            type="button"
            className="input-attach-btn"
            onClick={() => {
              if (documents.length > 0) {
                setIsDocMentionOpen(prev => !prev);
                setDocMentionQuery('');
              } else {
                onNavigateToIngestion();
              }
            }}
            data-tooltip="Tag Document (@)"
          >
            <Plus size={18} />
          </button>

          {/* Inline Tagged Document Chips (ChatGPT Single-Row Style) */}
          {taggedDocuments.map(doc => (
            <div key={doc.id} className="input-inline-doc-chip anim-scale-in">
              <FileText size={12} className="text-indigo-400" />
              <span className="input-inline-doc-name">{getDocName(doc)}</span>
              <button
                type="button"
                className="input-inline-doc-remove"
                onClick={() => handleRemoveTag(doc.id)}
                data-tooltip="Remove filter"
              >
                <X size={11} />
              </button>
            </div>
          ))}

          <input
            ref={inputRef}
            type="text"
            placeholder={taggedDocuments.length > 0 ? "Ask a question..." : "Message Noesis... (type @ to tag docs)"}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
          />

          {/* Voice Input Microphone Button */}
          <button 
            type="button" 
            className={`input-voice-btn ${isRecording ? 'is-recording' : ''} ${isTranscribing ? 'is-transcribing' : ''}`}
            onClick={handleToggleRecording}
            disabled={isStreaming || isTranscribing}
            data-tooltip={isRecording ? 'Click to stop speaking' : isTranscribing ? 'Transcribing speech...' : 'Voice typing (Groq Whisper)'}
          >
            {isTranscribing ? (
              <Loader2 size={17} className="animate-spin text-indigo-400" />
            ) : isRecording ? (
              <span className="recording-indicator">
                <span className="recording-pulse-dot"></span>
                <Square size={13} fill="currentColor" />
              </span>
            ) : (
              <Mic size={17} />
            )}
          </button>

          <button 
            type="submit" 
            className={`send-arrow-circle ${input.trim() && !isStreaming ? 'active' : ''}`}
            disabled={!input.trim() || isStreaming}
          >
            <ArrowUp size={16} />
          </button>
          </form>

        {/* Disclaimer */}
        <div className="chatgpt-disclaimer">
          Noesis LangGraph RAG can make mistakes. Verify important citations and document excerpts.
        </div>
      </div>

      {/* Source Viewer Modal */}
      {activeSource && (
        <div className="drawer-overlay anim-fade-in" onClick={() => setActiveSource(null)}>
          <div className="drawer-card anim-pop-in" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-top-bar">
              <div className="drawer-title-box">
                <FileCheck size={18} className="text-accent" />
                <div>
                  <h4>{activeSource.fileName}</h4>
                  <span className="drawer-loc">
                    {activeSource.page || activeSource.sheet || 'Reference Document'} {activeSource.similarity ? `• ${activeSource.similarity}` : ''}
                  </span>
                </div>
              </div>
              <button className="drawer-close" onClick={() => setActiveSource(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="drawer-content-box">
              <div className="drawer-label">EXTRACTED PASSAGE CONTENT</div>
              <p className="drawer-passage">{activeSource.text || 'No text snippet available for this citation.'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

