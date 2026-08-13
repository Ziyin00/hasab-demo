export type AuditResourceType = "chat_context" | "chatbot_widget";

export type AuditAction =
  | "chat_context.created"
  | "chat_context.updated"
  | "chat_context.deleted"
  | "chatbot_widget.created"
  | "chatbot_widget.updated"
  | "chatbot_widget.deleted"
  | (string & {});

export type AuthMethod = "api_key" | "sanctum" | "system" | null;

export interface AuditLogUser {
  id: number;
  name: string;
  email: string;
}

export interface TextSummary {
  length: number;
  preview: string | null;
}

export interface AuditLogMetadata {
  source?: string;
  rag_store_id?: number;
  [key: string]: unknown;
}

export interface AuditLogEntry {
  id: number;
  user_id: number | null;
  user: AuditLogUser | null;
  organization_id: number | null;
  auth_method: AuthMethod;
  action: AuditAction;
  resource_type: AuditResourceType;
  resource_id: number | null;
  resource_key: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  metadata: AuditLogMetadata | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuditLogPagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface AuditLogListResult {
  audit_logs: AuditLogEntry[];
  pagination: AuditLogPagination;
}

export interface AuditLogQuery {
  resource_type?: AuditResourceType | "";
  resource_id?: number;
  resource_key?: string;
  action?: AuditAction | "";
  actor_user_id?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

export interface DiffRow {
  field: string;
  from: unknown;
  to: unknown;
}
