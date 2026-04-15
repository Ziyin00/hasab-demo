import React from "react";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-6 py-4 border-b">
        <nav className="flex justify-between items-center">
          <div className="text-2xl font-bold italic">Hasab AI</div>
          <ul className="flex gap-6">
            <li><a href="/services" className="hover:text-primary transition-colors">Services</a></li>
            <li><a href="/pricing" className="hover:text-primary transition-colors">Pricing</a></li>
            <li><a href="/about" className="hover:text-primary transition-colors">About</a></li>
            <li><a href="/contact" className="hover:text-primary transition-colors">Contact</a></li>
          </ul>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="p-6 border-t text-center text-muted-foreground">
        &copy; 2026 Hasab AI. All rights reserved.
      </footer>
    </div>
  );
}
