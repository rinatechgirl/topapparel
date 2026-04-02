import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Params {
  user: User;
  tenantId: string;
  fullName?: string;
}

export async function getOrCreateCustomerRecord({ user, tenantId, fullName }: Params) {
  // Check if customer record already exists for this user + tenant
  const { data: existing } = await supabase
    .from("customers")
    .select("id, first_name, last_name")
    .eq("created_by", user.id)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (existing) return existing;

  // Create one if not found
  const nameParts = (fullName ?? user.email ?? "Customer").split(" ");
  const first_name = nameParts[0] ?? "Customer";
  const last_name = nameParts.slice(1).join(" ") || "";

  const { data: created, error } = await supabase
    .from("customers")
    .insert({
      first_name,
      last_name,
      email: user.email,
      created_by: user.id,
      tenant_id: tenantId,
    })
    .select("id, first_name, last_name")
    .single();

  if (error) throw new Error("We couldn't prepare your customer profile. Please try again.");
  return created;
}
