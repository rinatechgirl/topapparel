import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, Scissors } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Check your email for a password reset link!");
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
      else toast.success("Welcome back!");
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) toast.error(error.message);
      else toast.success("Check your email to confirm your account!");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — dark charcoal branding with fashion imagery */}
      <div className="hidden lg:flex lg:w-[45%] bg-sidebar relative overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fff' fill-opacity='0.15'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
        {/* Gold accent line */}
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-accent/30 to-transparent" />
        
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 w-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-14 h-14 rounded-2xl bg-accent/20 backdrop-blur-sm flex items-center justify-center border border-accent/30">
              <Scissors className="w-7 h-7 text-accent" />
            </div>
          </div>
          <h1 className="text-5xl xl:text-6xl font-display font-bold text-sidebar-foreground leading-tight tracking-tight mb-2">
            Rina<span className="text-accent italic">Fit</span>
          </h1>
          <p className="text-lg text-sidebar-foreground/50 font-body mb-8 max-w-sm leading-relaxed">
            Your tailoring business, beautifully managed.
          </p>
          <div className="flex items-center gap-6 text-sidebar-foreground/40 text-xs uppercase tracking-widest">
            <span>Customers</span>
            <span className="w-1 h-1 rounded-full bg-accent/50" />
            <span>Measurements</span>
            <span className="w-1 h-1 rounded-full bg-accent/50" />
            <span>Designs</span>
          </div>
        </div>
      </div>

      {/* Right panel — clean cream form */}
      <div className="flex-1 flex items-center justify-center px-6 sm:px-10 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center gap-3 mb-1">
              <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center">
                <Scissors className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-2xl text-foreground">
                Rina<span className="text-accent italic">Fit</span>
              </span>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-foreground">
              {isForgot ? "Reset Password" : isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-muted-foreground text-sm mt-2 font-body">
              {isForgot ? "Enter your email to receive a reset link" : isLogin ? "Sign in to continue to your dashboard" : "Get started with RinaFit today"}
            </p>
          </div>

          {isForgot ? (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="h-12 bg-card border-border/80 focus:border-accent" />
              </div>
              <Button type="submit" className="w-full h-12 gap-2 text-sm font-semibold uppercase tracking-wider bg-primary hover:bg-primary/90" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"} <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Full Name</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" required className="h-12 bg-card border-border/80 focus:border-accent" />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="h-12 bg-card border-border/80 focus:border-accent" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="h-12 bg-card border-border/80 focus:border-accent" />
              </div>
              <Button type="submit" className="w-full h-12 gap-2 text-sm font-semibold uppercase tracking-wider bg-primary hover:bg-primary/90" disabled={loading}>
                {loading ? "Please wait..." : isLogin ? "Login" : "Create Account"} <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          )}

          <div className="mt-8 space-y-3 text-center">
            {isLogin && !isForgot && (
              <button type="button" onClick={() => setIsForgot(true)} className="block w-full text-sm text-muted-foreground hover:text-accent transition-colors">
                Forgot Password?
              </button>
            )}
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setIsForgot(false); }}
              className="text-sm text-muted-foreground hover:text-accent transition-colors"
            >
              {isForgot ? "Back to Sign In" : isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
