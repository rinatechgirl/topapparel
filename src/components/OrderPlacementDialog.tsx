import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function OrderPlacementDialog({ design }: { design: any }) {
  const [loading, setLoading] = useState(false);

  const placeOrder = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from("orders").insert({
      customer_id: user.id,
      design_id: design.id,
      organization_id: design.organization_id, // 🔥 CRITICAL
      status: "pending",
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Order placed successfully");
    }

    setLoading(false);
  };

  return (
    <button onClick={placeOrder} disabled={loading}>
      {loading ? "Placing..." : "Place Order"}
    </button>
  );
}