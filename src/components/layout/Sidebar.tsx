"use client";

import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

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
              <a href={item.url} className="flex items-center gap-3">
                <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                <span>{item.title}</span>
              </a>
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
    </Sidebar>
  );
}
