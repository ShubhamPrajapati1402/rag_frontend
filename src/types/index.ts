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
  fileType?: string;
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
  modelProvider?: string;
  modelName?: string;
  createdAt?: string;
  taggedDocs?: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  model_provider?: string;
  model_name?: string;
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

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  description: string;
  context_window: number;
  is_inbuilt: boolean;
  requires_api_key: boolean;
  is_configured: boolean;
  default_base_url?: string | null;
}

export interface ProviderInfo {
  provider: string;
  name: string;
  description: string;
  website_url: string;
  api_key_help_url: string;
  default_base_url?: string | null;
  is_inbuilt: boolean;
  is_configured: boolean;
  models: ModelInfo[];
}

export interface ModelsCatalogResponse {
  providers: ProviderInfo[];
  default_model: string;
  default_provider: string;
}

export interface UserAPIKey {
  id: number;
  provider: string;
  key_hint: string;
  base_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  latency_ms: number;
  model_tested?: string | null;
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
