"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth.store";
import { RegisterResponse, InvitationRegisterRequest } from "@/types/api.types";

interface InvitationRegisterFormProps {
  email: string;
  invitationToken: string;
  onSuccess: () => void;
}

export function InvitationRegisterForm({
  email,
  invitationToken,
  onSuccess,
}: InvitationRegisterFormProps) {
  const { login, addToast } = useAuthStore();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (password.length < 6) errs.password = "Password must be at least 6 characters";
    if (password !== confirmPassword) errs.confirmPassword = "Passwords do not match";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      const payload: InvitationRegisterRequest = {
        name,
        phone_number: phone || undefined,
        password,
        password_confirmation: confirmPassword,
        email,
        invitation_token: invitationToken,
      };
      const res = await apiClient.post<RegisterResponse>("/auth/register", payload);
      await login(res.data);
      addToast("Invitation accepted", "Account created successfully.", "success");
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <h4 className="font-semibold text-foreground">Create account to accept invitation</h4>

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
        <p className="text-sm text-muted-foreground">Full Name</p>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading}
          className={fieldErrors.name ? "border-destructive" : ""}
        />
        {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
      </div>

      <div className="space-y-1.5">
        <p className="text-sm text-muted-foreground">Phone Number (optional)</p>
        <Input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={loading}
        />
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
            className={fieldErrors.password ? "border-destructive" : ""}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowPass(!showPass)}
          >
            {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password}</p>}
      </div>

      <div className="space-y-1.5">
        <p className="text-sm text-muted-foreground">Confirm Password</p>
        <div className="relative">
          <Input
            type={showConfirm ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            className={fieldErrors.confirmPassword ? "border-destructive" : ""}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowConfirm(!showConfirm)}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {fieldErrors.confirmPassword && (
          <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create Account & Accept"
        )}
      </Button>
    </form>
  );
}
