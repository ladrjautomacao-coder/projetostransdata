import { FolderKanban, LayoutDashboard, HardHat, BookOpenCheck, Users, LogOut, BarChart3, ShieldCheck, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import logoTransdata from "@/assets/logo-transdata.png.asset.json";

const projectsModuleItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Gestão de Projetos", url: "/projetos", icon: FolderKanban },
];

const implantacaoModuleItems = [
  { title: "Implantação", url: "/implantacao", icon: HardHat },
];

const adminItems = [
  { title: "Equipe", url: "/admin/equipe", icon: Users, adminOnly: true },
  { title: "Usuários", url: "/admin/usuarios", icon: ShieldCheck, adminOnly: true },
  { title: "Configurações", url: "/admin/configuracoes", icon: Settings, adminOnly: true },
  { title: "Manual do Sistema", url: "/manual", icon: BookOpenCheck, adminOnly: false },
];

export function AppSidebar() {
  const { signOut, profile, isAdmin } = useAuth();

  return (
    <Sidebar className="border-r-0">
      {/* Logo area with tech styling */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-sidebar-primary/5 to-transparent" />
        <img src={logoTransdata.url} alt="Transdata" className="h-10 w-auto relative z-10 rounded-lg" />
        <div className="flex flex-col relative z-10">
          <span className="text-[10px] uppercase tracking-[0.2em] text-sidebar-primary font-semibold">Sistema de Gestão</span>
          <span className="text-xs text-sidebar-foreground/50">{profile?.full_name || "Usuário"}</span>
        </div>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-accent text-[11px] uppercase tracking-[0.22em] font-bold px-2 py-2">
            <BarChart3 className="h-3.5 w-3.5 mr-2 text-accent" />
            Módulo Projetos
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {projectsModuleItems.map(item => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="transition-all duration-200"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium border-l-2 border-sidebar-primary"
                    >
                      <item.icon className="mr-2 h-4 w-4 group-hover/menu-item:text-sidebar-primary transition-colors" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-accent text-[11px] uppercase tracking-[0.22em] font-bold px-2 py-2">
            <BarChart3 className="h-3.5 w-3.5 mr-2 text-accent" />
            Módulo Implantação
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {implantacaoModuleItems.map(item => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="transition-all duration-200"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium border-l-2 border-sidebar-primary"
                    >
                      <item.icon className="mr-2 h-4 w-4 group-hover/menu-item:text-sidebar-primary transition-colors" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {(() => {
          const visibleAdminItems = adminItems.filter(i => !i.adminOnly || isAdmin);
          if (visibleAdminItems.length === 0) return null;
          return (
            <SidebarGroup>
              <SidebarGroupLabel className="text-accent text-[11px] uppercase tracking-[0.22em] font-bold px-2 py-2">
                <BarChart3 className="h-3.5 w-3.5 mr-2 text-accent" />
                Administração
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleAdminItems.map(item => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className="transition-all duration-200"
                          activeClassName="bg-sidebar-accent text-sidebar-primary font-medium border-l-2 border-sidebar-primary"
                        >
                          <item.icon className="mr-2 h-4 w-4 group-hover/menu-item:text-sidebar-primary transition-colors" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })()}
      </SidebarContent>

      {/* Footer with tech divider */}
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-sidebar-primary/30 to-transparent mb-2" />
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-primary hover:bg-sidebar-accent transition-all duration-200"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" /> Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
