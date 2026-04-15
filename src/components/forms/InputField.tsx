"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InputFieldProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
}

export const InputField = ({ name, label, type = "text", placeholder }: InputFieldProps) => {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-2 w-full">
      <Label htmlFor={name}>{label}</Label>
      <Input 
        id={name} 
        type={type} 
        placeholder={placeholder} 
        {...register(name)} 
      />
      {errors[name] && (
        <p className="text-sm text-destructive">{errors[name]?.message as string}</p>
      )}
    </div>
  );
};
