import React from "react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your application preferences and general settings.
        </p>
      </div>
      <div className="p-8 border rounded-lg bg-card text-card-foreground shadow-sm">
        <p>Application preferences and general configurations will be displayed here.</p>
      </div>
    </div>
  );
}
