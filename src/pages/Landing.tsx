import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Users,
  Ruler,
  Palette,
  BarChart3,
  Shield,
  Globe,
} from "lucide-react";
import fallbackLogo from "@/assets/logo.jpeg";

// ─── Data ─────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: Users,
    title: "Customer management",
    description:
      "Store customer profiles, contact details, and full history in one place. Search and filter instantly.",
  },
  {
    icon: Ruler,
    title: "Precision measurements",
    description:
      "Record 25+ body measurements per customer, organised by outfit type for quick access.",
  },
  {
    icon: Palette,
    title: "Design library",
    description:
      "Upload front and back view photos for every design, organised by gender and category.",
  },
  {
    icon: BarChart3,
    title: "Reports & insights",
    description:
      "Track business performance with admin-only reports — customers, designs, and activity over time.",
  },
  {
    icon: Shield,
    title: "Role-based access",
    description:
      "Invite staff, assign admin or staff roles, and control exactly what each person can see and do.",
  },
  {
    icon: Globe,
    title: "Your own branded portal",
    description:
      "Every business gets its own login page at yourname.rinasfit.com, with your logo and colours.",
  },
];

const steps = [
  {
    number: "01",
    title: "Create your account",
    description:
      "Sign up with your business name and choose your username — this becomes your unique subdomain.",
  },
  {
    number: "02",
    title: "Set up your portal",
    description:
      "Upload your logo, add your business details, and invite your team members.",
  },
  {
    number: "03",
    title: "Start managing",
    description:
      "Add customers, record measurements, upload designs, and run your business from one dashboard.",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={fallbackLogo}
              alt="Rina's Fit"
              className="w-7 h-7 object-contain rounded-sm"
            />
            <span className="font-semibold text-sm text-foreground">Rina's Fit</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/magazine")}>
              Magazine
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
              Log in
            </Button>
            <Button size="sm" onClick={() => navigate("/register-business")}>
              Create account
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted text-xs text-muted-foreground mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          Multi-tenant platform for tailoring businesses
        </div>

        <h1 className="text-4xl sm:text-5xl font-semibold text-foreground leading-tight max-w-3xl mx-auto">
          The modern platform for managing your tailoring business
        </h1>

        <p className="text-muted-foreground mt-6 text-lg max-w-xl mx-auto leading-relaxed">
          Customers, measurements, and designs — all in one place, with your
          own branded portal at{" "}
          <span className="text-foreground font-medium">yourname.rinasfit.com</span>.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
          <Button
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => navigate("/register-business")}
          >
            Get started free
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => navigate("/auth")}
          >
            Sign in to your account
          </Button>
        </div>
      </section>

      {/* ── Features grid ───────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-foreground">
            Everything your tailoring business needs
          </h2>
          <p className="text-muted-foreground mt-2 text-sm max-w-md mx-auto">
            Built specifically for tailoring and fashion businesses — no bloat, no unnecessary complexity.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="p-6 rounded-xl border border-border bg-card hover:border-foreground/20 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center mb-4 group-hover:bg-muted/70 transition-colors">
                  <Icon className="w-4 h-4 text-foreground" />
                </div>
                <h3 className="font-medium text-foreground mb-1.5">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold text-foreground">
              Up and running in minutes
            </h2>
            <p className="text-muted-foreground mt-2 text-sm max-w-md mx-auto">
              No technical setup required — just create your account and start managing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="text-center space-y-3">
                <div className="text-4xl font-semibold text-foreground/10 select-none">
                  {step.number}
                </div>
                <h3 className="font-medium text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Subdomain showcase ──────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h2 className="text-2xl font-semibold text-foreground">
          Your own branded login page
        </h2>
        <p className="text-muted-foreground mt-3 text-sm max-w-lg mx-auto leading-relaxed">
          Every business on Rina's Fit gets its own subdomain. Your clients and
          staff log in at a page that shows your logo and business name — not ours.
        </p>

        {/* Subdomain preview pill */}
        <div className="inline-flex items-center gap-2 mt-8 px-4 py-2.5 bg-muted rounded-xl border border-border text-sm font-mono">
          <span className="text-muted-foreground">https://</span>
          <span className="text-foreground font-semibold">yourbusiness</span>
          <span className="text-muted-foreground">.rinasfit.com</span>
        </div>
      </section>

      {/* ── CTA banner ──────────────────────────────────────────────────────── */}
      <section className="border-t border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold text-foreground">
            Ready to run your tailoring business smarter?
          </h2>
          <p className="text-muted-foreground mt-3 text-sm max-w-sm mx-auto">
            Set up your account in minutes. No credit card required.
          </p>
          <Button
            size="lg"
            className="mt-8"
            onClick={() => navigate("/register-business")}
          >
            Create your free account
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img
              src={fallbackLogo}
              alt="Rina's Fit"
              className="w-5 h-5 object-contain"
            />
            <span className="text-sm text-muted-foreground">Rina's Fit</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Rina's Fit. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
