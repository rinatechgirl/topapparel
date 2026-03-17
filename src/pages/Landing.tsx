import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Users, Ruler, Palette, BarChart3, Shield, Globe, ChevronDown } from "lucide-react";
import fallbackLogo from "@/assets/logo.jpeg";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

const features = [
  { icon: Users,    title: "Customer profiles",   description: "Complete client records with contact history, preferences and measurement timeline — all searchable in seconds." },
  { icon: Ruler,    title: "25+ measurements",     description: "Every body measurement recorded per customer, per outfit type. Never lose a sizing note again." },
  { icon: Palette,  title: "Design library",       description: "Front and back view photos for every design, filterable by gender and category. Your catalogue, beautifully organised." },
  { icon: BarChart3, title: "Business reports",    description: "Admin-only insights into customer growth, design activity, and business performance over time." },
  { icon: Shield,   title: "Role-based teams",     description: "Invite staff, assign roles, and control exactly what each person can access within your organisation." },
  { icon: Globe,    title: "Branded subdomain",    description: "Your own portal at yourname.rinasfit.com — your logo, your name, your clients. Fully white-labelled." },
];

const stats = [
  { value: "25+",   label: "Measurement fields" },
  { value: "100%",  label: "Data isolation" },
  { value: "2 min", label: "Setup time" },
  { value: "∞",     label: "Organisations" },
];

const HERO_IMG    = "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900&q=80&auto=format&fit=crop";
const TAILOR_IMG  = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&q=80&auto=format&fit=crop";
const FABRIC_IMG  = "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=700&q=80&auto=format&fit=crop";
const FASHION_IMG = "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=700&q=80&auto=format&fit=crop";

