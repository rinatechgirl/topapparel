import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TenantPublicInfo {
  id: string;
  business_name: string;
  slug: string;
  status: string;
  logo_url: string | null;
}

/**
 * Fetches public tenant info by slug — no auth required.
 * Used on the branded login page (slug.rinasfit.com/auth).
 */
export function useTenantBySlug(slug: string | null) {
  const [tenant, setTenant] = useState<TenantPublicInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setTenant(null);

    supabase
      .from("tenants")
      .select("id, business_name, slug, status, logo_url")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data) {
          setTenant(data as TenantPublicInfo);
        } else {
          setNotFound(true);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { tenant, loading, notFound };
}
