import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, ArrowRight } from "lucide-react";

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
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[hsl(250,65%,55%)] via-[hsl(260,60%,50%)] to-[hsl(280,65%,45%)] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight">Rina's Fit</h1>
          </div>
          <h2 className="text-4xl xl:text-5xl font-display font-bold text-white leading-tight mb-4">
            Your tailoring business,{" "}
            <span className="text-white/80">beautifully managed.</span>
          </h2>
          <p className="text-lg text-white/70 max-w-md leading-relaxed">
            Customers, measurements, designs — everything your fashion business needs, in one modern platform.
          </p>
          <div className="mt-10 flex items-center gap-6 text-white/60 text-sm">
            <span className="flex items-center gap-2">✓ Multi-tenant</span>
            <span className="flex items-center gap-2">✓ Secure</span>
            <span className="flex items-center gap-2">✓ Beautiful</span>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl text-foreground">Rina's Fit</span>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold text-foreground">
              {isForgot ? "Reset password" : isLogin ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isForgot ? "Enter your email to receive a reset link" : isLogin ? "Sign in to continue to your dashboard" : "Get started with Rina's Fit"}
            </p>
          </div>

          {isForgot ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"} <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" required />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"} <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          )}

          <div className="mt-6 space-y-2 text-center">
            {isLogin && !isForgot && (
              <button type="button" onClick={() => setIsForgot(true)} className="block w-full text-sm text-muted-foreground hover:text-primary transition-colors">
                Forgot your password?
              </button>
            )}
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setIsForgot(false); }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
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
