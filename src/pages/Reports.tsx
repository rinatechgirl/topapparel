import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StatCard from "@/components/StatCard";
import { Users, Palette, FolderOpen, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Reports = () => {
  const [stats, setStats] = useState({ customers: 0, designs: 0, categories: 0, measurements: 0 });

  useEffect(() => {
    const load = async () => {
      const [c, d, cat, m] = await Promise.all([
        supabase.from("customers").select("id", { count: "exact", head: true }),
        supabase.from("designs").select("id", { count: "exact", head: true }),
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase.from("measurements").select("id", { count: "exact", head: true }),
      ]);
      setStats({ customers: c.count ?? 0, designs: d.count ?? 0, categories: cat.count ?? 0, measurements: m.count ?? 0 });
    };
    load();
  }, []);

  const exportCSV = async (table: string) => {
    const { data } = await supabase.from(table as any).select("*");
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((r) => Object.values(r).map((v) => `"${v ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([headers + "\n" + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${table}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">Business overview and data export</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Customers" value={stats.customers} icon={Users} />
        <StatCard title="Total Designs" value={stats.designs} icon={Palette} />
        <StatCard title="Total Categories" value={stats.categories} icon={FolderOpen} />
        <StatCard title="Total Measurements" value={stats.measurements} icon={Ruler} />
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-display text-lg">Export Data</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => exportCSV("customers")}>Export Customers</Button>
          <Button variant="outline" onClick={() => exportCSV("measurements")}>Export Measurements</Button>
          <Button variant="outline" onClick={() => exportCSV("designs")}>Export Designs</Button>
          <Button variant="outline" onClick={() => exportCSV("categories")}>Export Categories</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
