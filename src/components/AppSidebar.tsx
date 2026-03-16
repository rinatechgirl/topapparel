import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Users, Ruler, Palette, FolderOpen, BarChart3,
  LogOut, X, Shield, Settings,
} from "lucide-react";
import logo from "@/assets/logo.jpeg";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/customers", icon: Users, label: "Customers" },
  { to: "/measurements", icon: Ruler, label: "Measurements" },
  { to: "/designs", icon: Palette, label: "Designs" },
  { to: "/categories", icon: FolderOpen, label: "Categories" },
];

const adminItems = [
  { to: "/reports", icon: BarChart3, label: "Reports" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const platformAdminItems = [
  { to: "/admin", icon: Shield, label: "Platform Admin" },
];

const AppSidebar = ({ open, onClose }: AppSidebarProps) => {
  const { isAdmin, isPlatformAdmin, signOut, user, tenant } = useAuth();
  const location = useLocation();

  const allItems = [
    ...navItems,
    ...(isAdmin ? adminItems : []),
    ...(isPlatformAdmin ? platformAdminItems : []),
  ];

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-[260px] bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Rina's Fit" className="w-10 h-10 rounded-xl object-contain" />
            <div className="min-w-0">
              <span className="font-display font-bold text-base text-sidebar-foreground block leading-tight tracking-tight">
                Rina<span className="text-accent italic">Fit</span>
              </span>
              {tenant && (
                <span className="text-[10px] text-sidebar-foreground/50 truncate block">{tenant.business_name}</span>
              )}
            </div>
          </div>
          <button className="lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-sidebar-foreground/35">Menu</p>
          {allItems.map((item) => {
            const isActive = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to));
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200",
                  isActive
                    ? "bg-accent/15 text-accent shadow-sm"
                    : "text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className={cn("w-[18px] h-[18px]", isActive && "text-accent")} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* User / Logout */}
        <div className="px-3 py-4 border-t border-sidebar-border">
          <div className="px-3 py-2 text-[11px] text-sidebar-foreground/35 truncate mb-1">
            {user?.email}
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors w-full"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
