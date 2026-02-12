import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StatCard from "@/components/StatCard";
import { Users, Palette, FolderOpen, Ruler } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

const Dashboard = () => {
  const [stats, setStats] = useState({ customers: 0, designs: 0, categories: 0, measurements: 0 });
  const [recentMeasurements, setRecentMeasurements] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const [c, d, cat, m] = await Promise.all([
        supabase.from("customers").select("id", { count: "exact", head: true }),
        supabase.from("designs").select("id", { count: "exact", head: true }),
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase.from("measurements").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        customers: c.count ?? 0,
        designs: d.count ?? 0,
        categories: cat.count ?? 0,
        measurements: m.count ?? 0,
      });

      const { data } = await supabase
        .from("measurements")
        .select("id, date_recorded, customer_id, customers(first_name, last_name)")
        .order("date_recorded", { ascending: false })
        .limit(5);
      setRecentMeasurements(data ?? []);
    };
    load();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of your fashion business</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Customers" value={stats.customers} icon={Users} />
        <StatCard title="Designs" value={stats.designs} icon={Palette} />
        <StatCard title="Categories" value={stats.categories} icon={FolderOpen} />
        <StatCard title="Measurements" value={stats.measurements} icon={Ruler} />
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-display text-lg">Recent Measurements</CardTitle>
        </CardHeader>
        <CardContent>
          {recentMeasurements.length === 0 ? (
            <p className="text-muted-foreground text-sm">No measurements recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {recentMeasurements.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm font-medium text-foreground">
                    {(m.customers as any)?.first_name} {(m.customers as any)?.last_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(m.date_recorded), "MMM d, yyyy")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
