"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth.store";
import { apiClient } from "@/lib/api-client";
import { LoginResponse } from "@/types/api.types";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";

const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, loadingState, addToast } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema as any),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setError(null);
    try {
      const response = await apiClient.post<LoginResponse>("/auth/login", values);
      if (response.data.access_token) {
        await login(response.data);
        addToast("Login successful", "Welcome back!", "success");
        router.push("/dashboard");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Invalid credentials. Please try again.";
      setError(message);
      addToast("Login failed", message, "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="space-y-1 text-center">
        <h1 className="text-3xl font-bold text-foreground">Welcome Back</h1>
        <p className="text-muted-foreground text-sm">Sign in to Hasab Meetings</p>
      </div>

      {/* Email / password form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            disabled={loadingState}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            disabled={loadingState}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button className="w-full" type="submit" disabled={loadingState}>
          {loadingState ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing In...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-muted-foreground text-xs">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <GoogleLoginButton onError={(msg) => setError(msg)} />

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="underline hover:text-foreground transition-colors">
          Sign up
        </Link>
      </p>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground leading-relaxed">
        By proceeding, you confirm that you agree with our{" "}
        <Link href="/terms" className="underline hover:text-foreground transition-colors">
          Terms And Conditions
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-foreground transition-colors">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}
