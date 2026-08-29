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
  id?: string;
  fileName: string;
  fileType?: string;
  page?: string;
  sheet?: string;
  similarity?: string;
  text: string;
  documentId?: string;
  score?: number | string;
}

export type LangGraphNode = 'summarizer' | 'router' | 'retriever' | 'grader' | 'generator' | string;

export interface ChatMessage {
  id: number | string;
  type: 'user' | 'ai';
  content: string;
  sources?: SourceCitation[];
  nodeStatus?: string;
  createdAt?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  message_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  role?: string;
  avatarUrl?: string;
  avatar?: string;
  picture?: string;
  image?: string;
}
