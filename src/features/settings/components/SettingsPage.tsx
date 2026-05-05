"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Building2, CreditCard, Palette } from "lucide-react";
import { useProfile } from "../hooks/useSettings";
import { AccountTab } from "./AccountTab";
import { OrganizationTab } from "./OrganizationTab";
import { BillingTab } from "./BillingTab";
import { AppearanceTab } from "./AppearanceTab";

type TabId = "account" | "organization" | "billing" | "appearance";

const VALID_TABS: TabId[] = ["account", "organization", "billing", "appearance"];

function isValidTab(t: string | undefined): t is TabId {
  return VALID_TABS.includes(t as TabId);
}

const BASE_TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "account", label: "Account", icon: User },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "appearance", label: "Appearance", icon: Palette },
];

interface Props {
  initialTab?: string;
}

export function SettingsPage({ initialTab }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>(
    isValidTab(initialTab) ? initialTab : "account"
  );
  const { data: profile } = useProfile();

  const hasOrg = !!profile?.organization;

  const tabs = hasOrg
    ? [
        BASE_TABS[0],
        { id: "organization" as TabId, label: "Organization", icon: Building2 },
        ...BASE_TABS.slice(1),
      ]
    : BASE_TABS;

  function handleTabChange(id: TabId) {
    setActiveTab(id);
    router.replace(`/dashboard/settings?tab=${id}`, { scroll: false });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleTabChange(id)}
            className={`relative flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
              activeTab === id
                ? "text-foreground font-medium after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "account" && <AccountTab />}
        {activeTab === "organization" && <OrganizationTab />}
        {activeTab === "billing" && <BillingTab />}
        {activeTab === "appearance" && <AppearanceTab />}
      </div>
    </div>
  );
}
