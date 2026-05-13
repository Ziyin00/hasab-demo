"use client";

import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTeamAccess, useGrantAccess, useRevokeAccess } from "../hooks/useTeamAccess";

export function TeamAccessTable() {
  const { data: members, isLoading } = useTeamAccess(true);
  const { mutate: grant, isPending: granting, variables: grantingId } = useGrantAccess();
  const { mutate: revoke, isPending: revoking, variables: revokingId } = useRevokeAccess();

  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <div>
        <h2 className="text-base font-semibold">Team Access Management</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Grant or revoke context access for team members with admin role.
        </p>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="text-xs font-medium">Name</TableHead>
              <TableHead className="text-xs font-medium">Email</TableHead>
              <TableHead className="text-xs font-medium">Role</TableHead>
              <TableHead className="text-xs font-medium">Status</TableHead>
              <TableHead className="text-xs font-medium text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : members && members.length > 0 ? (
              members.map((member) => {
                const isAdmin = member.is_team_admin || member.team_role === "admin";
                const hasAccess = !!member.has_access;
                const isOrgGranted = member.access_type === "org_granted";
                const isGranting = granting && grantingId === member.id;
                const isRevoking = revoking && revokingId === member.id;

                return (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium text-sm">{member.name || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {member.email || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {member.team_role || (isAdmin ? "admin" : "member")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          hasAccess
                            ? "border-green-500/30 text-green-500 bg-green-500/10"
                            : "border-muted-foreground/30 text-muted-foreground"
                        }`}
                      >
                        {member.access_status || (hasAccess ? "approved" : "no access")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {!isAdmin ? (
                        <span className="text-xs text-muted-foreground">Must request</span>
                      ) : hasAccess && isOrgGranted ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => revoke(member.id)}
                          disabled={isRevoking}
                        >
                          {isRevoking ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            "Revoke"
                          )}
                        </Button>
                      ) : hasAccess ? (
                        <span className="text-xs text-muted-foreground">Admin approved</span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => grant(member.id)}
                          disabled={isGranting}
                        >
                          {isGranting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            "Grant"
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-sm text-muted-foreground"
                >
                  No team members found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
