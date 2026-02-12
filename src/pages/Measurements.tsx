import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Ruler } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

const Measurements = () => {
  const { isAdmin } = useAuth();
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("all");

  useEffect(() => {
    supabase.from("customers").select("id, first_name, last_name").order("first_name").then(({ data }) => setCustomers(data ?? []));
  }, []);

  useEffect(() => {
    const load = async () => {
      let query = supabase.from("measurements").select("*, customers(first_name, last_name)").order("date_recorded", { ascending: false });
      if (filterCustomer && filterCustomer !== "all") query = query.eq("customer_id", filterCustomer);
      const { data } = await query;
      let results = data ?? [];
      if (search) {
        const s = search.toLowerCase();
        results = results.filter((m) => {
          const name = `${(m.customers as any)?.first_name ?? ""} ${(m.customers as any)?.last_name ?? ""}`.toLowerCase();
          return name.includes(s);
        });
      }
      setMeasurements(results);
    };
    load();
  }, [search, filterCustomer]);

  const fields = ["chest", "waist", "hip", "shoulder", "sleeve_length", "neck", "inseam"] as const;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Measurements</h1>
        <p className="text-muted-foreground text-sm mt-1">All recorded body measurements</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by customer..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCustomer} onValueChange={setFilterCustomer}>
          <SelectTrigger className="w-56"><SelectValue placeholder="All customers" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Customers</SelectItem>
            {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {measurements.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No measurements found.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {measurements.map((m) => (
            <Card key={m.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Link to={`/customers/${m.customer_id}`} className="flex items-center gap-2 hover:text-accent transition-colors">
                    <Ruler className="w-4 h-4 text-accent" />
                    <span className="font-medium text-sm">{(m.customers as any)?.first_name} {(m.customers as any)?.last_name}</span>
                  </Link>
                  <span className="text-xs text-muted-foreground">{format(new Date(m.date_recorded), "MMM d, yyyy")}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
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

export default Measurements;
