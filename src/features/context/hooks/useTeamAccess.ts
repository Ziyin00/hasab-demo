import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { accessApi } from "../api/access.api";

export function useTeamAccess(enabled: boolean) {
  return useQuery({
    queryKey: ["context", "team"],
    queryFn: accessApi.getTeamMembers,
    enabled,
  });
}

export function useGrantAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: number) => accessApi.grantAccess(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["context", "team"] });
      toast.success("Access granted");
    },
    onError: () => toast.error("Failed to grant access"),
  });
}

export function useRevokeAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: number) => accessApi.revokeAccess(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["context", "team"] });
      toast.success("Access revoked");
    },
    onError: () => toast.error("Failed to revoke access"),
  });
}
