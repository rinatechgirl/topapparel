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

const OUTFIT_SCHEMAS: Record<string, { key: string, label: string }[]> = {
  "Short Gown": [
    { key: "bust", label: "Bust" }, { key: "waist", label: "Waist" }, { key: "hip", label: "Hip" },
    { key: "shoulder", label: "Shoulder" }, { key: "sleeve_length", label: "Sleeve Length" },
    { key: "dress_length", label: "Gown Length" }, { key: "round_sleeve", label: "Round Sleeve" },
    { key: "neck_depth", label: "Neck Depth" }, { key: "back_width", label: "Back Width" }
  ],
  "Long Gown": [
    { key: "bust", label: "Bust" }, { key: "waist", label: "Waist" }, { key: "hip", label: "Hip" },
    { key: "shoulder", label: "Shoulder" }, { key: "sleeve_length", label: "Sleeve Length" },
    { key: "dress_length", label: "Full Length" }, { key: "round_sleeve", label: "Round Sleeve" },
    { key: "neck_depth", label: "Neck Depth" }, { key: "back_width", label: "Back Width" }
  ],
  "Top / Blouse": [
    { key: "bust", label: "Bust" }, { key: "waist", label: "Waist" }, { key: "shoulder", label: "Shoulder" },
    { key: "sleeve_length", label: "Sleeve Length" }, { key: "top_length", label: "Top Length" }
  ],
  "Trousers": [
    { key: "waist", label: "Waist" }, { key: "hip", label: "Hip" }, { key: "thigh", label: "Thigh" },
    { key: "knee", label: "Knee" }, { key: "ankle", label: "Ankle" }, { key: "trouser_length", label: "Trouser Length" }
  ],
  "Skirt": [
    { key: "waist", label: "Waist" }, { key: "hip", label: "Hip" }, { key: "dress_length", label: "Skirt Length" }
  ],
  "Shirt": [
    { key: "chest", label: "Chest" }, { key: "shoulder", label: "Shoulder" }, { key: "sleeve_length", label: "Sleeve Length" },
    { key: "shirt_length", label: "Shirt Length" }, { key: "neck_size", label: "Neck Size" }
  ],
  "Suit": [
    { key: "chest", label: "Chest" }, { key: "waist", label: "Waist" }, { key: "hip", label: "Hip" },
    { key: "shoulder", label: "Shoulder" }, { key: "sleeve_length", label: "Sleeve Length" },
    { key: "shirt_length", label: "Suit Length" }
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
    { key: "dress_length", label: "Overall Length" }, { key: "neck", label: "Neck" }, { key: "inseam", label: "Inseam" }
  ]
};

const MeasurementForm = ({ customerId, measurement, onClose, onSaved }: Props) => {
  const { user, tenantId } = useAuth();

  const [outfitType, setOutfitType] = useState<string>(measurement?.outfit_type || "Shirt");
  const [gender, setGender] = useState<string>(measurement?.measurement_gender || measurement?.gender || "Unisex");
  const [notes, setNotes] = useState<string>(measurement?.notes || "");

  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (measurement) {
      const currentFields = OUTFIT_SCHEMAS[measurement.outfit_type || "Custom"] || OUTFIT_SCHEMAS["Custom"];
      currentFields.forEach(f => {
        if (measurement[f.key] != null) initial[f.key] = String(measurement[f.key]);
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

    const numericData: Record<string, number | null> = {};
    for (const f of currentFields) {
      const rawVal = formData[f.key];
      if (rawVal) {
        const val = parseFloat(rawVal);
        if (isNaN(val) || val < 0) {
          toast.error(`${f.label} must be a positive number`);
          setLoading(false);
          return;
        }
        numericData[f.key] = val;
      }
    }

    const payload: any = {
      customer_id: customerId,
      outfit_type: outfitType,
      measurement_gender: gender,
      notes: notes || null,
      tenant_id: tenantId,
      ...numericData,
    };

    if (measurement) {
      const { error } = await supabase.from("measurements").update(payload).eq("id", measurement.id);
      if (error) toast.error(error.message); else toast.success("Measurement updated");
    } else {
      const { error } = await supabase.from("measurements").insert([{ ...payload, created_by: user?.id }] as any);
      if (error) toast.error(error.message); else toast.success("Measurement added");
    }
    setLoading(false);
    onSaved();
  };

  return (
    <Card className="shadow-sm border-accent/20 max-h-[90vh] overflow-y-auto w-full">
      <CardHeader className="pb-3 border-b border-border/60">
        <CardTitle className="font-display text-lg">{measurement ? "Edit Measurement" : "Enter Measurements"}</CardTitle>
      </CardHeader>
      <CardContent className="pt-5">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Gender *</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  {GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Outfit Type *</Label>
              <Select value={outfitType} onValueChange={setOutfitType}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {OUTFIT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="py-4 border-t border-border/60">
            <Label className="text-sm font-display font-semibold text-foreground mb-4 block">Dimensions</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {currentFields.map((f) => {
                let displayLabel = f.label;
                if (f.key === "chest" || f.key === "bust") {
                  displayLabel = gender === "Female" ? "Bust" : gender === "Male" ? "Chest" : f.label;
                }
                return (
                  <div key={f.key} className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-medium">{displayLabel}</Label>
                    <Input type="number" step="0.1" min="0" value={formData[f.key] || ""} onChange={(e) => handleFieldChange(f.key, e.target.value)} className="h-11" />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-border/60">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Additional Notes</Label>
            <Textarea placeholder="Any specific adjustments, preferences, or observations..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="h-11 px-6">Cancel</Button>
            <Button type="submit" disabled={loading} className="h-11 px-8">{loading ? "Saving..." : "Save Measurements"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default MeasurementForm;
