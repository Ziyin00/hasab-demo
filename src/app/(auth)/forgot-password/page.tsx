"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ForgotPasswordForm } from "@/components/forms/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Sign In
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
        <p className="text-muted-foreground text-sm">
          Enter the email associated with your account
        </p>
      </div>

      <ForgotPasswordForm />
    </div>
  );
}
