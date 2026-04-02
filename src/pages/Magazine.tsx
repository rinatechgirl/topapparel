import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

const Magazine = () => {
  const [designs, setDesigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPublicDesigns = async () => {
      const { data } = await supabase
        .from("designs")
        .select("id, title, image_url")
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      setDesigns(data || []);
      setLoading(false);
    };

    loadPublicDesigns();
  }, []);

  if (loading) return <div className="p-6">Loading catalogue…</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
      {designs.map((design) => (
        <Card key={design.id} className="p-3">
          <img
            src={design.image_url}
            alt={design.title}
            className="rounded mb-2"
          />
          <p className="text-sm font-medium">{design.title}</p>
        </Card>
      ))}
    </div>
  );
};

export default Magazine;