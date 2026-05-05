"use client";

import { useState } from "react";
import type { AxiosError } from "axios";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTopUp } from "../hooks/useTopUp";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TopUpDialog({ open, onOpenChange }: Props) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"ETB" | "USD">("ETB");
  const [amountError, setAmountError] = useState("");
  const { mutate: topUp, isPending, error, reset } = useTopUp();

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAmount(val);
    if (!val) setAmountError("Amount is required.");
    else if (parseFloat(val) <= 0) setAmountError("Amount must be greater than 0.");
    else setAmountError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amountError || !amount) return;
    topUp(
      { amount, currency },
      {
        onSuccess: (data) => {
          const url = data?.data?.response?.data?.checkout_url;
          if (url) {
            window.location.href = url;
          } else {
            toast.error("Failed to initiate checkout. Please try again.");
          }
        },
      }
    );
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setAmount("");
      setAmountError("");
      reset();
    }
    onOpenChange(val);
  };

  const isValid = !amountError && !!amount;
  const apiError = error
    ? ((error as AxiosError<{ message: string }>).response?.data?.message ?? (error as Error).message)
    : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Top Up Account Credit</DialogTitle>
          <DialogDescription>
            Select your currency and enter the amount to add credits to your account.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4 pt-1" onSubmit={handleSubmit}>
          {apiError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Currency</label>
            <Select value={currency} onValueChange={(v) => setCurrency(v as "ETB" | "USD")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ETB">ETB </SelectItem>
                <SelectItem value="USD">USD </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Amount</label>
            <Input
              type="number"
              placeholder={`Amount in ${currency}`}
              value={amount}
              onChange={handleAmountChange}
              onBlur={handleAmountChange}
              className={amountError ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {amountError && (
              <p className="text-xs text-destructive">{amountError}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isPending || !isValid}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Proceed to Checkout"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
