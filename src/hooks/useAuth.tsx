import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { getTenantSlugFromHostname } from "@/hooks/useTenantSlug";
import type { User, Session } from "@supabase/supabase-js";

type AppRole = "admin" | "staff";

interface TenantInfo {
  id: string;
  business_name: string;
  slug: string;
  status: string;
  logo_url?: string | null;
  business_email?: string;
  owner_name?: string;
  phone?: string | null;
  address?: string | null;
  country?: string | null;
  description?: string | null;
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

  // Prevent concurrent fetchUserContext calls
  const fetchingRef = useRef(false);
  // Prevent state updates after unmount
  const mountedRef = useRef(true);
  // Skip the duplicate initial onAuthStateChange call
  const initializedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchUserContext = async (userId: string) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      await supabase.rpc("accept_pending_invitation");

      const { data: isPlatAdmin } = await supabase.rpc("is_platform_admin");
      const platformAdmin = isPlatAdmin === true;

      if (!mountedRef.current) return;
      setIsPlatformAdmin(platformAdmin);

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role, tenant_id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      const userRole = platformAdmin
        ? "admin"
        : ((roleData?.role as AppRole) ?? "staff");

      if (!mountedRef.current) return;
      setRole(userRole);

      // Platform admins don't need tenant context
      if (platformAdmin) {
        setTenantId(null);
        setTenant(null);
        return;
      }

      const subdomainSlug = getTenantSlugFromHostname();

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("user_id", userId)
        .maybeSingle();

      let tid = profile?.tenant_id ?? null;

      // Resolve tenant from subdomain if user has no tenant yet
      if (!tid && subdomainSlug) {
        const { data: subdomainTenant } = await supabase
          .from("tenants")
          .select(
            "id, business_name, slug, status, logo_url, business_email, owner_name, phone, address, country, description"
          )
          .eq("slug", subdomainSlug)
          .maybeSingle();

        if (subdomainTenant && mountedRef.current) {
          setTenant(subdomainTenant as TenantInfo);
          setTenantId(subdomainTenant.id);
          return;
        }
      }

      if (!mountedRef.current) return;
      setTenantId(tid);

      if (tid) {
        const { data: tenantData } = await supabase
          .from("tenants")
          .select(
            "id, business_name, slug, status, logo_url, business_email, owner_name, phone, address, country, description"
          )
          .eq("id", tid)
          .maybeSingle();

        if (mountedRef.current) {
          setTenant(tenantData as TenantInfo | null);
        }
      } else {
        setTenant(null);
      }
    } finally {
      fetchingRef.current = false;
    }
  };

  const refreshTenant = async () => {
    if (user) await fetchUserContext(user.id);
  };

  useEffect(() => {
    // Bootstrap: get current session once, then listen for changes
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mountedRef.current) return;
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchUserContext(session.user.id);
      }

      if (mountedRef.current) {
        setLoading(false);
        initializedRef.current = true;
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mountedRef.current) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Skip the duplicate event fired on initial mount —
        // getSession() above already handled it.
        if (initializedRef.current) {
          // Show loading during re-auth context fetch
          setLoading(true);
          await fetchUserContext(session.user.id);
          if (mountedRef.current) setLoading(false);
        }
      } else {
        // Signed out — clear all context
        setRole(null);
        setTenantId(null);
        setTenant(null);
        setIsPlatformAdmin(false);
        if (initializedRef.current && mountedRef.current) {
          setLoading(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        role,
        isAdmin: role === "admin",
        isPlatformAdmin,
        tenantId,
        tenant,
        signOut,
        refreshTenant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
