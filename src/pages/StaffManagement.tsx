import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  UserPlus,
  Loader2,
  Trash2,
  Mail,
  ShieldCheck,
  User,
  Clock,
  RefreshCw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StaffMember {
  user_id: string;
  role: "admin" | "staff";
  profile: {
    full_name: string;
    email: string;
  } | null;
}

interface Invitation {
  id: string;
  email: string;
  role: "admin" | "staff";
  status: string;
  created_at: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const StaffManagement = () => {
  const { tenantId, user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "staff">("staff");
  const [inviteLoading, setInviteLoading] = useState(false);

  const [removeTarget, setRemoveTarget] = useState<StaffMember | null>(null);

  // ── Fetch current staff ────────────────────────────────────────────────────
  const { data: staff = [], isLoading: staffLoading } = useQuery({
    queryKey: ["staff", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role, profiles(full_name, email)")
        .eq("tenant_id", tenantId!);

      if (error) throw error;

      return (data ?? []).map((row: any) => ({
        user_id: row.user_id,
        role: row.role,
        profile: row.profiles ?? null,
      })) as StaffMember[];
    },
  });

  // ── Fetch pending invitations ──────────────────────────────────────────────
  const { data: invitations = [], isLoading: invLoading } = useQuery({
    queryKey: ["invitations", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invitations")
        .select("id, email, role, status, created_at")
        .eq("tenant_id", tenantId!)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as Invitation[];
    },
  });

  // ── Send invitation ────────────────────────────────────────────────────────
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !user) return;

    const email = inviteEmail.trim().toLowerCase();

    // Check if already a member
    const alreadyMember = staff.some((s) => s.profile?.email === email);
    if (alreadyMember) {
      toast.error("This person is already a member of your team.");
      return;
    }

    // Check for existing pending invite
    const alreadyInvited = invitations.some((i) => i.email === email);
    if (alreadyInvited) {
      toast.error("An invitation has already been sent to this email.");
      return;
    }

    setInviteLoading(true);

    const { error } = await supabase.from("invitations").insert({
      email,
      role: inviteRole,
      tenant_id: tenantId,
      invited_by: user.id,
      status: "pending",
    });

    setInviteLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Invitation sent to ${email}.`);
      setInviteEmail("");
      setInviteRole("staff");
      setInviteOpen(false);
      queryClient.invalidateQueries({ queryKey: ["invitations", tenantId] });
    }
  };

  // ── Change role ────────────────────────────────────────────────────────────
  const handleRoleChange = useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: "admin" | "staff";
    }) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ role })
        .eq("user_id", userId)
        .eq("tenant_id", tenantId!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role updated.");
      queryClient.invalidateQueries({ queryKey: ["staff", tenantId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ── Remove staff member ────────────────────────────────────────────────────
  const handleRemove = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("tenant_id", tenantId!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Staff member removed.");
      setRemoveTarget(null);
      queryClient.invalidateQueries({ queryKey: ["staff", tenantId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ── Revoke invitation ──────────────────────────────────────────────────────
  const handleRevoke = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("invitations")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Invitation revoked.");
      queryClient.invalidateQueries({ queryKey: ["invitations", tenantId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ─── Render ────────────────────────────────────────────────────────────────

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        You don't have permission to manage staff.
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Staff management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Invite team members and manage their roles.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Invite staff
        </Button>
      </div>

      {/* ── Current team ──────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">
            Team members
            <span className="ml-2 text-muted-foreground font-normal">({staff.length})</span>
          </h2>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["staff", tenantId] })}
            className="text-muted-foreground hover:text-foreground"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {staffLoading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : staff.length === 0 ? (
          <div className="rounded-xl border border-border bg-muted/30 p-8 text-center">
            <User className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No team members yet.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
            {staff.map((member) => {
              const isSelf = member.user_id === user?.id;
              return (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {member.profile?.full_name || "Unknown"}
                        {isSelf && (
                          <span className="ml-2 text-xs text-muted-foreground font-normal">
                            (you)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.profile?.email || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Role selector — disabled for self to prevent locking out */}
                    <Select
                      value={member.role}
                      onValueChange={(val) =>
                        handleRoleChange.mutate({
                          userId: member.user_id,
                          role: val as "admin" | "staff",
                        })
                      }
                      disabled={isSelf}
                    >
                      <SelectTrigger className="h-7 text-xs w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3 h-3" /> Admin
                          </span>
                        </SelectItem>
                        <SelectItem value="staff">
                          <span className="flex items-center gap-1.5">
                            <User className="w-3 h-3" /> Staff
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {!isSelf && (
                      <button
                        onClick={() => setRemoveTarget(member)}
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Pending invitations ───────────────────────────────────────────── */}
      {(invitations.length > 0 || invLoading) && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">
            Pending invitations
            <span className="ml-2 text-muted-foreground font-normal">({invitations.length})</span>
          </h2>

          {invLoading ? (
            <div className="flex items-center justify-center h-16">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between px-4 py-3 bg-card"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{inv.email}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-xs h-4 px-1.5">
                          {inv.role}
                        </Badge>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {new Date(inv.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevoke.mutate(inv.id)}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Invite dialog ─────────────────────────────────────────────────── */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite a team member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select
                value={inviteRole}
                onValueChange={(val) => setInviteRole(val as "admin" | "staff")}
              >
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">
                    <div>
                      <p className="font-medium">Staff</p>
                      <p className="text-xs text-muted-foreground">
                        Can manage customers, measurements and designs
                      </p>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div>
                      <p className="font-medium">Admin</p>
                      <p className="text-xs text-muted-foreground">
                        Full access including reports, settings and staff management
                      </p>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={inviteLoading}>
                {inviteLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Send invitation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Remove confirmation dialog ────────────────────────────────────── */}
      <AlertDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{removeTarget?.profile?.full_name || removeTarget?.profile?.email}</strong>{" "}
              will lose access to your organisation immediately. You can invite them again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                removeTarget && handleRemove.mutate(removeTarget.user_id)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StaffManagement;
