import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface CustomerRecord {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
}

function splitFullName(fullName?: string | null, fallbackEmail?: string | null) {
  const normalizedName = fullName?.trim();

  if (normalizedName) {
    const parts = normalizedName.split(/\s+/).filter(Boolean);
    return {
      firstName: parts[0] ?? "Customer",
      lastName: parts.slice(1).join(" ") || "Customer",
      fullName: normalizedName,
    };
  }

  const emailPrefix = fallbackEmail?.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  const fallbackName = emailPrefix || "Customer";
  const parts = fallbackName.split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] ?? "Customer",
    lastName: parts.slice(1).join(" ") || "Customer",
    fullName: fallbackName,
  };
}

export async function ensureCustomerProfile({
  user,
  tenantId,
  fullName,
}: {
  user: User;
  tenantId: string;
  fullName?: string | null;
}) {
  const resolvedName =
    fullName?.trim() ||
    (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) ||
    null;

  const { fullName: safeName } = splitFullName(resolvedName, user.email ?? null);

  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      tenant_id: tenantId,
      email: user.email ?? "",
      full_name: safeName,
    } as never,
    { onConflict: "user_id" }
  );

  if (error) throw error;
}

export async function getOrCreateCustomerRecord({
  user,
  tenantId,
  fullName,
}: {
  user: User;
  tenantId: string;
  fullName?: string | null;
}) {
  const email = user.email?.trim().toLowerCase();

  if (!email) {
    throw new Error("Your account needs a valid email address before placing an order.");
  }

  const { data: existing, error: existingError } = await supabase
    .from("customers")
    .select("id, first_name, last_name, email")
    .eq("tenant_id", tenantId)
    .eq("email", email)
    .order("created_at", { ascending: true })
    .limit(1);

  if (existingError) throw existingError;

  const existingCustomer = existing?.[0] as CustomerRecord | undefined;
  if (existingCustomer) return existingCustomer;

  const { firstName, lastName } = splitFullName(fullName, email);

  const { data: created, error: createError } = await supabase
    .from("customers")
    .insert({
      first_name: firstName,
      last_name: lastName,
      email,
      tenant_id: tenantId,
      created_by: user.id,
    } as never)
    .select("id, first_name, last_name, email")
    .single();

  if (createError) throw createError;

  return created as CustomerRecord;
}
