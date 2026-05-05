import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import QueryProvider from "@/components/providers/query-provider";

import { AuthInitializer } from "@/components/providers/auth-initializer";
import { TranscriptionJobToast } from "@/components/providers/TranscriptionJobToast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hasab AI - Dashboard",
  description: "Next generation AI content processing dashboard",
  icons: {
    icon: "/hasab_ai.png",
    shortcut: "/hasab_ai.png",
    apple: "/hasab_ai.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          scriptProps={{ suppressHydrationWarning: true }}
        >
          <QueryProvider>
            <TooltipProvider>
              <AuthInitializer />
              {children}
              <Toaster />
              <TranscriptionJobToast />
            </TooltipProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
