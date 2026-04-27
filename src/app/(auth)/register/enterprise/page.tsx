"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { UserInfoStep } from "@/components/forms/register/UserInfoStep";
import { OrgInfoStep } from "@/components/forms/register/OrgInfoStep";
import { AddressStep } from "@/components/forms/register/AddressStep";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth.store";
import { RegisterResponse } from "@/types/api.types";
import { cn } from "@/lib/utils";

const userSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().min(1, "Email is required").email("Invalid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
    password_confirmation: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  });

const orgSchema = z.object({
  organization_name: z.string().min(1, "Organization name is required"),
  organization_email: z.string().min(1, "Email is required").email("Invalid email"),
  organization_phone: z.string().min(1, "Phone number is required"),
  website: z.string().optional(),
});

const addressSchema = z.object({
  address: z.string().min(1, "Address is required"),
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
  postal_code: z.string().optional(),
  terms: z.boolean().refine((v) => v === true, "You must accept the terms and conditions"),
});

type UserForm = z.infer<typeof userSchema>;
type OrgForm = z.infer<typeof orgSchema>;
type AddressForm = z.infer<typeof addressSchema>;

const STEP_LABELS = ["Your Info", "Organization", "Address"];

export default function EnterpriseRegisterPage() {
  const router = useRouter();
  const { login, addToast } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userForm = useForm<UserForm>({
    resolver: zodResolver(userSchema as any),
    defaultValues: { name: "", email: "", password: "", password_confirmation: "" },
  });

  const orgForm = useForm<OrgForm>({
    resolver: zodResolver(orgSchema as any),
    defaultValues: { organization_name: "", organization_email: "", organization_phone: "", website: "" },
  });

  const addressForm = useForm<AddressForm>({
    resolver: zodResolver(addressSchema as any),
    defaultValues: { address: "", country: "", city: "", postal_code: "", terms: undefined as any },
  });

  const handleNext = async () => {
    const valid =
      step === 1 ? await userForm.trigger() : await orgForm.trigger();
    if (valid) setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    const valid = await addressForm.trigger();
    if (!valid) return;

    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...userForm.getValues(),
        ...orgForm.getValues(),
        ...addressForm.getValues(),
        user_type: "organization" as const,
      };
      const response = await apiClient.post<RegisterResponse>("/auth/register", payload);
      await login(response.data);
      addToast("Account created", "Welcome to Hasab AI!", "success");
      router.push("/dashboard");
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        Object.values(err.response?.data?.errors ?? {}).flat().join(" ") ||
        "Registration failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => (step === 1 ? router.push("/register") : setStep((s) => s - 1))}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {step === 1 ? "Back" : "Previous step"}
        </button>
        <h1 className="text-2xl font-bold text-foreground">Enterprise Account</h1>
        <p className="text-muted-foreground text-sm">{STEP_LABELS[step - 1]}</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1;
          return (
            <div key={n} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-1.5">
                <div
                  className={cn(
                    "h-1.5 w-8 rounded-full transition-colors",
                    n < step
                      ? "bg-primary"
                      : n === step
                      ? "bg-primary/50"
                      : "bg-muted",
                  )}
                />
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
          {error}
        </div>
      )}

      {/* Step 1 */}
      {step === 1 && (
        <Form {...userForm}>
          <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-5">
            <UserInfoStep />
            <Button type="submit" className="w-full">
              Next <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </form>
        </Form>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <Form {...orgForm}>
          <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-5">
            <OrgInfoStep />
            <Button type="submit" className="w-full">
              Next <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </form>
        </Form>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <Form {...addressForm}>
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-5">
            <AddressStep />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Complete Registration"
              )}
            </Button>
          </form>
        </Form>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="underline hover:text-foreground transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
