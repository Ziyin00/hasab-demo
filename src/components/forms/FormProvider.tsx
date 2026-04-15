"use client";

import { useForm, FormProvider as HookFormProvider, UseFormReturn, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodType } from "zod";

interface FormProviderProps<T extends FieldValues> {
  children: React.ReactNode;
  schema: ZodType<T, any, any>;
  onSubmit: (data: T) => void;
  defaultValues?: Partial<T>;
}

export const FormProvider = <T extends FieldValues>({
  children,
  schema,
  onSubmit,
  defaultValues,
}: FormProviderProps<T>) => {
  const methods = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any,
  });

  return (
    <HookFormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit as any)} className="space-y-4">
        {children}
      </form>
    </HookFormProvider>
  );
};
