import { ChatMessage, ChatSession, SourceCitation } from '../types';

export const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL;

export function normalizeCitation(item: any, idx: number): SourceCitation {
  if (typeof item === 'string') {
    return {
      id: `src-${idx}-${Date.now()}`,
      fileName: 'Document Source',
      fileType: 'PDF',
      text: item,
      similarity: 'Relevant match'
    };
  }

  const fileName = item.filename || item.fileName || item.file_name || item.name || 'Document';
  const ext = fileName.split('.').pop()?.toUpperCase() || '';
  let fileType = item.fileType || item.file_type || item.format;
  if (!fileType) {
    if (ext === 'PDF') fileType = 'PDF';
    else if (ext === 'XLSX' || ext === 'XLS') fileType = 'Excel';
    else if (ext === 'CSV') fileType = 'CSV';
    else if (ext === 'DOCX' || ext === 'DOC') fileType = 'DOCX';
    else if (ext === 'MD') fileType = 'Markdown';
    else fileType = 'Doc';
  } else if (fileType === 'XLS' || fileType === 'XLSX') {
    fileType = 'Excel';
  }

  let page = item.page_number !== undefined && item.page_number !== null ? String(item.page_number) : (
    item.page !== undefined && item.page !== null ? String(item.page) : (
      item.pageNum !== undefined && item.pageNum !== null ? String(item.pageNum) : ''
    )
  );
  if (page && !page.toLowerCase().startsWith('page')) {
    page = `Page ${page}`;
  }

  let sheet = item.sheet_name || item.sheet || item.sheetName || '';
  if (sheet && !String(sheet).toLowerCase().startsWith('sheet')) {
    sheet = `Sheet: ${sheet}`;
  }

  let similarity = '';
  if (item.similarity) {
    similarity = String(item.similarity);
  } else if (item.score !== undefined && item.score !== null) {
    const num = Number(item.score);
    if (!isNaN(num)) {
      similarity = num <= 1 ? `${Math.round(num * 100)}% match` : `${Math.round(num)}% match`;
    }
  }

  return {
    id: item.id || item.doc_id || item.document_id || `src-${idx}-${Date.now()}`,
    fileName,
    fileType,
    page: page || (sheet ? sheet : undefined),
    sheet: sheet || undefined,
    similarity: similarity || (page ? 'Source reference' : 'Relevant match'),
    text: item.text || item.content || item.snippet || item.preview || item.previewText || item.chunk_text || '',
    documentId: item.documentId || item.document_id || item.doc_id,
    score: item.score
  };
}

export interface StreamChatOptions {
  question: string;
  sessionId?: string | null;
  documentIds?: string[] | null;
  onMetadata?: (meta: { session_id?: string; title?: string }) => void;
  onNodeStatus?: (status: { node: string; message?: string; thought?: string; detail?: any }) => void;
  onToken?: (token: string) => void;
  onCitations?: (citations: SourceCitation[]) => void;
  onDone?: (data?: { session_id?: string; title?: string }) => void;
  onError?: (err: Error) => void;
  signal?: AbortSignal;
}

