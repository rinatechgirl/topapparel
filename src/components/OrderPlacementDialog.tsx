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
  const { user, tenantId } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [measurements, setMeasurements] = useState<MeasurementOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedMeasurement, setSelectedMeasurement] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const loadCustomers = async () => {
      const { data } = await supabase
        .from("customers")
        .select("id, first_name, last_name")
        .order("first_name");
      setCustomers(data ?? []);
    };
    loadCustomers();
  }, [open]);

  useEffect(() => {
    if (!selectedCustomer) {
      setMeasurements([]);
      setSelectedMeasurement("");
      return;
    }
    const loadMeasurements = async () => {
      const { data } = await supabase
        .from("measurements")
        .select("id, outfit_type, measurement_gender, date_recorded")
        .eq("customer_id", selectedCustomer)
        .order("date_recorded", { ascending: false });
      setMeasurements(data ?? []);
    };
    loadMeasurements();
  }, [selectedCustomer]);

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      toast.error("Please select a customer");
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
      navigate("/orders");
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

          {selectedCustomer && (
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Existing Measurement {measurements.length === 0 ? "(none found)" : ""}
              </Label>
              {measurements.length > 0 ? (
                <Select value={selectedMeasurement} onValueChange={setSelectedMeasurement}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select measurement (optional)" /></SelectTrigger>
                  <SelectContent>
                    {measurements.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.outfit_type ?? "General"} — {new Date(m.date_recorded).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            disabled={loading || !selectedCustomer}
          >
            {loading ? "Placing Order..." : "Place Order"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderPlacementDialog;
