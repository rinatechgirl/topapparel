import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import MeasurementForm from "@/components/MeasurementForm";
import { getOrCreateCustomerRecord } from "@/lib/customerOrder";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  designId: string;
  designTitle: string;
  designTenantId: string; // 🔒 REQUIRED
}

interface CustomerOption {
  id: string;
  first_name: string;
  last_name: string;
}

interface MeasurementOption {
  id: string;
  outfit_type: string | null;
  measurement_gender: string | null;
  date_recorded: string;
}

const OrderPlacementDialog = ({
  open,
  onOpenChange,
  designId,
  designTitle,
  designTenantId,
}: Props) => {
  const { user, tenantId: authTenantId, role } = useAuth();
  const navigate = useNavigate();

  // 🔒 HARD TENANT RESOLUTION
  const effectiveTenantId = designTenantId || authTenantId;

  const isCustomer = role === "customer";

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [measurements, setMeasurements] = useState<MeasurementOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedMeasurement, setSelectedMeasurement] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [customerSetupLoading, setCustomerSetupLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [showMeasurementForm, setShowMeasurementForm] = useState(false);

  // ─────────────────────────────────────────────────────────────
  // HARD SAFETY GUARD (prevents silent FK/RLS failures)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (open && !effectiveTenantId) {
      toast.error("Unable to identify the designer for this order.");
      onOpenChange(false);
    }
  }, [open, effectiveTenantId, onOpenChange]);

  const loadMeasurements = async (customerId: string, autoSelectLatest = false) => {
    const { data, error } = await supabase
      .from("measurements")
      .select("id, outfit_type, measurement_gender, date_recorded")
      .eq("customer_id", customerId)
      .order("date_recorded", { ascending: false });

    if (error) {
      toast.error("Failed to load measurements");
      return;
    }

    const list = data ?? [];
    setMeasurements(list);

    if (autoSelectLatest && list[0]?.id) {
      setSelectedMeasurement(list[0].id);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // CUSTOMER AUTO SETUP (PUBLIC FLOW)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    if (isCustomer) {
      if (!user) {
        navigate(`/auth?returnTo=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      if (!effectiveTenantId) return;

      const setupCustomer = async () => {
        setCustomerSetupLoading(true);
        try {
          const customer = await getOrCreateCustomerRecord({
            user,
            tenantId: effectiveTenantId,
            fullName:
              typeof user.user_metadata?.full_name === "string"
                ? user.user_metadata.full_name
                : undefined,
          });

          setSelectedCustomer(customer.id);
          setCustomerName(
            `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim()
          );

          await loadMeasurements(customer.id, true);
        } catch (err) {
          toast.error(
            err instanceof Error
              ? err.message
              : "We couldn't prepare your customer account"
          );
          onOpenChange(false);
        } finally {
          setCustomerSetupLoading(false);
        }
      };

      setupCustomer();
      return;
    }

    // ─────────────────────────────────────────────────────────────
    // STAFF FLOW (TENANT SCOPED)
    // ─────────────────────────────────────────────────────────────
    const loadCustomers = async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, first_name, last_name")
        .eq("tenant_id", effectiveTenantId)
        .order("first_name");

      if (error) {
        toast.error("Failed to load customers");
        return;
      }

      setCustomers(data ?? []);
    };

    loadCustomers();
  }, [open, isCustomer, effectiveTenantId, user, navigate, onOpenChange]);

  useEffect(() => {
    if (isCustomer) return;
    if (!selectedCustomer) {
      setMeasurements([]);
      setSelectedMeasurement("");
      return;
    }
    loadMeasurements(selectedCustomer);
  }, [isCustomer, selectedCustomer]);

  // ─────────────────────────────────────────────────────────────
  // ORDER SUBMIT
  // ─────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedCustomer) {
      toast.error("Customer not resolved");
      return;
    }

    if (isCustomer && !selectedMeasurement) {
      toast.error("Please select or add a measurement");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("orders").insert({
      tenant_id: effectiveTenantId,
      customer_id: selectedCustomer,
      design_id: designId,
      measurement_id: selectedMeasurement || null,
      notes: notes.trim() || null,
      created_by: user?.id,
      status: "pending_price_confirmation",
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Order placed successfully!");
    onOpenChange(false);
    setNotes("");
    setSelectedMeasurement("");
    if (!isCustomer) navigate("/orders");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Order: {designTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isCustomer ? (
            <div className="space-y-2">
              <Label>Customer</Label>
              <div className="rounded border p-3 text-sm">
                {customerSetupLoading ? "Preparing profile..." : customerName}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.first_name} {c.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedCustomer && !showMeasurementForm && (
            <div className="space-y-2">
              <Label>Measurement</Label>
              {measurements.length > 0 ? (
                <Select
                  value={selectedMeasurement}
                  onValueChange={setSelectedMeasurement}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select measurement" />
                  </SelectTrigger>
                  <SelectContent>
                    {measurements.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.outfit_type ?? "General"} —{" "}
                        {new Date(m.date_recorded).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No measurements yet.
                </p>
              )}
            </div>
          )}

          {isCustomer && showMeasurementForm && (
            <MeasurementForm
              customerId={selectedCustomer}
              onClose={() => setShowMeasurementForm(false)}
              onSaved={async () => {
                setShowMeasurementForm(false);
                await loadMeasurements(selectedCustomer, true);
              }}
            />
          )}

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button
            className="w-full"
            disabled={loading || customerSetupLoading}
            onClick={handleSubmit}
          >
            {loading ? "Placing Order..." : "Place Order"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderPlacementDialog;
