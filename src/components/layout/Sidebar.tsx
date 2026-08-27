"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
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
  ChevronsUpDown,
  FileText,
  Bot,
  MessageSquare,
  Send,
  History,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/auth.store";
import { useAccess } from "@/hooks/useAccess";
import type { AccessLevel } from "@/lib/userAccess";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  exact?: boolean;
  /** Who can see this item — mirrors hasab-dashboard-v2 */
  access?: AccessLevel;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "MONITORING",
    items: [
      {
        title: "Analytics",
        url: "/dashboard/analytics",
        icon: TrendingUp,
        exact: true,
        access: "admin",
      },
      {
        title: "Conversations",
        url: "/dashboard/analytics/conversations",
        icon: MessageSquare,
        access: "admin",
      },
      {
        title: "Activity",
        url: "/dashboard/activity",
        icon: History,
        access: "all",
      },
    ],
  },
  {
    label: "WIDGET",
    items: [
      { title: "Widgets", url: "/dashboard/widgets", icon: Bot, access: "org" },
      {
        title: "Telegram Bots",
        url: "/dashboard/telegram-bots",
        icon: Send,
        access: "org",
      },
      {
        title: "Contexts",
        url: "/dashboard/context",
        icon: FileText,
        access: "admin",
      },
    ],
  },
  {
    label: "DEVELOPER",
    items: [
      { title: "API Key", url: "/dashboard/api-keys", icon: KeyRound, access: "admin" },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { state, isMobile } = useSidebar();
  const { user, logout } = useAuthStore();
  const { can, roleLabel } = useAccess();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isCollapsed = state === "collapsed";
  const { theme, resolvedTheme, setTheme } = useTheme();
  const isDark = (resolvedTheme ?? theme) === "dark";

  const visibleGroups = useMemo(() => {
    // Hydration safety: on the server `user` is null (no localStorage),
    // so role-based filtering would change the rendered DOM after mount.
    // Render the full nav until the component mounts on the client.
    if (!isMounted) return NAV_GROUPS;

    return NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => can(item.access ?? "all")),
    })).filter((group) => group.items.length > 0);
  }, [can, isMounted]);

  const displayName = isMounted ? user?.name || "Hasab User" : "Hasab User";
  const displayEmail = isMounted ? user?.email || "user@hasab.ai" : "user@hasab.ai";
  const displayInitials =
    isMounted && user?.name ? user.name.substring(0, 2).toUpperCase() : "HA";
  const orgName = isMounted ? user?.organization?.name ?? displayName : displayName;
  const displayRole = isMounted ? roleLabel : "";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="relative border-b p-4 group-data-[collapsible=icon]:p-2">
        {!isCollapsed || isMobile ? (
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/"
              className="flex min-w-0 items-center gap-2 rounded-md outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Image
                src="/hasab_ai.png"
                alt="Hasab AI"
                width={28}
                height={28}
                className="size-7 shrink-0 rounded-md"
              />
              <div className="min-w-0">
                <p className="text-sm leading-tight font-bold">Hasab AI</p>
                <p className="text-[10px] tracking-widest text-muted-foreground uppercase">
                  Chat Dashboard
                </p>
              </div>
            </Link>
            <SidebarTrigger className="-mr-2" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Link
              href="/"
              className="rounded-md outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
              title="Home"
            >
              <Image
                src="/hasab_ai.png"
                alt="Hasab AI"
                width={28}
                height={28}
                className="size-7 rounded-md"
              />
            </Link>
            <SidebarTrigger />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {visibleGroups.map((group) => (
          <SidebarGroup key={group.label}>
            {(!isCollapsed || isMobile) && (
              <SidebarGroupLabel className="px-4 py-2 text-[10px] tracking-widest text-muted-foreground">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = item.exact
                    ? pathname === item.url
                    : pathname === item.url || pathname.startsWith(item.url + "/");
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className={cn(
                          "transition-all duration-150",
                          isActive
                            ? "bg-primary/10 font-medium text-primary"
                            : "hover:bg-accent"
                        )}
                      >
                        <Link href={item.url} className="flex items-center gap-3">
                          <item.icon
                            className={cn(
                              "h-4 w-4 shrink-0",
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

      <SidebarFooter className="border-t p-4">
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
                        <span className="truncate text-sm font-semibold">{orgName}</span>
                        <span className="truncate text-[11px] text-muted-foreground">
                          {displayRole || "Hasab AI Chat"}
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
                      <span className="truncate text-xs text-muted-foreground">
                        {displayEmail}
                      </span>
                      {displayRole && (
                        <span className="mt-0.5 truncate text-[10px] font-medium text-primary">
                          {displayRole}
                        </span>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                >
                  {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
                  {isDark ? "Light Mode" : "Dark Mode"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={async () => {
                    await logout();
                    router.push("/login");
                  }}
                >
                  <LogOut className="mr-2 size-4" />
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
