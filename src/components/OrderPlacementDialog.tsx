const payload = {
  tenant_id: effectiveTenantId, // 🔐 REQUIRED
  customer_id: selectedCustomer,
  design_id: designId,
  measurement_id: selectedMeasurement || null,
  notes: notes || null,
  status: "pending_price_confirmation",
  created_by: user?.id,
};

const { error } = await supabase.from("orders").insert(payload);

if (error) {
  toast.error(error.message);
  return;
}

toast.success("Order placed successfully");
onOpenChange(false);