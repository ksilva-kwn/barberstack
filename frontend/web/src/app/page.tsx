'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  motion, useScroll, AnimatePresence,
} from 'framer-motion';
import {
  Scissors, Menu, X, Calendar, Receipt, TrendingUp, Users,
  Repeat2, Building2, Package, UtensilsCrossed, Check,
  ArrowRight, Star, Instagram, Youtube, Twitter,
} from 'lucide-react';

// ─── Colors ──────────────────────────────────────────────────────────────────
const C = {
  bg:     '#0E1114',
  bgAlt:  '#0B0E11',
  card:   '#141A1F',
  card2:  '#171D23',
  border: '#1E252D',
  accent: '#BB1A23',
  text:   '#E6E3DE',
  muted:  'rgba(230,227,222,0.55)',
  faint:  'rgba(230,227,222,0.35)',
};

// ─── Variants ─────────────────────────────────────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 32 },
  visible: (delay = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
  }),
};
const stagger = (delay = 0.08) => ({
  hidden:  {},
  visible: { transition: { staggerChildren: delay } },
});
const cardHover = {
  rest:  { y: 0,  boxShadow: '0 0 0 0 rgba(187,26,35,0)' },
  hover: { y: -5, boxShadow: '0 16px 40px -8px rgba(187,26,35,0.22)', transition: { duration: 0.25 } },
};

function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      custom={delay}
      variants={fadeUp}
    >
      {children}
    </motion.div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const features = [
  { Icon: Calendar,        title: 'Agenda Inteligente', desc: 'Agendamento online para seus clientes, com notificações automáticas e controle de horários dos profissionais.' },
  { Icon: Receipt,         title: 'Caixa',              desc: 'Controle completo do caixa com abertura, fechamento, sangrias e suprimentos. Tudo registrado e organizado.' },
  { Icon: TrendingUp,      title: 'Financeiro',         desc: 'Relatórios financeiros detalhados, fluxo de caixa, contas a pagar e receber. Visão total do seu negócio.' },
  { Icon: Users,           title: 'Clientes',           desc: 'Cadastro completo de clientes com histórico de atendimentos, preferências e dados de contato.' },
  { Icon: Repeat2,         title: 'Assinaturas',        desc: 'Ofereça planos de assinatura para seus clientes com cobrança recorrente e gestão automatizada.' },
  { Icon: Building2,       title: 'Barbearia',          desc: 'Configure sua página de agendamento, cadastre profissionais, serviços, filiais e personalize tudo.' },
  { Icon: Package,         title: 'Estoque',            desc: 'Controle de produtos, alertas de estoque baixo, histórico de movimentações e relatórios completos.' },
  { Icon: UtensilsCrossed, title: 'Bar & Cozinha',      desc: 'Gerencie o bar e cozinha da sua barbearia com cardápio digital, pedidos e controle de consumo.' },
];

const steps = [
  { num: '01', title: 'Crie sua conta',               desc: 'Cadastre-se em menos de 2 minutos. Sem cartão de crédito, sem compromisso.' },
  { num: '02', title: 'Configure sua barbearia',      desc: 'Cadastre profissionais, serviços, horários e personalize sua página de agendamento.' },
  { num: '03', title: 'Compartilhe com clientes',     desc: 'Envie o link de agendamento para seus clientes e comece a receber reservas.' },
  { num: '04', title: 'Gerencie tudo em um só lugar', desc: 'Acompanhe agenda, financeiro, estoque e muito mais pelo painel completo.' },
];

const plans = [
  {
    name: 'Básico', price: '89', desc: 'Ideal para barbearias que estão começando', highlight: false,
    features: ['1 profissional', 'Agenda online', 'Caixa e financeiro básico', 'Cadastro de clientes', 'Suporte por email'],
  },
  {
    name: 'Profissional', price: '149', desc: 'Para barbearias em crescimento', highlight: true,
    features: ['Até 5 profissionais', 'Agenda online ilimitada', 'Financeiro completo', 'Cadastro de clientes', 'Assinaturas e cobranças', 'Controle de estoque', 'Suporte prioritário'],
  },
  {
    name: 'Premium', price: '249', desc: 'Para redes e barbearias completas', highlight: false,
    features: ['Profissionais ilimitados', 'Múltiplas filiais', 'Todos os módulos inclusos', 'Bar e cozinha', 'Relatórios avançados', 'API e integrações', 'Gerente de conta dedicado'],
  },
];

