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
  Zap
} from 'lucide-react';
import { DocumentItem, ChatMessage, SourceCitation } from '../../types';
import './ChatStudio.css';

interface ChatStudioProps {
  onNavigateToIngestion: () => void;
  docCount: number;
  documents?: DocumentItem[];
  onOpenCommandPalette: () => void;
}

export default function ChatStudio({ 
  onNavigateToIngestion, 
  docCount, 
  documents = [], 
  onOpenCommandPalette 
}: ChatStudioProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<number | string | null>(null);
  const [activeSource, setActiveSource] = useState<SourceCitation | null>(null);
  const [streamingText, setStreamingText] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSearching, streamingText]);

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
    
    // Natural 3D rotational sensitivity
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
        "How does DocuMind extract structured tables?"
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

  const handleSend = (e?: React.FormEvent | null, overridePrompt?: string) => {
    e?.preventDefault();
    const queryToSend = overridePrompt || input.trim();
    if (!queryToSend || isSearching || isStreaming) return;

    setInputHistory(prev => [queryToSend, ...prev]);
    setHistoryIndex(-1);
    setTempDraft('');

    const userMsg: ChatMessage = {
      id: Date.now(),
      type: 'user',
      content: queryToSend
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsSearching(true);

    // Simulate ChatGPT retrieval and token streaming
    setTimeout(() => {
      setIsSearching(false);
      setIsStreaming(true);

      const isFinancial = queryToSend.toLowerCase().includes('revenue') || queryToSend.toLowerCase().includes('margin') || queryToSend.toLowerCase().includes('cost') || queryToSend.toLowerCase().includes('tesla') || queryToSend.toLowerCase().includes('table') || queryToSend.toLowerCase().includes('profit') || queryToSend.toLowerCase().includes('pdf');

      const fullResponse = isFinancial 
        ? `### Financial Performance Breakdown\n\nBased on your indexed documents and SEC 10-K report:\n\n- **Total FY2025 Revenue**: **$96.77 Billion** (up 14.2% year-over-year).\n- **Automotive Gross Margin**: Reached **19.8%** in Q4 following automated manufacturing scaling.\n- **Cloud GPU Compute Spend**: **$41,200/month** for the 64x H100 GPU cluster (averaging 94.2% utilization).\n\nAll figures match the extracted table rows directly from your uploaded source files.`
        : `I searched through your **${docCount} uploaded documents** and found the exact relevant sections matching your inquiry.\n\n- **Document Context**: Extracted with high similarity matching.\n- **Data Verification**: Verified across structural boundaries with zero data loss.`;

      const words = fullResponse.split(' ');
      let currentWordIndex = 0;
      setStreamingText('');

      const streamInterval = setInterval(() => {
        if (currentWordIndex < words.length) {
          setStreamingText(prev => prev + (prev ? ' ' : '') + words[currentWordIndex]);
          currentWordIndex++;
        } else {
          clearInterval(streamInterval);
          setIsStreaming(false);

          const newAiMsg: ChatMessage = {
            id: Date.now() + 1,
            type: 'ai',
            content: fullResponse,
            sources: documents.length > 0 ? [
              {
                id: 'src-res-1',
                fileName: documents[0].name,
                fileType: documents[0].format,
                page: 'Page 42',
                similarity: '95% match',
                text: documents[0].previewText || 'ITEM 7: Automotive gross margin expanded to 19.8% with total revenues reaching $96.77B.'
              },
              ...(documents[1] ? [{
                id: 'src-res-2',
                fileName: documents[1].name,
                fileType: documents[1].format,
                page: 'Sheet: Compute_Clusters',
                similarity: '91% match',
                text: documents[1].previewText || 'Cluster US-EAST-VA-09: 64x H100 GPU compute burn rate $41,200/mo. Average utilization 94.2%.'
              }] : [])
            ] : []
          };

          setMessages(prev => [...prev, newAiMsg]);
          setStreamingText('');
        }
      }, 30);
    }, 900);
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
      {/* Scrollable Conversation Flow */}
      <div className="chatgpt-messages-viewport">
        {messages.length === 0 ? (
          /* Symmetrical 4-Plane Gyroscopic Solar System */
          <div className="chatgpt-hero-empty anim-fade-in">
            {/* 3D Multi-Shell Solar Gyroscopic System with 360° Drag & Touch Control */}
            <div 
              className={`neural-3d-scene ${isDragging ? 'is-dragging' : ''}`}
              onMouseDown={handlePointerDown}
              onTouchStart={handlePointerDown}
              title="Click and drag with mouse or touch to rotate 360° in 3D"
            >
              {/* Central Volumetric 3D Sphere (Completely Static - Never moves with cursor) */}
              <div className="volumetric-3d-sphere">
                <Brain size={22} className="sphere-brain-hologram" />
              </div>

              {/* Interactive 3D Rotator Wrapper ONLY for Gyroscopic Rings & Planets */}
              <div 
                className="interactive-3d-rotator"
                style={{
                  transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`
                }}
              >
                <div className="neural-3d-floating-system">
                  {/* 1. Horizontal Equatorial Ring (0°) */}
                  <div className="gyro-3d-ring gyro-equatorial">
                    <div className="planet-revolver rev-eq">
                      <div className="orbit-planet">
                        <div className="sub-moon-orbit moon-orbit-eq">
                          <div className="sub-moon"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. +45° Tilted Ring from Right Side */}
                  <div className="gyro-3d-ring gyro-tilt-pos">
                    <div className="planet-revolver rev-pos">
                      <div className="orbit-planet">
                        <div className="sub-moon-orbit moon-orbit-pos">
                          <div className="sub-moon"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. -45° Tilted Ring from Left Side */}
                  <div className="gyro-3d-ring gyro-tilt-neg">
                    <div className="planet-revolver rev-neg">
                      <div className="orbit-planet">
                        <div className="sub-moon-orbit moon-orbit-neg">
                          <div className="sub-moon"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. 90° Polar Ring Perpendicular to Equatorial Ring */}
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

              {/* Realistic Ground Floor Shadow */}
              <div className="neural-3d-floor-shadow"></div>
            </div>

            <h1 className="chatgpt-hero-prompt anim-slide-up">What can I help with?</h1>

            {/* AI Architecture Badges */}
            <div className="hero-feature-pills anim-slide-up">
              <div className="hero-pill-badge">
                <Brain size={13} className="badge-icon" />
                <span>Neural Semantic Index</span>
              </div>
              <div className="hero-pill-badge">
                <Cpu size={13} className="badge-icon" />
                <span>AI Document Processor</span>
              </div>
              <div className="hero-pill-badge">
                <Zap size={13} className="badge-icon" />
                <span>Real-Time RAG Synthesis</span>
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
                  {/* Sources Chips */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="sources-chip-row">
                      {msg.sources.map((src, sIdx) => (
                        <button 
                          key={sIdx} 
                          className="source-badge-chip"
                          onClick={() => setActiveSource(src)}
                        >
                          <span className="source-icon">
                            {src.fileType === 'PDF' ? <FileText size={12} /> : <FileSpreadsheet size={12} />}
                          </span>
                          <span className="source-name">{src.fileName}</span>
                          <span className="source-match">{src.similarity}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Formatted Content */}
                  <div className="ai-markdown-body">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>

                  {/* Action Icons */}
                  <div className="ai-actions-row">
                    <button 
                      className="action-icon-btn" 
                      onClick={() => copyText(msg.content, msg.id)}
                      title="Copy"
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

        {/* Real-time Streaming State with Cursor Animation */}
        {isStreaming && (
          <div className="chatgpt-msg-row ai anim-slide-up">
            <div className="ai-message-card">
              <div className="ai-markdown-body">
                <ReactMarkdown>{streamingText}</ReactMarkdown>
                <span className="typing-cursor"></span>
              </div>
            </div>
          </div>
        )}

        {/* Animated Searching Indicator */}
        {isSearching && (
          <div className="chatgpt-msg-row ai anim-fade-in">
            <div className="chatgpt-thinking-pill anim-pop-in">
              <span className="thinking-dot-pulse"></span>
              <span>Searching {docCount} documents & synthesizing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Bottom Console */}
      <div className="chatgpt-input-wrapper">
        {/* Dynamic Suggestion Starter Pills Based on Uploaded Files */}
        {messages.length === 0 && (
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
            placeholder="Message DocuMind..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <button 
            type="submit" 
            className={`send-arrow-circle ${input.trim() ? 'active' : ''}`}
            disabled={!input.trim() || isSearching || isStreaming}
          >
            <ArrowUp size={16} />
          </button>
        </form>

        {/* ChatGPT Disclaimer */}
        <div className="chatgpt-disclaimer">
          DocuMind can make mistakes. Verify important document info.
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
                  <span className="drawer-loc">{activeSource.page} • {activeSource.similarity}</span>
                </div>
              </div>
              <button className="drawer-close" onClick={() => setActiveSource(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="drawer-content-box">
              <div className="drawer-label">EXTRACTED PASSAGE</div>
              <p className="drawer-passage">{activeSource.text}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
