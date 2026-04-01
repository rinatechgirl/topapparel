import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import MeasurementForm from "@/components/MeasurementForm";
import { getOrCreateCustomerRecord } from "@/lib/customerOrder";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  designId: string;
  designTitle: string;
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

const OrderPlacementDialog = ({ open, onOpenChange, designId, designTitle }: Props) => {
  const { user, tenantId, role } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [measurements, setMeasurements] = useState<MeasurementOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedMeasurement, setSelectedMeasurement] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [customerSetupLoading, setCustomerSetupLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [showMeasurementForm, setShowMeasurementForm] = useState(false);

  const isCustomer = role === "customer";

  const loadMeasurements = async (customerId: string, autoSelectLatest = false) => {
    const { data } = await supabase
      .from("measurements")
      .select("id, outfit_type, measurement_gender, date_recorded")
      .eq("customer_id", customerId)
      .order("date_recorded", { ascending: false });

    const nextMeasurements = data ?? [];
    setMeasurements(nextMeasurements);

    if (autoSelectLatest && nextMeasurements[0]?.id) {
      setSelectedMeasurement(nextMeasurements[0].id);
    }
  };

  useEffect(() => {
    if (!open) return;

    if (isCustomer) {
      if (!user || !tenantId) return;

      const setupCustomer = async () => {
        setCustomerSetupLoading(true);

        try {
          const customer = await getOrCreateCustomerRecord({
            user,
            tenantId,
            fullName:
              typeof user.user_metadata?.full_name === "string"
                ? user.user_metadata.full_name
                : undefined,
          });

          setSelectedCustomer(customer.id);
          setCustomerName(`${customer.first_name} ${customer.last_name}`.trim());
          await loadMeasurements(customer.id, true);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "We couldn't prepare your order profile.";
          toast.error(message);
        } finally {
          setCustomerSetupLoading(false);
        }
      };

      setupCustomer();
      return;
    }

    const loadCustomers = async () => {
      const { data } = await supabase
        .from("customers")
        .select("id, first_name, last_name")
        .order("first_name");
      setCustomers(data ?? []);
    };
    loadCustomers();
  }, [open, isCustomer, tenantId, user]);

  useEffect(() => {
    if (isCustomer) return;

    if (!selectedCustomer) {
      setMeasurements([]);
      setSelectedMeasurement("");
      return;
    }
    loadMeasurements(selectedCustomer);
  }, [isCustomer, selectedCustomer]);

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      toast.error(isCustomer ? "We couldn't find your customer profile." : "Please select a customer");
      return;
    }

    if (isCustomer && !selectedMeasurement) {
      toast.error("Please select an existing measurement or add a new one before placing your order.");
      return;
    }

    setLoading(true);

    const payload: Record<string, unknown> = {
      tenant_id: tenantId,
      customer_id: selectedCustomer,
      design_id: designId,
      measurement_id: selectedMeasurement || null,
      notes: notes.trim() || null,
      created_by: user?.id,
      status: "pending" as const,
    };

    const { error } = await supabase.from("orders").insert(payload as any);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Order placed successfully!");
      onOpenChange(false);
      setSelectedCustomer("");
      setSelectedMeasurement("");
      setNotes("");
      if (!isCustomer) navigate("/orders");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Order: {designTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {isCustomer ? (
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Customer</Label>
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-3 text-sm text-foreground">
                {customerSetupLoading ? "Preparing your customer profile..." : customerName || user?.email || "Customer"}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Customer *</Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select customer" /></SelectTrigger>
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
              <div className="flex items-center justify-between gap-3">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Existing Measurement {measurements.length === 0 ? "(none found)" : ""}
                </Label>
                {isCustomer && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowMeasurementForm(true)}>
                    Add new measurement
                  </Button>
                )}
              </div>
              {measurements.length > 0 ? (
                <Select value={selectedMeasurement} onValueChange={setSelectedMeasurement}>
                  <SelectTrigger className="h-11"><SelectValue placeholder={isCustomer ? "Select measurement" : "Select measurement (optional)"} /></SelectTrigger>
                  <SelectContent>
                    {measurements.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.outfit_type ?? "General"} — {new Date(m.date_recorded).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : isCustomer ? (
                <p className="text-xs text-muted-foreground">
                  You haven’t added any measurements yet. Add one now so this order can be tailored correctly.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No measurements for this customer.{" "}
                  <button
                    type="button"
                    className="text-primary underline"
                    onClick={() => {
                      onOpenChange(false);
                      navigate(`/customers/${selectedCustomer}`);
                    }}
                  >
                    Add one first
                  </button>
                </p>
              )}
            </div>
          )}

          {isCustomer && selectedCustomer && showMeasurementForm && (
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
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Custom Notes (fabric, color, adjustments)
            </Label>
            <Textarea
              placeholder="E.g., Use blue ankara fabric, add a side slit..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            className="w-full h-11"
            onClick={handleSubmit}
            disabled={loading || customerSetupLoading || !selectedCustomer || showMeasurementForm}
          >
            {loading ? "Placing Order..." : "Place Order"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderPlacementDialog;
