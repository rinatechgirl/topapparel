import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const MAIN_DOMAINS = ["rinasfit.com", "www.rinasfit.com", "localhost", "lovable.app"];

export function getSubdomain(): string | null {
  const hostname = window.location.hostname;

  // Check if we're on a main domain (no subdomain)
  for (const domain of MAIN_DOMAINS) {
    if (hostname === domain) return null;
    // Handle lovable preview domains
    if (hostname.endsWith(".lovable.app")) return null;
  }

  // Extract subdomain from *.rinasfit.com
  if (hostname.endsWith(".rinasfit.com")) {
    const sub = hostname.replace(".rinasfit.com", "");
    if (sub && sub !== "www") return sub;
  }

  return null;
}

interface SubdomainTenant {
  id: string;
  business_name: string;
  slug: string;
  status: string;
  logo_url: string | null;
}

export function useTenantBySubdomain() {
  const [subdomain] = useState(() => getSubdomain());
  const [tenant, setTenant] = useState<SubdomainTenant | null>(null);
  const [loading, setLoading] = useState(!!subdomain);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!subdomain) return;

    const fetchTenant = async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, business_name, slug, status, logo_url")
        .eq("slug", subdomain)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
      } else {
        setTenant(data);
      }
      setLoading(false);
    };

    fetchTenant();
  }, [subdomain]);

  return { subdomain, tenant, loading, notFound, isSubdomain: !!subdomain };
}
