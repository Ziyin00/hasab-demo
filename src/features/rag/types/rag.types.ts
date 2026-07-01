export type DocumentStatus = "pending" | "processing" | "ready" | "failed";

export interface RagStore {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  documents_count?: number;
  created_at: string;
  updated_at: string;
}

export interface RagDocument {
  id: number;
  rag_store_id?: number;
  original_name: string;
  file_path?: string;
  mime_type: string;
  status: DocumentStatus;
  chunk_count: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface RagQuerySource {
  document_id: number;
  chunk_index: number;
  content: string;
  relevance_score: number;
}

export interface RagQueryResult {
  answer: string;
  sources: RagQuerySource[];
}

export interface CreateStorePayload {
  name: string;
  description?: string;
}
