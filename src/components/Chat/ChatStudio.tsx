import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
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
  Cpu,
  Zap,
  AlertCircle,
  Sparkles,
  GitFork,
  Database,
  CheckCheck
} from 'lucide-react';
import { DocumentItem, ChatMessage, SourceCitation } from '../../types';
import { chatApi } from '../../services/chatApi';
import './ChatStudio.css';

interface ChatStudioProps {
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onSessionCreated?: (session: { id: string; title: string }) => void;
  onSessionTitleUpdated?: (sessionId: string, title: string) => void;
  onNavigateToIngestion: () => void;
  docCount: number;
  documents?: DocumentItem[];
  onOpenCommandPalette: () => void;
}

export default function ChatStudio({ 
  currentSessionId,
  onSelectSession,
  onSessionCreated,
  onSessionTitleUpdated,
  onNavigateToIngestion, 
  docCount, 
  documents = [], 
  onOpenCommandPalette 
}: ChatStudioProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingText, setStreamingText] = useState<string>('');
  const [streamingCitations, setStreamingCitations] = useState<SourceCitation[]>([]);
  const [activeNodeStatus, setActiveNodeStatus] = useState<{ node: string; message: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | string | null>(null);
  const [activeSource, setActiveSource] = useState<SourceCitation | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // 360° Interactive Cursor / Touch Rotation Physics
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
  const activeSessionIdRef = useRef<string>(currentSessionId);

  // Load session messages when currentSessionId changes from outside (e.g. sidebar click)
  useEffect(() => {
    let isCancelled = false;

    // If currentSessionId matches what is already loaded/active in this view, don't re-fetch and overwrite live state
    if (currentSessionId === activeSessionIdRef.current) {
      return;
    }

    activeSessionIdRef.current = currentSessionId;

    if (!currentSessionId) {
      setMessages([]);
      setStreamingText('');
      setStreamingCitations([]);
      setActiveNodeStatus(null);
      setErrorMessage(null);
      return;
    }

    const loadSessionHistory = async () => {
      setIsLoadingHistory(true);
      setErrorMessage(null);
      try {
        const data = await chatApi.getSession(currentSessionId);
        if (!isCancelled && data) {
          setMessages(data.messages);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Error fetching session history:', err);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingHistory(false);
        }
      }
    };

    loadSessionHistory();

    return () => {
      isCancelled = true;
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

  // 360° Interactive Rotation Handlers (Mouse & Touch)
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

  // Dynamically compute suggestions directly based on uploaded documents
  const dynamicPromptStarters = useMemo(() => {
    if (!documents || documents.length === 0) {
      return [
        "Attach a PDF or spreadsheet to start analyzing",
        "Upload financial records to calculate margins",
        "How does Noesis extract structured tables?"
      ];
    }
    return documents.slice(0, 3).map((doc) => {
      const isPdf = doc.format === 'PDF' || doc.name.toLowerCase().endsWith('.pdf');
      const isSheet = doc.format === 'Excel' || doc.format === 'CSV' || doc.name.toLowerCase().endsWith('.xlsx') || doc.name.toLowerCase().endsWith('.csv');
      
      if (isPdf) {
        return `Summarize key findings in ${doc.name}`;
      }
      if (isSheet) {
        return `Extract compute numbers from ${doc.name}`;
      }
      return `Explain core sections of ${doc.name}`;
    });
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
      content: queryToSend
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);
    setStreamingText('');
    setStreamingCitations([]);
    setActiveNodeStatus({ node: 'router', message: 'Analyzing query intent...' });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let accumulatedText = '';
    let accumulatedCitations: SourceCitation[] = [];
    let activeSession = currentSessionId;

    try {
      await chatApi.streamChat({
        question: queryToSend,
        sessionId: activeSession || null,
        signal: controller.signal,
        onMetadata: (meta) => {
          if (meta.session_id) {
            activeSession = meta.session_id;
            activeSessionIdRef.current = meta.session_id;
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

      // Stream completed successfully, save final AI message into state
      if (accumulatedText.trim()) {
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          type: 'ai',
          content: accumulatedText,
          sources: accumulatedCitations.length > 0 ? accumulatedCitations : undefined
        };
        setMessages(prev => [...prev, aiMsg]);
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
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="chatgpt-canvas-root">
      {/* Full-width scroll area (scrollbar at the far right edge of the screen) */}
      <div className="chatgpt-scroll-area">
        <div className="chatgpt-messages-viewport">
        {messages.length === 0 && !isStreaming ? (
          /* Symmetrical 4-Plane Gyroscopic Solar System */
          <div className="chatgpt-hero-empty anim-fade-in">
            {/* 3D Multi-Shell Solar Gyroscopic System with 360° Drag & Touch Control */}
            <div 
              className={`neural-3d-scene ${isDragging ? 'is-dragging' : ''}`}
              onMouseDown={handlePointerDown}
              onTouchStart={handlePointerDown}
              title="Click and drag with mouse or touch to rotate 360° in 3D"
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

                  {/* 2. +45° Tilted Ring */}
                  <div className="gyro-3d-ring gyro-tilt-pos">
                    <div className="planet-revolver rev-pos">
                      <div className="orbit-planet">
                        <div className="sub-moon-orbit moon-orbit-pos">
                          <div className="sub-moon"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. -45° Tilted Ring */}
                  <div className="gyro-3d-ring gyro-tilt-neg">
                    <div className="planet-revolver rev-neg">
                      <div className="orbit-planet">
                        <div className="sub-moon-orbit moon-orbit-neg">
                          <div className="sub-moon"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. 90° Polar Ring */}
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

            <h1 className="chatgpt-hero-prompt anim-slide-up">What can I help with?</h1>

            {/* AI Architecture Badges */}
            <div className="hero-feature-pills anim-slide-up">
              <div className="hero-pill-badge">
                <Brain size={13} className="badge-icon" />
                <span>LangGraph Stateful Multi-Agent</span>
              </div>
              <div className="hero-pill-badge">
                <Cpu size={13} className="badge-icon" />
                <span>Self-Corrective RAG Grader</span>
              </div>
              <div className="hero-pill-badge">
                <Zap size={13} className="badge-icon" />
                <span>Real-Time SSE Streaming</span>
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`chatgpt-msg-row ${msg.type} anim-slide-up`}>
              {msg.type === 'user' ? (
                <div className="user-message-bubble anim-slide-up">
                  {msg.content}
                </div>
              ) : (
                <div className="ai-message-card anim-slide-up">
                  {/* Formatted Content */}
                  <div className="ai-markdown-body">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>

                  {/* Structured Citations */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="sources-container">
                      <div className="sources-heading">Source References ({msg.sources.length})</div>
                      <div className="sources-chip-row">
                        {msg.sources.map((src, sIdx) => (
                          <button 
                            key={src.id || sIdx} 
                            className="source-badge-chip"
                            onClick={() => setActiveSource(src)}
                            title="Click to view extracted source passage"
                          >
                            <span className="source-icon">
                              {src.fileType === 'Excel' || src.fileType === 'CSV' ? (
                                <FileSpreadsheet size={13} />
                              ) : (
                                <FileText size={13} />
                              )}
                            </span>
                            <span className="source-name">{src.fileName}</span>
                            {src.page && <span className="source-sub">• {src.page}</span>}
                            {src.sheet && <span className="source-sub">• {src.sheet}</span>}
                            {src.similarity && <span className="source-match">{src.similarity}</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Icons */}
                  <div className="ai-actions-row">
                    <button 
                      className="action-icon-btn" 
                      onClick={() => copyText(msg.content, msg.id)}
                      title="Copy response"
                    >
                      {copiedId === msg.id ? <Check size={14} className="text-accent" /> : <Copy size={14} />}
                    </button>
                    <button className="action-icon-btn" title="Good response"><ThumbsUp size={14} /></button>
                    <button className="action-icon-btn" title="Bad response"><ThumbsDown size={14} /></button>
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
              {/* Dynamic Live LangGraph Pipeline Node Indicator */}
              {activeNodeStatus && (
                <div className="langgraph-node-pill anim-fade-in">
                  <div className="node-spinner-ring"></div>
                  <span className="node-badge-tag">{activeNodeStatus.node}</span>
                  <span className="node-status-text">{activeNodeStatus.message}</span>
                </div>
              )}

              {/* Streaming Tokens */}
              {streamingText && (
                <div className="ai-markdown-body">
                  <ReactMarkdown>{streamingText}</ReactMarkdown>
                  <span className="typing-cursor"></span>
                </div>
              )}

              {/* Streaming Citations */}
              {streamingCitations.length > 0 && (
                <div className="sources-container anim-fade-in">
                  <div className="sources-heading">Source References ({streamingCitations.length})</div>
                  <div className="sources-chip-row">
                    {streamingCitations.map((src, sIdx) => (
                      <button 
                        key={src.id || sIdx} 
                        className="source-badge-chip"
                        onClick={() => setActiveSource(src)}
                      >
                        <span className="source-icon">
                          {src.fileType === 'Excel' || src.fileType === 'CSV' ? (
                            <FileSpreadsheet size={13} />
                          ) : (
                            <FileText size={13} />
                          )}
                        </span>
                        <span className="source-name">{src.fileName}</span>
                        {src.page && <span className="source-sub">• {src.page}</span>}
                        {src.similarity && <span className="source-match">{src.similarity}</span>}
                      </button>
                    ))}
                  </div>
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
        {/* Dynamic Suggestion Starter Pills Based on Uploaded Files */}
        {messages.length === 0 && !isStreaming && (
          <div className="prompt-starters-row anim-slide-up">
            {dynamicPromptStarters.map((starter, idx) => (
              <button 
                key={idx} 
                className="starter-pill-btn"
                onClick={() => handleSend(null, starter)}
              >
                <span>{starter}</span>
              </button>
            ))}
          </div>
        )}

        {/* ChatGPT Input Bar */}
        <form className="chatgpt-input-bar anim-slide-up" onSubmit={(e) => handleSend(e)}>
          <button 
            type="button" 
            className="input-attach-btn"
            onClick={onNavigateToIngestion}
            title="Attach Document"
          >
            <Plus size={18} />
          </button>

          <input 
            ref={inputRef}
            type="text" 
            placeholder="Message Noesis..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
          />

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
