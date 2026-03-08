import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, User } from "lucide-react";
import { Link } from "react-router-dom";

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  gender: string | null;
  created_at: string;
}

const emptyForm = { first_name: "", last_name: "", phone: "", email: "", address: "", gender: "" };

const Customers = () => {
  const { isAdmin, user, tenantId } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const fetchCustomers = async () => {
    let query = supabase.from("customers").select("*").order("created_at", { ascending: false });
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    const { data } = await query;
    setCustomers(data ?? []);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchCustomers(); }, [search]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
      gender: form.gender || null,
      tenant_id: tenantId,
    };

    if (editingId) {
      const { error } = await supabase.from("customers").update(payload as any).eq("id", editingId);
      if (error) toast.error(error.message); else toast.success("Customer updated");
    } else {
      const { error } = await supabase.from("customers").insert({ ...payload, created_by: user?.id } as any);
      if (error) toast.error(error.message); else toast.success("Customer added");
    }
    setLoading(false);
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    fetchCustomers();
  };

  const handleEdit = (c: Customer) => {
    setForm({ first_name: c.first_name, last_name: c.last_name, phone: c.phone ?? "", email: c.email ?? "", address: c.address ?? "", gender: c.gender ?? "" });
    setEditingId(c.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this customer and all their measurements?")) return;
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Customer deleted"); fetchCustomers(); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your client records</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditingId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Customer</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">{editingId ? "Edit Customer" : "New Customer"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Saving..." : "Save Customer"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {customers.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No customers found.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {customers.map((c) => (
            <Card key={c.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <Link to={`/customers/${c.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{c.first_name} {c.last_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.email || c.phone || "No contact info"}</p>
                  </div>
                </Link>
                <div className="flex items-center gap-1 ml-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Pencil className="w-4 h-4" /></Button>
                  {isAdmin && <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Customers;
