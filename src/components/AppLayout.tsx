import { useState } from "react";
import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import NotificationBell from "./NotificationBell";
import { Menu, Sun, Moon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import fallbackLogo from "@/assets/logo.jpeg";

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { tenant } = useAuth();
  const { isDark, toggle } = useTheme();

  const logoSrc = tenant?.logo_url ?? fallbackLogo;

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        logoSrc={logoSrc}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border flex items-center justify-between px-4 lg:px-6 bg-card/80 backdrop-blur-xl shrink-0">

          {/* Left — mobile hamburger + tenant name */}
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            {tenant && (
              <span className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <img
                  src={logoSrc}
                  alt={tenant.business_name}
                  className="w-5 h-5 object-contain rounded-sm"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = fallbackLogo;
                  }}
                />
                {tenant.business_name}
              </span>
            )}
          </div>

          {/* Right — notifications + theme toggle */}
          <div className="flex items-center gap-1">
            <NotificationBell />
            <button
              onClick={toggle}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
