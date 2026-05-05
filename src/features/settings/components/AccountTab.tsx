"use client";

import { useState, useEffect } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfile, useUpdateProfile, useChangePassword } from "../hooks/useSettings";
import type { User } from "@/types/api.types";

function Avatar({ name }: { name: string }) {
  return (
    <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-semibold flex-shrink-0 select-none">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-9"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export function AccountTab() {
  const { data: profile, isLoading } = useProfile();
  const { mutate: updateProfile, isPending: isSaving } = useUpdateProfile();
  const { mutate: changePassword, isPending: isChangingPw } = useChangePassword();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setPhone(profile.phone_number ?? "");
    }
  }, [profile]);

  function handleSaveProfile() {
    updateProfile(
      { name: name.trim(), phone_number: phone.trim() },
      {
        onSuccess: () => toast.success("Profile updated"),
        onError: () => toast.error("Failed to update profile"),
      }
    );
  }

  function handleChangePassword() {
    if (newPw !== confirmPw) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPw.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    changePassword(
      { current_password: currentPw, password: newPw, password_confirmation: confirmPw },
      {
        onSuccess: () => {
          toast.success("Password updated");
          setCurrentPw("");
          setNewPw("");
          setConfirmPw("");
        },
        onError: () => toast.error("Failed to update password. Check your current password."),
      }
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border bg-card h-48 animate-pulse" />
        ))}
      </div>
    );
  }

  const user = profile as User;

  return (
    <div className="space-y-5">
      {/* Profile */}
      <SectionCard title="Profile" description="Your name and contact info.">
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar name={user?.name ?? "U"} />
            <div>
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.role?.name}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+251..."
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user?.email ?? ""}
              disabled
              className="text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
          </div>

          <div className="flex justify-end pt-1">
            <Button onClick={handleSaveProfile} disabled={isSaving} className="gap-2">
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save changes
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* Change password */}
      <SectionCard title="Password" description="Update your account password.">
        <div className="space-y-4">
          <PasswordField
            id="current-pw"
            label="Current password"
            value={currentPw}
            onChange={setCurrentPw}
            placeholder="••••••••"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <PasswordField
              id="new-pw"
              label="New password"
              value={newPw}
              onChange={setNewPw}
              placeholder="Min. 8 characters"
            />
            <PasswordField
              id="confirm-pw"
              label="Confirm new password"
              value={confirmPw}
              onChange={setConfirmPw}
              placeholder="Repeat new password"
            />
          </div>
          <div className="flex justify-end pt-1">
            <Button
              onClick={handleChangePassword}
              disabled={isChangingPw || !currentPw || !newPw || !confirmPw}
              className="gap-2"
            >
              {isChangingPw && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Update password
            </Button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
