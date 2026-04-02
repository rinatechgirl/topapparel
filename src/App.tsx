import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import PublicLayout from "@/components/PublicLayout";

import Auth from "@/pages/Auth";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Designs from "@/pages/Designer/Designs";
import Magazine from "@/pages/Magazine";
import Orders from "@/pages/Orders";
import Customers from "@/pages/Customers";
import Measurements from "@/pages/Measurements";
import Reports from "@/pages/Reports";
import OrganizationSettings from "@/pages/OrganizationSettings";
import StaffManagement from "@/pages/StaffManagement";
import AdminPanel from "@/pages/AdminPanel";
import TenantRegister from "@/pages/TenantRegister";
import PendingApproval from "@/pages/PendingApproval";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

/* ───────────────────────── ROUTE GUARDS ───────────────────────── */

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center">Loading…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
};

const RequireDesigner = ({ children }: { children: JSX.Element }) => {
  const { role } = useAuth();
  if (role === "customer") return <Navigate to="/designs" replace />;
  return children;
};

const RequirePlatformAdmin = ({ children }: { children: JSX.Element }) => {
  const { isPlatformAdmin } = useAuth();
  if (!isPlatformAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};

const AuthGate = () => {
  const { user, loading, role, isPlatformAdmin } = useAuth();
  if (loading) return <div className="p-10 text-center">Loading…</div>;

  if (user) {
    if (isPlatformAdmin) return <Navigate to="/admin" replace />;
    if (role === "customer") return <Navigate to="/designs" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <Auth />;
};

/* ───────────────────────── APP ───────────────────────── */

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<AuthGate />} />
            <Route path="/magazine" element={<Magazine />} />

            {/* Public customer browsing */}
            <Route element={<PublicLayout />}>
              <Route path="/designs" element={<Magazine />} />
            </Route>

            {/* Business registration */}
            <Route path="/register-business" element={<TenantRegister />} />
            <Route path="/pending-approval" element={<PendingApproval />} />

            {/* Authenticated */}
            <Route
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route
                path="/dashboard"
                element={
                  <RequireDesigner>
                    <Dashboard />
                  </RequireDesigner>
                }
              />

              <Route
                path="/designer/designs"
                element={
                  <RequireDesigner>
                    <Designs />
                  </RequireDesigner>
                }
              />

              <Route path="/orders" element={<Orders />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/measurements" element={<Measurements />} />

              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<OrganizationSettings />} />
              <Route path="/staff" element={<StaffManagement />} />

              <Route
                path="/admin"
                element={
                  <RequirePlatformAdmin>
                    <AdminPanel />
                  </RequirePlatformAdmin>
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