import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { Package, Clock, CheckCircle, Truck, Search, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router-dom";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Pending", color: "bg-yellow-500/10 text-yellow-700 border-yellow-200", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-blue-500/10 text-blue-700 border-blue-200", icon: Package },
  ready: { label: "Ready", color: "bg-green-500/10 text-green-700 border-green-200", icon: CheckCircle },
  delivered: { label: "Delivered", color: "bg-muted text-muted-foreground border-border", icon: Truck },
};

const STATUSES = ["pending", "in_progress", "ready", "delivered"] as const;

const Orders = () => {
  const { isAdmin, tenantId } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [detailOrder, setDetailOrder] = useState<any | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    let query = supabase
      .from("orders")
      .select("*, customers(first_name, last_name), designs(title, image_url), measurements(outfit_type)")
      .order("created_at", { ascending: false });

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus as any);
    }

    const { data } = await query;
    let filtered = data ?? [];
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((o: any) => {
        const name = `${o.customers?.first_name ?? ""} ${o.customers?.last_name ?? ""}`.toLowerCase();
        const design = (o.designs?.title ?? "").toLowerCase();
        return name.includes(s) || design.includes(s);
      });
    }
    setOrders(filtered);
  };

  useEffect(() => { fetchOrders(); }, [search, filterStatus]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchOrders();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [filterStatus, search]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus } as any)
      .eq("id", orderId);
    if (error) toast.error(error.message);
    else toast.success(`Order marked as ${STATUS_CONFIG[newStatus]?.label}`);
    setUpdatingId(null);
    fetchOrders();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Orders</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage customer orders and track progress</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by customer or design…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-11" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 h-11"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="py-12 text-center text-muted-foreground">No orders found.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => {
            const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
            const StatusIcon = cfg.icon;
            return (
              <Card key={order.id} className="shadow-sm border-border/60 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Design thumbnail */}
                    {order.designs?.image_url && (
                      <img
                        src={order.designs.image_url}
                        alt={order.designs?.title}
                        className="w-16 h-20 object-cover rounded-md border border-border shrink-0"
                      />
                    )}

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-display font-semibold text-foreground">
                          {order.designs?.title ?? "Design removed"}
                        </p>
                        <Badge variant="outline" className={cfg.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {cfg.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Customer: {order.customers?.first_name} {order.customers?.last_name}
                      </p>
                      {order.measurements?.outfit_type && (
                        <p className="text-xs text-muted-foreground">Outfit: {order.measurements.outfit_type}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="ghost" size="sm" className="gap-1" onClick={() => setDetailOrder(order)}>
                        <Eye className="w-3.5 h-3.5" /> View
                      </Button>
                      {(isAdmin) && order.status !== "delivered" && (
                        <Select
                          value={order.status}
                          onValueChange={(val) => updateStatus(order.id, val)}
                          disabled={updatingId === order.id}
                        >
                          <SelectTrigger className="h-9 w-36 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={!!detailOrder} onOpenChange={(o) => { if (!o) setDetailOrder(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {detailOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display">Order Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Design</p>
                  <p className="text-sm font-medium text-foreground">{detailOrder.designs?.title ?? "Removed"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Customer</p>
                  <p className="text-sm font-medium text-foreground">
                    {detailOrder.customers?.first_name} {detailOrder.customers?.last_name}
                  </p>
                  <Link
                    to={`/customers/${detailOrder.customer_id}`}
                    className="text-xs text-primary hover:underline"
                  >
                    View customer profile →
                  </Link>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Status</p>
                  <Badge variant="outline" className={STATUS_CONFIG[detailOrder.status]?.color}>
                    {STATUS_CONFIG[detailOrder.status]?.label}
                  </Badge>
                </div>
                {detailOrder.notes && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Notes</p>
                    <p className="text-sm text-foreground">{detailOrder.notes}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(detailOrder.created_at), "MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
                {detailOrder.updated_at !== detailOrder.created_at && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Last Updated</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(detailOrder.updated_at), "MMMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
