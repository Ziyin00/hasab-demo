import React from "react";

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing details.
        </p>
      </div>
      <div className="p-8 border rounded-lg bg-card text-card-foreground shadow-sm">
        <p>Billing information and subscription plans will be displayed here.</p>
      </div>
    </div>
  );
}
