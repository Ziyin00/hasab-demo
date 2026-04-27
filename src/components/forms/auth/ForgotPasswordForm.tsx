"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiClient } from "@/lib/api-client";
import { ForgotPasswordResponse } from "@/types/api.types";

const schema = z.object({
  email: z.email("Please enter a valid email address"),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [sentEmail, setSentEmail] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: FormValues) => {
    try {
      await apiClient.post<ForgotPasswordResponse>("/forgot-password", { email: values.email });
      setSentEmail(values.email);
      form.reset();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to send reset email.";
      form.setError("email", { type: "manual", message: msg });
    }
  };

  if (sentEmail) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <Mail className="h-16 w-16 text-primary" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-foreground">Check your email</h2>
          <p className="text-sm text-muted-foreground">
            We sent a password reset link to{" "}
            <span className="font-medium text-foreground">{sentEmail}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Button className="flex-1" onClick={() => window.open("https://mail.google.com", "_blank")}>
            Open Gmail
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => setSentEmail(null)}>
            Resend Email
          </Button>
        </div>
        <Link
          href="/login"
          className="block text-sm text-muted-foreground hover:text-foreground transition-colors underline"
        >
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="your@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Send Reset Link"
          )}
        </Button>
      </form>
    </Form>
  );
}
