'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Scissors, Menu, X, Calendar, Receipt, TrendingUp, Users,
  Repeat2, Building2, Package, UtensilsCrossed, Check,
  ArrowRight, Star, Instagram, Youtube, Twitter,
} from 'lucide-react';

// ─── Data ────────────────────────────────────────────────────────────────────

const features = [
  {
    Icon: Calendar,
    title: 'Agenda Inteligente',
    desc: 'Agendamento online para seus clientes, com notificações automáticas e controle de horários dos profissionais.',
  },
  {
    Icon: Receipt,
    title: 'Caixa',
    desc: 'Controle completo do caixa com abertura, fechamento, sangrias e suprimentos. Tudo registrado e organizado.',
  },
  {
    Icon: TrendingUp,
    title: 'Financeiro',
    desc: 'Relatórios financeiros detalhados, fluxo de caixa, contas a pagar e receber. Visão total do seu negócio.',
  },
  {
    Icon: Users,
    title: 'Clientes',
    desc: 'Cadastro completo de clientes com histórico de atendimentos, preferências e dados de contato.',
  },
  {
    Icon: Repeat2,
    title: 'Assinaturas',
    desc: 'Ofereça planos de assinatura para seus clientes com cobrança recorrente e gestão automatizada.',
  },
  {
    Icon: Building2,
    title: 'Barbearia',
    desc: 'Configure sua página de agendamento, cadastre profissionais, serviços, filiais e personalize tudo.',
  },
  {
    Icon: Package,
    title: 'Estoque',
    desc: 'Controle de produtos, alertas de estoque baixo, histórico de movimentações e relatórios completos.',
  },
  {
    Icon: UtensilsCrossed,
    title: 'Bar & Cozinha',
    desc: 'Gerencie o bar e cozinha da sua barbearia com cardápio digital, pedidos e controle de consumo.',
  },
];

const steps = [
  { num: '01', title: 'Crie sua conta', desc: 'Cadastre-se em menos de 2 minutos. Sem cartão de crédito, sem compromisso.' },
  { num: '02', title: 'Configure sua barbearia', desc: 'Cadastre profissionais, serviços, horários e personalize sua página de agendamento.' },
  { num: '03', title: 'Compartilhe com clientes', desc: 'Envie o link de agendamento para seus clientes e comece a receber reservas.' },
  { num: '04', title: 'Gerencie tudo em um só lugar', desc: 'Acompanhe agenda, financeiro, estoque e muito mais pelo painel completo.' },
];

const plans = [
  {
    name: 'Básico',
    price: '89',
    desc: 'Ideal para barbearias que estão começando',
    features: ['1 profissional', 'Agenda online', 'Caixa e financeiro básico', 'Cadastro de clientes', 'Suporte por email'],
    highlight: false,
  },
  {
    name: 'Profissional',
    price: '149',
    desc: 'Para barbearias em crescimento',
    features: ['Até 5 profissionais', 'Agenda online ilimitada', 'Financeiro completo', 'Cadastro de clientes', 'Assinaturas e cobranças', 'Controle de estoque', 'Suporte prioritário'],
    highlight: true,
  },
  {
    name: 'Premium',
    price: '249',
    desc: 'Para redes e barbearias completas',
    features: ['Profissionais ilimitados', 'Múltiplas filiais', 'Todos os módulos inclusos', 'Bar e cozinha', 'Relatórios avançados', 'API e integrações', 'Gerente de conta dedicado'],
    highlight: false,
  },
];

const testimonials = [
  {
    text: 'O Barberstack transformou a forma como gerencio minha barbearia. A agenda online reduziu em 80% os no-shows e o financeiro me dá total controle.',
    name: 'Ricardo Almeida',
    role: 'Dono — Barbearia Vintage',
  },
  {
    text: 'Com 3 filiais, precisávamos de algo robusto. O Barberstack entrega tudo: estoque, bar, assinaturas. É completo demais.',
    name: 'Felipe Costa',
    role: 'Gerente — Kings Barbershop',
  },
  {
    text: 'Super fácil de usar. Meus clientes adoram agendar online e eu consigo focar no que importa: cortar cabelo e atender bem.',
    name: 'André Santos',
    role: 'Barbeiro — Studio AS',
  },
];

