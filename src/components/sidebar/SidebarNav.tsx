import { NavLink } from "@/components/NavLink";
import {
  SidebarGroup as UISidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { PermModule } from "@/lib/permissions";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  module: PermModule;
  end?: boolean;
  badge?: number;
}

export function SidebarItem({ item }: { item: NavItem }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={item.title} className="h-auto">
        <NavLink
          to={item.url}
          end={item.end}
          className="group/nav flex items-center gap-2 rounded-lg px-2.5 py-2 text-sidebar-foreground/80 border-l-[3px] border-transparent transition-all duration-200 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
          activeClassName="!bg-sidebar-accent !text-sidebar-accent-foreground font-medium !border-sidebar-primary"
        >
          <item.icon className="h-4 w-4 shrink-0 transition-colors group-hover/nav:text-sidebar-primary group-[.font-medium]/nav:text-sidebar-primary" />
          <span className="truncate">{item.title}</span>
          {typeof item.badge === "number" && item.badge > 0 && (
            <span
              className={cn(
                "ml-auto min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none",
                "bg-sidebar-border text-sidebar-foreground/90",
                "group-[.font-medium]/nav:bg-sidebar-primary group-[.font-medium]/nav:text-sidebar-primary-foreground",
                "group-data-[collapsible=icon]/sidebar-wrapper:hidden",
              )}
            >
              {item.badge}
            </span>
          )}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function SidebarNavGroup({ label, items }: { label: string; items: NavItem[] }) {
  if (items.length === 0) return null;
  return (
    <UISidebarGroup>
      <SidebarGroupLabel className="px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarItem key={item.url} item={item} />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </UISidebarGroup>
  );
}
