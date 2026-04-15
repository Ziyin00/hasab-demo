"use client";

import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/Sidebar";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter(Boolean);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="h-16 border-b flex items-center px-6 sticky top-0 bg-background z-10 gap-4">
            <SidebarTrigger />
            <div className="h-4 w-[1px] bg-border mx-2" />
            
            <Breadcrumb>
              <BreadcrumbList>
                {pathSegments.map((segment, index) => {
                  const href = `/${pathSegments.slice(0, index + 1).join("/")}`;
                  const isLast = index === pathSegments.length - 1;
                  const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");

                  return (
                    <React.Fragment key={href}>
                      <BreadcrumbItem>
                        {isLast ? (
                          <BreadcrumbPage>{label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {!isLast && <BreadcrumbSeparator />}
                    </React.Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <main className="p-6 flex-1">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
