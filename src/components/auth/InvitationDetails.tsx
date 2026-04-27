interface InvitationDetailsProps {
  email: string;
  role?: string;
  organization?: string;
}

export function InvitationDetails({ email, role, organization }: InvitationDetailsProps) {
  return (
    <div className="w-full rounded-lg border border-border bg-muted/30 p-4 space-y-1.5 text-sm">
      <div className="flex gap-2">
        <span className="font-medium text-foreground">Email:</span>
        <span className="text-muted-foreground">{email}</span>
      </div>
      {role && (
        <div className="flex gap-2">
          <span className="font-medium text-foreground">Role:</span>
          <span className="text-muted-foreground">{role}</span>
        </div>
      )}
      {organization && (
        <div className="flex gap-2">
          <span className="font-medium text-foreground">Organization:</span>
          <span className="text-muted-foreground">{organization}</span>
        </div>
      )}
    </div>
  );
}
