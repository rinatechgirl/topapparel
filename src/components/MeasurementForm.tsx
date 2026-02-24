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

interface Props {
  customerId: string;
  measurement?: any;
  onClose: () => void;
  onSaved: () => void;
}

const OUTFIT_TYPES = [
  "Short Gown",
  "Long Dress",
  "Top",
  "Trousers",
  "Skirt",
  "Shirt",
  "Suit",
  "Native Wear",
  "Custom",
] as const;

const GENDERS = ["Male", "Female", "Unisex"] as const;

interface MeasurementField {
  key: string;
  label: string;
}

const OUTFIT_FIELDS: Record<string, MeasurementField[]> = {
  "Short Gown": [
    { key: "bust", label: "Bust" },
    { key: "waist", label: "Waist" },
    { key: "hip", label: "Hip" },
    { key: "shoulder", label: "Shoulder" },
    { key: "sleeve_length", label: "Sleeve Length" },
    { key: "dress_length", label: "Dress Length" },
    { key: "round_sleeve", label: "Round Sleeve" },
    { key: "neck_depth", label: "Neck Depth" },
    { key: "back_width", label: "Back Width" },
  ],
  "Long Dress": [
    { key: "bust", label: "Bust" },
    { key: "waist", label: "Waist" },
    { key: "hip", label: "Hip" },
    { key: "shoulder", label: "Shoulder" },
    { key: "sleeve_length", label: "Sleeve Length" },
    { key: "dress_length", label: "Dress Length" },
    { key: "round_sleeve", label: "Round Sleeve" },
    { key: "neck_depth", label: "Neck Depth" },
    { key: "back_width", label: "Back Width" },
  ],
  "Top": [
    { key: "bust", label: "Bust" },
    { key: "waist", label: "Waist" },
    { key: "shoulder", label: "Shoulder" },
    { key: "sleeve_length", label: "Sleeve Length" },
    { key: "top_length", label: "Top Length" },
  ],
  "Trousers": [
    { key: "waist", label: "Waist" },
    { key: "hip", label: "Hip" },
    { key: "thigh", label: "Thigh" },
    { key: "knee", label: "Knee" },
    { key: "ankle", label: "Ankle" },
    { key: "trouser_length", label: "Trouser Length" },
  ],
  "Skirt": [
    { key: "waist", label: "Waist" },
    { key: "hip", label: "Hip" },
    { key: "dress_length", label: "Skirt Length" },
  ],
  "Shirt": [
    { key: "chest", label: "Chest" },
    { key: "shoulder", label: "Shoulder" },
    { key: "sleeve_length", label: "Sleeve Length" },
    { key: "shirt_length", label: "Shirt Length" },
    { key: "neck_size", label: "Neck Size" },
  ],
  "Suit": [
    { key: "chest", label: "Chest" },
    { key: "waist", label: "Waist" },
    { key: "hip", label: "Hip" },
    { key: "shoulder", label: "Shoulder" },
    { key: "sleeve_length", label: "Sleeve Length" },
    { key: "shirt_length", label: "Jacket Length" },
    { key: "neck_size", label: "Neck Size" },
    { key: "thigh", label: "Thigh" },
    { key: "trouser_length", label: "Trouser Length" },
  ],
  "Native Wear": [
    { key: "chest", label: "Chest" },
    { key: "waist", label: "Waist" },
    { key: "hip", label: "Hip" },
    { key: "shoulder", label: "Shoulder" },
    { key: "sleeve_length", label: "Sleeve Length" },
    { key: "dress_length", label: "Garment Length" },
    { key: "neck_size", label: "Neck Size" },
    { key: "back_width", label: "Back Width" },
  ],
  "Custom": [
    { key: "chest", label: "Chest" },
    { key: "bust", label: "Bust" },
    { key: "waist", label: "Waist" },
    { key: "hip", label: "Hip" },
    { key: "shoulder", label: "Shoulder" },
    { key: "sleeve_length", label: "Sleeve Length" },
    { key: "neck", label: "Neck" },
    { key: "inseam", label: "Inseam" },
    { key: "dress_length", label: "Dress Length" },
    { key: "round_sleeve", label: "Round Sleeve" },
    { key: "neck_depth", label: "Neck Depth" },
    { key: "back_width", label: "Back Width" },
    { key: "thigh", label: "Thigh" },
    { key: "knee", label: "Knee" },
    { key: "ankle", label: "Ankle" },
    { key: "trouser_length", label: "Trouser Length" },
    { key: "top_length", label: "Top Length" },
    { key: "shirt_length", label: "Shirt Length" },
    { key: "neck_size", label: "Neck Size" },
  ],
};

