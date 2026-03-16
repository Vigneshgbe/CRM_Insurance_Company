import { useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";

interface AppLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function AppLayout({ title, children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      <AppSidebar />
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-60 h-full bg-sidebar text-sidebar-foreground z-50">
            <AppSidebar />
          </aside>
        </div>
      )}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        <AppHeader title={title} onToggleMobile={() => setMobileOpen(!mobileOpen)} />
        <main className="flex-1 p-6 bg-surface overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
