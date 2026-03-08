/**
 * Extracts the tenant slug from the current hostname.
 * e.g. rinatailors.rinasfit.com → "rinatailors"
 * rinasfit.com → null
 * localhost → null
 */
export function getTenantSlugFromHostname(): string | null {
  const hostname = window.location.hostname;

  // Local dev — no subdomain detection
  if (hostname === "localhost" || hostname === "127.0.0.1") return null;

  // Preview/staging domains (lovable.app)
  if (hostname.endsWith(".lovable.app")) return null;

  // Production: rinasfit.com
  const baseDomain = "rinasfit.com";
  if (hostname === baseDomain || hostname === `www.${baseDomain}`) return null;

  if (hostname.endsWith(`.${baseDomain}`)) {
    const slug = hostname.replace(`.${baseDomain}`, "");
    if (slug && !slug.includes(".")) return slug;
  }

  return null;
}
