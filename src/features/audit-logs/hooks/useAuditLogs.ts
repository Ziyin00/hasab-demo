import { useQuery } from "@tanstack/react-query";
import { auditLogApi } from "../api/audit-log.api";
import type { AuditLogQuery } from "../types/audit-log.types";

export function useAuditLogs(params: AuditLogQuery) {
  return useQuery({
    queryKey: ["audit-logs", params],
    queryFn: () => auditLogApi.list(params),
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useAuditLogDetail(id: number | null) {
  return useQuery({
    queryKey: ["audit-log", id],
    queryFn: () => auditLogApi.get(id!),
    enabled: id != null,
    staleTime: 60 * 1000,
    retry: false,
  });
}
