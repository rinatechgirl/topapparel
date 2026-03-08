import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Building2, Check, X, Ban, Trash2, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface Tenant {
  id: string;
  business_name: string;
  slug: string;
  business_email: string;
  owner_name: string;
  phone: string | null;
  country: string | null;
  status: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-warning/20 text-warning",
  approved: "bg-success/20 text-success",
  suspended: "bg-destructive/20 text-destructive",
  rejected: "bg-muted text-muted-foreground",
};

const AdminPanel = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const fetchTenants = async () => {
    setLoading(true);
    let query = supabase.from("tenants").select("*").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter as any);
    const { data, error } = await query;
    if (error) toast.error(error.message);
    setTenants((data as Tenant[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchTenants(); }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("tenants")
      .update({ status } as any)
      .eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Tenant ${status}`); fetchTenants(); }
  };

  const deleteTenant = async (id: string) => {
    if (!confirm("Delete this organization and ALL its data? This cannot be undone.")) return;
    const { error } = await supabase.from("tenants").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Tenant deleted"); fetchTenants(); }
  };

  const counts = {
    all: tenants.length,
    pending: tenants.filter(t => t.status === "pending").length,
    approved: tenants.filter(t => t.status === "approved").length,
    suspended: tenants.filter(t => t.status === "suspended").length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Platform Admin</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage registered organizations</p>
        </div>
        <Button variant="outline" onClick={fetchTenants} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: counts.all, key: "all" },
          { label: "Pending", value: counts.pending, key: "pending" },
          { label: "Approved", value: counts.approved, key: "approved" },
          { label: "Suspended", value: counts.suspended, key: "suspended" },
        ].map(s => (
          <Card
            key={s.key}
            className={`cursor-pointer transition-shadow hover:shadow-md ${filter === s.key ? "ring-2 ring-accent" : ""}`}
            onClick={() => setFilter(s.key)}
          >
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tenant List */}
      {loading ? (
        <p className="text-muted-foreground text-center py-8">Loading...</p>
      ) : tenants.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No organizations found.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {tenants.map((t) => (
            <Card key={t.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground">{t.business_name}</p>
                        <Badge className={`text-[10px] ${statusColors[t.status] ?? ""}`}>{t.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{t.owner_name} • {t.business_email}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Slug: <span className="font-mono text-accent">{t.slug}</span>
                        {t.country && ` • ${t.country}`}
                        {t.phone && ` • ${t.phone}`}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">Registered: {format(new Date(t.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
                    </div>
                  </div>

                  <div className="flex gap-1.5 shrink-0">
                    {t.status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => updateStatus(t.id, "approved")} className="gap-1">
                          <Check className="w-3.5 h-3.5" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(t.id, "rejected")} className="gap-1">
                          <X className="w-3.5 h-3.5" /> Reject
                        </Button>
                      </>
                    )}
                    {t.status === "approved" && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(t.id, "suspended")} className="gap-1 text-destructive">
                        <Ban className="w-3.5 h-3.5" /> Suspend
                      </Button>
                    )}
                    {t.status === "suspended" && (
                      <Button size="sm" onClick={() => updateStatus(t.id, "approved")} className="gap-1">
                        <Check className="w-3.5 h-3.5" /> Reactivate
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => deleteTenant(t.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
