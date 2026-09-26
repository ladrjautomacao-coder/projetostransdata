import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { apexHostname } from "@/contexts/TenantBrandingContext";

const HOPEXT_LOGO_URL = "https://emzqlctomlsjwmgthbkv.supabase.co/storage/v1/object/public/tenant-logos/hopext-default.png";

const PLANS = [
  {
    id: "trial",
    eyebrow: "Degustação",
    title: "Plano Teste",
    subtitle: "Experimente a plataforma na prática",
    priceMain: "Grátis",
    priceSuffix: "/ 7 dias",
    note: "Sem cadastro de cartão",
    features: [
      { ok: true, text: "Acesso total à ferramenta por 7 dias" },
      { ok: true, text: "Teste de fluxos e automações No-Code" },
      { ok: true, text: "Suporte inicial à plataforma" },
      { ok: false, text: "Suporte VIP via WhatsApp" },
    ],
    cta: "Começar Grátis",
    highlight: false,
  },
  {
    id: "annual",
    eyebrow: "Foco em Crescimento",
    title: "Plano Anual",
    subtitle: "O pacote completo com desconto expressivo",
    priceMain: "R$ 2.000",
    priceSuffix: "/ ano",
    note: "Equivale a apenas R$ 166,66 / mês",
    badge: "Melhor Custo-Benefício • Economize R$ 1.588",
    features: [
      { ok: true, text: "Acesso contínuo e irrestrito por 1 ano" },
      { ok: true, text: "Todas as integrações No-Code liberadas" },
      { ok: true, text: "Suporte prioritário VIP" },
      { ok: true, text: "Atualizações e novos recursos inclusos" },
      { ok: true, text: "Onboarding exclusivo da equipe HopeXT" },
    ],
    cta: "Assinar Plano Anual",
    highlight: true,
  },
  {
    id: "monthly",
    eyebrow: "Sem Fidelidade",
    title: "Plano Mensal",
    subtitle: "Liberdade para pagar mês a mês",
    priceMain: "R$ 299",
    priceSuffix: "/ mês",
    note: "Cancele quando desejar, sem multas",
    features: [
      { ok: true, text: "Acesso completo mensal" },
      { ok: true, text: "Gestão e produtos digitais ilimitados" },
      { ok: true, text: "Suporte operacional padrão" },
      { ok: true, text: "Renovação automática simples" },
    ],
    cta: "Assinar Plano Mensal",
    highlight: false,
  },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function redirectToTenant(slug: string) {
  const host = apexHostname(window.location.hostname);
  const port = window.location.port ? `:${window.location.port}` : "";
  window.location.href = `${window.location.protocol}//${slug}.${host}${port}/`;
}

export default function PublicSignup() {
  const { toast } = useToast();

  // login (quem já é cliente)
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // cadastro (teste grátis / interesse em plano pago)
  const [signupOpen, setSignupOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[number] | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [slug, setSlug] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const openSignup = (plan: typeof PLANS[number]) => {
    setSelectedPlan(plan);
    setSignupOpen(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });
      if (error) throw error;

      const { data: profile } = await (supabase as any)
        .from("profiles").select("tenant_id").eq("user_id", data.user.id).maybeSingle();
      if (!profile?.tenant_id) throw new Error("Não foi possível identificar sua empresa.");

      const { data: tenant } = await (supabase as any)
        .from("tenants").select("slug").eq("id", profile.tenant_id).maybeSingle();
      if (!tenant?.slug) throw new Error("Não foi possível identificar o endereço da sua empresa.");

      redirectToTenant(tenant.slug);
    } catch (err: any) {
      toast({ title: "Não foi possível entrar", description: err.message, variant: "destructive" });
      setLoginSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !email.trim() || password.length < 6) {
      toast({ title: "Preencha nome da empresa, e-mail e uma senha com pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("public-signup", {
        body: {
          company_name: companyName.trim(),
          slug: slug.trim() || undefined,
          full_name: fullName.trim(),
          email: email.trim(),
          password,
        },
      });
      if (error || (data as any)?.error) {
        throw new Error((data as any)?.error || error?.message || "Erro ao criar sua conta");
      }
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInErr) throw signInErr;
      redirectToTenant((data as any).slug);
    } catch (err: any) {
      toast({ title: "Erro ao criar sua conta", description: err.message, variant: "destructive" });
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-hopeDark font-['Plus_Jakarta_Sans',sans-serif] text-gray-100">
      {/* Iluminação ambiente */}
      <div className="pointer-events-none absolute -left-[5%] -top-[5%] z-0 h-[600px] w-[600px] rounded-full blur-[90px]"
        style={{ background: "radial-gradient(circle, rgba(157,78,221,0.18) 0%, rgba(0,0,0,0) 70%)" }} />
      <div className="pointer-events-none absolute -right-[5%] top-[35%] z-0 h-[600px] w-[600px] rounded-full blur-[100px]"
        style={{ background: "radial-gradient(circle, rgba(0,229,255,0.14) 0%, rgba(0,0,0,0) 70%)" }} />
      <div className="pointer-events-none absolute bottom-0 left-[20%] z-0 h-[500px] w-[500px] rounded-full blur-[90px]"
        style={{ background: "radial-gradient(circle, rgba(224,86,253,0.15) 0%, rgba(0,0,0,0) 70%)" }} />
      <div className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundSize: "40px 40px",
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)",
        }} />

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-hopeDark/70 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 md:px-8">
          <a href="#" className="flex items-center gap-3">
            <img src={HOPEXT_LOGO_URL} alt="HopeXT" className="h-12 w-12 rounded-full object-cover"
              style={{ filter: "drop-shadow(0 0 25px rgba(0,229,255,0.28)) drop-shadow(0 0 40px rgba(157,78,221,0.22))" }} />
            <div className="flex flex-col">
              <span className="font-brand text-2xl font-black tracking-tight"
                style={{ background: "linear-gradient(135deg,#00E5FF 0%,#a855f7 50%,#ec4899 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                HopeXT
              </span>
              <span className="-mt-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">HopexTech</span>
            </div>
          </a>
          <nav className="flex items-center gap-4">
            <a href="#planos" className="hidden text-sm font-semibold text-gray-300 transition-colors hover:text-cyan-400 sm:inline-block">
              Planos &amp; Assinaturas
            </a>
            <a href="#planos" className="rounded-xl px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition-all hover:brightness-110 md:text-sm"
              style={{ background: "linear-gradient(90deg,#00b4d8 0%,#8338ec 50%,#d946ef 100%)" }}>
              Testar Grátis
            </a>
          </nav>
        </div>
      </header>

      {/* HERO + LOGIN */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-20">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-14">
          {/* Apresentação */}
          <section className="flex flex-col items-center space-y-6 text-center lg:col-span-7 lg:items-start lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 backdrop-blur-md">
              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Hub No-Code &amp; Gestão Inteligente</span>
            </div>

            <div className="flex flex-col items-center justify-center gap-5 sm:flex-row lg:justify-start">
              <img src={HOPEXT_LOGO_URL} alt="HopeXT" className="h-24 w-24 rounded-full object-cover md:h-28 md:w-28"
                style={{ filter: "drop-shadow(0 0 25px rgba(0,229,255,0.28)) drop-shadow(0 0 40px rgba(157,78,221,0.22))" }} />
              <div>
                <h1 className="font-brand text-5xl font-black tracking-tight md:text-6xl"
                  style={{ background: "linear-gradient(135deg,#00E5FF 0%,#a855f7 50%,#ec4899 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  HopeXT
                </h1>
                <p className="mt-1 text-sm font-semibold uppercase tracking-widest text-gray-400">
                  HopexTech — No-Code &amp; Digital Products
                </p>
              </div>
            </div>

            <p className="max-w-xl text-base leading-relaxed text-gray-300 md:text-lg">
              Centralize suas operações, acelere a entrega de produtos digitais e automatize fluxos estratégicos com eficiência máxima.
            </p>

            <div className="flex w-full flex-col gap-4 pt-2 sm:w-auto sm:flex-row">
              <a href="#planos" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 font-semibold text-white transition-all hover:border-cyan-400/50 hover:bg-white/10">
                Ver Planos Disponíveis
                <svg className="h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </a>
              <div className="flex items-center justify-center gap-2 py-2 text-xs text-gray-400">
                <svg className="h-4 w-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
                7 dias grátis sem cartão
              </div>
            </div>
          </section>

          {/* Login */}
          <section className="mx-auto w-full max-w-md lg:col-span-5">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-hopeCard p-7 shadow-2xl backdrop-blur-xl md:p-9">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Já é membro?</span>
                <h2 className="font-brand mt-1 text-2xl font-bold tracking-wide text-white">Acessar Sistema</h2>
                <p className="mt-1 text-sm text-gray-400">Entre com suas credenciais corporativas</p>
              </div>

              <form className="space-y-4" onSubmit={handleLogin}>
                <div>
                  <label htmlFor="login-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-300">E-mail</label>
                  <input
                    id="login-email" type="email" placeholder="voce@empresa.com" required
                    value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0d0d1a]/80 px-4 py-3 text-sm text-white placeholder-gray-500 transition-all focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="login-password" className="text-xs font-semibold uppercase tracking-wider text-gray-300">Senha</label>
                    <a href="/forgot-password" className="text-xs text-cyan-400 transition-colors hover:text-cyan-300">Esqueceu?</a>
                  </div>
                  <input
                    id="login-password" type="password" placeholder="••••••••" required minLength={6}
                    value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0d0d1a]/80 px-4 py-3 text-sm text-white placeholder-gray-500 transition-all focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
                <button type="submit" disabled={loginSubmitting}
                  className="w-full rounded-xl px-4 py-3.5 text-sm font-semibold uppercase tracking-wider text-white shadow-lg shadow-purple-600/30 transition-all hover:brightness-110 disabled:opacity-60"
                  style={{ background: "linear-gradient(90deg,#00b4d8 0%,#8338ec 50%,#d946ef 100%)" }}>
                  {loginSubmitting ? "Entrando..." : "Entrar"}
                </button>
              </form>

              <div className="mt-6 border-t border-white/5 pt-4 text-center">
                <p className="text-xs text-gray-400">
                  Ainda não possui conta?{" "}
                  <a href="#planos" className="ml-1 font-semibold text-cyan-400 hover:underline">Escolha um plano abaixo</a>
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* PLANOS */}
      <section id="planos" className="relative z-10 mx-auto max-w-7xl border-t border-white/5 px-4 py-20 md:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-400">
            Transparência &amp; Performance
          </div>
          <h2 className="font-brand text-3xl font-black tracking-tight text-white md:text-5xl">Planos flexíveis para a sua escala</h2>
          <p className="mt-3 text-base text-gray-400 md:text-lg">Escolha o plano ideal para gerenciar suas operações com velocidade e inteligência.</p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-8 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div key={plan.id}
              className={
                plan.highlight
                  ? "relative flex flex-col justify-between rounded-2xl border-2 border-purple-500/60 bg-gradient-to-b from-[#18122c] to-[#0f0e20] p-8 shadow-2xl shadow-purple-900/30 backdrop-blur-xl md:-translate-y-3"
                  : "relative flex flex-col justify-between rounded-2xl border border-white/10 bg-hopeCard p-8 backdrop-blur-xl transition-all hover:border-white/20"
              }
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg">
                  {plan.badge}
                </div>
              )}
              <div>
                <div className={`mb-2 mt-1 text-xs font-bold uppercase tracking-widest ${plan.highlight ? "text-purple-400" : "text-cyan-400"}`}>
                  {plan.eyebrow}
                </div>
                <h3 className="font-brand text-2xl font-bold text-white">{plan.title}</h3>
                <p className="mt-1 text-xs text-gray-400">{plan.subtitle}</p>

                <div className="mb-6 mt-6">
                  <div className="flex items-baseline gap-1">
                    <span className="font-brand text-4xl font-extrabold text-white">{plan.priceMain}</span>
                    <span className="text-sm text-gray-400">{plan.priceSuffix}</span>
                  </div>
                  {plan.id === "trial" ? (
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {plan.note}
                    </div>
                  ) : (
                    <p className={`mt-2 text-xs ${plan.highlight ? "text-purple-300" : "text-gray-400"} font-medium`}>{plan.note}</p>
                  )}
                </div>

                <ul className="space-y-3 border-t border-white/5 pt-4 text-sm text-gray-300">
                  {plan.features.map((f) => (
                    <li key={f.text} className={`flex items-center gap-2.5 ${f.ok ? "" : "text-gray-500"}`}>
                      <span className={f.ok ? (plan.highlight ? "text-purple-400" : "text-cyan-400") : "text-gray-600"}>{f.ok ? "✔" : "✕"}</span>
                      {f.text}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => openSignup(plan)}
                  className={
                    plan.highlight
                      ? "w-full rounded-xl px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-xl shadow-purple-600/40"
                      : plan.id === "trial"
                        ? "w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition-all hover:bg-white/10"
                        : "w-full rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3.5 text-sm font-semibold uppercase tracking-wider text-cyan-300 transition-all hover:border-cyan-400 hover:bg-cyan-500/20"
                  }
                  style={plan.highlight ? { background: "linear-gradient(90deg,#00b4d8 0%,#8338ec 50%,#d946ef 100%)" } : undefined}
                >
                  {plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-xs text-gray-500">
        <p>© 2026 HopexTech — No-Code &amp; Digital Products. Todos os direitos reservados.</p>
      </footer>

      {/* Dialog de cadastro — abre pra qualquer plano escolhido */}
      <Dialog open={signupOpen} onOpenChange={(o) => { setSignupOpen(o); if (!o) setSubmitting(false); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto border-white/10 bg-[#0f0f1c] text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedPlan?.id === "trial" ? "Comece seu teste grátis" : `Você escolheu o ${selectedPlan?.title}`}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedPlan?.id === "trial"
                ? "7 dias de acesso completo, sem cartão de crédito."
                : "Crie sua conta agora com 7 dias grátis — entraremos em contato para confirmar o pagamento do plano escolhido."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-300">Nome da empresa *</label>
              <input required maxLength={100} value={companyName}
                onChange={(e) => { setCompanyName(e.target.value); if (!slug) setSlug(slugify(e.target.value)); }}
                className="w-full rounded-xl border border-white/10 bg-[#0d0d1a]/80 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-300">Endereço da sua empresa</label>
              <div className="flex items-center gap-1">
                <input value={slug} maxLength={60} onChange={(e) => setSlug(slugify(e.target.value))}
                  className="flex-1 rounded-xl border border-white/10 bg-[#0d0d1a]/80 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400" />
                <span className="whitespace-nowrap text-xs text-gray-500">.{apexHostname(window.location.hostname)}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-300">Seu nome *</label>
              <input required maxLength={100} value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0d0d1a]/80 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-300">Seu e-mail *</label>
              <input type="email" required maxLength={200} value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0d0d1a]/80 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-300">Senha *</label>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0d0d1a]/80 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400" />
            </div>
            <button type="submit" disabled={submitting}
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold uppercase tracking-wider text-white shadow-lg shadow-purple-600/30 disabled:opacity-60"
              style={{ background: "linear-gradient(90deg,#00b4d8 0%,#8338ec 50%,#d946ef 100%)" }}>
              {submitting ? "Criando..." : "Começar teste grátis"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
