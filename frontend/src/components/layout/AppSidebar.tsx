import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, FolderOpen, FileText, BarChart3, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Clients", icon: Users, path: "/clients" },
  { label: "Cases", icon: FolderOpen, path: "/cases/1" },
  { label: "Documents", icon: FileText, path: "/documents" },
  { label: "Reports", icon: BarChart3, path: "/reports" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-sidebar text-sidebar-foreground fixed left-0 top-0 z-30">
      <div className="h-14 flex items-center px-5 border-b border-sidebar-muted">
        <span className="text-lg font-bold tracking-tight">Hypernova CRM</span>
      </div>
      <nav className="flex-1 py-3 px-3 space-y-0.5">
        {navItems.map((item) => {
          const active = location.pathname.startsWith(item.path.split("/").slice(0, 2).join("/"));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors",
                active ? "bg-sidebar-accent text-sidebar-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-muted hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-muted p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-semibold text-sidebar-foreground">AS</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Amanda Singh</p>
            <p className="text-xs text-sidebar-foreground/60">Admin</p>
          </div>
          <Link to="/login" className="text-sidebar-foreground/60 hover:text-sidebar-foreground">
            <LogOut className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