export default function Landing() {
  const navigate = useNavigate();
  const featuresRef = useInView();
  const stepsRef    = useInView();
  const statsRef    = useInView();
  const magRef      = useInView();
  const ctaRef      = useInView();
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroLoaded(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0b08] text-[#f0ebe3] overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');
        .rf-serif{font-family:'Playfair Display',serif}
        .rf-sans{font-family:'DM Sans',sans-serif}
        .rf-gold{color:#c9972a}
        .grain{position:fixed;inset:0;pointer-events:none;z-index:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");opacity:0.4}
        .fade-up{opacity:0;transform:translateY(32px);transition:opacity 0.7s cubic-bezier(0.22,1,0.36,1),transform 0.7s cubic-bezier(0.22,1,0.36,1)}
        .fade-up.visible{opacity:1;transform:translateY(0)}
        .d1{transition-delay:0.1s}.d2{transition-delay:0.2s}.d3{transition-delay:0.3s}.d4{transition-delay:0.4s}.d5{transition-delay:0.5s}.d6{transition-delay:0.6s}
        .hover-lift{transition:transform 0.3s cubic-bezier(0.22,1,0.36,1),box-shadow 0.3s ease}
        .hover-lift:hover{transform:translateY(-4px);box-shadow:0 20px 40px rgba(0,0,0,0.4)}
        .line-draw{width:0;transition:width 1.2s cubic-bezier(0.22,1,0.36,1)}
        .line-draw.visible{width:100%}
        .btn-p{display:inline-flex;align-items:center;gap:8px;background:#c9972a;color:#0d0b08;padding:14px 28px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;border:none;cursor:pointer;transition:background 0.2s,transform 0.2s}
        .btn-p:hover{background:#d9a83a;transform:translateY(-1px)}
        .btn-o{display:inline-flex;align-items:center;gap:8px;background:transparent;color:#f0ebe3;padding:13px 27px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;letter-spacing:0.06em;text-transform:uppercase;border:1px solid rgba(240,235,227,0.2);cursor:pointer;transition:border-color 0.2s,color 0.2s}
        .btn-o:hover{border-color:#c9972a;color:#c9972a}
        .feat-card{border:1px solid rgba(240,235,227,0.07);padding:32px;background:rgba(240,235,227,0.02);transition:border-color 0.3s,background 0.3s}
        .feat-card:hover{border-color:rgba(201,151,42,0.3);background:rgba(201,151,42,0.04)}
        .step-num{font-family:'Playfair Display',serif;font-size:72px;font-weight:700;line-height:1;color:rgba(201,151,42,0.1);user-select:none;transition:color 0.3s}
        .step-wrap:hover .step-num{color:rgba(201,151,42,0.22)}
        .divider-gold{height:1px;background:linear-gradient(90deg,transparent,rgba(201,151,42,0.3),transparent)}
        .tag{display:inline-flex;align-items:center;gap:6px;font-family:'DM Sans',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#c9972a}
        nav a{transition:color 0.2s}
        nav a:hover{color:#c9972a}
      `}</style>

      <div className="grain" aria-hidden />

      {/* Navbar */}
      <nav className="rf-sans fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0d0b08]/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={fallbackLogo} alt="Rina's Fit" className="w-8 h-8 object-contain rounded" />
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-[#f0ebe3] tracking-tight">Rina's Fit</span>
              <span className="hidden sm:block text-[9px] font-bold tracking-[0.2em] uppercase text-[#c9972a] opacity-70">Digital Atelier</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="/magazine" onClick={(e) => { e.preventDefault(); navigate("/magazine"); }} className="text-xs font-medium text-[#f0ebe3]/50 tracking-wide">Magazine</a>
            <a href="/auth" onClick={(e) => { e.preventDefault(); navigate("/auth"); }} className="text-xs font-medium text-[#f0ebe3]/50 tracking-wide">Sign in</a>
          </div>
          <button className="btn-p text-xs px-5 py-2.5" onClick={() => navigate("/register-business")}>
            Get started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col justify-center pt-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={HERO_IMG} alt="" className="w-full h-full object-cover object-top opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d0b08] via-[#0d0b08]/75 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0b08] via-transparent to-transparent" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 py-24">
          <div className="max-w-3xl">
            <div className={`tag mb-8 fade-up ${heroLoaded ? "visible" : ""}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9972a] animate-pulse" />
              Multi-tenant tailoring platform
            </div>
            <h1 className={`rf-serif text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] text-[#f0ebe3] mb-8 fade-up d1 ${heroLoaded ? "visible" : ""}`}>
              The atelier<br />
              <em className="text-[#c9972a] not-italic">management</em><br />
              platform.
            </h1>
            <p className={`rf-sans text-base sm:text-lg text-[#f0ebe3]/50 max-w-lg leading-relaxed mb-10 fade-up d2 ${heroLoaded ? "visible" : ""}`}>
              Customers, measurements, designs — managed from your own branded portal.
              Built exclusively for tailoring and fashion businesses across Africa.
            </p>
            <div className={`flex flex-wrap gap-4 fade-up d3 ${heroLoaded ? "visible" : ""}`}>
              <button className="btn-p" onClick={() => navigate("/register-business")}>
                Start for free <ArrowRight size={14} />
              </button>
              <button className="btn-o" onClick={() => navigate("/auth")}>
                Sign in
              </button>
            </div>
            <div className={`mt-12 inline-flex items-center gap-3 border border-white/8 bg-white/3 px-4 py-3 fade-up d4 ${heroLoaded ? "visible" : ""}`}>
              <span className="text-[#f0ebe3]/30 text-xs rf-sans">Your portal at</span>
              <code className="text-xs text-[#c9972a] rf-sans">
                <span className="text-[#f0ebe3]/35">https://</span>yourbrand<span className="text-[#f0ebe3]/35">.rinasfit.com</span>
              </code>
            </div>
          </div>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-25">
          <span className="text-[9px] rf-sans tracking-[0.2em] uppercase text-[#f0ebe3]">Scroll</span>
          <ChevronDown size={14} className="text-[#f0ebe3] animate-bounce" />
        </div>
      </section>

      {/* Stats */}
      <div ref={statsRef.ref} className="border-y border-white/6 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8 grid grid-cols-2 md:grid-cols-4 divide-x divide-white/6">
          {stats.map((s, i) => (
            <div key={s.label} className={`px-8 text-center fade-up d${i + 1} ${statsRef.inView ? "visible" : ""}`}>
              <p className="rf-serif text-3xl font-bold text-[#c9972a]">{s.value}</p>
              <p className="rf-sans text-[11px] text-[#f0ebe3]/35 uppercase tracking-[0.15em] mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Editorial two-column */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-28 grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        <div>
          <div className="tag mb-6">The problem we solve</div>
          <h2 className="rf-serif text-4xl lg:text-5xl font-bold text-[#f0ebe3] leading-tight mb-6">
            Tailoring businesses<br />
            <em className="text-[#f0ebe3]/35 not-italic">deserve better</em><br />
            than notebooks.
          </h2>
          <p className="rf-sans text-sm text-[#f0ebe3]/45 leading-relaxed mb-8 max-w-md">
            Most tailors still manage customers and measurements in notebooks, WhatsApp groups, and spreadsheets.
            Rina's Fit gives every tailoring business a professional digital workspace — in minutes, not months.
          </p>
          <div className="divider-gold mb-8" />
          <div className="grid grid-cols-2 gap-5">
            {["Customer records", "Measurement history", "Design catalogue", "Staff management"].map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <span className="w-1 h-1 rounded-full bg-[#c9972a] shrink-0" />
                <span className="rf-sans text-xs text-[#f0ebe3]/55">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative h-[480px] hidden lg:block">
          <div className="absolute inset-0 overflow-hidden">
            <img src={TAILOR_IMG} alt="Tailor at work" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0b08]/50 to-transparent" />
          </div>
          <div className="absolute -bottom-6 -left-6 w-48 h-48 border border-[#c9972a]/20 bg-[#0d0b08] p-5 flex flex-col justify-end">
            <p className="rf-serif text-3xl font-bold text-[#c9972a]">Africa's</p>
            <p className="rf-sans text-xs text-[#f0ebe3]/40 mt-1 uppercase tracking-wider">tailoring platform</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section ref={featuresRef.ref} className="border-t border-white/6">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-28">
          <div className={`mb-16 fade-up ${featuresRef.inView ? "visible" : ""}`}>
            <div className="tag mb-4">Platform features</div>
            <h2 className="rf-serif text-4xl font-bold text-[#f0ebe3]">Everything in one place</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className={`feat-card fade-up d${Math.min(i + 1, 6)} ${featuresRef.inView ? "visible" : ""}`}>
                  <div className="w-8 h-8 border border-[#c9972a]/30 flex items-center justify-center mb-6">
                    <Icon size={14} className="text-[#c9972a]" />
                  </div>
                  <h3 className="rf-serif text-lg font-semibold text-[#f0ebe3] mb-3">{f.title}</h3>
                  <p className="rf-sans text-sm text-[#f0ebe3]/40 leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section ref={stepsRef.ref} className="bg-[#0f0c09] border-t border-white/6">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-28">
          <div className={`text-center mb-20 fade-up ${stepsRef.inView ? "visible" : ""}`}>
            <div className="tag justify-center mb-4">Getting started</div>
            <h2 className="rf-serif text-4xl font-bold text-[#f0ebe3]">Up and running in minutes</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-0 relative">
            <div className="hidden md:block absolute top-[38px] left-[16.67%] right-[16.67%] h-px">
              <div className={`line-draw h-full bg-gradient-to-r from-[#c9972a]/20 via-[#c9972a]/50 to-[#c9972a]/20 ${stepsRef.inView ? "visible" : ""}`} />
            </div>
            {[
              { num: "01", title: "Create your account", body: "Sign up with your business name and choose your username — it becomes your permanent subdomain." },
              { num: "02", title: "Set up your portal",  body: "Upload your logo, add business details, and invite your team. Takes under two minutes." },
              { num: "03", title: "Start managing",      body: "Add customers, record measurements, upload designs, and run your entire business from one dashboard." },
            ].map((step, i) => (
              <div key={step.num} className={`step-wrap px-8 text-center fade-up d${i + 2} ${stepsRef.inView ? "visible" : ""}`}>
                <div className="w-10 h-10 rounded-full border border-[#c9972a]/35 bg-[#c9972a]/10 flex items-center justify-center mx-auto mb-4">
                  <span className="rf-sans text-[11px] font-bold text-[#c9972a]">{step.num}</span>
                </div>
                <div className="step-num -mt-1 mb-2">{step.num}</div>
                <h3 className="rf-serif text-xl font-semibold text-[#f0ebe3] mb-3">{step.title}</h3>
                <p className="rf-sans text-sm text-[#f0ebe3]/40 leading-relaxed max-w-xs mx-auto">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Magazine teaser */}
      <section ref={magRef.ref} className="border-t border-white/6">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-28">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className={`fade-up ${magRef.inView ? "visible" : ""}`}>
              <div className="tag mb-6">Fashion magazine</div>
              <h2 className="rf-serif text-4xl lg:text-5xl font-bold text-[#f0ebe3] leading-tight mb-6">
                Showcase your designs<br />
                <em className="text-[#c9972a] not-italic">to the world.</em>
              </h2>
              <p className="rf-sans text-sm text-[#f0ebe3]/45 leading-relaxed mb-8 max-w-md">
                Publish your designs to the Rina's Fit global magazine. Clients across Africa discover your work,
                browse front and back views, and click through to your personal catalogue page.
              </p>
              <button className="btn-o" onClick={() => navigate("/magazine")}>
                Browse the magazine <ArrowRight size={13} />
              </button>
            </div>
            <div className={`grid grid-cols-2 gap-3 fade-up d2 ${magRef.inView ? "visible" : ""}`}>
              <div className="hover-lift aspect-[3/4] overflow-hidden">
                <img src={FASHION_IMG} alt="Fashion" className="w-full h-full object-cover" />
              </div>
              <div className="mt-8 space-y-3">
                <div className="hover-lift aspect-square overflow-hidden">
                  <img src={FABRIC_IMG} alt="Fabric" className="w-full h-full object-cover" />
                </div>
                <div className="border border-[#c9972a]/20 p-4 bg-[#c9972a]/5">
                  <p className="rf-serif text-sm font-semibold text-[#f0ebe3] mb-1">Your catalogue</p>
                  <p className="rf-sans text-[11px] text-[#f0ebe3]/35">slug.rinasfit.com/catalogue</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subdomain showcase */}
      <section className="border-t border-white/6 bg-[#0f0c09]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-28 text-center">
          <div className="tag justify-center mb-6">White-labelled</div>
          <h2 className="rf-serif text-4xl font-bold text-[#f0ebe3] mb-6">Your brand. Your portal.</h2>
          <p className="rf-sans text-sm text-[#f0ebe3]/40 max-w-lg mx-auto leading-relaxed mb-12">
            Every business gets their own branded login page with their logo and business name —
            completely separate from every other organisation on the platform.
          </p>
          <div className="max-w-2xl mx-auto border border-white/8 bg-white/[0.02] overflow-hidden">
            <div className="border-b border-white/8 px-4 py-3 flex items-center gap-3 bg-white/3">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
              </div>
              <div className="flex-1 bg-white/5 rounded px-3 py-1.5 text-[11px] rf-sans text-[#f0ebe3]/35 text-left">
                https://<span className="text-[#c9972a] font-medium">yourbrand</span>.rinasfit.com
              </div>
            </div>
            <div className="p-8 flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#c9972a]/10 border border-[#c9972a]/20 flex items-center justify-center">
                <span className="rf-serif text-lg font-bold text-[#c9972a]">B</span>
              </div>
              <div className="text-center">
                <p className="rf-serif text-base font-semibold text-[#f0ebe3]">Sign in to Your Brand</p>
                <p className="rf-sans text-xs text-[#f0ebe3]/25 mt-1">Powered by Rina's Fit</p>
              </div>
              <div className="w-full max-w-xs space-y-2">
                <div className="h-9 bg-white/5 border border-white/8 rounded" />
                <div className="h-9 bg-white/5 border border-white/8 rounded" />
                <div className="h-9 bg-[#c9972a]/70 rounded" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section ref={ctaRef.ref} className="border-t border-white/6">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-32 text-center">
          <div className={`fade-up ${ctaRef.inView ? "visible" : ""}`}>
            <p className="rf-sans text-[11px] font-bold tracking-[0.2em] uppercase text-[#c9972a] mb-6">Join Rina's Fit</p>
            <h2 className="rf-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[#f0ebe3] leading-[1.1] max-w-3xl mx-auto mb-8">
              Your digital atelier<br />
              <em className="text-[#f0ebe3]/25 not-italic">starts today.</em>
            </h2>
            <p className="rf-sans text-sm text-[#f0ebe3]/35 max-w-sm mx-auto mb-10">
              No credit card required. Set up your organisation in under two minutes.
            </p>
            <button className="btn-p text-sm px-8 py-4" onClick={() => navigate("/register-business")}>
              Create your free account <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/6">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={fallbackLogo} alt="Rina's Fit" className="w-6 h-6 object-contain rounded opacity-60" />
            <span className="rf-sans text-xs text-[#f0ebe3]/25">Rina's Fit</span>
            <span className="text-[#f0ebe3]/10">·</span>
            <span className="rf-sans text-[9px] font-bold tracking-[0.15em] uppercase text-[#c9972a] opacity-55">Digital Atelier</span>
          </div>
          <div className="flex items-center gap-6">
            {[["Magazine", "/magazine"], ["Sign in", "/auth"], ["Register", "/register-business"]].map(([label, path]) => (
              <button key={label} onClick={() => navigate(path)} className="rf-sans text-xs text-[#f0ebe3]/25 hover:text-[#c9972a] transition-colors">{label}</button>
            ))}
          </div>
          <p className="rf-sans text-[11px] text-[#f0ebe3]/18">© {new Date().getFullYear()} Rina's Fit. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
