import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Image as ImageIcon } from "lucide-react";

interface Design { id: string; title: string; description: string | null; category_id: string | null; image_url: string | null; created_at: string; }
interface Category { id: string; name: string; }

const Designs = () => {
  const { isAdmin } = useAuth();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", category_id: "", });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDesigns = async () => {
    let query = supabase.from("designs").select("*").order("created_at", { ascending: false });
    if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    if (filterCategory && filterCategory !== "all") query = query.eq("category_id", filterCategory);
    const { data } = await query;
    setDesigns(data ?? []);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("id, name").order("name");
    setCategories(data ?? []);
  };

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { fetchDesigns(); }, [search, filterCategory]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let imageUrl = editingId ? designs.find(d => d.id === editingId)?.image_url ?? null : null;

    if (file) {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("design-images").upload(path, file);
      if (uploadError) { toast.error("Upload failed: " + uploadError.message); setLoading(false); return; }
      const { data: urlData } = supabase.storage.from("design-images").getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      category_id: form.category_id || null,
      image_url: imageUrl,
    };

    if (editingId) {
      const { error } = await supabase.from("designs").update(payload).eq("id", editingId);
      if (error) toast.error(error.message); else toast.success("Design updated");
    } else {
      const { error } = await supabase.from("designs").insert(payload);
      if (error) toast.error(error.message); else toast.success("Design added");
    }
    setLoading(false);
    setDialogOpen(false);
    resetForm();
    fetchDesigns();
  };

  const resetForm = () => { setEditingId(null); setForm({ title: "", description: "", category_id: "" }); setFile(null); };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this design?")) return;
    const { error } = await supabase.from("designs").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); fetchDesigns(); }
  };

  const getCategoryName = (id: string | null) => categories.find(c => c.id === id)?.name ?? "Uncategorized";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Designs</h1>
          <p className="text-muted-foreground text-sm mt-1">Browse and manage your catalogue</p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Add Design</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle className="font-display">{editingId ? "Edit Design" : "New Design"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Image</Label>
                  <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search designs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {designs.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No designs found.</CardContent></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {designs.map((d) => (
            <Card key={d.id} className="shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
              <div className="aspect-[4/5] bg-secondary relative">
                {d.image_url ? (
                  <img src={d.image_url} alt={d.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-12 h-12 text-muted-foreground/30" /></div>
                )}
                {isAdmin && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => { setForm({ title: d.title, description: d.description ?? "", category_id: d.category_id ?? "" }); setEditingId(d.id); setDialogOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => handleDelete(d.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <p className="font-medium text-foreground text-sm">{d.title}</p>
                <p className="text-xs text-accent mt-1">{getCategoryName(d.category_id)}</p>
                {d.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{d.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Designs;
