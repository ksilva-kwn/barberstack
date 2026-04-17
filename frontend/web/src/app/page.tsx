'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Scissors, Menu, X, Calendar, Receipt, TrendingUp, Users,
  Repeat2, Package, UtensilsCrossed, Check, ArrowRight,
  BarChart3, Shield, Zap, Star,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

// ─── Animation helpers ────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const features = [
  { icon: Calendar,       title: 'Agenda inteligente',    desc: 'Grade visual por barbeiro, drag & drop, bloqueios e horário de funcionamento.' },
  { icon: Receipt,        title: 'Caixa & Comandas',      desc: 'Abertura e fechamento de comandas com controle de pagamento e histórico.' },
  { icon: TrendingUp,     title: 'Financeiro completo',   desc: 'Comissões, balanço, contas a pagar/receber e relatórios detalhados.' },
  { icon: Users,          title: 'Gestão de clientes',    desc: 'Cadastro, histórico de visitas, bloqueio e relatórios de recorrência.' },
  { icon: Repeat2,        title: 'Assinaturas',           desc: 'Planos mensais para fidelizar clientes com benefícios exclusivos.' },
  { icon: Package,        title: 'Estoque',               desc: 'Controle de produtos com baixa automática ao fechar comandas.' },
  { icon: UtensilsCrossed,title: 'Bar / Cozinha',         desc: 'Cardápio integrado na comanda, perfeito para barbearias com bar.' },
  { icon: BarChart3,      title: 'Relatórios',            desc: 'Dashboards de faturamento, origem dos agendamentos e desempenho.' },
  { icon: Shield,         title: 'Multi-filial',          desc: 'Gerencie todas as unidades a partir de um único painel administrativo.' },
];

const plans = [
  {
    name: 'Bronze',
    price: 'R$ 89',
    period: '/mês',
    desc: 'Ideal para barbearias com 1 profissional.',
    features: ['1 barbeiro', 'Agenda & Caixa', 'Gestão de clientes', 'Relatórios básicos'],
    cta: 'Começar grátis',
    highlight: false,
  },
  {
    name: 'Prata',
    price: 'R$ 149',
    period: '/mês',
    desc: 'Para equipes em crescimento.',
    features: ['Até 5 barbeiros', 'Tudo do Bronze', 'Financeiro completo', 'Assinaturas', 'Suporte prioritário'],
    cta: 'Começar grátis',
    highlight: true,
  },
  {
    name: 'Ouro',
    price: 'R$ 249',
    period: '/mês',
    desc: 'Para redes e franquias.',
    features: ['Barbeiros ilimitados', 'Tudo do Prata', 'Multi-filial', 'Bar / Cozinha', 'API & integrações'],
    cta: 'Falar com vendas',
    highlight: false,
  },
];

const stats = [
  { value: '2.500+', label: 'Barbearias ativas' },
  { value: '156%',   label: 'Aumento médio de receita' },
  { value: '99,9%',  label: 'Uptime garantido' },
  { value: '4,9★',   label: 'Avaliação média' },
];

const testimonials = [
  { name: 'Rodrigo Lima',   role: 'Dono — Barbearia do Ro',  text: 'O Barberstack mudou nossa operação. Agenda cheia, financeiro no controle e clientes mais satisfeitos.' },
  { name: 'Carlos Mendes',  role: 'Gerente — Studio Black',  text: 'Controlo 3 unidades por um único painel. Nunca foi tão fácil gerenciar minha rede.' },
  { name: 'André Souza',    role: 'Barbeiro — BarberHub',    text: 'A agenda visual é incrível. Meus clientes adoram agendar pelo portal. Profissional demais.' },
];

