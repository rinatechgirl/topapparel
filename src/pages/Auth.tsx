import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getTenantSlugFromHostname } from "@/hooks/useTenantSlug";
import { useTenantBySlug } from "@/hooks/useTenantBySlug";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowRight, ChevronLeft, Eye, EyeOff } from "lucide-react";
import fallbackLogo from "@/assets/logo.jpeg";

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_DOMAIN = "rinasfit.com";
const IS_DEV =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

/**
 * Redirects to the tenant's own subdomain.
 * On localhost (dev), uses a ?tenant= query param as a fallback
 * because subdomains don't resolve locally without extra setup.
 */
function redirectToTenantSubdomain(slug: string, path = "/auth") {
  if (IS_DEV) {
    window.location.href = `${path}?tenant=${slug}`;
  } else {
    window.location.href = `https://${slug}.${BASE_DOMAIN}${path}`;
  }
}

// ─── Shared loading screen ────────────────────────────────────────────────────

function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  );
}

// ─── Mode 1: Branded tenant login (slug.rinasfit.com/auth) ────────────────────

function TenantLogin({ slug }: { slug: string }) {
  const navigate = useNavigate();
  const { tenant, loading: tenantLoading, notFound } = useTenantBySlug(slug);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      // App.tsx AuthGate handles the final redirect (/dashboard or /admin)
      navigate("/dashboard", { replace: true });
    }
  };

  if (tenantLoading) return <FullPageSpinner />;

  // Slug exists in URL but no matching tenant in DB
  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-5 max-w-sm">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto text-2xl">
            🔍
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Organisation not found</h1>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              <strong className="text-foreground">{slug}</strong> doesn't match any registered
              business. Check the URL or go back to the main login.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() =>
              IS_DEV
                ? navigate("/auth")
                : (window.location.href = `https://${BASE_DOMAIN}/auth`)
            }
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Main login
          </Button>
        </div>
      </div>
    );
  }

  const logoSrc = tenant?.logo_url ?? fallbackLogo;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">

        {/* Tenant branding */}
        <div className="flex flex-col items-center gap-3 text-center">
          <img
            src={logoSrc}
            alt={tenant?.business_name ?? slug}
            className="w-20 h-20 object-contain rounded-xl border border-border bg-background p-1 shadow-sm"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = fallbackLogo;
            }}
          />
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Sign in to {tenant?.business_name ?? slug}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Powered by Rina's Fit</p>
          </div>
        </div>

        {/* Login form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <a
                href="/reset-password"
                className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
              >
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Sign in
          </Button>
        </form>

        <div className="text-center">
          <a
            href={IS_DEV ? "/auth" : `https://${BASE_DOMAIN}/auth`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Not your organisation? Go to main login
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Mode 2: Slug discovery (rinasfit.com/auth) ───────────────────────────────

function SlugDiscovery() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"business" | "admin">("business");

  // Business slug lookup
  const [slug, setSlug] = useState("");
  const [slugLoading, setSlugLoading] = useState(false);

  // Admin email/password
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);

  const handleSlugSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSlug = slug.trim().toLowerCase();
    if (!cleanSlug) return;

    setSlugLoading(true);

    const { data } = await supabase
      .from("tenants")
      .select("id, slug, status")
      .eq("slug", cleanSlug)
      .maybeSingle();

    setSlugLoading(false);

    if (!data) {
      toast.error("Organisation not found. Check your business username and try again.");
      return;
    }
    if (data.status === "suspended") {
      toast.error("This account has been suspended. Please contact support.");
      return;
    }
    if (data.status === "pending") {
      toast.error("This account is pending approval. You will receive an email when it is ready.");
      return;
    }
    if (data.status === "rejected") {
      toast.error("This account application was rejected. Contact support for more information.");
      return;
    }

    redirectToTenantSubdomain(data.slug);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setAdminLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      navigate("/admin", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-background flex">

      {/* Left: branding panel */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 bg-muted/40 border-r border-border items-center justify-center p-12">
        <div className="max-w-sm space-y-8">
          <img src={fallbackLogo} alt="Rina's Fit" className="w-10 h-10 object-contain" />
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground leading-snug">
              Welcome back to Rina's Fit
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Your tailoring business management platform. Customers, measurements, and designs — all in one place.
            </p>
          </div>
          <div className="space-y-3">
            {[
              "Your own branded subdomain",
              "Customer profiles & measurements",
              "Design library with photos",
              "Multi-staff with role management",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">

          {/* Mobile logo */}
          <img
            src={fallbackLogo}
            alt="Rina's Fit"
            className="w-8 h-8 object-contain lg:hidden"
          />

          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {mode === "business" ? "Sign in to your organisation" : "Platform admin sign in"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "business"
                ? "Enter your business username to continue"
                : "Use your platform administrator credentials"}
            </p>
          </div>

          {/* Business login: slug lookup */}
          {mode === "business" && (
            <form onSubmit={handleSlugSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="slug">Business username</Label>
                <div className="flex">
                  <Input
                    id="slug"
                    type="text"
                    placeholder="yourbusiness"
                    value={slug}
                    onChange={(e) =>
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                    }
                    required
                    autoFocus
                    className="rounded-r-none border-r-0 focus-visible:z-10"
                  />
                  <span className="inline-flex items-center px-3 border border-input bg-muted text-muted-foreground text-sm rounded-r-md shrink-0">
                    .rinasfit.com
                  </span>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={slugLoading}>
                {slugLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                Continue
              </Button>
            </form>
          )}

          {/* Admin login: email + password */}
          {mode === "admin" && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@rinasfit.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={adminLoading}>
                {adminLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Sign in
              </Button>
            </form>
          )}

          <div className="space-y-3 text-center">
            <p className="text-sm text-muted-foreground">
              New business?{" "}
              <a
                href="/register-business"
                className="text-foreground font-medium hover:underline underline-offset-4"
              >
                Create an account
              </a>
            </p>
            <button
              type="button"
              onClick={() => {
                setMode(mode === "business" ? "admin" : "business");
                setSlug("");
                setEmail("");
                setPassword("");
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              {mode === "business"
                ? "Platform admin sign in →"
                : "← Back to business login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Root export — auto-detects mode from hostname / query param ──────────────

const Auth = () => {
  const [searchParams] = useSearchParams();

  // Production: detect from subdomain (e.g. royalpark.rinasfit.com)
  const subdomainSlug = getTenantSlugFromHostname();

  // Development: detect from ?tenant= query param (localhost fallback)
  const devSlug = searchParams.get("tenant");

  const tenantSlug = subdomainSlug ?? devSlug;

  if (tenantSlug) return <TenantLogin slug={tenantSlug} />;
  return <SlugDiscovery />;
};

export default Auth;
