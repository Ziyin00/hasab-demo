"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth.store";
import { LoginResponse, InvitationLoginRequest } from "@/types/api.types";

interface InvitationLoginFormProps {
  email: string;
  invitationToken: string;
  onSuccess: () => void;
}

export function InvitationLoginForm({ email, invitationToken, onSuccess }: InvitationLoginFormProps) {
  const { login, addToast } = useAuthStore();
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload: InvitationLoginRequest = {
        email,
        password,
        invitation_token: invitationToken,
      };
      const res = await apiClient.post<LoginResponse>("/auth/login", payload);
      await login(res.data);
      addToast("Invitation accepted", "Welcome aboard!", "success");
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <h4 className="font-semibold text-foreground">Login to accept invitation</h4>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <p className="text-sm text-muted-foreground">Email</p>
        <Input value={email} disabled />
      </div>

      <div className="space-y-1.5">
        <p className="text-sm text-muted-foreground">Password</p>
        <div className="relative">
          <Input
            type={showPass ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowPass(!showPass)}
          >
            {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading || !password}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Logging in...
          </>
        ) : (
          "Login & Accept"
        )}
      </Button>
    </form>
  );
}
