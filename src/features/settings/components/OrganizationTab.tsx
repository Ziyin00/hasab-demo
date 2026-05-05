"use client";

import { useState, useEffect } from "react";
import { Building2, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfile, useUpdateOrganization } from "../hooks/useSettings";
import type { Organization } from "@/types/api.types";

function Field({
  label,
  value,
  editing,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  if (!editing) {
    return (
      <div className="flex flex-col gap-0.5 py-3 border-b last:border-0">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-medium">{value || "—"}</span>
      </div>
    );
  }
  return (
    <div className="space-y-1.5 py-2">
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? label}
      />
    </div>
  );
}

export function OrganizationTab() {
  const { data: profile, isLoading } = useProfile();
  const org = profile?.organization as Organization | null | undefined;
  const { mutate: updateOrg, isPending } = useUpdateOrganization(org?.id ?? 0);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone_number: "",
    address: "",
    city: "",
    country: "",
    postal_code: "",
    website: "",
  });

  useEffect(() => {
    if (org) {
      setForm({
        name: org.name ?? "",
        email: org.email ?? "",
        phone_number: org.phone_number ?? "",
        address: org.address ?? "",
        city: org.city ?? "",
        country: org.country ?? "",
        postal_code: org.postal_code ?? "",
        website: org.website ?? "",
      });
    }
  }, [org]);

  function set(field: keyof typeof form) {
    return (v: string) => setForm((f) => ({ ...f, [field]: v }));
  }

  function handleSave() {
    updateOrg(form, {
      onSuccess: () => {
        toast.success("Organization updated");
        setEditing(false);
      },
      onError: () => toast.error("Failed to update organization"),
    });
  }

  function handleCancel() {
    if (org) {
      setForm({
        name: org.name ?? "",
        email: org.email ?? "",
        phone_number: org.phone_number ?? "",
        address: org.address ?? "",
        city: org.city ?? "",
        country: org.country ?? "",
        postal_code: org.postal_code ?? "",
        website: org.website ?? "",
      });
    }
    setEditing(false);
  }

  if (isLoading) {
    return <div className="rounded-xl border bg-card h-64 animate-pulse" />;
  }

  if (!org) {
    return (
      <div className="rounded-xl border bg-card p-10 flex flex-col items-center justify-center text-center gap-3">
        <Building2 className="h-8 w-8 text-muted-foreground/40" />
        <div>
          <p className="text-sm font-medium">No organization</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            You are not associated with any organization.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl border bg-card px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-base font-semibold">{org.name}</p>
              <p className="text-xs text-muted-foreground">
                {org.is_owner ? "Owner" : "Member"}
              </p>
            </div>
          </div>
          {!editing && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Organization details</h2>
            {!editing && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Contact details and location.
              </p>
            )}
          </div>
        </div>

        <div className={editing ? "px-6 py-5 space-y-1" : ""}>
          {editing ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["name", "Organization name"],
                  ["email", "Email"],
                  ["phone_number", "Phone number"],
                  ["website", "Website"],
                  ["address", "Address"],
                  ["city", "City"],
                  ["country", "Country"],
                  ["postal_code", "Postal code"],
                ] as [keyof typeof form, string][]
              ).map(([field, label]) => (
                <Field
                  key={field}
                  label={label}
                  value={form[field]}
                  editing
                  onChange={set(field)}
                />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x">
              <div className="px-6">
                <Field label="Name" value={form.name} editing={false} onChange={set("name")} />
                <Field label="Email" value={form.email} editing={false} onChange={set("email")} />
                <Field label="Phone" value={form.phone_number} editing={false} onChange={set("phone_number")} />
                <Field label="Website" value={form.website} editing={false} onChange={set("website")} />
              </div>
              <div className="px-6">
                <Field label="Address" value={form.address} editing={false} onChange={set("address")} />
                <Field label="City" value={form.city} editing={false} onChange={set("city")} />
                <Field label="Country" value={form.country} editing={false} onChange={set("country")} />
                <Field label="Postal code" value={form.postal_code} editing={false} onChange={set("postal_code")} />
              </div>
            </div>
          )}
        </div>

        {editing && (
          <div className="px-6 pb-5 flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending} className="gap-2">
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save changes
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
