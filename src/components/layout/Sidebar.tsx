"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  LogOut,
  Sun,
  Moon,
  TrendingUp,
  KeyRound,
  Code2,
  ChevronsUpDown,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/auth.store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const NAV_GROUPS = [
  {
    label: "MONITORING",
    items: [
      { title: "Analytics", url: "/dashboard/analytics", icon: TrendingUp },
    ],
  },
  {
    label: "WIDGET",
    items: [
      { title: "Installation", url: "/dashboard/installation", icon: Code2 },
      { title: "Contexts", url: "/dashboard/context", icon: FileText },
    ],
  },
  {
    label: "DEVELOPER",
    items: [
      { title: "API Keys", url: "/dashboard/api-keys", icon: KeyRound },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { state, isMobile } = useSidebar();
  const { user, logout } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isCollapsed = state === "collapsed";
  const { theme, setTheme } = useTheme();

  const displayName = isMounted ? user?.name || "Hasab User" : "Hasab User";
  const displayEmail = isMounted ? user?.email || "user@hasab.ai" : "user@hasab.ai";
  const displayInitials =
    isMounted && user?.name ? user.name.substring(0, 2).toUpperCase() : "HA";
  const orgName = isMounted ? user?.organization?.name ?? displayName : displayName;

  return (
    <Sidebar collapsible="icon">
      {/* Header */}
      <SidebarHeader className="p-4 border-b relative group-data-[collapsible=icon]:p-2">
        {!isCollapsed || isMobile ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Image
                src="/hasab_ai.png"
                alt="Hasab AI"
                width={28}
                height={28}
                className="rounded-md size-7"
              />
              <div>
                <p className="font-bold text-sm leading-tight">Hasab AI</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  Chat Dashboard
                </p>
              </div>
            </div>
            <SidebarTrigger className="-mr-2" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Image
              src="/hasab_ai.png"
              alt="Hasab AI"
              width={28}
              height={28}
              className="rounded-md size-7"
            />
            <SidebarTrigger />
          </div>
        )}
      </SidebarHeader>

      {/* Nav groups */}
      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            {(!isCollapsed || isMobile) && (
              <SidebarGroupLabel className="px-4 py-2 text-[10px] tracking-widest text-muted-foreground">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className={cn(
                          "transition-all duration-150",
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-accent"
                        )}
                      >
                        <Link href={item.url} className="flex items-center gap-3">
                          <item.icon
                            className={cn(
                              "w-4 h-4 shrink-0",
                              isActive ? "text-primary" : "text-muted-foreground"
                            )}
                          />
                          {(!isCollapsed || isMobile) && (
                            <span className="text-sm">{item.title}</span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-4 border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage alt={displayName} />
                    <AvatarFallback className="rounded-lg text-xs">
                      {displayInitials}
                    </AvatarFallback>
                  </Avatar>
                  {(!isCollapsed || isMobile) && (
                    <>
                      <div className="grid flex-1 text-left text-xs leading-tight">
                        <span className="truncate font-semibold text-sm">{orgName}</span>
                        <span className="truncate text-[11px] text-muted-foreground">
                          Hasab AI Chat v1.0
                        </span>
                      </div>
                      <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
                    </>
                  )}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="right"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage alt={displayName} />
                      <AvatarFallback className="rounded-lg">{displayInitials}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{displayName}</span>
                      <span className="truncate text-xs text-muted-foreground">{displayEmail}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={async () => {
                    await logout();
                    router.push("/login");
                  }}
                >
                  <LogOut className="size-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