// All possible measurement keys for DB payload
const ALL_KEYS = [
  "chest", "bust", "waist", "hip", "shoulder", "sleeve_length", "neck", "inseam",
  "dress_length", "round_sleeve", "neck_depth", "back_width", "thigh", "knee",
  "ankle", "trouser_length", "top_length", "shirt_length", "neck_size",
];

const MeasurementForm = ({ customerId, measurement, onClose, onSaved }: Props) => {
  const { user } = useAuth();
  const [outfitType, setOutfitType] = useState<string>(measurement?.outfit_type ?? "");
  const [gender, setGender] = useState<string>(measurement?.measurement_gender ?? "");
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    ALL_KEYS.forEach((k) => { init[k] = measurement?.[k]?.toString() ?? ""; });
    return init;
  });
  const [notes, setNotes] = useState(measurement?.notes ?? "");
  const [loading, setLoading] = useState(false);

  const activeFields = useMemo(() => {
    if (!outfitType) return [];
    let fields = OUTFIT_FIELDS[outfitType] ?? OUTFIT_FIELDS["Custom"];
    // Gender-based label adjustments
    if (gender === "Male") {
      fields = fields.map((f) => f.key === "bust" ? { key: "chest", label: "Chest" } : f);
      // Deduplicate
      const seen = new Set<string>();
      fields = fields.filter((f) => { if (seen.has(f.key)) return false; seen.add(f.key); return true; });
    }
    return fields;
  }, [outfitType, gender]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outfitType) { toast.error("Please select an outfit type"); return; }
    if (!gender) { toast.error("Please select gender"); return; }
    setLoading(true);

    const payload: Record<string, any> = {
      customer_id: customerId,
      outfit_type: outfitType,
      measurement_gender: gender,
      notes: notes.trim() || null,
    };

    // Set all keys, null for unused
    for (const key of ALL_KEYS) {
      const isActive = activeFields.some((f) => f.key === key);
      if (isActive && values[key]) {
        const val = parseFloat(values[key]);
        if (isNaN(val) || val < 0) {
          const label = activeFields.find((f) => f.key === key)?.label ?? key;
          toast.error(`${label} must be a positive number`);
          setLoading(false);
          return;
        }
        payload[key] = val;
      } else {
        payload[key] = null;
      }
    }

    if (measurement) {
      const { error } = await supabase.from("measurements").update(payload).eq("id", measurement.id);
      if (error) toast.error(error.message); else toast.success("Measurement updated");
    } else {
      const { error } = await supabase.from("measurements").insert([{ ...payload, created_by: user?.id } as any]);
      if (error) toast.error(error.message); else toast.success("Measurement added");
    }
    setLoading(false);
    onSaved();
  };

  return (
    <Card className="shadow-sm border-accent/30">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-base">{measurement ? "Edit Measurement" : "New Measurement"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-5">
          {/* Step 1: Outfit Type & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Outfit Type *</Label>
              <Select value={outfitType} onValueChange={setOutfitType}>
                <SelectTrigger><SelectValue placeholder="Select outfit type" /></SelectTrigger>
                <SelectContent>
                  {OUTFIT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Gender *</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Step 2: Dynamic Fields */}
          {outfitType && gender && activeFields.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">
                Measurements for {outfitType} ({gender})
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {activeFields.map((f) => (
                  <div key={f.key} className="space-y-1">
                    <Label className="text-xs">{f.label} (cm)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={values[f.key] ?? ""}
                      onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                      placeholder="0.0"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <Label className="text-xs">Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional notes..." />
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
