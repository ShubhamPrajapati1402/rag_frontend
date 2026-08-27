export type ThemeType = 'light' | 'dark';

export interface DocumentItem {
  id: string;
  name: string;
  format: string;
  size: string;
  status: 'ready' | 'processing' | 'error';
  date: string;
  summary: string;
  previewText?: string;
}

export interface SourceCitation {
  id: string;
  fileName: string;
  fileType: string;
  page: string;
  similarity: string;
  text: string;
}

export interface ChatMessage {
  id: number | string;
  type: 'user' | 'ai';
  content: string;
  sources?: SourceCitation[];
}

export interface ChatSession {
  id: string;
  title: string;
}

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}
