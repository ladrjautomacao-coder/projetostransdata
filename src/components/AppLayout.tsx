import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import { Signal } from "lucide-react";
import { ProjectFiltersProvider } from "@/contexts/ProjectFiltersContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AlertsBell } from "@/components/AlertsBell";
import { CommandPalette } from "@/components/CommandPalette";
import { AssistantWidget } from "@/components/assistant/AssistantWidget";

export function AppLayout() {
  return (
    <ProjectFiltersProvider>
    <SidebarProvider>
      <CommandPalette />
      <AssistantWidget />
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <header className="flex h-14 items-center border-b bg-card/80 backdrop-blur-sm px-3 md:px-4 relative gap-2">
            <SidebarTrigger className="mr-1 md:mr-4" />
            <div className="flex-1" />
            <div className="flex items-center gap-1.5 md:gap-3">
              <AlertsBell />
              <ThemeToggle />
              <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
                <Signal className="h-3 w-3 text-primary animate-pulse" />
                <span className="font-medium uppercase tracking-wider">Sistema Online</span>
              </div>
            </div>
          </header>
          <div className="flex-1 p-3 md:p-6 overflow-auto bg-background">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
    </ProjectFiltersProvider>
  );
}

