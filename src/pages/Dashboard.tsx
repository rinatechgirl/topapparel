import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StatCard from "@/components/StatCard";
import { Users, Palette, FolderOpen, Ruler, PlusCircle, FileText, UserPlus, ImagePlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--secondary))",
  "hsl(210, 70%, 55%)",
  "hsl(340, 65%, 50%)",
  "hsl(160, 55%, 45%)",
];

const Dashboard = () => {
  const [stats, setStats] = useState({ customers: 0, designs: 0, categories: 0, measurements: 0 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recentMeasurements, setRecentMeasurements] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [measurementsByMonth, setMeasurementsByMonth] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [designsByCategory, setDesignsByCategory] = useState<any[]>([]);

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

      // Recent measurements
      const { data: recent } = await supabase
        .from("measurements")
        .select("id, date_recorded, customer_id, customers(first_name, last_name)")
        .order("date_recorded", { ascending: false })
        .limit(5);
      setRecentMeasurements(recent ?? []);

      // Measurements by month (last 6 months)
      const { data: allMeasurements } = await supabase
        .from("measurements")
        .select("date_recorded")
        .gte("date_recorded", subMonths(new Date(), 5).toISOString())
        .order("date_recorded", { ascending: true });

      const monthMap: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(new Date(), i);
        monthMap[format(d, "MMM yyyy")] = 0;
      }
      (allMeasurements ?? []).forEach((m) => {
        const key = format(new Date(m.date_recorded), "MMM yyyy");
        if (key in monthMap) monthMap[key]++;
      });
      setMeasurementsByMonth(Object.entries(monthMap).map(([month, count]) => ({ month, count })));

      // Designs by category
      const { data: designs } = await supabase
        .from("designs")
        .select("category_id, categories(name)");
      const catMap: Record<string, number> = {};
      (designs ?? []).forEach((d) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const name = (d.categories as any)?.name ?? "Uncategorized";
        catMap[name] = (catMap[name] || 0) + 1;
      });
      setDesignsByCategory(Object.entries(catMap).map(([name, value]) => ({ name, value })));
    };
    load();
  }, []);

  const measurementsChartConfig = {
    count: { label: "Measurements", color: "hsl(var(--primary))" },
  };

  const designsChartConfig = designsByCategory.reduce((acc, item, i) => {
    acc[item.name] = { label: item.name, color: CHART_COLORS[i % CHART_COLORS.length] };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

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

      {/* Quick Actions */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button asChild className="gap-2">
            <Link to="/customers"><UserPlus className="w-4 h-4" /> Add Customer</Link>
          </Button>
          <Button asChild variant="secondary" className="gap-2">
            <Link to="/measurements"><FileText className="w-4 h-4" /> Add Measurement</Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/designs"><ImagePlus className="w-4 h-4" /> Add Design</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Measurements Over Time */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-lg">Measurements Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {measurementsByMonth.length === 0 ? (
              <p className="text-muted-foreground text-sm">No data yet.</p>
            ) : (
              <ChartContainer config={measurementsChartConfig} className="h-[250px] w-full">
                <BarChart data={measurementsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Designs by Category */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-lg">Designs by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {designsByCategory.length === 0 ? (
              <p className="text-muted-foreground text-sm">No designs yet.</p>
            ) : (
              <ChartContainer config={designsChartConfig} className="h-[250px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                  <Pie
                    data={designsByCategory}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, value }) => `${name} (${value})`}
                    labelLine={false}
                  >
                    {designsByCategory.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Measurements */}
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
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
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
