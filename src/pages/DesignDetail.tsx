import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Image as ImageIcon, ShoppingBag, MessageCircle } from "lucide-react";
import OrderPlacementDialog from "@/components/OrderPlacementDialog";
import { getTenantSlugFromHostname } from "@/hooks/useTenantSlug";

interface Design {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  image_url: string | null;
  back_view_image_url: string | null;
  gender: string | null;
  is_public: boolean;
  created_at: string;
  tenant_id: string | null;
}

interface TenantInfo {
  slug: string;
  business_name: string;
  whatsapp_phone: string | null;
}

const DesignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [design, setDesign] = useState<Design | null>(null);
  const [categoryName, setCategoryName] = useState("Uncategorized");
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [tenantSlugForAuth, setTenantSlugForAuth] = useState<string | null>(getTenantSlugFromHostname());
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data } = await supabase.from("designs").select("*").eq("id", id).single();
      if (data) {
        setDesign(data as Design);

        if (data.tenant_id) {
          const { data: tenantData } = await supabase
            .from("tenants")
            .select("slug, business_name, whatsapp_phone")
            .eq("id", data.tenant_id)
            .maybeSingle();

          if (tenantData) {
            setTenantInfo(tenantData as TenantInfo);
            if (!tenantSlugForAuth) setTenantSlugForAuth(tenantData.slug);
          }
        }

        if (data.category_id) {
          const { data: cat } = await supabase.from("categories").select("name").eq("id", data.category_id).single();
          if (cat) setCategoryName(cat.name);
        }
      }
    };
    load();
  }, [id, tenantSlugForAuth]);

  const whatsappUrl = tenantInfo?.whatsapp_phone && design
    ? `https://wa.me/${tenantInfo.whatsapp_phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello, I'm interested in your design: ${design.title}`)}`
    : null;

  if (!design) return <div className="p-6 text-muted-foreground">Loading design…</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Front View</p>
            <div className="aspect-[4/5] bg-muted rounded-lg overflow-hidden">
              {design.image_url ? (
                <img src={design.image_url} alt="Front" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Back View</p>
            <div className="aspect-[4/5] bg-muted rounded-lg overflow-hidden">
              {design.back_view_image_url ? (
                <img src={design.back_view_image_url} alt="Back" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-6 space-y-4">
            <h1 className="text-2xl font-display font-bold text-foreground">{design.title}</h1>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary">{categoryName}</Badge>
              {design.gender && <Badge variant="outline">{design.gender}</Badge>}
            </div>
            {tenantInfo && (
              <p className="text-sm text-muted-foreground">
                By <span className="font-medium text-foreground">{tenantInfo.business_name}</span>
              </p>
            )}
            {design.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{design.description}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Added: {new Date(design.created_at).toLocaleDateString()}
            </p>

            {/* WhatsApp contact for price negotiation */}
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full h-11 rounded-md border border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400 font-medium text-sm hover:bg-green-500/20 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Chat on WhatsApp to negotiate price
              </a>
            )}

            {user ? (
              <Button
                className="w-full h-12 gap-2 text-sm font-semibold uppercase tracking-wider"
                onClick={() => setOrderDialogOpen(true)}
              >
                <ShoppingBag className="w-4 h-4" />
                Request / Order This Design
              </Button>
            ) : (
              <Button
                className="w-full h-12 gap-2 text-sm font-semibold uppercase tracking-wider"
                onClick={() => {
                  const params = new URLSearchParams({
                    returnTo: `${location.pathname}${location.search}`,
                    intent: "customer-order",
                  });

                  if (tenantSlugForAuth) params.set("tenant", tenantSlugForAuth);

                  navigate(`/auth?${params.toString()}`);
                }}
              >
                <ShoppingBag className="w-4 h-4" />
                Sign In to Order This Design
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {user && design && (
        <OrderPlacementDialog
          open={orderDialogOpen}
          onOpenChange={setOrderDialogOpen}
          designId={design.id}
          designTitle={design.title}
        />
      )}
    </div>
  );
};

export default DesignDetail;
