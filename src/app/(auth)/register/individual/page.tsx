"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { IndividualForm } from "@/components/forms/register/IndividualForm";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth.store";
import { RegisterResponse } from "@/types/api.types";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";

const schema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.email("Invalid email address"),
    phone_number: z.string().min(1, "Phone number is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
    password_confirmation: z.string().min(1, "Please confirm your password"),
    terms: z.boolean().refine((v) => v === true, "You must accept the terms and conditions"),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  });

type FormValues = z.infer<typeof schema>;

export default function IndividualRegisterPage() {
  const router = useRouter();
  const { login, addToast } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema as any),
    defaultValues: {
      name: "",
      email: "",
      phone_number: "",
      password: "",
      password_confirmation: "",
      terms: undefined as any,
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      const response = await apiClient.post<RegisterResponse>("/auth/register", {
        name: values.name,
        email: values.email,
        phone_number: values.phone_number,
        password: values.password,
        password_confirmation: values.password_confirmation,
        user_type: "individual",
      });
      await login(response.data);
      addToast("Account created", "Welcome to Hasab AI!", "success");
      router.push("/dashboard");
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        Object.values(err.response?.data?.errors ?? {}).flat().join(" ") ||
        "Registration failed. Please try again.";
      setError(msg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/register"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Individual Account</h1>
        <p className="text-muted-foreground text-sm">Enter your details to create an account</p>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
          {error}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <IndividualForm />

          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      </Form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-muted-foreground text-xs">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <GoogleLoginButton onError={(msg) => setError(msg)} />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="underline hover:text-foreground transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
