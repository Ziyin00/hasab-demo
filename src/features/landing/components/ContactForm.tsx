"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitContactForm } from "@/features/landing/api/contact.api";

type ContactFields = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

type FieldErrors = Record<keyof ContactFields, string>;

const EMPTY_FIELDS: ContactFields = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

const EMPTY_ERRORS: FieldErrors = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

function validateContactForm(data: ContactFields): { isValid: boolean; errors: FieldErrors } {
  const errors = { ...EMPTY_ERRORS };
  let isValid = true;

  if (!data.name.trim()) {
    errors.name = "Name is required";
    isValid = false;
  }

  if (!data.email.trim()) {
    errors.email = "Email is required";
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Please enter a valid email address";
    isValid = false;
  }

  if (!data.subject.trim()) {
    errors.subject = "Subject is required";
    isValid = false;
  }

  if (!data.message.trim()) {
    errors.message = "Message is required";
    isValid = false;
  } else if (data.message.trim().length < 10) {
    errors.message = "Message should be at least 10 characters";
    isValid = false;
  }

  return { isValid, errors };
}

export interface ContactFormProps {
  defaultSubject?: string;
  messageLabel?: string;
  messagePlaceholder?: string;
}

export function ContactForm({
  defaultSubject = "",
  messageLabel = "Message",
  messagePlaceholder = "How can we help you?",
}: ContactFormProps) {
  const [data, setData] = useState<ContactFields>({
    ...EMPTY_FIELDS,
    subject: defaultSubject,
  });
  const [errors, setErrors] = useState<FieldErrors>(EMPTY_ERRORS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ success: boolean; message: string } | null>(
    null
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const field = name as keyof ContactFields;

    setData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const { isValid, errors: nextErrors } = validateContactForm(data);
    setErrors(nextErrors);
    if (!isValid) return;

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await submitContactForm(data);
      setSubmitStatus({
        success: true,
        message: response?.message || "Message sent successfully!",
      });
      setData({
        ...EMPTY_FIELDS,
        subject: defaultSubject,
      });
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to send message. Please try again later.";
      setSubmitStatus({ success: false, message: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="lp-contact-form space-y-4 border border-[var(--lp-border)] p-6 sm:p-8"
      onSubmit={handleSubmit}
    >
      <AnimatePresence mode="wait">
        {submitStatus ? (
          <motion.div
            key={submitStatus.success ? "success" : "error"}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={`rounded border p-4 text-sm ${
              submitStatus.success
                ? "border-emerald-500/30 bg-emerald-500/10 text-[var(--lp-ink)]"
                : "border-red-500/30 bg-red-500/10 text-[var(--lp-ink)]"
            }`}
          >
            <div className="flex items-start gap-2">
              {submitStatus.success ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              ) : null}
              <p>{submitStatus.message}</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="contact-name">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            className={`mt-2 ${errors.name ? "border-red-500" : ""}`}
            value={data.name}
            onChange={handleChange}
            placeholder="Your name"
          />
          {errors.name ? <p className="mt-1 text-sm text-red-500">{errors.name}</p> : null}
        </div>

        <div>
          <Label htmlFor="contact-email">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            className={`mt-2 ${errors.email ? "border-red-500" : ""}`}
            value={data.email}
            onChange={handleChange}
            placeholder="your.email@example.com"
          />
          {errors.email ? <p className="mt-1 text-sm text-red-500">{errors.email}</p> : null}
        </div>
      </div>

      <div>
        <Label htmlFor="contact-subject">
          Subject <span className="text-red-500">*</span>
        </Label>
        <Input
          id="contact-subject"
          name="subject"
          type="text"
          className={`mt-2 ${errors.subject ? "border-red-500" : ""}`}
          value={data.subject}
          onChange={handleChange}
          placeholder="What's this about?"
        />
        {errors.subject ? <p className="mt-1 text-sm text-red-500">{errors.subject}</p> : null}
      </div>

      <div>
        <Label htmlFor="contact-message">
          {messageLabel} <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="contact-message"
          name="message"
          rows={5}
          className={`mt-2 resize-none ${errors.message ? "border-red-500" : ""}`}
          value={data.message}
          onChange={handleChange}
          placeholder={messagePlaceholder}
        />
        {errors.message ? <p className="mt-1 text-sm text-red-500">{errors.message}</p> : null}
      </div>

      <Button type="submit" variant="default" className="w-full sm:w-auto" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Sending...
          </>
        ) : (
          "Send message"
        )}
      </Button>
    </form>
  );
}
