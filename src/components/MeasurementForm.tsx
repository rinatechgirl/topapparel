import { useState } from "react";
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

const OUTFIT_TYPES = [
  "Short Gown", "Long Gown", "Top / Blouse", "Trousers", "Skirt",
  "Shirt", "Suit", "Native Wear", "Two-Piece Set", "Custom"
];
const GENDERS = ["Male", "Female", "Unisex"];
const UNITS = ["cm", "inches"];

const OUTFIT_SCHEMAS: Record<string, { key: string, label: string }[]> = {
  "Short Gown": [
    { key: "bust", label: "Bust" }, { key: "waist", label: "Waist" }, { key: "hip", label: "Hip" },
    { key: "shoulder", label: "Shoulder" }, { key: "sleeve_length", label: "Sleeve Length" },
    { key: "gown_length_short", label: "Gown Length (Short)" }, { key: "armhole", label: "Armhole" },
    { key: "neck_circumference", label: "Neck Circumference" }
  ],
  "Long Gown": [
    { key: "bust", label: "Bust" }, { key: "waist", label: "Waist" }, { key: "hip", label: "Hip" },
    { key: "shoulder", label: "Shoulder" }, { key: "sleeve_length", label: "Sleeve Length" },
    { key: "full_length", label: "Full Length" }, { key: "armhole", label: "Armhole" },
    { key: "neck_depth", label: "Neck Depth" }
  ],
  "Top / Blouse": [
    { key: "bust", label: "Bust" }, { key: "waist", label: "Waist" }, { key: "shoulder", label: "Shoulder" },
    { key: "sleeve_length", label: "Sleeve Length" }, { key: "top_length", label: "Top Length" },
    { key: "armhole", label: "Armhole" }
  ],
  "Trousers": [
    { key: "waist", label: "Waist" }, { key: "hip", label: "Hip" }, { key: "thigh", label: "Thigh" },
    { key: "knee", label: "Knee" }, { key: "ankle", label: "Ankle" }, { key: "trouser_length", label: "Trouser Length" },
    { key: "crotch_depth", label: "Crotch Depth" }
  ],
  "Skirt": [
    { key: "waist", label: "Waist" }, { key: "hip", label: "Hip" }, { key: "skirt_length", label: "Skirt Length" }
  ],
  "Shirt": [
    { key: "chest", label: "Chest" }, { key: "shoulder", label: "Shoulder" }, { key: "sleeve_length", label: "Sleeve Length" },
    { key: "shirt_length", label: "Shirt Length" }, { key: "neck", label: "Neck" }, { key: "armhole", label: "Armhole" }
  ],
  "Suit": [
    { key: "chest", label: "Chest" }, { key: "waist", label: "Waist" }, { key: "hip", label: "Hip" },
    { key: "shoulder", label: "Shoulder" }, { key: "sleeve_length", label: "Sleeve Length" }, { key: "suit_length", label: "Suit Length" }
  ],
  "Native Wear": [
    { key: "chest", label: "Chest / Bust" }, { key: "waist", label: "Waist" }, { key: "hip", label: "Hip" },
    { key: "shoulder", label: "Shoulder" }, { key: "sleeve_length", label: "Sleeve Length" },
    { key: "top_length", label: "Top Length" }, { key: "trouser_length", label: "Trouser Length" }
  ],
  "Two-Piece Set": [
    { key: "bust", label: "Bust / Chest" }, { key: "waist", label: "Waist" }, { key: "hip", label: "Hip" },
    { key: "shoulder", label: "Shoulder" }, { key: "sleeve_length", label: "Sleeve Length" },
    { key: "top_length", label: "Top Length" }, { key: "trouser_length", label: "Trouser/Skirt Length" }
  ],
  "Custom": [
    { key: "chest", label: "Chest / Bust" }, { key: "waist", label: "Waist" }, { key: "hip", label: "Hip" },
    { key: "shoulder", label: "Shoulder" }, { key: "sleeve_length", label: "Sleeve Length" },
    { key: "length", label: "Overall Length" }, { key: "neck", label: "Neck" }, { key: "inseam", label: "Inseam" }
  ]
};

const MeasurementForm = ({ customerId, measurement, onClose, onSaved }: Props) => {
  const { user } = useAuth();

  const [outfitType, setOutfitType] = useState<string>(measurement?.outfit_type || "Shirt");
  const [gender, setGender] = useState<string>(measurement?.gender || "Unisex");
  const [unit, setUnit] = useState<string>(measurement?.unit || "cm");
  const [notes, setNotes] = useState<string>(measurement?.notes || "");

  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (measurement?.measurement_data) {
      Object.entries(measurement.measurement_data).forEach(([k, v]) => {
        initial[k] = String(v);
      });
    } else if (measurement) {
      const currentFields = OUTFIT_SCHEMAS[measurement.outfit_type || "Custom"] || OUTFIT_SCHEMAS["Custom"];
      currentFields.forEach(f => {
        if (measurement[f.key]) initial[f.key] = String(measurement[f.key]);
      });
    }
    return initial;
  });

  const [loading, setLoading] = useState(false);

  const currentFields = OUTFIT_SCHEMAS[outfitType] || OUTFIT_SCHEMAS["Custom"];

  const handleFieldChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gender || !outfitType) {
      toast.error("Please fill gender and outfit type"); return;
    }

    setLoading(true);

    const measurement_data: Record<string, number> = {};
    for (const f of currentFields) {
      const rawVal = formData[f.key];
      if (rawVal) {
        const val = parseFloat(rawVal);
        if (isNaN(val) || val < 0) {
          toast.error(`${f.label} must be a positive number`);
          setLoading(false);
          return;
        }
        measurement_data[f.key] = val;
      }
    }

    const payload = {
      customer_id: customerId,
      outfit_type: outfitType,
      gender,
      unit,
      measurement_data: measurement_data as Json,
      notes: notes || null
    };

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
      <CardHeader className="pb-3 border-b">
        <CardTitle className="font-display text-lg">{measurement ? "Edit Measurement" : "New Measurement"}</CardTitle>
      </CardHeader>
      <CardContent className="pt-5">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Gender *</Label>
              <Select value={gender} onValueChange={(val) => setGender(val)}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  {GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Outfit Type *</Label>
              <Select value={outfitType} onValueChange={(val) => setOutfitType(val)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {OUTFIT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Measurement Unit</Label>
              <Select value={unit} onValueChange={(val) => setUnit(val)}>
                <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                <SelectContent>
                  {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="py-4 border-t border-border">
            <Label className="text-base font-semibold text-foreground mb-4 block">Dimensions ({unit})</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {currentFields.map((f) => {
                let displayLabel = f.label;
                if (f.key === "chest" || f.key === "bust") {
                  displayLabel = gender === "Female" ? "Bust" : gender === "Male" ? "Chest" : f.label;
                }
                return (
                  <div key={f.key} className="space-y-2">
                    <Label className="text-sm text-muted-foreground">{displayLabel}</Label>
                    <Input type="number" step="0.1" min="0" value={formData[f.key] || ""} onChange={(e) => handleFieldChange(f.key, e.target.value)} />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-border">
            <Label className="text-sm font-medium">Additional Notes</Label>
            <Textarea placeholder="Any specific adjustments, preferences, or observations..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Measurement"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default MeasurementForm;
