import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
}

const StatCard = ({ title, value, icon: Icon, description }: StatCardProps) => (
  <Card className="shadow-sm hover:shadow-md transition-all duration-200 group border-border/60">
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{title}</p>
          <p className="text-3xl font-display font-bold mt-1.5 text-foreground">{value}</p>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/15 transition-colors">
          <Icon className="w-5 h-5 text-accent" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default StatCard;
