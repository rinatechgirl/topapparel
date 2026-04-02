import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Designs() {
  const [designs, setDesigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDesigns = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // get designer organization
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (!profile?.organization_id) return;

      const { data } = await supabase
        .from("designs")
        .select("*")
        .eq("organization_id", profile.organization_id) // 🔥 TENANT ISOLATION
        .order("created_at", { ascending: false });

      setDesigns(data || []);
      setLoading(false);
    };

    fetchDesigns();
  }, []);

  if (loading) return <p>Loading designs...</p>;

  return (
    <div>
      <h1>My Designs</h1>

      {designs.length === 0 && <p>No designs yet.</p>}

      {designs.map((design) => (
        <div key={design.id}>
          <h3>{design.title}</h3>
          <p>{design.description}</p>
          <p>
            Status:{" "}
            {design.is_public ? "Public (Magazine)" : "Private (Catalogue)"}
          </p>
        </div>
      ))}
    </div>
  );
}