const testimonials = [
  { text: 'O Barberstack transformou a forma como gerencio minha barbearia. A agenda online reduziu em 80% os no-shows e o financeiro me dá total controle.', name: 'Ricardo Almeida', role: 'Dono — Barbearia Vintage' },
  { text: 'Com 3 filiais, precisávamos de algo robusto. O Barberstack entrega tudo: estoque, bar, assinaturas. É completo demais.', name: 'Felipe Costa', role: 'Gerente — Kings Barbershop' },
  { text: 'Super fácil de usar. Meus clientes adoram agendar online e eu consigo focar no que importa: cortar cabelo e atender bem.', name: 'André Santos', role: 'Barbeiro — Studio AS' },
];

const footerLinks = {
  Produto:  ['Funcionalidades', 'Planos', 'Integrações', 'Novidades'],
  Empresa:  ['Sobre nós', 'Blog', 'Carreiras', 'Contato'],
  Suporte:  ['Central de ajuda', 'Documentação', 'Status', 'API'],
  Legal:    ['Termos de uso', 'Privacidade', 'Cookies'],
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => {
    const unsub = scrollY.on('change', v => setScrolled(v > 20));
    return unsub;
  }, [scrollY]);

  const navLinks = [
    { label: 'Funcionalidades', href: '#funcionalidades' },
    { label: 'Como funciona',   href: '#como-funciona'   },
    { label: 'Planos',          href: '#planos'           },
    { label: 'Depoimentos',     href: '#depoimentos'      },
  ];

  return (
    <div style={{ backgroundColor: C.bg, color: C.text, fontFamily: "'Helvetica Now Display','Helvetica Neue','Barlow',Helvetica,Arial,sans-serif" }}>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <motion.header
        className="fixed top-0 inset-x-0 z-50 border-b"
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{
          backgroundColor: scrolled ? 'rgba(14,17,20,0.97)' : 'rgba(14,17,20,0.82)',
          borderColor: C.border,
          backdropFilter: 'blur(14px)',
          boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,0.45)' : 'none',
          transition: 'box-shadow 0.3s, background-color 0.3s',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <motion.div
              whileHover={{ scale: 1.1, rotate: -8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 12 }}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: C.accent, boxShadow: '0 0 18px rgba(187,26,35,0.50)' }}
            >
              <Scissors className="w-4 h-4 text-white" />
            </motion.div>
            <span className="font-semibold text-lg tracking-tight" style={{ color: C.text }}>Barberstack</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((l, i) => (
              <motion.a
                key={l.href}
                href={l.href}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                className="text-sm font-medium relative group"
                style={{ color: C.muted }}
                whileHover={{ color: C.text }}
              >
                {l.label}
                <span className="absolute -bottom-0.5 left-0 h-px w-0 group-hover:w-full transition-all duration-300 rounded-full" style={{ backgroundColor: C.accent }} />
              </motion.a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              <Link href="/login" className="text-sm font-medium px-4 py-2 rounded-lg" style={{ color: C.muted }}>Entrar</Link>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
              <Link
                href="/register"
                className="text-sm font-semibold px-5 py-2 rounded-lg inline-block"
                style={{ backgroundColor: C.accent, color: '#fff', boxShadow: '0 4px 20px rgba(187,26,35,0.40)' }}
              >
                Teste grátis
              </Link>
            </motion.div>
          </div>

          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)} style={{ color: C.text }}>
            <AnimatePresence mode="wait">
              {mobileOpen
                ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X className="w-5 h-5" /></motion.div>
                : <motion.div key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Menu className="w-5 h-5" /></motion.div>
              }
            </AnimatePresence>
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="md:hidden overflow-hidden border-t px-6"
              style={{ backgroundColor: C.bg, borderColor: C.border }}
            >
              <div className="pt-4 pb-4 space-y-2">
                {navLinks.map(l => (
                  <a key={l.href} href={l.href} className="block text-sm font-medium py-1.5" style={{ color: C.muted }} onClick={() => setMobileOpen(false)}>{l.label}</a>
                ))}
                <div className="pt-2 flex flex-col gap-2">
                  <Link href="/login" className="text-sm font-medium py-2 text-center rounded-lg border" style={{ color: C.text, borderColor: C.border }}>Entrar</Link>
                  <Link href="/register" className="text-sm font-semibold py-2 text-center rounded-lg" style={{ backgroundColor: C.accent, color: '#fff' }}>Teste grátis</Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden min-h-screen flex items-center">
        {/* Ambient glows */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 55% 50% at 65% 50%, rgba(187,26,35,0.10) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 40% 50% at 15% 60%, rgba(187,26,35,0.05) 0%, transparent 65%)' }} />

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <motion.div initial="hidden" animate="visible" variants={stagger(0.10)}>
            <motion.div variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } }}>
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium tracking-widest uppercase mb-8 border"
                style={{ color: C.accent, borderColor: 'rgba(187,26,35,0.35)', backgroundColor: 'rgba(187,26,35,0.07)' }}
              >
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full inline-block"
                  style={{ backgroundColor: C.accent }}
                />
                Sistema completo para barbearias
              </div>
            </motion.div>

            <motion.h1
              variants={{ hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.65, delay: 0.05 } } }}
              className="text-5xl lg:text-6xl font-bold leading-[1.08] mb-6"
              style={{ color: C.text, letterSpacing: '-0.02em' }}
            >
              Gerencie sua barbearia{' '}
              <span style={{ color: C.accent, textShadow: '0 0 36px rgba(187,26,35,0.45)' }}>
                como nunca antes
              </span>
            </motion.h1>

            <motion.p
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.12 } } }}
              className="text-lg mb-10 leading-relaxed max-w-lg"
              style={{ color: C.muted }}
            >
              Agenda, financeiro, estoque e muito mais — tudo em um só lugar.
              Simplifique sua operação e foque no que importa: seus clientes.
            </motion.p>

            <motion.div
              variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.20 } } }}
              className="flex flex-wrap items-center gap-3 mb-14"
            >
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link href="/register" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: C.accent, color: '#fff', boxShadow: '0 8px 32px rgba(187,26,35,0.42)' }}>
                  Criar conta grátis <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <a href="#como-funciona" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-sm font-medium border"
                  style={{ borderColor: C.border, color: C.text }}>
                  Ver demonstração
                </a>
              </motion.div>
            </motion.div>

            <motion.div
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.5, delay: 0.35 } } }}
              className="flex flex-wrap gap-10"
            >
              {[{ value: '2.500+', label: 'Barbearias' }, { value: '156%', label: 'Aumento médio de receita' }, { value: '99,9%', label: 'Uptime garantido' }].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}>
                  <p className="text-2xl font-bold" style={{ color: C.text }}>{s.value}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.faint }}>{s.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right — dashboard mockup */}
          <motion.div
            className="hidden lg:flex items-center justify-center"
            initial={{ opacity: 0, x: 52 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.85, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative w-full max-w-md"
              style={{ filter: 'drop-shadow(0 32px 64px rgba(0,0,0,0.65)) drop-shadow(0 0 48px rgba(187,26,35,0.14))' }}
            >
              <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: C.card, borderColor: C.border }}>
                {/* Window chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: C.border, backgroundColor: C.card2 }}>
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                  <div className="flex-1 h-5 rounded mx-4" style={{ backgroundColor: C.border }} />
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[{ label: 'Faturamento', val: 'R$8.4k', hi: true }, { label: 'Cortes', val: '312', hi: false }, { label: 'Comandas', val: '7', hi: false }].map((k, i) => (
                      <motion.div key={k.label}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + i * 0.10 }}
                        className="rounded-xl p-3.5 border"
                        style={{ backgroundColor: C.bgAlt, borderColor: k.hi ? 'rgba(187,26,35,0.40)' : C.border, boxShadow: k.hi ? '0 0 20px rgba(187,26,35,0.14)' : 'none' }}
                      >
                        <p className="text-[10px] mb-1.5" style={{ color: 'rgba(230,227,222,0.40)' }}>{k.label}</p>
                        <p className="text-sm font-bold" style={{ color: k.hi ? C.accent : C.text }}>{k.val}</p>
                      </motion.div>
                    ))}
                  </div>

                  <div className="rounded-xl border p-4" style={{ backgroundColor: C.bgAlt, borderColor: C.border }}>
                    <p className="text-[10px] mb-4" style={{ color: 'rgba(230,227,222,0.40)' }}>Faturamento Mensal</p>
                    <div className="flex items-end gap-2 h-16">
                      {[40, 65, 50, 80, 60, 95, 72].map((h, i) => (
                        <motion.div key={i} className="flex-1 rounded-t"
                          initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: 0.95 + i * 0.07, duration: 0.5, ease: 'easeOut' }}
                          style={{ backgroundColor: i === 5 ? C.accent : 'rgba(187,26,35,0.20)', boxShadow: i === 5 ? '0 0 14px rgba(187,26,35,0.50)' : 'none' }}
                        />
                      ))}
                    </div>
                  </div>

                  {['Samuel — Corte + Barba', 'Pedro — Corte'].map((item, i) => (
                    <motion.div key={item}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.3 + i * 0.1 }}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ backgroundColor: C.border }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: C.accent }} />
                      <span className="text-[11px]" style={{ color: C.muted }}>{item}</span>
                      <span className="ml-auto text-[10px]" style={{ color: C.faint }}>Hoje</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Floating badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.75, x: 16 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ delay: 1.6, type: 'spring', stiffness: 220, damping: 16 }}
                className="absolute -bottom-6 -right-6 rounded-xl border px-4 py-3 flex items-center gap-3"
                style={{ backgroundColor: C.card, borderColor: 'rgba(187,26,35,0.32)', boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 0 20px rgba(187,26,35,0.14)' }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(187,26,35,0.14)' }}>
                  <TrendingUp className="w-4 h-4" style={{ color: C.accent }} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold" style={{ color: C.text }}>+23% este mês</p>
                  <p className="text-[10px]" style={{ color: C.faint }}>vs. mês anterior</p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── FUNCIONALIDADES ─────────────────────────────────────────────── */}
      <section id="funcionalidades" className="py-24 px-6" style={{ backgroundColor: C.bgAlt }}>
        <div className="max-w-7xl mx-auto">
          <FadeUp className="text-center mb-16">
            <p className="text-xs font-medium tracking-widest uppercase mb-4" style={{ color: C.accent }}>Funcionalidades</p>
            <h2 className="text-4xl lg:text-5xl font-bold mb-5" style={{ color: C.text, letterSpacing: '-0.02em' }}>Tudo que sua barbearia precisa</h2>
            <p className="text-base max-w-2xl mx-auto" style={{ color: C.muted }}>Uma plataforma completa para gerenciar cada aspecto do seu negócio, do agendamento ao bar.</p>
          </FadeUp>

          <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger(0.07)}>
            {features.map(({ Icon, title, desc }) => (
              <motion.div key={title} variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55 } } }}
                initial="rest" whileHover="hover" animate="rest">
                <motion.div variants={cardHover} className="flex gap-5 p-6 rounded-2xl border h-full cursor-default"
                  style={{ backgroundColor: C.card, borderColor: C.border }}>
                  <motion.div
                    whileHover={{ scale: 1.12, rotate: -6 }}
                    transition={{ type: 'spring', stiffness: 320 }}
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'rgba(187,26,35,0.12)' }}
                  >
                    <Icon className="w-5 h-5" style={{ color: C.accent }} />
                  </motion.div>
                  <div>
                    <h3 className="font-semibold text-base mb-1.5" style={{ color: C.text }}>{title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{desc}</p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ───────────────────────────────────────────────── */}
      <section id="como-funciona" className="py-24 px-6" style={{ backgroundColor: C.bg }}>
        <div className="max-w-7xl mx-auto">
          <FadeUp className="text-center mb-16">
            <p className="text-xs font-medium tracking-widest uppercase mb-4" style={{ color: C.accent }}>Como funciona</p>
            <h2 className="text-4xl lg:text-5xl font-bold mb-5" style={{ color: C.text, letterSpacing: '-0.02em' }}>Simples de começar</h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: C.muted }}>Em poucos passos sua barbearia estará funcionando no Barberstack.</p>
          </FadeUp>

          <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 max-w-4xl mx-auto"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger(0.13)}>
            {steps.map((s) => (
              <motion.div key={s.num} variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55 } } }} className="flex gap-6">
                <p className="text-6xl font-bold shrink-0 leading-none select-none" style={{ color: 'rgba(187,26,35,0.22)', fontVariantNumeric: 'tabular-nums' }}>
                  {s.num}
                </p>
                <div className="pt-1">
                  <h3 className="font-semibold text-lg mb-2" style={{ color: C.text }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── PLANOS ──────────────────────────────────────────────────────── */}
      <section id="planos" className="py-24 px-6" style={{ backgroundColor: C.bgAlt }}>
        <div className="max-w-7xl mx-auto">
          <FadeUp className="text-center mb-16">
            <p className="text-xs font-medium tracking-widest uppercase mb-4" style={{ color: C.accent }}>Planos</p>
            <h2 className="text-4xl lg:text-5xl font-bold mb-5" style={{ color: C.text, letterSpacing: '-0.02em' }}>Escolha o plano ideal</h2>
            <p className="text-base" style={{ color: C.muted }}>Todos os planos incluem 14 dias de teste grátis. Sem fidelidade.</p>
          </FadeUp>

          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger(0.1)}>
            {plans.map((plan) => (
              <motion.div key={plan.name}
                variants={{ hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } }}
                whileHover={plan.highlight
                  ? { y: -7, boxShadow: '0 24px 60px -12px rgba(187,26,35,0.38)' }
                  : { y: -4, boxShadow: '0 16px 40px -8px rgba(0,0,0,0.45)' }
                }
                transition={{ duration: 0.25 }}
                className="relative rounded-2xl border p-8 flex flex-col"
                style={{
                  backgroundColor: plan.highlight ? C.card : C.bg,
                  borderColor: plan.highlight ? C.accent : C.border,
                  boxShadow: plan.highlight ? '0 8px 32px rgba(187,26,35,0.18)' : 'none',
                }}
              >
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: C.accent, color: '#fff', boxShadow: '0 4px 16px rgba(187,26,35,0.55)' }}>
                    ✦ Mais popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="font-bold text-xl mb-1" style={{ color: C.text }}>{plan.name}</h3>
                  <p className="text-sm" style={{ color: C.faint }}>{plan.desc}</p>
                </div>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-sm font-medium" style={{ color: C.muted }}>R$</span>
                  <span className="text-5xl font-bold" style={{ color: C.text }}>{plan.price}</span>
                  <span className="text-sm" style={{ color: C.faint }}>/mês</span>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link href="/register" className="w-full py-3 rounded-xl text-sm font-semibold text-center mb-8 block"
                    style={plan.highlight
                      ? { backgroundColor: C.accent, color: '#fff', boxShadow: '0 4px 16px rgba(187,26,35,0.45)' }
                      : { backgroundColor: C.card2, color: C.text }}>
                    Começar teste grátis
                  </Link>
                </motion.div>
                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm" style={{ color: 'rgba(230,227,222,0.70)' }}>
                      <Check className="w-4 h-4 shrink-0" style={{ color: C.accent }} />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ─────────────────────────────────────────────────── */}
      <section id="depoimentos" className="py-24 px-6" style={{ backgroundColor: C.bg }}>
        <div className="max-w-7xl mx-auto">
          <FadeUp className="text-center mb-16">
            <p className="text-xs font-medium tracking-widest uppercase mb-4" style={{ color: C.accent }}>Depoimentos</p>
            <h2 className="text-4xl lg:text-5xl font-bold" style={{ color: C.text, letterSpacing: '-0.02em' }}>Quem usa, recomenda</h2>
          </FadeUp>

          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger(0.1)}>
            {testimonials.map((t, i) => (
              <motion.div key={t.name}
                variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55 } } }}
                whileHover={{ y: -5, boxShadow: '0 16px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(187,26,35,0.22)' }}
                transition={{ duration: 0.25 }}
                className="p-7 rounded-2xl border flex flex-col gap-5"
                style={{ backgroundColor: C.card, borderColor: C.border }}
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <motion.div key={j}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + i * 0.08 + j * 0.06, type: 'spring', stiffness: 280 }}
                    >
                      <Star className="w-4 h-4 fill-current" style={{ color: C.accent }} />
                    </motion.div>
                  ))}
                </div>
                <p className="text-sm leading-relaxed flex-1" style={{ color: 'rgba(230,227,222,0.70)' }}>&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="font-semibold text-sm" style={{ color: C.text }}>{t.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.faint }}>{t.role}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ backgroundColor: C.bgAlt }}>
        <FadeUp>
          <div className="max-w-4xl mx-auto text-center rounded-3xl border px-8 py-20 relative overflow-hidden"
            style={{ backgroundColor: C.card, borderColor: C.border }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(187,26,35,0.13) 0%, transparent 70%)' }} />
            <motion.div className="absolute inset-0 pointer-events-none"
              animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 4, repeat: Infinity }}
              style={{ background: 'radial-gradient(ellipse 50% 40% at 50% 110%, rgba(187,26,35,0.08) 0%, transparent 60%)' }}
            />
            <p className="text-xs font-medium tracking-widest uppercase mb-6" style={{ color: C.accent }}>Comece hoje</p>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6" style={{ color: C.text, letterSpacing: '-0.02em' }}>
              Pronto para revolucionar<br />sua barbearia?
            </h2>
            <p className="text-base mb-10 max-w-xl mx-auto" style={{ color: C.muted }}>
              Junte-se a mais de 2.500 barbearias que já estão usando o Barberstack para amplificar sua gestão.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link href="/register" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold"
                  style={{ backgroundColor: C.accent, color: '#fff', boxShadow: '0 8px 32px rgba(187,26,35,0.48)' }}>
                  Criar conta grátis <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <a href="#" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-medium border"
                  style={{ borderColor: C.border, color: C.text }}>
                  Falar com vendas
                </a>
              </motion.div>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t px-6 pt-16 pb-10" style={{ borderColor: C.border, backgroundColor: C.bg }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: C.accent, boxShadow: '0 0 14px rgba(187,26,35,0.38)' }}>
                  <Scissors className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-base" style={{ color: C.text }}>Barberstack</span>
              </Link>
              <p className="text-xs leading-relaxed" style={{ color: C.faint }}>O sistema completo para barbearias modernas.</p>
            </div>
            {Object.entries(footerLinks).map(([group, links]) => (
              <div key={group}>
                <p className="text-xs font-semibold tracking-wider uppercase mb-5" style={{ color: 'rgba(230,227,222,0.28)' }}>{group}</p>
                <ul className="space-y-3">
                  {links.map((l) => (
                    <li key={l}>
                      <motion.a href="#" className="text-sm" style={{ color: C.muted }} whileHover={{ color: C.text, x: 2 }} transition={{ duration: 0.15 }}>{l}</motion.a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t" style={{ borderColor: C.border }}>
            <p className="text-xs" style={{ color: 'rgba(230,227,222,0.28)' }}>© 2026 Barberstack. Todos os direitos reservados.</p>
            <div className="flex items-center gap-4">
              {[Instagram, Youtube, Twitter].map((Icon, i) => (
                <motion.a key={i} href="#" whileHover={{ scale: 1.2, color: C.accent }} transition={{ duration: 0.15 }} style={{ color: C.faint }}>
                  <Icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
