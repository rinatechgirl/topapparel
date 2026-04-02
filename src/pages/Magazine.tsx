import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";

export default function Magazine() {
  const [designs, setDesigns] = useState<any[]>([]);

  useEffect(() => {
    const fetchPublicDesigns = async () => {
      const { data } = await supabase
        .from("designs")
        .select(`
          id,
          title,
          description,
          image_url,
          organization:organizations(name)
        `)
        .eq("is_public", true) // 🔥 ONLY PUBLIC
        .order("created_at", { ascending: false });

      setDesigns(data || []);
    };

    fetchPublicDesigns();
  }, []);

  return (
    <div>
      <h1>Fashion Magazine</h1>

      {designs.map((design) => (
        <div key={design.id}>
          <img src={design.image_url} alt="" width={200} />
          <h3>{design.title}</h3>
          <p>{design.description}</p>
          <p>Designer: {design.organization?.name}</p>

          <Link to={`/customer/order/${design.id}`}>
            Place Order
          </Link>
        </div>
      ))}
    </div>
  );
}
