import { BillingPage } from "@/features/billing/components/BillingPage";

export default function BillingPageRoute() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Manage your credits and view transaction history.
        </p>
      </div>
      <BillingPage />
    </div>
  );
}
