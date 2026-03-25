import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import { Signal } from "lucide-react";
import { ProjectFiltersProvider } from "@/contexts/ProjectFiltersContext";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AppLayout() {
  return (
    <ProjectFiltersProvider>
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className="flex h-14 items-center border-b bg-card/80 backdrop-blur-sm px-4 relative">
            <SidebarTrigger className="mr-4" />
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Signal className="h-3 w-3 text-primary animate-pulse" />
                <span className="font-medium uppercase tracking-wider">Sistema Online</span>
              </div>
            </div>
          </header>
          <div className="flex-1 p-4 md:p-6 overflow-auto tech-grid">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
    </ProjectFiltersProvider>
  );
}
