"use client";

import { useState } from "react";
import { Loader2, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBuyTokens } from "../hooks/useSettings";
import type { TokenCurrency } from "../types/billing.types";

interface TopUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TopUpDialog({ open, onOpenChange }: TopUpDialogProps) {
  const [currency, setCurrency] = useState<TokenCurrency>("ETB");
  const [amount, setAmount] = useState("");
  const { mutate, isPending } = useBuyTokens();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) return;

    mutate(
      { currency, amount: parsed },
      {
        onSuccess: (data) => {
          onOpenChange(false);
          if (data.response?.data?.checkout_url) {
            window.location.href = data.response.data.checkout_url;
          }
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-primary" />
            Top Up Tokens
          </DialogTitle>
          <DialogDescription>
            Choose a currency and enter the amount you want to pay. You will be
            redirected to the payment page.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={currency}
              onValueChange={(v) => setCurrency(v as TokenCurrency)}
            >
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ETB">ETB — Ethiopian Birr</SelectItem>
                <SelectItem value="USD">USD — US Dollar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount ({currency})</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              step="any"
              placeholder="e.g. 100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !amount}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Proceed to Checkout
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
