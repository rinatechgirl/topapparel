import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, Mail, MapPin } from "lucide-react";
import { format } from "date-fns";
import MeasurementForm from "@/components/MeasurementForm";

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [customer, setCustomer] = useState<any>(null);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState<any>(null);

  const load = async () => {
    const { data: c } = await supabase.from("customers").select("*").eq("id", id).single();
    setCustomer(c);
    const { data: m } = await supabase.from("measurements").select("*").eq("customer_id", id).order("date_recorded", { ascending: false });
    setMeasurements(m ?? []);
  };

  useEffect(() => { if (id) load(); }, [id]);

  if (!customer) return <div className="p-6 text-muted-foreground">Loading...</div>;

  const fields = ["chest", "waist", "hip", "shoulder", "sleeve_length", "neck", "inseam"] as const;

  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" onClick={() => navigate("/customers")} className="gap-2">
        <ArrowLeft className="w-4 h-4" />Back to Customers
      </Button>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-display text-xl">{customer.first_name} {customer.last_name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {customer.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4" />{customer.phone}</div>}
          {customer.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-4 h-4" />{customer.email}</div>}
          {customer.address && <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-4 h-4" />{customer.address}</div>}
          {customer.gender && <p className="text-muted-foreground capitalize">Gender: {customer.gender}</p>}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-semibold text-foreground">Measurements</h2>
        <Button onClick={() => { setEditingMeasurement(null); setShowForm(true); }} size="sm">Add Measurement</Button>
      </div>

      {showForm && (
        <MeasurementForm
          customerId={id!}
          measurement={editingMeasurement}
          onClose={() => { setShowForm(false); setEditingMeasurement(null); }}
          onSaved={() => { setShowForm(false); setEditingMeasurement(null); load(); }}
        />
      )}

      {measurements.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No measurements recorded.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {measurements.map((m) => (
            <Card key={m.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground">{format(new Date(m.date_recorded), "MMM d, yyyy")}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setEditingMeasurement(m); setShowForm(true); }}>Edit</Button>
                    {isAdmin && (
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={async () => {
                        await supabase.from("measurements").delete().eq("id", m.id);
                        load();
                      }}>Delete</Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {fields.map((f) => m[f] != null && (
                    <div key={f}>
                      <p className="text-xs text-muted-foreground capitalize">{f.replace("_", " ")}</p>
                      <p className="text-sm font-medium text-foreground">{m[f]} cm</p>
                    </div>
                  ))}
                </div>
                {m.notes && <p className="text-xs text-muted-foreground mt-3 italic">{m.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerDetail;
