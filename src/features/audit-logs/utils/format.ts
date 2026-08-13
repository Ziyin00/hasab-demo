import type {
  AuditAction,
  AuditLogEntry,
  AuditResourceType,
  AuthMethod,
  DiffRow,
  TextSummary,
} from "../types/audit-log.types";

export const ACTION_LABELS: Record<string, string> = {
  "chat_context.created": "Context created",
  "chat_context.updated": "Context updated",
  "chat_context.deleted": "Context deleted",
  "chatbot_widget.created": "Widget created",
  "chatbot_widget.updated": "Widget updated",
  "chatbot_widget.deleted": "Widget deleted",
};

export const RESOURCE_TYPE_LABELS: Record<AuditResourceType, string> = {
  chat_context: "Chat context",
  chatbot_widget: "Chatbot widget",
};

export const AUTH_METHOD_LABELS: Record<Exclude<AuthMethod, null>, string> = {
  api_key: "API key",
  sanctum: "Portal",
  system: "System",
};

const DIFF_SKIP = new Set(["id"]);

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  priority: "Priority",
  is_active: "Active",
  rag_store_id: "RAG store",
  context_data: "Content",
  widget_id: "Widget ID",
  allowed_origins: "Allowed origins",
  theme: "Theme",
  settings: "Settings",
  chat_context_ids: "Contexts",
  rag_store_ids: "RAG stores",
  welcome_message: "Welcome message",
  default_language: "Default language",
  position: "Position",
  rate_limit_per_minute: "Rate limit / min",
};

export function actionLabel(action: AuditAction | string): string {
  return ACTION_LABELS[action] ?? action.replace(/\./g, " · ");
}

export function resourceTypeLabel(type: AuditResourceType | string): string {
  return RESOURCE_TYPE_LABELS[type as AuditResourceType] ?? type;
}

export function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field.replace(/_/g, " ");
}

export function formatActor(entry: AuditLogEntry): string {
  if (entry.auth_method === "system" && entry.metadata?.source === "rag_sync") {
    return entry.user?.name ? `${entry.user.name} (RAG sync)` : "System (RAG sync)";
  }
  if (entry.auth_method === "system" && entry.metadata?.source === "rag_store_deleted") {
    return entry.user?.name
      ? `${entry.user.name} (KB deleted)`
      : "System (knowledge base deleted)";
  }
  if (entry.user?.name) return entry.user.name;
  if (entry.user?.email) return entry.user.email;
  if (entry.auth_method === "system") return "System";
  return "Unknown user";
}

export function formatAuthMethod(method: AuthMethod): string | null {
  if (!method) return null;
  return AUTH_METHOD_LABELS[method] ?? method;
}

export function eventSummary(entry: AuditLogEntry): string {
  if (entry.metadata?.source === "rag_sync") {
    return "Knowledge base synced to context";
  }
  if (entry.metadata?.source === "rag_store_deleted") {
    return "Removed because knowledge base was deleted";
  }
  if (entry.action.endsWith(".deleted")) {
    return "This resource was deleted";
  }
  const diffs = diffFields(entry.old_values, entry.new_values);
  const active = diffs.find((d) => d.field === "is_active");
  if (active && active.to === false) return "Widget deactivated";
  if (active && active.to === true) return "Widget activated";
  return actionLabel(entry.action);
}

export function diffFields(
  oldVals: Record<string, unknown> | null,
  newVals: Record<string, unknown> | null
): DiffRow[] {
  const keys = new Set([
    ...Object.keys(oldVals ?? {}),
    ...Object.keys(newVals ?? {}),
  ]);
  const rows: DiffRow[] = [];
  for (const key of keys) {
    if (DIFF_SKIP.has(key)) continue;
    const from = oldVals?.[key];
    const to = newVals?.[key];
    if (JSON.stringify(from) !== JSON.stringify(to)) {
      rows.push({ field: key, from, to });
    }
  }
  return rows;
}

export function formatContextDataSummary(val: unknown): string {
  if (!val || typeof val !== "object") return "—";
  const { length, preview } = val as TextSummary;
  const len = typeof length === "number" ? length : 0;
  if (preview) {
    const snip = String(preview).slice(0, 80);
    return `${len} chars: ${snip}${String(preview).length > 80 ? "…" : ""}`;
  }
  return `${len} chars`;
}

export function formatDiffValue(field: string, value: unknown): string {
  if (value == null) return "—";
  if (field === "context_data") return formatContextDataSummary(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    if (value.length === 0) return "None";
    if (value.every((v) => typeof v === "string" || typeof v === "number")) {
      return value.join(", ");
    }
    return JSON.stringify(value);
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export const FILTER_ACTIONS = [
  { value: "all", label: "All actions" },
  { value: "chat_context.created", label: "Context created" },
  { value: "chat_context.updated", label: "Context updated" },
  { value: "chat_context.deleted", label: "Context deleted" },
  { value: "chatbot_widget.created", label: "Widget created" },
  { value: "chatbot_widget.updated", label: "Widget updated" },
  { value: "chatbot_widget.deleted", label: "Widget deleted" },
] as const;

export const FILTER_RESOURCE_TYPES = [
  { value: "all", label: "All resources" },
  { value: "chat_context", label: "Chat contexts" },
  { value: "chatbot_widget", label: "Chatbot widgets" },
] as const;
