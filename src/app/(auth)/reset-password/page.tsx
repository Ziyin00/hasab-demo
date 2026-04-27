"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/forms/auth/ResetPasswordForm";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    if (!token || !email) {
      router.replace("/login");
    }
  }, [token, email, router]);

  if (!token || !email) return null;

  return <ResetPasswordForm token={token} email={email} />;
}

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Create New Password</h1>
        <p className="text-muted-foreground text-sm">
          Enter a new password for your account. Make sure it&apos;s strong and secure.
        </p>
      </div>

      <Suspense>
        <ResetPasswordContent />
      </Suspense>

      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link href="/login" className="underline hover:text-foreground transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
