import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Building2, Check, X, Ban, Trash2, RefreshCw,
  Search, Globe, Users, ShieldAlert, ShieldCheck,
  ChevronDown, ExternalLink,
} from "lucide-react";
import { format } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tenant {
  id: string;
  business_name: string;
  slug: string;
  business_email: string;
  owner_name: string;
  phone: string | null;
  country: string | null;
  status: string;
  logo_url: string | null;
  created_at: string;
  member_count?: number;
}

type FilterStatus = "all" | "pending" | "approved" | "suspended" | "rejected";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; classes: string; dot: string }> = {
  pending:   { label: "Pending",   classes: "bg-amber-50 text-amber-700 border border-amber-200",    dot: "bg-amber-400" },
  approved:  { label: "Active",    classes: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500" },
  suspended: { label: "Suspended", classes: "bg-red-50 text-red-700 border border-red-200",          dot: "bg-red-500" },
  rejected:  { label: "Rejected",  classes: "bg-slate-100 text-slate-500 border border-slate-200",   dot: "bg-slate-400" },
};

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-card rounded-xl p-5 border transition-all shadow-sm hover:shadow-md ${
        active
          ? "border-accent ring-1 ring-accent/30"
          : "border-slate-200 dark:border-slate-800"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 bg-accent/10 rounded-lg">
          <Icon className="w-5 h-5 text-accent" />
        </div>
        {active && (
          <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full uppercase tracking-wide">
            Filtered
          </span>
        )}
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
        {value.toLocaleString()}
      </p>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const AdminPanel = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [filtered, setFiltered] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Fetch all tenants + member count ────────────────────────────────────────
  const fetchTenants = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // Fetch member counts per tenant
    const { data: roleCounts } = await supabase
      .from("user_roles")
      .select("tenant_id");

    const countMap: Record<string, number> = {};
    (roleCounts ?? []).forEach((r: any) => {
      countMap[r.tenant_id] = (countMap[r.tenant_id] ?? 0) + 1;
    });

    const enriched = (data ?? []).map((t: any) => ({
      ...t,
      member_count: countMap[t.id] ?? 0,
    })) as Tenant[];

    setTenants(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchTenants(); }, []);

  // ── Apply search + status filter ─────────────────────────────────────────────
  useEffect(() => {
    let result = tenants;

    if (filterStatus !== "all") {
      result = result.filter((t) => t.status === filterStatus);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.business_name.toLowerCase().includes(q) ||
          t.owner_name.toLowerCase().includes(q) ||
          t.business_email.toLowerCase().includes(q) ||
          t.slug.toLowerCase().includes(q)
      );
    }

    setFiltered(result);
  }, [tenants, filterStatus, search]);

  // ── Counts ────────────────────────────────────────────────────────────────────
  const counts = {
    all:       tenants.length,
    pending:   tenants.filter((t) => t.status === "pending").length,
    approved:  tenants.filter((t) => t.status === "approved").length,
    suspended: tenants.filter((t) => t.status === "suspended").length,
  };

  // ── Actions ───────────────────────────────────────────────────────────────────
  const updateStatus = async (id: string, status: string) => {
    setActionLoading(id + status);
    const { error } = await supabase
      .from("tenants")
      .update({ status } as any)
      .eq("id", id);

    setActionLoading(null);
    if (error) toast.error(error.message);
    else {
      toast.success(`Organisation ${status}`);
      fetchTenants();
    }
  };

  const deleteTenant = async (tenant: Tenant) => {
    if (
      !confirm(
        `Permanently delete "${tenant.business_name}" and ALL its data?\n\nThis cannot be undone.`
      )
    )
      return;

    setActionLoading(tenant.id + "delete");
    const { error } = await supabase.from("tenants").delete().eq("id", tenant.id);
    setActionLoading(null);

    if (error) toast.error(error.message);
    else {
      toast.success("Organisation deleted");
      fetchTenants();
    }
  };

  const IS_DEV =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  const visitOrg = (slug: string) => {
    const url = IS_DEV
      ? `/?tenant=${slug}`
      : `https://${slug}.rinasfit.com`;
    window.open(url, "_blank");
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-1">
            Rina's Fit
          </p>
          <h1 className="text-2xl font-display font-bold text-foreground leading-tight">
            Platform Control
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all registered organisations
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTenants}
          disabled={loading}
          className="gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Building2}
          label="Total organisations"
          value={counts.all}
          active={filterStatus === "all"}
          onClick={() => setFilterStatus("all")}
        />
        <StatCard
          icon={ShieldAlert}
          label="Pending approval"
          value={counts.pending}
          active={filterStatus === "pending"}
          onClick={() => setFilterStatus("pending")}
        />
        <StatCard
          icon={ShieldCheck}
          label="Active"
          value={counts.approved}
          active={filterStatus === "approved"}
          onClick={() => setFilterStatus("approved")}
        />
        <StatCard
          icon={Ban}
          label="Suspended"
          value={counts.suspended}
          active={filterStatus === "suspended"}
          onClick={() => setFilterStatus("suspended")}
        />
      </div>

      {/* ── Search + table ───────────────────────────────────────────────────── */}
      <div className="bg-card rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">

        {/* Table toolbar */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-display font-bold text-foreground">
              Organisations
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {filtered.length} {filterStatus !== "all" ? filterStatus : "total"}
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              placeholder="Search by name, email, slug…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus-visible:ring-accent"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground mt-3">Loading organisations…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No organisations found.</p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="mt-2 text-xs text-accent hover:underline underline-offset-4"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((t) => {
              const cfg = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.pending;
              const isExpanded = expandedId === t.id;
              const isActing = actionLoading?.startsWith(t.id);

              return (
                <div key={t.id} className="group">
                  {/* Main row */}
                  <div className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">

                    {/* Logo / avatar */}
                    <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center overflow-hidden shrink-0">
                      {t.logo_url ? (
                        <img
                          src={t.logo_url}
                          alt={t.business_name}
                          className="w-full h-full object-contain p-0.5"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <Building2 className="w-4 h-4 text-accent" />
                      )}
                    </div>

                    {/* Name + email */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {t.business_name}
                        </p>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.classes}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <p className="text-xs text-muted-foreground">{t.owner_name}</p>
                        <span className="text-muted-foreground/30">·</span>
                        <p className="text-xs text-muted-foreground truncate">{t.business_email}</p>
                      </div>
                    </div>

                    {/* Slug */}
                    <div className="hidden md:block shrink-0">
                      <p className="text-[10px] font-mono text-accent bg-accent/10 px-2 py-1 rounded">
                        {t.slug}.rinasfit.com
                      </p>
                    </div>

                    {/* Members */}
                    <div className="hidden lg:flex items-center gap-1 shrink-0">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {t.member_count} {t.member_count === 1 ? "member" : "members"}
                      </span>
                    </div>

                    {/* Date */}
                    <div className="hidden lg:block shrink-0 text-right">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(t.created_at), "MMM d, yyyy")}
                      </p>
                    </div>

                    {/* Expand toggle */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : t.id)}
                      className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded shrink-0"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </button>
                  </div>

                  {/* Expanded action row */}
                  {isExpanded && (
                    <div className="px-6 pb-4 flex flex-wrap items-center gap-2 bg-slate-50/50 dark:bg-slate-800/10 border-t border-slate-100 dark:border-slate-800">

                      {/* Visit */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1.5"
                        onClick={() => visitOrg(t.slug)}
                      >
                        <Globe className="w-3 h-3" />
                        Visit portal
                        <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                      </Button>

                      {/* Status actions */}
                      {t.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            className="h-7 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={!!isActing}
                            onClick={() => updateStatus(t.id, "approved")}
                          >
                            <Check className="w-3 h-3" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                            disabled={!!isActing}
                            onClick={() => updateStatus(t.id, "rejected")}
                          >
                            <X className="w-3 h-3" />
                            Reject
                          </Button>
                        </>
                      )}

                      {t.status === "approved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1.5 text-amber-700 border-amber-200 hover:bg-amber-50"
                          disabled={!!isActing}
                          onClick={() => updateStatus(t.id, "suspended")}
                        >
                          <Ban className="w-3 h-3" />
                          Suspend
                        </Button>
                      )}

                      {t.status === "suspended" && (
                        <Button
                          size="sm"
                          className="h-7 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={!!isActing}
                          onClick={() => updateStatus(t.id, "approved")}
                        >
                          <Check className="w-3 h-3" />
                          Reactivate
                        </Button>
                      )}

                      {t.status === "rejected" && (
                        <Button
                          size="sm"
                          className="h-7 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={!!isActing}
                          onClick={() => updateStatus(t.id, "approved")}
                        >
                          <Check className="w-3 h-3" />
                          Approve anyway
                        </Button>
                      )}

                      {/* Divider */}
                      <div className="flex-1" />

                      {/* Metadata (visible in expanded on mobile) */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground md:hidden">
                        <span className="font-mono text-accent">{t.slug}</span>
                        {t.country && <span>{t.country}</span>}
                        <span>{t.member_count} members</span>
                      </div>

                      {/* Delete — last */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs gap-1.5 text-red-500 hover:bg-red-50 hover:text-red-600 ml-auto"
                        disabled={!!isActing}
                        onClick={() => deleteTenant(t)}
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Table footer */}
        {!loading && filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {filtered.length} of {tenants.length} organisations
            </p>
            {filterStatus !== "all" && (
              <button
                onClick={() => setFilterStatus("all")}
                className="text-xs text-accent hover:underline underline-offset-4"
              >
                Show all
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
