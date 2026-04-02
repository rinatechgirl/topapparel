import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import Designs from "@/pages/Designer/Designs";
import Magazine from "@/pages/Magazine";
import CustomerOrder from "@/pages/Customer/Order";

function AppRoutes() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      setRole(profile?.role ?? null);
      setLoading(false);
    };

    loadUser();
  }, []);

  if (loading) return null;

  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/magazine" element={<Magazine />} />

      {/* DESIGNER */}
      {role === "designer" && (
        <Route path="/designer/designs" element={<Designs />} />
      )}

      {/* CUSTOMER */}
      {role === "customer" && (
        <Route
          path="/customer/order/:designId"
          element={<CustomerOrder />}
        />
      )}

      {/* LANDING ONLY */}
      <Route
        path="/"
        element={
          role === "designer" ? (
            <Navigate to="/designer/designs" replace />
          ) : (
            <Navigate to="/magazine" replace />
          )
        }
      />

      {/* 404 – NO FORCED REDIRECT */}
      <Route path="*" element={<Navigate to="/magazine" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
