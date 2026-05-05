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
  FileAudio,
  Languages,
  Mic2,
  Clock,
  Key,
  LayoutDashboard,
  Users,
  User,
  CreditCard,
  Settings,
  LogOut,
  ChevronsUpDown,
  HelpCircle,
  MessageSquare,
  FileText,
  Sun,
  Moon,
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

const generalItems = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
];

const playgroundItems = [
  { title: "Transcription", url: "/dashboard/playground/transcription", icon: FileAudio },
  { title: "Translation", url: "/dashboard/playground/translation", icon: Languages },
  { title: "Text to Speech", url: "/dashboard/playground/tts", icon: Mic2 },
  { title: "Meeting Minutes", url: "/dashboard/playground/meeting-minutes", icon: Users },
];

const historyItems = [
  { title: "History", url: "/dashboard/history", icon: Clock },
];

const settingItems = [
  { title: "API Keys", url: "/dashboard/api-keys", icon: Key },
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
  const displayInitials = isMounted && user?.name ? user.name.substring(0, 2).toUpperCase() : "HA";

  const renderMenuItems = (items: typeof generalItems) => (
    <SidebarMenu>
      {items.map((item) => {
        const isActive = pathname === item.url;
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton 
              asChild 
              isActive={isActive}
              tooltip={item.title}
              className={cn(
                "transition-all duration-200",
                isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
              )}
            >
              <Link href={item.url} className="flex items-center gap-3">
                <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                {(!isCollapsed || isMobile) && <span>{item.title}</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b relative group-data-[collapsible=icon]:p-2">
        {(!isCollapsed || isMobile) ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Image
                src="/hasab_ai.png"
                alt="Hasab AI"
                width={28}
                height={28}
                className="rounded-md"
                style={{ height: "auto" }}
              />
              <span className="font-bold text-lg tracking-tight">Hasab AI</span>
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
              className="rounded-md"
              style={{ height: "auto" }}
            />
            <SidebarTrigger />
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2">General</SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(generalItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2">Playground</SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(playgroundItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2">Account & API</SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(settingItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            {renderMenuItems(historyItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {[
                { title: "Help", href: "/help", icon: HelpCircle },
                { title: "Feedback", href: "/feedback", icon: MessageSquare },
                { title: "Terms & Conditions", href: "/terms", icon: FileText },
              ].map(({ title, href, icon: Icon }) => (
                <SidebarMenuItem key={title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={title}
                    className="text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <Link href={href} className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      {(!isCollapsed || isMobile) && <span className="text-xs">{title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
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
                    <AvatarImage alt={displayName || "User"} />
                    <AvatarFallback className="rounded-lg">{displayInitials}</AvatarFallback>
                  </Avatar>
                  {(!isCollapsed || isMobile) && (
                    <>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{displayName}</span>
                        <span className="truncate text-xs text-muted-foreground">{displayEmail}</span>
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
                      <AvatarImage alt={displayName || "User"} />
                      <AvatarFallback className="rounded-lg">{displayInitials}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{displayName}</span>
                      <span className="truncate text-xs text-muted-foreground">{displayEmail}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings?tab=account" className="flex items-center gap-2 w-full">
                    <User className="size-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings?tab=billing" className="flex items-center gap-2 w-full">
                    <CreditCard className="size-4" />
                    <span>Billing</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="flex items-center gap-2 w-full">
                    <Settings className="size-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? (
                    <Sun className="size-4" />
                  ) : (
                    <Moon className="size-4" />
                  )}
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
