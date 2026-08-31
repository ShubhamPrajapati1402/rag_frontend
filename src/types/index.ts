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
  is_superuser?: boolean;
  avatarUrl?: string;
  avatar?: string;
  picture?: string;
  image?: string;
}

export interface EvaluationClaim {
  claim: string;
  supported: boolean;
  reason: string;
}

export interface EvaluationCase {
  id: number;
  document_name: string;
  question: string;
  ground_truth?: string;
  generated_answer: string;
  retrieved_contexts?: string[];
  faithfulness: number;
  answer_relevancy: number;
  context_precision: number;
  context_recall: number;
  claims_evaluation?: EvaluationClaim[];
  latency_ms: number;
}

export interface EvaluationRun {
  id: number;
  title: string;
  eval_mode: string;
  total_cases: number;
  faithfulness_score: number;
  answer_relevancy_score: number;
  context_precision_score: number;
  context_recall_score: number;
  overall_rag_score: number;
  avg_latency_ms: number;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  created_at: string;
  cases?: EvaluationCase[];
}
