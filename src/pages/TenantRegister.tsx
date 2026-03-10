import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Building2, ArrowRight } from "lucide-react";
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

    try {
      const slug = slugify(form.business_name);
      if (!slug) { toast.error("Invalid business name"); setLoading(false); return; }

      // Step 1: Create tenant
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

      let tenantId = tenant?.id;
      if (tenantErr) {
        // Check if it's a duplicate slug — find existing
        const { data: found } = await supabase
          .from("tenants")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();
        if (found) tenantId = found.id;
        else {
          toast.error(tenantErr.message.includes("duplicate") ? "Business name already taken" : tenantErr.message);
          setLoading(false);
          return;
        }
      }

      if (!tenantId) { toast.error("Failed to create organization"); setLoading(false); return; }

      // Step 2: Update profile with tenant_id
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ tenant_id: tenantId } as any)
        .eq("user_id", user.id);

      if (profileErr) {
        console.error("Profile update error:", profileErr);
        toast.error("Failed to link profile: " + profileErr.message);
        setLoading(false);
        return;
      }

      // Step 3: Create admin role for this tenant
      const { error: roleErr } = await supabase
        .from("user_roles")
        .upsert({ user_id: user.id, role: "admin", tenant_id: tenantId } as any, { onConflict: "user_id,role" });

      if (roleErr) {
        console.error("Role upsert error:", roleErr);
        toast.error("Failed to set role: " + roleErr.message);
        setLoading(false);
        return;
      }

      // Step 4: Refresh auth context so it picks up the new tenant_id
      await refreshTenant();

      toast.success("Organization registered! Awaiting approval.");
      navigate("/pending-approval");
    } catch (err: any) {
      console.error("Registration error:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary mb-4">
            <Building2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">Register Your Business</h1>
          <p className="text-muted-foreground mt-1 text-sm">Create your organization on Rina's Fit</p>
          {form.business_name && (
            <p className="text-xs text-muted-foreground mt-2">
              Your URL: <span className="font-mono text-primary font-medium">{slugify(form.business_name)}.rinasfit.com</span>
            </p>
          )}
        </div>

        <Card className="shadow-xl border-border/50">
          <CardHeader className="text-center pb-4">
            <CardTitle className="font-display text-lg">Business Details</CardTitle>
            <CardDescription>Fill in your tailoring business information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Business Name *</Label>
                <Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} placeholder="e.g. Rina Tailors" required />
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
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? "Registering..." : "Register Organization"} <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TenantRegister;
