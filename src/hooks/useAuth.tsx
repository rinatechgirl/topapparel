import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type AppRole = "admin" | "staff";

interface TenantInfo {
  id: string;
  business_name: string;
  slug: string;
  status: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: AppRole | null;
  isAdmin: boolean;
  isPlatformAdmin: boolean;
  tenantId: string | null;
  tenant: TenantInfo | null;
  signOut: () => Promise<void>;
  refreshTenant: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  role: null,
  isAdmin: false,
  isPlatformAdmin: false,
  tenantId: null,
  tenant: null,
  signOut: async () => {},
  refreshTenant: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  const fetchUserContext = async (userId: string) => {
    // Try to accept any pending invitation first
    await supabase.rpc("accept_pending_invitation");

    // Fetch role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role, tenant_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    const userRole = (roleData?.role as AppRole) ?? "staff";
    setRole(userRole);

    // Check if platform admin (role=admin, tenant_id=null)
    const platformAdmin = userRole === "admin" && !roleData?.tenant_id;
    setIsPlatformAdmin(platformAdmin);

    // Fetch profile for tenant_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("user_id", userId)
      .maybeSingle();

    const tid = profile?.tenant_id ?? null;
    setTenantId(tid);

    if (tid) {
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("id, business_name, slug, status")
        .eq("id", tid)
        .maybeSingle();
      setTenant(tenantData as TenantInfo | null);
    } else {
      setTenant(null);
    }
  };

  const refreshTenant = async () => {
    if (user) await fetchUserContext(user.id);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchUserContext(session.user.id), 0);
        } else {
          setRole(null);
          setTenantId(null);
          setTenant(null);
          setIsPlatformAdmin(false);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserContext(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user, session, loading, role,
      isAdmin: role === "admin",
      isPlatformAdmin,
      tenantId, tenant,
      signOut, refreshTenant,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
