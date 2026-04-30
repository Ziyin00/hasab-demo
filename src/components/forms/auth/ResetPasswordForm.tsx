"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth.store";
import { ResetPasswordResponse } from "@/types/api.types";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

interface ResetPasswordFormProps {
  token: string;
  email: string;
}

export function ResetPasswordForm({ token, email }: ResetPasswordFormProps) {
  const router = useRouter();
  const { login, addToast } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [rootError, setRootError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema as any),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: FormValues) => {
    setRootError(null);
    try {
      const res = await apiClient.post<ResetPasswordResponse>("/reset-password", {
        token,
        email,
        password: values.password,
        password_confirmation: values.confirmPassword,
      });
      await login({ ...res.data.data, message: res.data.message });
      addToast("Password reset", "Your password has been updated.", "success");
      router.push("/dashboard");
    } catch (err: any) {
      setRootError(
        err.response?.data?.message || err.message || "Failed to reset password. Please try again."
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {rootError && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
            {rootError}
          </div>
        )}

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPass ? "text" : "password"}
                    placeholder="New password"
                    {...field}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPass(!showPass)}
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm new password"
                    {...field}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Resetting...
            </>
          ) : (
            "Reset Password"
          )}
        </Button>
      </form>
    </Form>
  );
}
