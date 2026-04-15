"use client";

import { usePathname } from "next/navigation";
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
} from "@/components/ui/sidebar";
import { 
  FileAudio, 
  Languages, 
  Mic2, 
  Clock, 
  Key, 
  LayoutDashboard,
  Subtitles,
  Users,
  User,
  CreditCard,
  Settings,
  LogOut,
  ChevronsUpDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
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
  { title: "History", url: "/dashboard/history", icon: Clock },
];

const playgroundItems = [
  { title: "Transcription", url: "/dashboard/playground/transcription", icon: FileAudio },
  { title: "Translation", url: "/dashboard/playground/translation", icon: Languages },
  { title: "TTS", url: "/dashboard/playground/tts", icon: Mic2 },
  { title: "Meeting Minutes", url: "/dashboard/playground/meeting-minutes", icon: Users },
  { title: "Subtitles", url: "/dashboard/playground/subtitles", icon: Subtitles },
];

const settingItems = [
  { title: "API Keys", url: "/dashboard/api-keys", icon: Key },
];

export function AppSidebar() {
  const pathname = usePathname();

  const renderMenuItems = (items: typeof generalItems) => (
    <SidebarMenu>
      {items.map((item) => {
        const isActive = pathname === item.url;
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton 
              asChild 
              isActive={isActive}
              className={cn(
                "transition-all duration-200",
                isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
              )}
            >
              <Link href={item.url} className="flex items-center gap-3">
                <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="text-xl font-bold italic tracking-tighter">Hasab AI</div>
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
                    <AvatarImage src="/avatar.png" alt="User" />
                    <AvatarFallback className="rounded-lg">HA</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-primary">Hasab User</span>
                    <span className="truncate text-xs text-muted-foreground">user@hasab.ai</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
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
                      <AvatarImage src="/avatar.png" alt="User" />
                      <AvatarFallback className="rounded-lg">HA</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold text-primary">Hasab User</span>
                      <span className="truncate text-xs text-muted-foreground">user@hasab.ai</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile" className="flex items-center gap-2 w-full">
                    <User className="size-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/billing" className="flex items-center gap-2 w-full">
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
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive">
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
