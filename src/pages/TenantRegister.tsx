import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Scissors, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const slugify = (str: string) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const TenantRegister = () => {
  const { user, refreshTenant } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    business_name: "",
    business_email: "",
    owner_name: "",
    phone: "",
    address: "",
    country: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("You must be signed in"); return; }
    setLoading(true);

    const slug = slugify(form.business_name);
    if (!slug) { toast.error("Invalid business name"); setLoading(false); return; }

    // Create tenant - don't use .select() since RLS SELECT requires tenant assignment
    const { data: tenant, error: tenantErr } = await supabase
      .from("tenants")
      .insert({
        business_name: form.business_name.trim(),
        slug,
        business_email: form.business_email.trim(),
        owner_name: form.owner_name.trim(),
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        country: form.country.trim() || null,
        description: form.description.trim() || null,
      } as any)
      .select("id")
      .single();

    // If RLS blocks the select, try fetching by slug instead
    let tenantId = tenant?.id;
    if (tenantErr) {
      // Try to find the tenant we just created by slug
      const { data: found } = await supabase
        .from("tenants")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (found) {
        tenantId = found.id;
      } else {
        toast.error(tenantErr.message.includes("duplicate") ? "Business name already taken" : tenantErr.message);
        setLoading(false);
        return;
      }
    }

    if (!tenantId) {
      toast.error("Failed to create organization");
      setLoading(false);
      return;
    }

    // Update profile with tenant_id
    const { error: profileErr } = await supabase
      .from("profiles")
      .update({ tenant_id: tenantId } as any)
      .eq("user_id", user.id);

    if (profileErr) { toast.error(profileErr.message); setLoading(false); return; }

    // Create or update user_role as admin for this tenant
    const { error: roleErr } = await supabase
      .from("user_roles")
      .upsert({ user_id: user.id, role: "admin", tenant_id: tenantId } as any, { onConflict: "user_id,role" });

    if (roleErr) { toast.error(roleErr.message); setLoading(false); return; }

    toast.success("Organization registered! Awaiting approval from platform admin.");
    await refreshTenant();
    setLoading(false);
    navigate("/pending-approval");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
            <Building2 className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Register Your Business</h1>
          <p className="text-muted-foreground mt-1 font-body">Create your organization on Rina's Fit</p>
        </div>

        <Card className="shadow-lg border-border/50">
          <CardHeader className="text-center pb-4">
            <CardTitle className="font-display text-xl">Business Details</CardTitle>
            <CardDescription>Fill in your tailoring business information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Business Name *</Label>
                <Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} placeholder="e.g. Rina Tailors" required />
                {form.business_name && (
                  <p className="text-xs text-muted-foreground">Slug: <span className="font-mono text-accent">{slugify(form.business_name)}</span></p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Business Email *</Label>
                  <Input type="email" value={form.business_email} onChange={(e) => setForm({ ...form, business_email: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Owner Full Name *</Label>
                  <Input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Business Address</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Business Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Registering..." : "Register Organization"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TenantRegister;
