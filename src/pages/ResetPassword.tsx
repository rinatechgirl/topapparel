import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, CheckCircle, ArrowLeft, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import fallbackLogo from "@/assets/logo.jpeg";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [success, setSuccess] = useState(false);

  // Forgot-password request mode
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Check hash params for recovery token
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get("type") === "recovery") setIsRecovery(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setIsRecovery(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Send password reset email ───────────────────────────────────────────────
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);

    const redirectTo = `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    if (error) {
      toast.error(error.message);
    } else {
      setEmailSent(true);
      toast.success("Check your email for the reset link!");
    }
    setLoading(false);
  };

  // ── Set new password ────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error("Passwords do not match"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) toast.error(error.message);
    else { setSuccess(true); toast.success("Password updated successfully!"); setTimeout(() => navigate("/"), 2000); }
    setLoading(false);
  };

  // ── Recovery mode: set new password ─────────────────────────────────────────
  if (isRecovery || success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <img src={fallbackLogo} alt="Rina's Fit" className="w-12 h-12 object-contain rounded-2xl mx-auto mb-4" />
            <h1 className="text-2xl font-display font-bold text-foreground">Rina's Fit</h1>
          </div>

          <Card className="shadow-lg border-border/50">
            <CardHeader className="text-center pb-4">
              <CardTitle className="font-display text-xl">{success ? "Password Updated" : "Set New Password"}</CardTitle>
              <CardDescription>{success ? "You can now sign in with your new password." : "Enter your new password below."}</CardDescription>
            </CardHeader>
            <CardContent>
              {success ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <CheckCircle className="w-12 h-12 text-primary" />
                  <p className="text-sm text-muted-foreground">Redirecting...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>{loading ? "Updating..." : "Update Password"}</Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Default: request reset email ────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <img src={fallbackLogo} alt="Rina's Fit" className="w-12 h-12 object-contain rounded-2xl mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold text-foreground">Rina's Fit</h1>
        </div>

        <Card className="shadow-lg border-border/50">
          <CardHeader className="text-center pb-4">
            <CardTitle className="font-display text-xl">
              {emailSent ? "Check your email" : "Forgot password?"}
            </CardTitle>
            <CardDescription>
              {emailSent
                ? "We've sent a password reset link to your email address."
                : "Enter your email and we'll send you a link to reset your password."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailSent ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <Mail className="w-12 h-12 text-primary" />
                <p className="text-sm text-muted-foreground text-center">
                  Didn't receive it? Check your spam folder or{" "}
                  <button
                    type="button"
                    onClick={() => setEmailSent(false)}
                    className="text-primary hover:underline underline-offset-4"
                  >
                    try again
                  </button>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send reset link"}
                </Button>
              </form>
            )}
            <div className="mt-4 text-center">
              <Button variant="link" onClick={() => navigate("/auth")} className="gap-1.5 text-muted-foreground">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
