import { apiClient } from "@/lib/api-client";
import type { ContextAccessStatus, TeamMember } from "../types/context.types";

export const accessApi = {
  getStatus: () =>
    apiClient
      .get<{ data: ContextAccessStatus }>("/profile/context-access/status")
      .then((r) => r.data.data),

  requestAccess: () =>
    apiClient
      .post<{ message: string; data: ContextAccessStatus }>("/profile/context-access/request")
      .then((r) => r.data),

  getTeamMembers: () =>
    apiClient
      .get<{ data: { team_members?: TeamMember[]; members?: TeamMember[] } }>(
        "/profile/context-access/team"
      )
      .then((r) => {
        const d = r.data.data;
        return (d.team_members ?? d.members ?? []) as TeamMember[];
      }),

  grantAccess: (memberId: number) =>
    apiClient.post(`/profile/context-access/team/${memberId}/grant`).then((r) => r.data),

  revokeAccess: (memberId: number) =>
    apiClient.post(`/profile/context-access/team/${memberId}/revoke`).then((r) => r.data),
};
