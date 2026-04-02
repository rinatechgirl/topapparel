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
 * Requires authentication. Optionally restricts to admin only.
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
 * Customers are NOT sent here — they have their own guard.
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

  // Platform admins skip all tenant checks
  if (isPlatformAdmin) return <>{children}</>;

  // Customers should never enter the tenant-scoped designer dashboard
  // Send them to the magazine to browse
  if (role === "customer") return <Navigate to="/magazine" replace />;

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
 * Guard for customer-only routes.
 * Requires login. Blocks designers and admins.
 */
const CustomerGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, role } = useAuth();

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground">
        Loading…
      </div>
    );
  if (!user) return <Navigate to="/auth" replace />;
  // Designers and admins should go to their own dashboard
  if (role !== "customer") return <Navigate to="/dashboard" replace />;
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
 * Allows unauthenticated users and authenticated users without a tenant.
 * Blocks platform admins and users who already have a tenant.
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
  return <>{children}</>;
};

/**
 * Auth page gate.
 * Redirects already-signed-in users away from the login page.
 * Respects ?returnTo= param so customers return to the right page after login.
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
    // Respect returnTo param — send user back to where they were going
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get("returnTo");
    if (returnTo) return <Navigate to={returnTo} replace />;

    if (isPlatformAdmin) return <Navigate to="/admin" replace />;
    // Customers go to magazine to browse designs
    if (role === "customer") return <Navigate to="/magazine" replace />;
    // Designers and admins go to their dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <Auth />;
};

/**
 * Landing page gate.
 * Redirects signed-in users to the right place.
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
  // Customers go to magazine
  if (user && role === "customer") return <Navigate to="/magazine" replace />;
  // Everyone else goes to dashboard
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

            {/* Public magazine — cross-tenant, no auth required */}
            <Route path="/magazine" element={<Magazine />} />

            {/* Public catalogue — tenant storefront, no auth required */}
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

            {/* Pending approval */}
            <Route
              path="/pending-approval"
              element={
                <ProtectedRoute>
                  <PendingApproval />
                </ProtectedRoute>
              }
            />

            {/* ── Customer-only routes ───────────────────────────────────── */}
            <Route
              path="/customer"
              element={
                <CustomerGuard>
                  <AppLayout />
                </CustomerGuard>
              }
            >
              <Route path="orders" element={<Orders />} />
            </Route>

            {/* ── Designer / Admin tenant-scoped routes ─────────────────── */}
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