// ─── Dashboard Preview Mockup ─────────────────────────────────────────────────
function DashboardMockup() {
  return (
    <div
      className="rounded-2xl border overflow-hidden shadow-2xl"
      style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
    >
      {/* Titlebar */}
      <div className="flex items-center gap-1.5 px-4 py-3 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
        <span className="w-3 h-3 rounded-full bg-red-400" />
        <span className="w-3 h-3 rounded-full bg-yellow-400" />
        <span className="w-3 h-3 rounded-full bg-green-400" />
        <span className="ml-3 text-xs text-muted-foreground font-mono">barberstack.app/dashboard</span>
      </div>

      <div className="flex" style={{ height: '320px' }}>
        {/* Sidebar mini */}
        <div className="w-12 shrink-0 border-r flex flex-col items-center py-3 gap-3" style={{ backgroundColor: 'hsl(var(--sidebar))', borderColor: 'hsl(var(--border))' }}>
          {[BarChart3, Calendar, Receipt, Users, Package].map((Icon, i) => (
            <div key={i} className={`w-7 h-7 rounded-lg flex items-center justify-center ${i === 0 ? 'bg-primary/20' : ''}`}>
              <Icon className="w-3.5 h-3.5" style={{ color: i === 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }} />
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 space-y-4 overflow-hidden">
          {/* KPI row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Faturamento', value: 'R$ 8.4k', color: 'text-primary' },
              { label: 'Clientes',    value: '312',      color: 'text-emerald-500' },
              { label: 'Concluídos', value: '47',        color: 'text-violet-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl p-2.5 border" style={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}>
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p className={`text-base font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Chart bars */}
          <div className="rounded-xl p-3 border" style={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}>
            <p className="text-xs text-muted-foreground mb-3">Faturamento mensal</p>
            <div className="flex items-end gap-1.5 h-16">
              {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t"
                  style={{
                    height: `${h}%`,
                    backgroundColor: i === 11 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.25)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Recent row */}
          <div className="space-y-1.5">
            {['Samuel — Corte + Barba', 'Pedro — Corte'].map((name, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg px-2.5 py-1.5 border" style={{ borderColor: 'hsl(var(--border))' }}>
                <span className="text-xs text-foreground">{name}</span>
                <span className="text-xs font-medium" style={{ color: 'hsl(var(--primary))' }}>
                  {i === 0 ? 'R$ 80' : 'R$ 45'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>

      {/* ── NAV ───────────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 inset-x-0 z-30 transition-all duration-200"
        style={{
          backgroundColor: scrolled ? 'hsl(var(--card) / 0.95)' : 'transparent',
          borderBottom: scrolled ? '1px solid hsl(var(--border))' : '1px solid transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--primary))' }}>
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base">Barberstack</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Funcionalidades</a>
            <a href="#como-funciona" className="hover:text-foreground transition-colors">Como funciona</a>
            <a href="#planos" className="hover:text-foreground transition-colors">Planos</a>
            <a href="#depoimentos" className="hover:text-foreground transition-colors">Depoimentos</a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/entrar" className="hidden sm:inline-flex text-sm px-4 py-2 rounded-xl border transition-colors hover:bg-accent" style={{ borderColor: 'hsl(var(--border))' }}>
              Entrar
            </Link>
            <Link
              href="/registrar"
              className="text-sm px-4 py-2 rounded-xl font-semibold transition-colors"
              style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }}
            >
              Teste grátis
            </Link>
            <button className="md:hidden p-2 rounded-lg hover:bg-accent" onClick={() => setMenuOpen(o => !o)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t px-4 py-4 space-y-3 text-sm" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            {['Funcionalidades', 'Como funciona', 'Planos', 'Depoimentos'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className="block py-1 text-muted-foreground hover:text-foreground" onClick={() => setMenuOpen(false)}>{item}</a>
            ))}
            <Link href="/entrar" className="block py-1 text-muted-foreground hover:text-foreground" onClick={() => setMenuOpen(false)}>Entrar</Link>
          </div>
        )}
      </header>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <FadeUp delay={0}>
                <span
                  className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-6"
                  style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}
                >
                  <Zap className="w-3.5 h-3.5" /> Sistema completo para barbearias
                </span>
              </FadeUp>

              <FadeUp delay={0.05}>
                <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-5">
                  Gerencie sua barbearia<br />
                  <span style={{ color: 'hsl(var(--primary))' }}>como nunca antes</span>
                </h1>
              </FadeUp>

              <FadeUp delay={0.1}>
                <p className="text-lg text-muted-foreground mb-8 max-w-md">
                  Agenda, financeiro, estoque e muito mais — tudo em um só lugar. Simplifique sua operação e foque no que importa: seus clientes.
                </p>
              </FadeUp>

              <FadeUp delay={0.15}>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/registrar"
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm shadow-lg transition-all hover:opacity-90"
                    style={{ backgroundColor: 'hsl(var(--primary))', color: 'white', boxShadow: '0 8px 24px hsl(var(--primary) / 0.35)' }}
                  >
                    Criar conta grátis <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href="#como-funciona"
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm border transition-colors hover:bg-accent"
                    style={{ borderColor: 'hsl(var(--border))' }}
                  >
                    Ver demonstração
                  </a>
                </div>
              </FadeUp>

              <FadeUp delay={0.2}>
                <div className="flex flex-wrap gap-6 mt-10">
                  {stats.map(({ value, label }) => (
                    <div key={label}>
                      <p className="text-2xl font-extrabold" style={{ color: 'hsl(var(--primary))' }}>{value}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </FadeUp>
            </div>

            {/* Right — mockup */}
            <FadeUp delay={0.1} className="hidden lg:block">
              <DashboardMockup />
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-14">
            <p className="text-sm font-semibold mb-3" style={{ color: 'hsl(var(--primary))' }}>FUNCIONALIDADES</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Tudo que sua barbearia precisa</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Uma plataforma unificada que cobre desde o agendamento até o fechamento do caixa.</p>
          </FadeUp>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <FadeUp key={title} delay={i * 0.04}>
                <motion.div
                  className="p-5 rounded-2xl border h-full transition-shadow"
                  style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                  whileHover={{ y: -4, boxShadow: '0 12px 32px hsl(var(--primary) / 0.12)' }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}
                  >
                    <Icon className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
                  </div>
                  <h3 className="font-semibold text-sm mb-1.5">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section id="como-funciona" className="py-20 px-4 sm:px-6" style={{ backgroundColor: 'hsl(var(--card))' }}>
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-14">
            <p className="text-sm font-semibold mb-3" style={{ color: 'hsl(var(--primary))' }}>COMO FUNCIONA</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Pronto em minutos</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Configure sua barbearia e comece a usar sem necessidade de treinamento.</p>
          </FadeUp>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Crie sua conta',        desc: 'Cadastre sua barbearia, adicione os profissionais e configure os serviços oferecidos.' },
              { step: '02', title: 'Configure a agenda',    desc: 'Defina horários de funcionamento, bloqueios e o portal do cliente para agendamentos online.' },
              { step: '03', title: 'Gerencie e cresça',     desc: 'Acompanhe o financeiro, estoque e desempenho em tempo real pelo dashboard.' },
            ].map(({ step, title, desc }, i) => (
              <FadeUp key={step} delay={i * 0.1}>
                <div className="flex gap-5">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-bold text-sm"
                    style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }}
                  >
                    {step}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANS ─────────────────────────────────────────────────────────── */}
      <section id="planos" className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-14">
            <p className="text-sm font-semibold mb-3" style={{ color: 'hsl(var(--primary))' }}>PLANOS</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Simples e transparente</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">14 dias grátis em qualquer plano. Sem cartão de crédito.</p>
          </FadeUp>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map(({ name, price, period, desc, features: fs, cta, highlight }, i) => (
              <FadeUp key={name} delay={i * 0.08}>
                <div
                  className="rounded-2xl border p-6 h-full flex flex-col relative"
                  style={{
                    backgroundColor: highlight ? 'hsl(var(--primary))' : 'hsl(var(--card))',
                    borderColor: highlight ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                    color: highlight ? 'white' : 'inherit',
                    boxShadow: highlight ? '0 20px 48px hsl(var(--primary) / 0.35)' : undefined,
                  }}
                >
                  {highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full bg-white" style={{ color: 'hsl(var(--primary))' }}>
                      Mais popular
                    </span>
                  )}
                  <div className="mb-5">
                    <p className="font-bold text-base mb-1">{name}</p>
                    <div className="flex items-end gap-1 mb-2">
                      <span className="text-3xl font-extrabold">{price}</span>
                      <span className="text-sm pb-0.5 opacity-70">{period}</span>
                    </div>
                    <p className="text-sm opacity-70">{desc}</p>
                  </div>
                  <ul className="space-y-2.5 flex-1 mb-6">
                    {fs.map(f => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <Check className="w-4 h-4 shrink-0" style={{ color: highlight ? 'white' : 'hsl(var(--primary))' }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/registrar"
                    className="block text-center py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    style={highlight
                      ? { backgroundColor: 'white', color: 'hsl(var(--primary))' }
                      : { backgroundColor: 'hsl(var(--primary))', color: 'white' }
                    }
                  >
                    {cta}
                  </Link>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────────── */}
      <section id="depoimentos" className="py-20 px-4 sm:px-6" style={{ backgroundColor: 'hsl(var(--card))' }}>
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-14">
            <p className="text-sm font-semibold mb-3" style={{ color: 'hsl(var(--primary))' }}>DEPOIMENTOS</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold">Quem usa, aprova</h2>
          </FadeUp>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(({ name, role, text }, i) => (
              <FadeUp key={name} delay={i * 0.08}>
                <div
                  className="p-6 rounded-2xl border h-full"
                  style={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                >
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: 5 }).map((_, k) => (
                      <Star key={k} className="w-4 h-4 fill-current" style={{ color: 'hsl(var(--primary))' }} />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">"{text}"</p>
                  <div>
                    <p className="font-semibold text-sm">{name}</p>
                    <p className="text-xs text-muted-foreground">{role}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6">
        <FadeUp>
          <div
            className="max-w-3xl mx-auto text-center rounded-3xl p-12"
            style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }}
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Comece hoje mesmo</h2>
            <p className="opacity-80 mb-8 max-w-md mx-auto">14 dias grátis, sem cartão de crédito. Configure em minutos e veja a diferença.</p>
            <Link
              href="/registrar"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm bg-white transition-opacity hover:opacity-90"
              style={{ color: 'hsl(var(--primary))' }}
            >
              Criar conta grátis <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </FadeUp>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="border-t py-8 px-4 sm:px-6" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--primary))' }}>
              <Scissors className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-sm">Barberstack</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Barberstack. Todos os direitos reservados.</p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
            <a href="#" className="hover:text-foreground transition-colors">Termos</a>
            <a href="#" className="hover:text-foreground transition-colors">Suporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
