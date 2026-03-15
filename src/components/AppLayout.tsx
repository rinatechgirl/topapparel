import { useState } from "react";
import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import { Menu, Bell, Scissors } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { tenant } = useAuth();

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border flex items-center justify-between px-4 lg:px-6 bg-card/80 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            {tenant && (
              <span className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Scissors className="w-3.5 h-3.5 text-accent" />
                {tenant.business_name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors relative">
              <Bell className="w-4 h-4" />
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
