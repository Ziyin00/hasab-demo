import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <div className="w-full max-w-md p-8 bg-background border rounded-2xl shadow-sm">
        {children}
      </div>
    </div>
  );
}
