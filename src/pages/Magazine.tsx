import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Image as ImageIcon, RotateCcw, ExternalLink } from "lucide-react";
import fallbackLogo from "@/assets/logo.jpeg";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PublicDesign {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  back_view_image_url: string | null;
  gender: string | null;
  category_name: string | null;
  tenant_business_name: string;
  tenant_slug: string;
  tenant_logo_url: string | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

const Magazine = () => {
  const navigate = useNavigate();
  const [designs, setDesigns] = useState<PublicDesign[]>([]);
  const [filtered, setFiltered] = useState<PublicDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeGender, setActiveGender] = useState("All");
  const [detail, setDetail] = useState<PublicDesign | null>(null);
  const [detailFlipped, setDetailFlipped] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());

  const genders = ["All", "Female", "Male", "Unisex"];

  // ── Fetch all public designs across all tenants ───────────────────────────
  useEffect(() => {
    const fetchPublicDesigns = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("designs")
        .select(`
          id,
          title,
          description,
          image_url,
          back_view_image_url,
          gender,
          categories ( name ),
          tenants ( business_name, slug, logo_url )
        `)
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      const mapped: PublicDesign[] = (data ?? []).map((d: any) => ({
        id: d.id,
        title: d.title,
        description: d.description,
        image_url: d.image_url,
        back_view_image_url: d.back_view_image_url,
        gender: d.gender,
        category_name: d.categories?.name ?? null,
        tenant_business_name: d.tenants?.business_name ?? "Unknown",
        tenant_slug: d.tenants?.slug ?? "",
        tenant_logo_url: d.tenants?.logo_url ?? null,
      }));

      setDesigns(mapped);
      setFiltered(mapped);
      setLoading(false);
    };

    fetchPublicDesigns();
  }, []);

  // ── Filter whenever search or gender changes ──────────────────────────────
  useEffect(() => {
    let result = designs;

    if (activeGender !== "All") {
      result = result.filter((d) => d.gender === activeGender);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.description?.toLowerCase().includes(q) ||
          d.category_name?.toLowerCase().includes(q) ||
          d.tenant_business_name.toLowerCase().includes(q)
      );
    }

    setFiltered(result);
  }, [search, activeGender, designs]);

  const toggleFlip = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFlippedCards((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openDetail = (d: PublicDesign) => {
    setDetail(d);
    setDetailFlipped(false);
  };

  const IS_DEV =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  const goToCatalogue = (slug: string) => {
    if (IS_DEV) {
      window.open(`/catalogue?tenant=${slug}`, "_blank");
    } else {
      window.open(`https://${slug}.rinasfit.com/catalogue`, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-background">

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 shrink-0"
          >
            <img src={fallbackLogo} alt="Rina's Fit" className="w-7 h-7 object-contain rounded-sm" />
            <span className="font-semibold text-sm text-foreground hidden sm:block">Rina's Fit</span>
          </button>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search designs, tailors, styles…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          <Button size="sm" onClick={() => navigate("/auth")}>
            Sign in
          </Button>
        </div>
      </nav>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-semibold text-foreground">
          Fashion Magazine
        </h1>
        <p className="text-muted-foreground mt-2 text-sm max-w-md mx-auto">
          Discover designs from talented tailors across Africa. Find your next look.
        </p>

        {/* Gender filter pills */}
        <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
          {genders.map((g) => (
            <button
              key={g}
              onClick={() => setActiveGender(g)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                activeGender === g
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ────────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">

        {loading ? (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="break-inside-avoid rounded-xl bg-muted animate-pulse"
                style={{ height: `${220 + (i % 3) * 80}px` }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No designs found.</p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="mt-2 text-xs text-foreground underline underline-offset-4"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          /* Pinterest masonry layout */
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-4">
            {filtered.map((d) => {
              const isFlipped = flippedCards.has(d.id);
              return (
                <div
                  key={d.id}
                  className="break-inside-avoid mb-4 rounded-xl overflow-hidden border border-border bg-card group cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => openDetail(d)}
                >
                  {/* Image */}
                  <div className="relative overflow-hidden bg-muted">
                    <div className={`transition-opacity duration-500 ${isFlipped ? "opacity-0 absolute inset-0" : "opacity-100"}`}>
                      {d.image_url ? (
                        <img
                          src={d.image_url}
                          alt={d.title}
                          className="w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-48 flex items-center justify-center">
                          <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    {d.back_view_image_url && (
                      <div className={`transition-opacity duration-500 ${isFlipped ? "opacity-100" : "opacity-0 absolute inset-0"}`}>
                        <img
                          src={d.back_view_image_url}
                          alt={`${d.title} - Back`}
                          className="w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* Flip button */}
                    {(d.image_url && d.back_view_image_url) && (
                      <button
                        onClick={(e) => toggleFlip(d.id, e)}
                        className="absolute bottom-2 left-2 z-10 bg-card/80 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        title={isFlipped ? "Front view" : "Back view"}
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-foreground" />
                      </button>
                    )}
                    <span className="absolute bottom-2 right-2 text-[10px] bg-card/70 backdrop-blur-sm text-foreground px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {isFlipped ? "Back" : "Front"}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-3 space-y-2">
                    <p className="text-sm font-medium text-foreground leading-tight">{d.title}</p>
                    {d.category_name && (
                      <p className="text-xs text-muted-foreground">{d.category_name}</p>
                    )}
                    {/* Tailor info */}
                    <button
                      onClick={(e) => { e.stopPropagation(); goToCatalogue(d.tenant_slug); }}
                      className="flex items-center gap-1.5 mt-1 group/tailor"
                    >
                      <img
                        src={d.tenant_logo_url ?? fallbackLogo}
                        alt={d.tenant_business_name}
                        className="w-4 h-4 rounded-full object-contain border border-border"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackLogo; }}
                      />
                      <span className="text-xs text-muted-foreground group-hover/tailor:text-foreground transition-colors truncate">
                        {d.tenant_business_name}
                      </span>
                      <ExternalLink className="w-2.5 h-2.5 text-muted-foreground/50 group-hover/tailor:text-foreground/50 shrink-0" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Detail modal ─────────────────────────────────────────────────────── */}
      <Dialog open={!!detail} onOpenChange={(o) => { if (!o) setDetail(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{detail.title}</DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Front View</p>
                  <div className="aspect-[4/5] bg-muted rounded-lg overflow-hidden">
                    {detail.image_url
                      ? <img src={detail.image_url} alt="Front" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-10 h-10 text-muted-foreground/30" /></div>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Back View</p>
                  <div className="aspect-[4/5] bg-muted rounded-lg overflow-hidden">
                    {detail.back_view_image_url
                      ? <img src={detail.back_view_image_url} alt="Back" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-10 h-10 text-muted-foreground/30" /></div>}
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {detail.category_name && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold">Category:</span> {detail.category_name}
                  </p>
                )}
                {detail.gender && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold">Gender:</span> {detail.gender}
                  </p>
                )}
                {detail.description && (
                  <p className="text-sm text-foreground">{detail.description}</p>
                )}
              </div>

              {/* Tailor CTA */}
              <div className="mt-4 p-4 rounded-xl bg-muted/50 border border-border flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={detail.tenant_logo_url ?? fallbackLogo}
                    alt={detail.tenant_business_name}
                    className="w-10 h-10 rounded-lg object-contain border border-border bg-background p-0.5"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackLogo; }}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{detail.tenant_business_name}</p>
                    <p className="text-xs text-muted-foreground">View their full catalogue</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => goToCatalogue(detail.tenant_slug)}
                >
                  View catalogue
                  <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>

              {/* Order CTA */}
              <Button
                className="w-full h-11 mt-3 gap-2 text-sm font-semibold uppercase tracking-wider"
                onClick={() => {
                  setDetail(null);
                  navigate(`/designs/${detail.id}`);
                }}
              >
                Select This Design
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Magazine;
