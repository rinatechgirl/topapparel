import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";

const Designs = () => {
  const { tenantId } = useAuth();
  const [designs, setDesigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;

    const loadDesigns = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("designs")
        .select("*")
        .eq("tenant_id", tenantId) // 🔐 TENANT ISOLATION
        .order("created_at", { ascending: false });

      if (!error) setDesigns(data || []);
      setLoading(false);
    };

    loadDesigns();
  }, [tenantId]);

  if (loading) return <div className="p-6">Loading designs…</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
      {designs.map((design) => (
        <Card key={design.id} className="p-4">
          <img
            src={design.image_url}
            alt={design.title}
            className="rounded-md mb-3"
          />
          <h3 className="font-semibold">{design.title}</h3>
        </Card>
      ))}
    </div>
  );
};

export default Designs;