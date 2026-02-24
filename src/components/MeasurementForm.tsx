import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

interface Props {
  customerId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  measurement?: any;
  onClose: () => void;
  onSaved: () => void;
}

const fields = [
  { key: "chest", label: "Chest" },
  { key: "waist", label: "Waist" },
  { key: "hip", label: "Hip" },
  { key: "shoulder", label: "Shoulder" },
  { key: "sleeve_length", label: "Sleeve Length" },
  { key: "neck", label: "Neck" },
  { key: "inseam", label: "Inseam" },
] as const;

const MeasurementForm = ({ customerId, measurement, onClose, onSaved }: Props) => {
  const { user } = useAuth();
  const [form, setForm] = useState(() => {
    const initial: Record<string, string> = { notes: measurement?.notes ?? "" };
    fields.forEach((f) => { initial[f.key] = measurement?.[f.key]?.toString() ?? ""; });
    return initial;
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outfitType) { toast.error("Please select an outfit type"); return; }
    if (!gender) { toast.error("Please select gender"); return; }
    setLoading(true);

    const payload: Record<string, any> = { customer_id: customerId, notes: form.notes || null };
    for (const f of fields) {
      const val = parseFloat(form[f.key]);
      if (form[f.key] && (isNaN(val) || val < 0)) {
        toast.error(`${f.label} must be a positive number`);
        setLoading(false);
        return;
      }
      payload[f.key] = form[f.key] ? val : null;
    }

    if (measurement) {
      const { error } = await supabase.from("measurements").update(payload).eq("id", measurement.id);
      if (error) toast.error(error.message); else toast.success("Measurement updated");
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from("measurements").insert([{ ...payload, created_by: user?.id } as any]);
      if (error) toast.error(error.message); else toast.success("Measurement added");
    }
    setLoading(false);
    onSaved();
  };

  return (
    <Card className="shadow-sm border-accent/30 max-h-[90vh] overflow-y-auto w-full">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-base">{measurement ? "Edit Measurement" : "New Measurement"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {fields.map((f) => (
              <div key={f.key} className="space-y-1">
                <Label className="text-xs">{f.label} (cm)</Label>
                <Input type="number" step="0.1" min="0" value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button type="submit" disabled={loading} size="sm">{loading ? "Saving..." : "Save"}</Button>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default MeasurementForm;