export const chatApi = {
  // 1. Stream chat response with LangGraph SSE
  streamChat: async ({
    question,
    sessionId,
    documentIds = null,
    onMetadata,
    onNodeStatus,
    onToken,
    onCitations,
    onDone,
    onError,
    signal
  }: StreamChatOptions): Promise<void> => {
    try {
      const payload: {
        question: string;
        session_id: string | null;
        document_ids: string[] | null;
      } = {
        question,
        session_id: sessionId && sessionId.trim() !== '' ? sessionId : null,
        document_ids: documentIds
      };

      const response = await fetch(`${BACKEND_BASE_URL}/api/v1/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        credentials: 'include',
        body: JSON.stringify(payload),
        signal
      });

      if (!response.ok) {
        let errMessage = `Chat request failed (${response.status})`;
        try {
          const errData = await response.json();
          errMessage = errData.detail || errData.message || errMessage;
        } catch {
          // Non-JSON response fallback
        }
        throw new Error(errMessage);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported by response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Split by standard SSE double-newline boundary
        const blocks = buffer.split(/\r?\n\r?\n/);
        // Keep the last incomplete piece in the buffer
        buffer = blocks.pop() || '';

        for (const block of blocks) {
          if (!block.trim()) continue;

          let eventName = 'message';
          const dataLines: string[] = [];

          const lines = block.split(/\r?\n/);
          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventName = line.replace(/^event:\s*/, '').trim();
            } else if (line.startsWith('data:')) {
              dataLines.push(line.replace(/^data:\s*/, ''));
            }
          }

          const rawData = dataLines.join('\n');
          let parsedData: any = rawData;
          try {
            parsedData = JSON.parse(rawData);
          } catch {
            // Raw text or token string
          }

          switch (eventName) {
            case 'metadata':
              if (onMetadata) {
                const meta = typeof parsedData === 'object' && parsedData !== null ? parsedData : {};
                onMetadata(meta);
              }
              break;

            case 'trace':
            case 'node_status':
              if (onNodeStatus) {
                if (typeof parsedData === 'string') {
                  onNodeStatus({ node: 'trace', message: parsedData, thought: parsedData });
                } else if (typeof parsedData === 'object' && parsedData !== null) {
                  const nodeName = parsedData.step || parsedData.node || parsedData.name || parsedData.status || 'trace';
                  const thoughtText = parsedData.thought || parsedData.message || parsedData.thought_process;
                  onNodeStatus({
                    node: nodeName,
                    message: thoughtText || parsedData.message,
                    thought: thoughtText,
                    detail: parsedData
                  });
                }
              }
              break;

            case 'token':
              if (onToken) {
                let tokenStr = '';
                if (typeof parsedData === 'string') {
                  tokenStr = parsedData;
                } else if (parsedData && typeof parsedData.text === 'string') {
                  tokenStr = parsedData.text;
                } else if (parsedData && typeof parsedData.token === 'string') {
                  tokenStr = parsedData.token;
                } else if (parsedData && typeof parsedData.content === 'string') {
                  tokenStr = parsedData.content;
                }
                if (tokenStr) onToken(tokenStr);
              }
              break;

            case 'citations':
              if (onCitations) {
                let citationArray: any[] = [];
                if (Array.isArray(parsedData)) {
                  citationArray = parsedData;
                } else if (parsedData && Array.isArray(parsedData.citations)) {
                  citationArray = parsedData.citations;
                } else if (parsedData && Array.isArray(parsedData.sources)) {
                  citationArray = parsedData.sources;
                } else if (parsedData && typeof parsedData === 'object') {
                  citationArray = [parsedData];
                }
                const normalized = citationArray.map((c, idx) => normalizeCitation(c, idx));
                onCitations(normalized);
              }
              break;

            case 'done':
              if (onDone) {
                onDone(typeof parsedData === 'object' && parsedData !== null ? parsedData : undefined);
              }
              break;

            case 'error':
              const errMsg = typeof parsedData === 'object' && parsedData?.detail 
                ? parsedData.detail 
                : (typeof parsedData === 'string' ? parsedData : 'Error streaming response');
              throw new Error(errMsg);

            default:
              // Generic fallback
              if (parsedData?.text && onToken) {
                onToken(parsedData.text);
              } else if (parsedData?.token && onToken) {
                onToken(parsedData.token);
              }
              break;
          }
        }
      }

      // Handle any trailing buffer chunk
      if (buffer.trim()) {
        const lines = buffer.split(/\r?\n/);
        let eventName = 'message';
        const dataLines: string[] = [];
        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventName = line.replace(/^event:\s*/, '').trim();
          } else if (line.startsWith('data:')) {
            dataLines.push(line.replace(/^data:\s*/, ''));
          }
        }
        const rawData = dataLines.join('\n');
        if ((eventName === 'token' || eventName === 'message') && onToken && rawData) {
          try {
            const parsed = JSON.parse(rawData);
            onToken(parsed.text || parsed.token || rawData);
          } catch {
            onToken(rawData);
          }
        } else if (eventName === 'done' && onDone) {
          try {
            onDone(JSON.parse(rawData));
          } catch {
            onDone();
          }
        }
      }

      if (onDone) {
        onDone();
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }
      if (onError) {
        onError(err);
      } else {
        console.error('SSE Chat Stream Error:', err);
      }
    }
  },

  // 2. Fetch all user conversation sessions
  getSessions: async (): Promise<ChatSession[]> => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/v1/chat/sessions`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });

      if (!res.ok) {
        if (res.status === 401) return [];
        throw new Error(`Failed to load sessions (${res.status})`);
      }

      const data = await res.json();
      const sessionsList = Array.isArray(data) 
        ? data 
        : (data.sessions && Array.isArray(data.sessions) ? data.sessions : []);

      return sessionsList.map((s: any) => ({
        id: s.id || s.session_id,
        title: s.title || 'Untitled Conversation',
        message_count: s.message_count ?? s.messages_count ?? s.messages?.length ?? 0,
        created_at: s.created_at,
        updated_at: s.updated_at
      }));
    } catch (err) {
      console.warn('Could not fetch chat sessions:', err);
      return [];
    }
  },

  // 3. Fetch single session history (messages and citations)
  getSession: async (sessionId: string): Promise<{ session: ChatSession; messages: ChatMessage[] } | null> => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/v1/chat/sessions/${sessionId}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });

      if (!res.ok) return null;

      const data = await res.json();
      const rawMessages = Array.isArray(data) 
        ? data 
        : (data.messages && Array.isArray(data.messages) ? data.messages : []);

      const formattedMessages: ChatMessage[] = rawMessages.map((m: any, idx: number) => {
        const role = (m.role || m.type || 'ai').toLowerCase();
        const isUser = role === 'user' || role === 'human';
        const rawCitations = m.citations || m.sources || [];
        const sources = Array.isArray(rawCitations) 
          ? rawCitations.map((c: any, cIdx: number) => normalizeCitation(c, cIdx))
          : [];

        return {
          id: m.id || `msg-${idx}-${Date.now()}`,
          type: isUser ? 'user' : 'ai',
          content: m.content || m.text || m.message || '',
          sources: sources.length > 0 ? sources : undefined,
          createdAt: m.created_at || m.timestamp
        };
      });

      const session: ChatSession = {
        id: data.id || data.session_id || sessionId,
        title: data.title || 'Conversation',
        message_count: formattedMessages.length,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      return { session, messages: formattedMessages };
    } catch (err) {
      console.warn(`Could not fetch session ${sessionId}:`, err);
      return null;
    }
  },

  // 4. Delete a conversation session
  deleteSession: async (sessionId: string): Promise<boolean> => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/v1/chat/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      return res.ok;
    } catch (err) {
      console.warn(`Failed to delete session ${sessionId}:`, err);
      return false;
    }
  }
};
