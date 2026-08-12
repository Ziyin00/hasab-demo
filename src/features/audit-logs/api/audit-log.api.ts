import { chatbotApiClient } from "@/lib/api-client";
import type {
  AuditLogEntry,
  AuditLogListResult,
  AuditLogQuery,
} from "../types/audit-log.types";

function buildParams(params: AuditLogQuery): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    out[key] = value as string | number;
  }
  return out;
}

export const auditLogApi = {
  list: async (params: AuditLogQuery = {}): Promise<AuditLogListResult> => {
    const r = await chatbotApiClient.get("/audit-logs", {
      params: buildParams(params),
    });
    const data = r.data?.data ?? {};
    return {
      audit_logs: data.audit_logs ?? [],
      pagination: data.pagination ?? {
        current_page: 1,
        per_page: params.per_page ?? 20,
        total: 0,
        last_page: 1,
      },
    };
  },

  get: async (id: number): Promise<AuditLogEntry> => {
    const r = await chatbotApiClient.get(`/audit-logs/${id}`);
    return r.data?.data?.audit_log ?? r.data?.data;
  },
};
