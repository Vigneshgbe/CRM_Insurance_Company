import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, FolderOpen, FileText, FileTextIcon,
  BarChart3, Settings, LogOut, FileEdit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

// Templates kept — /templates and /templates/editor routes exist in App.tsx
const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard"       },
  { label: "Clients",   icon: Users,           path: "/clients"         },
  { label: "Cases",     icon: FolderOpen,       path: "/cases"           },
  { label: "Documents", icon: FileText,         path: "/documents"       },
  { label: "Editor",    icon: FileEdit,         path: "/document-editor" },
  { label: "OCF Forms", icon: FileTextIcon,     path: "/templates"       },
  { label: "Reports",   icon: BarChart3,        path: "/reports"         },
  { label: "Settings",  icon: Settings,         path: "/settings"        },
];

function getRoleLabel(user: any): string {
  if (!user) return "";
  if (user.displayRole)  return user.displayRole;
  if (user.display_role) return user.display_role;
  if (user.role === "client")   return "Client";
  if (user.role === "employee") return "Staff";
  return user.role || "";
}

// Read app name from localStorage (set by Settings page)
function readAppName(): string {
  try {
    const stored = localStorage.getItem("crm_system_settings");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.appName) return parsed.appName;
    }
  } catch { /* ignore */ }
  return "Padak Pvt Ltd CRM";
}

export function AppSidebar() {
  const location = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();

  // ── Reactive app name — updates immediately when Settings saves ───────────
  const [appName, setAppName] = useState<string>(readAppName);

  useEffect(() => {
    // Listen for storage events dispatched by Settings.tsx when saved
    function onStorage(e: StorageEvent) {
      if (e.key === "crm_system_settings") {
        setAppName(readAppName());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = user?.name || "";
  const initials    = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const roleLabel   = getRoleLabel(user);

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-sidebar text-sidebar-foreground fixed left-0 top-0 z-30">
      {/* Logo — shows saved app name from System Settings */}
      <div className="h-14 flex items-center px-5 border-b border-sidebar-muted">
        <span className="text-lg font-bold tracking-tight truncate">{appName}</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3 space-y-0.5">
        {navItems.map((item) => {
          // /document-editor must only match itself — not /documents
          const active = item.path === "/document-editor"
            ? location.pathname.startsWith("/document-editor")
            : location.pathname.startsWith(
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

      {/* ── Need Help? — additive only, no existing code changed ── */}
      <div className="px-3 pb-3">
        <div className="rounded-lg bg-sidebar-muted p-3">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-sm font-semibold text-sidebar-foreground">Need Help?</span>
            <div className="h-6 w-6 rounded-full bg-sidebar-accent/40 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-sidebar-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-sidebar-foreground/60 mb-2.5">Quick support &amp; resources</p>
          <a
            href="mailto:abiram.p@thepadak.com"
            className="block w-full text-center text-xs font-medium py-1.5 rounded bg-sidebar-accent text-sidebar-foreground hover:opacity-90 transition-opacity"
          >
            Contact Support
          </a>
        </div>
      </div>

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