import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Eye, EyeOff, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ensureCustomerProfile } from "@/lib/customerOrder";

interface CustomerOrderAuthProps {
  businessName: string;
  logoSrc: string;
  returnTo: string;
  tenantId: string;
}

const CustomerOrderAuth = ({
  businessName,
  logoSrc,
  returnTo,
  tenantId,
}: CustomerOrderAuthProps) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const emailRedirectTo = useMemo(() => {
    const url = new URL("/auth", window.location.origin);
    url.searchParams.set("intent", "customer-order");
    url.searchParams.set("returnTo", returnTo);
    return url.toString();
  }, [returnTo]);

  const handleSuccessfulAuth = async (
    authUser: NonNullable<Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"]>
  ) => {
    await ensureCustomerProfile({
      user: authUser,
      tenantId,
      fullName: fullName.trim() || undefined,
    });

    navigate(returnTo, { replace: true });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    try {
      if (!data.user) throw new Error("We couldn't sign you in. Please try again.");
      await handleSuccessfulAuth(data.user);
      toast.success("Signed in. Continue placing your order.");
    } catch (profileError) {
      const message =
        profileError instanceof Error
          ? profileError.message
          : "We couldn't prepare your customer account. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error("Please enter your full name.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: {
          full_name: fullName.trim(),
        },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    try {
      if (data.user && data.session) {
        await handleSuccessfulAuth(data.user);
        toast.success("Account created. Continue placing your order.");
      } else {
        setEmailSent(true);
        toast.success("Check your email to confirm your account, then continue your order.");
      }
    } catch (profileError) {
      const message =
        profileError instanceof Error
          ? profileError.message
          : "We couldn't prepare your customer account. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <img
              src={logoSrc}
              alt={businessName}
              className="w-20 h-20 object-contain rounded-xl border border-border bg-background p-1 shadow-sm"
            />
            <div>
              <h1 className="text-lg font-semibold text-foreground">Check your email</h1>
              <p className="text-sm text-muted-foreground mt-1">
                We sent a confirmation link to {email}. After confirming, you’ll return here to finish your order.
              </p>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={() => setEmailSent(false)}>
            Use a different email
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <img
            src={logoSrc}
            alt={businessName}
            className="w-20 h-20 object-contain rounded-xl border border-border bg-background p-1 shadow-sm"
          />
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {mode === "signin" ? `Sign in to order from ${businessName}` : `Create your customer account for ${businessName}`}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Customer access only — browse styles, attach measurements, and place your order online.
            </p>
          </div>
        </div>

        <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="customer-full-name">Full name</Label>
              <Input
                id="customer-full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                required
                autoFocus
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="customer-email">Email address</Label>
            <Input
              id="customer-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus={mode === "signin"}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="customer-password">Password</Label>
              {mode === "signin" && (
                <a
                  href="/reset-password"
                  className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                >
                  Forgot password?
                </a>
              )}
            </div>
            <div className="relative">
              <Input
                id="customer-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                className="pr-10"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="customer-confirm-password">Confirm password</Label>
              <div className="relative">
                <Input
                  id="customer-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowRight className="w-4 h-4 mr-2" />}
            {mode === "signin" ? "Sign in and continue" : "Create account and continue"}
          </Button>
        </form>

        <div className="space-y-3 text-center">
          <button
            type="button"
            onClick={() => {
              setMode((current) => (current === "signin" ? "signup" : "signin"));
              setPassword("");
              setConfirmPassword("");
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            {mode === "signin" ? "New customer? Create an account →" : "← I already have an account"}
          </button>
          <a
            href="/auth"
            className="block text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Looking for business staff login? Go back
          </a>
        </div>
      </div>
    </div>
  );
};

export default CustomerOrderAuth;