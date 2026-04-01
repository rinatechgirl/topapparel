import { Outlet, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import fallbackLogo from "@/assets/logo.jpeg";

const PublicLayout = () => {
  const { user, tenant } = useAuth();
  const { isDark, toggle } = useTheme();
  const logoSrc = tenant?.logo_url ?? fallbackLogo;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-14 border-b border-border flex items-center justify-between px-4 lg:px-6 bg-card/80 backdrop-blur-xl shrink-0">
        <Link to="/" className="flex items-center gap-2">
          <img
            src={logoSrc}
            alt="Rina's Fit"
            className="w-7 h-7 object-contain rounded-sm"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = fallbackLogo;
            }}
          />
          <span className="text-sm font-semibold text-foreground">Rina's Fit</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {user ? (
            <Link
              to="/dashboard"
              className="text-sm font-medium text-primary hover:underline underline-offset-4"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              to="/auth"
              className="text-sm font-medium text-primary hover:underline underline-offset-4"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 p-4 lg:p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default PublicLayout;
