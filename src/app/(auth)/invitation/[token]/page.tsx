"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth.store";
import { InvitationValidateResponse } from "@/types/api.types";
import { InvitationDetails } from "@/components/auth/InvitationDetails";
import { InvitationLoginForm } from "@/components/forms/auth/InvitationLoginForm";
import { InvitationRegisterForm } from "@/components/forms/auth/InvitationRegisterForm";

export default function InvitationPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { addToast } = useAuthStore();
  const token = params.token;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<InvitationValidateResponse | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Missing invitation token");
      setLoading(false);
      return;
    }

    apiClient
      .get<InvitationValidateResponse>(`/invitation/${token}/validate`)
      .then((res) => {
        if (!res.data.valid) {
          throw new Error(res.data.message || "Invalid or expired invitation token");
        }
        setInvitation(res.data);
      })
      .catch((err) => {
        const status = err?.response?.status;
        const alreadyExists =
          status === 404 ||
          status === 409 ||
          (err?.message || "").toLowerCase().includes("already exists");

        if (alreadyExists) {
          addToast(
            "Login required",
            "Your account exists. Please login to accept the invite.",
            "warning"
          );
          router.replace("/login");
          return;
        }

        setError(
          err.response?.data?.message || err.message || "Invitation validation failed"
        );
      })
      .finally(() => setLoading(false));
  }, [token, router, addToast]);

  const handleSuccess = () => router.push("/dashboard");

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold text-foreground">Accept Invitation</h1>
        {invitation?.organization && (
          <p className="text-muted-foreground text-sm">
            Join{" "}
            <span className="font-medium text-foreground">{invitation.organization}</span>
            {invitation.role ? ` as ${invitation.role}` : ""}
          </p>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Validating invitation...</span>
        </div>
      )}

      {!loading && error && (
        <div className="flex items-start gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && invitation && (
        <div className="space-y-6">
          <InvitationDetails
            email={invitation.email}
            role={invitation.role}
            organization={invitation.organization}
          />

          {invitation.hasAccount ? (
            <InvitationLoginForm
              email={invitation.email}
              invitationToken={token}
              onSuccess={handleSuccess}
            />
          ) : (
            <InvitationRegisterForm
              email={invitation.email}
              invitationToken={token}
              onSuccess={handleSuccess}
            />
          )}
        </div>
      )}
    </div>
  );
}
