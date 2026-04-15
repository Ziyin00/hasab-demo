import React from "react";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account settings and profile information.
        </p>
      </div>
      <div className="p-8 border rounded-lg bg-card text-card-foreground shadow-sm">
        <p>Profile information will be displayed here.</p>
      </div>
    </div>
  );
}
