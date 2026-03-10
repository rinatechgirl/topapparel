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
import Categories from "@/pages/Categories";
import Reports from "@/pages/Reports";
import NotFound from "@/pages/NotFound";
import ResetPassword from "@/pages/ResetPassword";
import TenantRegister from "@/pages/TenantRegister";
import PendingApproval from "@/pages/PendingApproval";
import AdminPanel from "@/pages/AdminPanel";
import OrganizationSettings from "@/pages/OrganizationSettings";
import Landing from "@/pages/Landing";
import TenantNotFound from "@/pages/TenantNotFound";

const queryClient = new QueryClient();

/**
 * Gate that checks if the current subdomain maps to an existing tenant.
 * If the subdomain doesn't exist in the DB, show the TenantNotFound page.
 * On main domain or valid subdomain, render children normally.
 */
const SubdomainGate = ({ children }: { children: React.ReactNode }) => {
  const { subdomainSlug, subdomainTenant, loading } = useAuth();

  // No subdomain — main domain, proceed normally
  if (!subdomainSlug) return <>{children}</>;

  // Still loading auth context, wait
  if (loading) return <div className="flex items-center justify-center h-screen text-muted-foreground">Loading...</div>;

  // Subdomain detected but tenant lookup returned null — not found
  if (subdomainSlug && subdomainTenant === null) {
    return <TenantNotFound slug={subdomainSlug} />;
  }

  return <>{children}</>;
};

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) => {
  const { user, loading, isAdmin, isPlatformAdmin } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (adminOnly && !isAdmin && !isPlatformAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const TenantGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, tenantId, tenant, isPlatformAdmin, subdomainSlug, subdomainTenant } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;

  // Platform admins bypass all tenant checks
  if (isPlatformAdmin) return <>{children}</>;

  // If on a valid subdomain, we may use subdomain tenant context
  if (subdomainSlug && subdomainTenant) {
    // User must belong to this subdomain tenant (enforced in useAuth via sign-out)
    if (subdomainTenant.status !== "approved") return <Navigate to="/pending-approval" replace />;
    // If user's tenantId matches subdomain, proceed
    if (tenantId === subdomainTenant.id) return <>{children}</>;
  }

  // No tenant assigned and not on a subdomain - redirect to register
  if (!tenantId && !subdomainSlug) return <Navigate to="/register-business" replace />;

  // Tenant not approved
  if (tenant && tenant.status !== "approved") return <Navigate to="/pending-approval" replace />;

  // If we have tenantId but tenant info hasn't loaded yet, wait
  if (tenantId && !tenant) return <div className="flex items-center justify-center h-screen text-muted-foreground">Loading...</div>;

  return <>{children}</>;
};

const PlatformAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isPlatformAdmin } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isPlatformAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const AuthGate = () => {
  const { user, loading, isPlatformAdmin, tenantMismatch } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-muted-foreground">Loading...</div>;
  if (user && isPlatformAdmin) return <Navigate to="/admin" replace />;
  if (user && !tenantMismatch) return <Navigate to="/dashboard" replace />;
  return <Auth />;
};

const LandingGate = () => {
  const { user, loading, isPlatformAdmin, subdomainSlug } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-muted-foreground">Loading...</div>;
  // On subdomain, redirect logged-in users to dashboard
  if (user && isPlatformAdmin) return <Navigate to="/admin" replace />;
  if (user) return <Navigate to="/dashboard" replace />;
  // On subdomain, show auth page instead of landing
  if (subdomainSlug) return <Navigate to="/auth" replace />;
  return <Landing />;
};

const RegisterGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isPlatformAdmin, tenantId } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (isPlatformAdmin) return <Navigate to="/admin" replace />;
  if (tenantId) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SubdomainGate>
            <Routes>
              <Route path="/" element={<LandingGate />} />
              <Route path="/auth" element={<AuthGate />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/register-business" element={<RegisterGuard><TenantRegister /></RegisterGuard>} />
              <Route path="/pending-approval" element={<ProtectedRoute><PendingApproval /></ProtectedRoute>} />
              <Route element={<TenantGuard><AppLayout /></TenantGuard>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/customers/:id" element={<CustomerDetail />} />
                <Route path="/measurements" element={<Measurements />} />
                <Route path="/designs" element={<Designs />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/reports" element={<ProtectedRoute adminOnly><Reports /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute adminOnly><OrganizationSettings /></ProtectedRoute>} />
                <Route path="/admin" element={<PlatformAdminRoute><AdminPanel /></PlatformAdminRoute>} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SubdomainGate>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
