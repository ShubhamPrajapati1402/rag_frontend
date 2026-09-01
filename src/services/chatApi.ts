import { ChatMessage, ChatSession, SourceCitation, DocumentItem } from '../types';

export const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL;

export function normalizeCitation(item: any, idx: number): SourceCitation {
  if (typeof item === 'string') {
    return {
      id: 'src-' + idx + '-' + Date.now(),
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
    page = 'Page ' + page;
  }

  let sheet = item.sheet_name || item.sheet || item.sheetName || '';
  if (sheet && !String(sheet).toLowerCase().startsWith('sheet')) {
    sheet = 'Sheet: ' + sheet;
  }

  let similarity = '';
  if (item.similarity) {
    similarity = String(item.similarity);
  } else if (item.score !== undefined && item.score !== null) {
    const num = Number(item.score);
    if (!isNaN(num)) {
      similarity = num <= 1 ? (Math.round(num * 100) + '% match') : (Math.round(num) + '% match');
    }
  }

  return {
    id: item.id || item.doc_id || item.document_id || ('src-' + idx + '-' + Date.now()),
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
  modelProvider?: string;
  modelName?: string;
  apiKey?: string;
  temperature?: number;
  onMetadata?: (meta: { session_id?: string; title?: string; model_provider?: string; model_name?: string }) => void;
  onNodeStatus?: (status: { node: string; message?: string; thought?: string; detail?: any }) => void;
  onToken?: (token: string) => void;
  onCitations?: (citations: SourceCitation[]) => void;
  onDone?: (data?: { session_id?: string; title?: string; model_provider?: string; model_name?: string }) => void;
  onError?: (err: Error) => void;
  signal?: AbortSignal;
}

export interface UploadStreamOptions {
  file: File;
  onProgress?: (progress: { percent: number; stage: string; message: string }) => void;
  onDone?: (data: any) => void;
  onError?: (err: Error) => void;
}

export const chatApi = {
  // 1. Stream chat response with LangGraph SSE
  streamChat: async ({
    question,
    sessionId,
    documentIds = null,
    modelProvider = 'inbuilt',
    modelName,
    apiKey,
    temperature = 0.3,
    onMetadata,
    onNodeStatus,
    onToken,
    onCitations,
    onDone,
    onError,
    signal
  }: StreamChatOptions): Promise<void> => {
    try {
      const payload: Record<string, any> = {
        question,
        session_id: sessionId && sessionId.trim() !== '' ? sessionId : null,
        document_ids: documentIds,
        model_provider: modelProvider,
        model_name: modelName || undefined,
        api_key: apiKey || undefined,
        temperature
      };

      const response = await fetch(BACKEND_BASE_URL + '/api/v1/chat/stream', {
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
        let errMessage = 'Chat request failed (' + response.status + ')';
        try {
          const errData = await response.json();
          errMessage = errData.detail || errData.message || errMessage;
        } catch {}
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
        const blocks = buffer.split(/\r?\n\r?\n/);
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
          } catch {}

          if (eventName === 'metadata' && onMetadata) {
            onMetadata(parsedData);
          } else if (eventName === 'trace' || eventName === 'node_status') {
            if (onNodeStatus) {
              onNodeStatus({
                node: parsedData.step || parsedData.node || 'processing',
                message: parsedData.thought || parsedData.status || '',
                thought: parsedData.thought,
                detail: parsedData
              });
            }
          } else if (eventName === 'token') {
            const token = typeof parsedData === 'object' ? (parsedData.text || '') : String(parsedData || '');
            if (onToken && token) {
              onToken(token);
            }
          } else if (eventName === 'citations' && onCitations) {
            const rawList = Array.isArray(parsedData.citations) ? parsedData.citations : (Array.isArray(parsedData) ? parsedData : []);
            const citations = rawList.map((c: any, cIdx: number) => normalizeCitation(c, cIdx));
            onCitations(citations);
          } else if (eventName === 'done') {
            if (onDone) onDone(parsedData);
          } else if (eventName === 'error') {
            const errMsg = typeof parsedData === 'object' ? (parsedData.error || parsedData.message || 'Stream error') : String(parsedData);
            if (onError) onError(new Error(errMsg));
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      if (onError) onError(err);
      else throw err;
    }
  },

  // 2. Fetch all user conversation sessions
  getSessions: async (): Promise<ChatSession[]> => {
    try {
      const res = await fetch(BACKEND_BASE_URL + '/api/v1/chat/sessions', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (data?.sessions || []);
    } catch (err) {
      console.warn('Failed to load chat sessions:', err);
      return [];
    }
  },

  // 3. Load full message history for a specific session
  getSessionMessages: async (sessionId: string): Promise<{ session: ChatSession; messages: ChatMessage[] } | null> => {
    try {
      const res = await fetch(BACKEND_BASE_URL + '/api/v1/chat/sessions/' + sessionId, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      if (!res.ok) return null;
      const data = await res.json();

      const rawMessages = data.messages || [];
      const formattedMessages: ChatMessage[] = [];

      for (let idx = 0; idx < rawMessages.length; idx++) {
        const m = rawMessages[idx];
        if (m.query && m.response) {
          formattedMessages.push({
            id: m.id ? (m.id + '-user') : ('msg-' + idx + '-user'),
            type: 'user',
            content: m.query,
            createdAt: m.created_at || m.timestamp
          });

          const rawCitations = m.citations || m.sources || [];
          const sources = Array.isArray(rawCitations) 
            ? rawCitations.map((c: any, cIdx: number) => normalizeCitation(c, cIdx))
            : [];
          formattedMessages.push({
            id: m.id ? (m.id + '-ai') : ('msg-' + idx + '-ai'),
            type: 'ai',
            content: m.response,
            sources: sources.length > 0 ? sources : undefined,
            modelProvider: m.model_provider,
            modelName: m.model_name,
            createdAt: m.created_at || m.timestamp
          });
          continue;
        }

        const roleStr = String(m.role || m.type || m.sender || m.author || '').toLowerCase();
        const isUser = roleStr === 'user' || roleStr === 'human' || m.is_user === true;
        const rawCitations = m.citations || m.sources || [];
        const sources = Array.isArray(rawCitations) 
          ? rawCitations.map((c: any, cIdx: number) => normalizeCitation(c, cIdx))
          : [];

        const content = m.content || m.text || m.message || m.body || m.answer || m.response || '';

        formattedMessages.push({
          id: m.id || m._id || ('msg-' + idx + '-' + Date.now()),
          type: isUser ? 'user' : 'ai',
          content,
          sources: sources.length > 0 ? sources : undefined,
          modelProvider: m.model_provider,
          modelName: m.model_name,
          createdAt: m.created_at || m.timestamp
        });
      }

      const session: ChatSession = {
        id: data.id || data.session_id || sessionId,
        title: data.title || 'Conversation',
        model_provider: data.model_provider,
        model_name: data.model_name,
        message_count: formattedMessages.length,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      return { session, messages: formattedMessages };
    } catch (err) {
      console.warn('Could not fetch session ' + sessionId + ':', err);
      return null;
    }
  },

    // Alias for getSessionMessages
  getSession: async (sessionId: string): Promise<{ session: ChatSession; messages: ChatMessage[] } | null> => {
    return await chatApi.getSessionMessages(sessionId);
  },

  // 4. Delete a conversation session
  deleteSession: async (sessionId: string): Promise<boolean> => {
    try {
      const res = await fetch(BACKEND_BASE_URL + '/api/v1/chat/sessions/' + sessionId, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      return res.ok;
    } catch (err) {
      console.warn('Failed to delete session ' + sessionId + ':', err);
      return false;
    }
  },

  // 5. Ingest / Upload document with real-time SSE progress
  streamUpload: async ({ file, onProgress, onDone, onError }: UploadStreamOptions): Promise<void> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(BACKEND_BASE_URL + '/api/v1/ingest/stream', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        let errMessage = 'Upload failed (' + response.status + ')';
        try {
          const errData = await response.json();
          errMessage = errData.detail || errData.message || errMessage;
        } catch {}
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
        const blocks = buffer.split(/\r?\n\r?\n/);
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
          } catch {}

          if (eventName === 'progress' && onProgress) {
            onProgress({
              percent: Number(parsedData.percent || 0),
              stage: String(parsedData.stage || 'processing'),
              message: String(parsedData.message || '')
            });
          } else if (eventName === 'done' && onDone) {
            onDone(parsedData);
          } else if (eventName === 'error' && onError) {
            onError(new Error(parsedData?.message || parsedData?.detail || 'Ingestion failed'));
          }
        }
      }
    } catch (err: any) {
      if (onError) onError(err);
      else throw err;
    }
  },

  // 6. Get list of ingested documents
  getDocuments: async (): Promise<DocumentItem[]> => {
    try {
      const res = await fetch(BACKEND_BASE_URL + '/api/v1/ingest/documents', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      if (!res.ok) return [];
      const data = await res.json();
      const rawList = Array.isArray(data) ? data : (data?.documents || data?.data || data?.items || []);
      return Array.isArray(rawList) ? rawList.map((d: any) => {
        let fmt = d.format || d.file_type || d.fileType;
        if (!fmt && d.filename) {
          const ext = d.filename.split('.').pop()?.toUpperCase();
          fmt = ext || 'TXT';
        }
        return {
          id: String(d.id || d.doc_id || ''),
          name: String(d.filename || d.name || d.file_name || 'Document'),
          format: String(fmt || 'TXT'),
          size: String(d.size || (d.chunk_count ? (d.chunk_count + ' chunks') : '')),
          status: (d.status === 'ready' || d.status === 'processing' || d.status === 'error' || d.status === 'COMPLETED') 
            ? (d.status === 'COMPLETED' ? 'ready' : d.status) 
            : 'ready',
          date: d.created_at ? new Date(d.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) + ' IST' : 'Just now',
          summary: String(d.summary || d.description || ''),
          previewText: String(d.extracted_preview || d.previewText || d.preview_text || d.preview || d.content || d.text || '')
        };
      }) : [];
    } catch (err) {
      console.warn('Failed to load documents:', err);
      return [];
    }
  },

  // 7. Get full document content preview
  getDocumentPreview: async (documentId: string | number): Promise<DocumentItem | null> => {
    try {
      const res = await fetch(BACKEND_BASE_URL + '/api/v1/ingest/documents/' + documentId + '/preview', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      if (!res.ok) return null;
      const d = await res.json();
      let fmt = d.format || d.file_type;
      if (!fmt && d.filename) {
        const ext = d.filename.split('.').pop()?.toUpperCase();
        fmt = ext || 'TXT';
      }
      return {
        id: String(d.id),
        name: d.filename || 'Document',
        format: String(fmt || 'TXT'),
        size: d.size || '',
        status: (d.status === 'COMPLETED' || d.status === 'ready') ? 'ready' : (d.status || 'ready'),
        date: d.created_at ? new Date(d.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) + ' IST' : 'Just now',
        summary: d.summary || '',
        previewText: d.extracted_preview || d.previewText || d.preview || ''
      };
    } catch (err) {
      console.warn('Failed to fetch preview for doc ' + documentId + ':', err);
      return null;
    }
  },

  // 8. Delete an ingested document
  deleteDocument: async (docId: string): Promise<boolean> => {
    try {
      const res = await fetch(BACKEND_BASE_URL + '/api/v1/ingest/documents/' + docId, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      return res.ok;
    } catch (err) {
      console.warn('Failed to delete document ' + docId + ':', err);
      return false;
    }
  }
};
