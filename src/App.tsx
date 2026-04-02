import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { getTenantSlugFromHostname } from "@/hooks/useTenantSlug";
import AppLayout from "@/components/AppLayout";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Customers from "@/pages/Customers";
import CustomerDetail from "@/pages/CustomerDetail";
import Measurements from "@/pages/Measurements";
import Designs from "@/pages/Designs";
import DesignDetail from "@/pages/DesignDetail";
import Orders from "@/pages/Orders";
import Categories from "@/pages/Categories";
import Reports from "@/pages/Reports";
import NotFound from "@/pages/NotFound";
import ResetPassword from "@/pages/ResetPassword";
import TenantRegister from "@/pages/TenantRegister";
import PendingApproval from "@/pages/PendingApproval";
import AdminPanel from "@/pages/AdminPanel";
import OrganizationSettings from "@/pages/OrganizationSettings";
import StaffManagement from "@/pages/StaffManagement";
import Landing from "@/pages/Landing";
import Magazine from "@/pages/Magazine";
import Catalogue from "@/pages/Catalogue";
import PublicLayout from "@/components/PublicLayout";

const queryClient = new QueryClient();

// ─── Route guards ─────────────────────────────────────────────────────────────

/**
 * Requires authentication. Optionally restricts to admin/platform-admin only.
 */
const ProtectedRoute = ({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) => {
  const { user, loading, isAdmin, isPlatformAdmin } = useAuth();
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground">
        Loading…
      </div>
    );
  if (!user) return <Navigate to="/auth" replace />;
  if (adminOnly && !isAdmin && !isPlatformAdmin)
    return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

/**
 * Requires an authenticated user whose tenant is approved.
 * Platform admins bypass tenant checks entirely.
 */
const TenantGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, tenantId, tenant, isPlatformAdmin, role } = useAuth();

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground">
        Loading…
      </div>
    );
  if (!user) return <Navigate to="/auth" replace />;

  if (role === "customer") return <Navigate to="/designs" replace />;

  // Platform admins skip all tenant checks
  if (isPlatformAdmin) return <>{children}</>;

  const subdomainSlug = getTenantSlugFromHostname();

  // No tenant linked and not on a subdomain → send to registration
  if (!tenantId && !subdomainSlug)
    return <Navigate to="/register-business" replace />;

  // Tenant exists but is not approved
  if (tenant && tenant.status !== "approved")
    return <Navigate to="/pending-approval" replace />;

  // Tenant ID is set but info hasn't loaded yet → wait
  if (tenantId && !tenant)
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground">
        Loading…
      </div>
    );

  return <>{children}</>;
};

/**
 * Restricts access to platform admins only.
 */
const PlatformAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isPlatformAdmin } = useAuth();
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground">
        Loading…
      </div>
    );
  if (!user) return <Navigate to="/auth" replace />;
  if (!isPlatformAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

/**
 * Registration guard.
 *
 * Allows BOTH unauthenticated users (creating a brand-new account)
 * AND authenticated users who don't have a tenant yet.
 *
 * Blocks:
 * - Platform admins (send to /admin)
 * - Authenticated users who already have a tenant (send to /dashboard)
 */
const RegisterGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isPlatformAdmin, tenantId } = useAuth();
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground">
        Loading…
      </div>
    );
  if (isPlatformAdmin) return <Navigate to="/admin" replace />;
  if (user && tenantId) return <Navigate to="/dashboard" replace />;
  // ↑ Unauthenticated users are allowed through — TenantRegister handles signup
  return <>{children}</>;
};

/**
 * Auth page gate.
 * Redirects already-signed-in users away from the login page.
 */
const AuthGate = () => {
  const { user, loading, isPlatformAdmin, role } = useAuth();
  
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground">
        Loading…
      </div>
    );
  if (user) {
    // Check for returnTo param to redirect back after login
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get("returnTo");
    if (returnTo) return <Navigate to={returnTo} replace />;
    if (isPlatformAdmin) return <Navigate to="/admin" replace />;
    if (role === "customer") return <Navigate to="/designs" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return <Auth />;
};

/**
 * Landing page gate.
 * Redirects signed-in users straight to their dashboard.
 */
const LandingGate = () => {
  const { user, loading, isPlatformAdmin, role } = useAuth();
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground">
        Loading…
      </div>
    );
  if (user && isPlatformAdmin) return <Navigate to="/admin" replace />;
  if (user && role === "customer") return <Navigate to="/designs" replace />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Landing />;
};

// ─── App ──────────────────────────────────────────────────────────────────────

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingGate />} />
            <Route path="/auth" element={<AuthGate />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Public magazine and catalogue — no auth required */}
            <Route path="/magazine" element={<Magazine />} />
            <Route path="/catalogue" element={<Catalogue />} />

            {/* Public design browsing — no auth required */}
            <Route element={<PublicLayout />}>
              <Route path="/designs" element={<Designs />} />
              <Route path="/designs/:id" element={<DesignDetail />} />
            </Route>

            {/* Business registration — open to unauthenticated users */}
            <Route
              path="/register-business"
              element={
                <RegisterGuard>
                  <TenantRegister />
                </RegisterGuard>
              }
            />

            {/* Pending approval — shown when tenant status ≠ approved */}
            <Route
              path="/pending-approval"
              element={
                <ProtectedRoute>
                  <PendingApproval />
                </ProtectedRoute>
              }
            />

            {/* Authenticated + tenant-scoped routes */}
            <Route
              element={
                <TenantGuard>
                  <AppLayout />
                </TenantGuard>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/customers/:id" element={<CustomerDetail />} />
              <Route path="/measurements" element={<Measurements />} />
              <Route path="/orders" element={<Orders />} />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute adminOnly>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute adminOnly>
                    <OrganizationSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/staff"
                element={
                  <ProtectedRoute adminOnly>
                    <StaffManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <PlatformAdminRoute>
                    <AdminPanel />
                  </PlatformAdminRoute>
                }
              />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
