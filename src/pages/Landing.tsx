import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Ruler, Users, Palette, Shield, Globe, ArrowRight, CheckCircle2 } from "lucide-react";

const features = [
  { icon: Users, title: "Customer Management", desc: "Organize client profiles, contact info, and history in one place." },
  { icon: Ruler, title: "Smart Measurements", desc: "Dynamic measurement forms that adapt to outfit types — gowns, suits, native wear & more." },
  { icon: Palette, title: "Design Catalogue", desc: "Upload front & back views, categorize by gender and style, build your lookbook." },
  { icon: Shield, title: "Tenant Isolation", desc: "Every business gets its own secure workspace. Your data stays yours." },
  { icon: Globe, title: "Custom Subdomain", desc: "Get your own branded URL like yourbrand.rinasfit.com — instant credibility." },
  { icon: Sparkles, title: "Role-Based Access", desc: "Assign Admin, Staff, or Viewer roles to control who sees and does what." },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">Rina's Fit</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>Sign In</Button>
            <Button size="sm" onClick={() => navigate("/auth")} className="gap-1.5">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3" />
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 lg:pt-28 lg:pb-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" /> Multi-tenant SaaS for Fashion Businesses
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold leading-tight tracking-tight mb-6">
              Your tailoring business,{" "}
              <span className="bg-gradient-to-r from-primary to-[hsl(280,65%,50%)] bg-clip-text text-transparent">
                beautifully managed.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
              Rina's Fit gives every fashion business its own workspace to manage customers, measurements, and designs — all under your branded subdomain.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" onClick={() => navigate("/auth")} className="gap-2 text-base px-8 h-12">
                Register Your Business <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate("/auth")} className="text-base px-8 h-12">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 lg:py-28 border-t border-border/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-3">Everything you need to run your fashion business</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">From customer intake to design cataloguing — one platform, zero headaches.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="group p-6 rounded-2xl border border-border/50 bg-card hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 lg:py-28 bg-muted/50 border-t border-border/50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-14">Get started in 3 steps</h2>
          <div className="grid sm:grid-cols-3 gap-10">
            {[
              { step: "1", title: "Register", desc: "Sign up and fill in your business details." },
              { step: "2", title: "Get Approved", desc: "Our team reviews and activates your account." },
              { step: "3", title: "Start Managing", desc: "Access your dashboard at yourbrand.rinasfit.com." },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-display font-bold mb-4">
                  {s.step}
                </div>
                <h3 className="font-display font-semibold text-lg mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-24 border-t border-border/50">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">Ready to grow your fashion business?</h2>
          <p className="text-muted-foreground text-lg mb-8">Join Rina's Fit and give your tailoring business the tools it deserves.</p>
          <Button size="lg" onClick={() => navigate("/auth")} className="gap-2 text-base px-10 h-12">
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-display font-semibold text-foreground">Rina's Fit</span>
          </div>
          <p>© {new Date().getFullYear()} Rina's Fit. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
