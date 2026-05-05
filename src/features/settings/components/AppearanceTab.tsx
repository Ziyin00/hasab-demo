"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

export function AppearanceTab() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-sm font-semibold">Theme</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Choose how the dashboard looks to you.
          </p>
        </div>
        <div className="px-6 py-5">
          <div className="flex gap-3">
            {THEMES.map(({ value, label, icon: Icon }) => {
              const active = theme === value;
              return (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex flex-col items-center gap-2.5 rounded-xl border-2 p-4 w-32 transition-colors ${
                    active
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      value === "dark"
                        ? "bg-zinc-900 text-zinc-100"
                        : "bg-zinc-100 text-zinc-800"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