const footerLinks = {
  Produto: ['Funcionalidades', 'Planos', 'Integrações', 'Novidades'],
  Empresa: ['Sobre nós', 'Blog', 'Carreiras', 'Contato'],
  Suporte: ['Central de ajuda', 'Documentação', 'Status', 'API'],
  Legal: ['Termos de uso', 'Privacidade', 'Cookies'],
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: 'Funcionalidades', href: '#funcionalidades' },
    { label: 'Como funciona',   href: '#como-funciona'   },
    { label: 'Planos',          href: '#planos'           },
    { label: 'Depoimentos',     href: '#depoimentos'      },
  ];

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: '#0A0908',
        color: '#E6E3DE',
        fontFamily: "'Helvetica Now Display', 'Helvetica Neue', 'Barlow', Helvetica, Arial, sans-serif",
      }}
    >

      {/* ── NAV ───────────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 inset-x-0 z-50 border-b"
        style={{ backgroundColor: 'rgba(10,9,8,0.92)', borderColor: '#252220', backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#B8A98A' }}
            >
              <Scissors className="w-4 h-4" style={{ color: '#0A0908' }} />
            </div>
            <span className="font-semibold text-lg tracking-tight" style={{ color: '#E6E3DE' }}>
              Barberstack
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium transition-colors"
                style={{ color: 'rgba(230,227,222,0.65)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#E6E3DE')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(230,227,222,0.65)')}
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              style={{ color: 'rgba(230,227,222,0.65)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#E6E3DE')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(230,227,222,0.65)')}
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold px-5 py-2 rounded-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#B8A98A', color: '#0A0908' }}
            >
              Teste grátis
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-md"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ color: '#E6E3DE' }}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t px-6 py-4 space-y-3" style={{ backgroundColor: '#0A0908', borderColor: '#252220' }}>
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="block text-sm font-medium py-1.5"
                style={{ color: 'rgba(230,227,222,0.65)' }}
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </a>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <Link href="/login" className="text-sm font-medium py-2 text-center rounded-lg border" style={{ color: '#E6E3DE', borderColor: '#252220' }}>Entrar</Link>
              <Link href="/register" className="text-sm font-semibold py-2 text-center rounded-lg" style={{ backgroundColor: '#B8A98A', color: '#0A0908' }}>Teste grátis</Link>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Decorative gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 70% 50%, rgba(184,169,138,0.07) 0%, transparent 70%)',
          }}
        />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            {/* Eyebrow */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium tracking-widest uppercase mb-8 border"
              style={{ color: '#B8A98A', borderColor: 'rgba(184,169,138,0.3)', backgroundColor: 'rgba(184,169,138,0.06)' }}
            >
              Sistema completo para barbearias
            </div>

            <h1
              className="text-5xl lg:text-6xl font-bold leading-[1.08] mb-6"
              style={{ color: '#E6E3DE', letterSpacing: '-0.02em' }}
            >
              Gerencie sua barbearia{' '}
              <span style={{ color: '#B8A98A' }}>como nunca antes</span>
            </h1>

            <p
              className="text-lg mb-10 leading-relaxed max-w-lg"
              style={{ color: 'rgba(230,227,222,0.60)' }}
            >
              Agenda, financeiro, estoque e muito mais — tudo em um só lugar.
              Simplifique sua operação e foque no que importa: seus clientes.
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-14">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#B8A98A', color: '#0A0908' }}
              >
                Criar conta grátis
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-sm font-medium border transition-colors hover:border-[#B8A98A]"
                style={{ borderColor: '#252220', color: '#E6E3DE' }}
              >
                Ver demonstração
              </a>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-10">
              {[
                { value: '2.500+', label: 'Barbearias' },
                { value: '156%',   label: 'Aumento médio de receita' },
                { value: '99,9%',  label: 'Uptime garantido' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-bold" style={{ color: '#E6E3DE' }}>{s.value}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(230,227,222,0.50)' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — decorative card */}
          <div className="hidden lg:flex items-center justify-center">
            <div
              className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden border"
              style={{ borderColor: '#252220', backgroundColor: '#141210' }}
            >
              {/* Fake dashboard preview */}
              <div className="absolute inset-0 p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#B8A98A' }} />
                  <div className="h-2 rounded-full w-24" style={{ backgroundColor: '#252220' }} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {['Faturamento', 'Cortes', 'Comandas'].map((label, i) => (
                    <div key={label} className="rounded-xl p-4 border" style={{ backgroundColor: '#1A1815', borderColor: '#2A2520' }}>
                      <p className="text-[10px] mb-2" style={{ color: 'rgba(230,227,222,0.45)' }}>{label}</p>
                      <p className="text-base font-bold" style={{ color: i === 0 ? '#B8A98A' : '#E6E3DE' }}>
                        {i === 0 ? 'R$8.4k' : i === 1 ? '312' : '7'}
                      </p>
                    </div>
                  ))}
                </div>
                {/* Fake chart bars */}
                <div className="flex-1 rounded-xl border p-4" style={{ backgroundColor: '#1A1815', borderColor: '#2A2520' }}>
                  <p className="text-[10px] mb-4" style={{ color: 'rgba(230,227,222,0.45)' }}>Faturamento Mensal</p>
                  <div className="flex items-end gap-2 h-16">
                    {[40, 65, 50, 80, 60, 95, 72].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t"
                        style={{ height: `${h}%`, backgroundColor: i === 5 ? '#B8A98A' : 'rgba(184,169,138,0.25)' }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FUNCIONALIDADES ───────────────────────────────────────────────── */}
      <section id="funcionalidades" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-xs font-medium tracking-widest uppercase mb-4" style={{ color: '#B8A98A' }}>
              Funcionalidades
            </p>
            <h2 className="text-4xl lg:text-5xl font-bold mb-5" style={{ color: '#E6E3DE', letterSpacing: '-0.02em' }}>
              Tudo que sua barbearia precisa
            </h2>
            <p className="text-base max-w-2xl mx-auto" style={{ color: 'rgba(230,227,222,0.55)' }}>
              Uma plataforma completa para gerenciar cada aspecto do seu negócio, do agendamento ao bar.
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map(({ Icon, title, desc }) => (
              <div
                key={title}
                className="flex gap-5 p-6 rounded-2xl border transition-colors"
                style={{ backgroundColor: '#141210', borderColor: '#252220' }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(184,169,138,0.3)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = '#252220')}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'rgba(184,169,138,0.12)' }}
                >
                  <Icon className="w-5 h-5" style={{ color: '#B8A98A' }} />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-1.5" style={{ color: '#E6E3DE' }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(230,227,222,0.55)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ─────────────────────────────────────────────────── */}
      <section
        id="como-funciona"
        className="py-24 px-6"
        style={{ backgroundColor: '#0E0C0B' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-medium tracking-widest uppercase mb-4" style={{ color: '#B8A98A' }}>
              Como funciona
            </p>
            <h2 className="text-4xl lg:text-5xl font-bold mb-5" style={{ color: '#E6E3DE', letterSpacing: '-0.02em' }}>
              Simples de começar
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: 'rgba(230,227,222,0.55)' }}>
              Em poucos passos sua barbearia estará funcionando no Barberstack.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 max-w-4xl mx-auto">
            {steps.map((s) => (
              <div key={s.num} className="flex gap-6">
                <p
                  className="text-6xl font-bold shrink-0 leading-none"
                  style={{ color: 'rgba(184,169,138,0.18)', fontVariantNumeric: 'tabular-nums' }}
                >
                  {s.num}
                </p>
                <div className="pt-1">
                  <h3 className="font-semibold text-lg mb-2" style={{ color: '#E6E3DE' }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(230,227,222,0.55)' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANOS ────────────────────────────────────────────────────────── */}
      <section id="planos" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-medium tracking-widest uppercase mb-4" style={{ color: '#B8A98A' }}>
              Planos
            </p>
            <h2 className="text-4xl lg:text-5xl font-bold mb-5" style={{ color: '#E6E3DE', letterSpacing: '-0.02em' }}>
              Escolha o plano ideal
            </h2>
            <p className="text-base" style={{ color: 'rgba(230,227,222,0.55)' }}>
              Todos os planos incluem 14 dias de teste grátis. Sem fidelidade.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className="relative rounded-2xl border p-8 flex flex-col"
                style={{
                  backgroundColor: plan.highlight ? '#141210' : '#0E0C0B',
                  borderColor: plan.highlight ? '#B8A98A' : '#252220',
                }}
              >
                {plan.highlight && (
                  <div
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: '#B8A98A', color: '#0A0908' }}
                  >
                    ✦ Mais popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="font-bold text-xl mb-1" style={{ color: '#E6E3DE' }}>{plan.name}</h3>
                  <p className="text-sm" style={{ color: 'rgba(230,227,222,0.50)' }}>{plan.desc}</p>
                </div>

                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-sm font-medium" style={{ color: 'rgba(230,227,222,0.55)' }}>R$</span>
                  <span className="text-5xl font-bold" style={{ color: '#E6E3DE' }}>{plan.price}</span>
                  <span className="text-sm" style={{ color: 'rgba(230,227,222,0.50)' }}>/mês</span>
                </div>

                <Link
                  href="/register"
                  className="w-full py-3 rounded-xl text-sm font-semibold text-center mb-8 transition-opacity hover:opacity-90"
                  style={
                    plan.highlight
                      ? { backgroundColor: '#B8A98A', color: '#0A0908' }
                      : { backgroundColor: '#1E1C1A', color: '#E6E3DE' }
                  }
                >
                  Começar teste grátis
                </Link>

                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm" style={{ color: 'rgba(230,227,222,0.70)' }}>
                      <Check className="w-4 h-4 shrink-0" style={{ color: '#B8A98A' }} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ───────────────────────────────────────────────────── */}
      <section
        id="depoimentos"
        className="py-24 px-6"
        style={{ backgroundColor: '#0E0C0B' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-medium tracking-widest uppercase mb-4" style={{ color: '#B8A98A' }}>
              Depoimentos
            </p>
            <h2 className="text-4xl lg:text-5xl font-bold" style={{ color: '#E6E3DE', letterSpacing: '-0.02em' }}>
              Quem usa, recomenda
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="p-7 rounded-2xl border flex flex-col gap-6"
                style={{ backgroundColor: '#141210', borderColor: '#252220' }}
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" style={{ color: '#B8A98A' }} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed flex-1" style={{ color: 'rgba(230,227,222,0.70)' }}>
                  &ldquo;{t.text}&rdquo;
                </p>
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#E6E3DE' }}>{t.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(230,227,222,0.45)' }}>{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div
          className="max-w-4xl mx-auto text-center rounded-3xl border px-8 py-20 relative overflow-hidden"
          style={{ backgroundColor: '#141210', borderColor: '#252220' }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(184,169,138,0.08) 0%, transparent 70%)' }}
          />
          <p className="text-xs font-medium tracking-widest uppercase mb-6" style={{ color: '#B8A98A' }}>
            Comece hoje
          </p>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6" style={{ color: '#E6E3DE', letterSpacing: '-0.02em' }}>
            Pronto para revolucionar<br />sua barbearia?
          </h2>
          <p className="text-base mb-10 max-w-xl mx-auto" style={{ color: 'rgba(230,227,222,0.55)' }}>
            Junte-se a mais de 2.500 barbearias que já estão usando o Barberstack para amplificar sua gestão e aumentar seus resultados.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#B8A98A', color: '#0A0908' }}
            >
              Criar conta grátis
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-medium border transition-colors"
              style={{ borderColor: '#252220', color: '#E6E3DE' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(184,169,138,0.4)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.borderColor = '#252220')}
            >
              Falar com vendas
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="border-t px-6 pt-16 pb-10" style={{ borderColor: '#252220', backgroundColor: '#0A0908' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
            {/* Brand */}
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#B8A98A' }}>
                  <Scissors className="w-4 h-4" style={{ color: '#0A0908' }} />
                </div>
                <span className="font-semibold text-base" style={{ color: '#E6E3DE' }}>Barberstack</span>
              </Link>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(230,227,222,0.45)' }}>
                O sistema completo para barbearias modernas.
              </p>
            </div>

            {/* Links */}
            {Object.entries(footerLinks).map(([group, links]) => (
              <div key={group}>
                <p className="text-xs font-semibold tracking-wider uppercase mb-5" style={{ color: 'rgba(230,227,222,0.35)' }}>
                  {group}
                </p>
                <ul className="space-y-3">
                  {links.map((l) => (
                    <li key={l}>
                      <a
                        href="#"
                        className="text-sm transition-colors"
                        style={{ color: 'rgba(230,227,222,0.55)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#E6E3DE')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(230,227,222,0.55)')}
                      >
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t" style={{ borderColor: '#252220' }}>
            <p className="text-xs" style={{ color: 'rgba(230,227,222,0.35)' }}>
              © 2026 Barberstack. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4">
              {[Instagram, Youtube, Twitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="transition-colors"
                  style={{ color: 'rgba(230,227,222,0.35)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#B8A98A')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(230,227,222,0.35)')}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
