import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, FolderOpen, FileText, BarChart3, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

// Templates removed — matches Settings page cleanup
const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Clients",   icon: Users,           path: "/clients"   },
  { label: "Cases",     icon: FolderOpen,       path: "/cases"     },
  { label: "Documents", icon: FileText,         path: "/documents" },
  { label: "Reports",   icon: BarChart3,        path: "/reports"   },
  { label: "Settings",  icon: Settings,         path: "/settings"  },
];

// Map DB role → display label
function getRoleLabel(user: any): string {
  if (!user) return "";
  // display_role comes from the users table (Admin / Manager / Staff / Client)
  if (user.displayRole)  return user.displayRole;
  if (user.display_role) return user.display_role;
  // Fall back to role field
  if (user.role === "client")   return "Client";
  if (user.role === "employee") return "Staff";
  return user.role || "";
}

export function AppSidebar() {
  const location = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = user?.name || "";
  const initials    = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const roleLabel   = getRoleLabel(user);

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-sidebar text-sidebar-foreground fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-sidebar-muted">
        <span className="text-lg font-bold tracking-tight">Hypernova CRM</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3 space-y-0.5">
        {navItems.map((item) => {
          const active = location.pathname.startsWith(
            item.path.split("/").slice(0, 2).join("/")
          );
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-muted hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-sidebar-muted p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-semibold text-sidebar-foreground shrink-0">
            {initials || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{displayName || "—"}</p>
            <p className="text-xs text-sidebar-foreground/60">{roleLabel}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}