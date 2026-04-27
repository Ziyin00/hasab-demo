"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

export function OrgInfoStep() {
  const { control } = useFormContext();

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="organization_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Organization Name <span className="text-destructive">*</span></FormLabel>
            <FormControl>
              <Input placeholder="Company Inc." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="organization_email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Organization Email <span className="text-destructive">*</span></FormLabel>
            <FormControl>
              <Input type="email" placeholder="contact@company.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="organization_phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phone Number <span className="text-destructive">*</span></FormLabel>
            <FormControl>
              <Input type="tel" placeholder="+1 555 000 0000" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="website"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Website</FormLabel>
            <FormControl>
              <Input placeholder="https://example.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
