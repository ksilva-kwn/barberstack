'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  motion, useScroll, useTransform, useSpring,
  AnimatePresence, MotionValue,
} from 'framer-motion';
import {
  Scissors, Menu, X, Calendar, Receipt, TrendingUp, Users,
  Repeat2, Package, UtensilsCrossed, Check, ArrowRight,
  BarChart3, Shield, Zap, Star, ChevronDown,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

// ─── Grain texture overlay ────────────────────────────────────────────────────
function Grain() {
  return (
    <svg className="pointer-events-none fixed inset-0 z-50 opacity-[0.025] mix-blend-overlay" style={{ width: '100%', height: '100%' }}>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  );
}

// ─── Barber Scissors SVG (scroll-driven) ─────────────────────────────────────
function ScissorsSVG({ openAngle, scale, opacity }: {
  openAngle: MotionValue<number>;
  scale: MotionValue<number>;
  opacity: MotionValue<number>;
}) {
  // Top blade rotates clockwise (positive), bottom counter-clockwise
  const topAngle = openAngle;
  const bottomAngle = useTransform(openAngle, v => -v);

  return (
    <motion.div
      className="relative"
      style={{ scale, opacity, width: '400px', height: '400px' }}
    >
      <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
        <defs>
          <linearGradient id="bladeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(220,80%,65%)" />
            <stop offset="100%" stopColor="hsl(220,80%,45%)" />
          </linearGradient>
          <linearGradient id="handleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(220,20%,75%)" />
            <stop offset="100%" stopColor="hsl(220,20%,45%)" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ── Top blade ─────────────────────────────────────────────────── */}
        <motion.g
          style={{
            rotate: topAngle,
            transformOrigin: '200px 200px',
          }}
        >
          {/* Handle ring top */}
          <circle cx="68" cy="128" r="36" stroke="url(#handleGrad)" strokeWidth="10" fill="none" />
          <circle cx="68" cy="128" r="16" fill="url(#handleGrad)" opacity="0.3" />
          {/* Finger rest tab */}
          <ellipse cx="50" cy="160" rx="14" ry="9" fill="url(#handleGrad)" />
          {/* Stem */}
          <path
            d="M 68 164 Q 120 185 200 200"
            stroke="url(#handleGrad)" strokeWidth="11" strokeLinecap="round" fill="none"
          />
          {/* Blade body */}
          <path
            d="M 200 200 L 370 108 L 376 122 Z"
            fill="url(#bladeGrad)" filter="url(#glow)"
          />
          {/* Blade sharp edge shimmer */}
          <path
            d="M 200 200 L 370 108 L 374 112"
            stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none"
          />
        </motion.g>

        {/* ── Bottom blade ──────────────────────────────────────────────── */}
        <motion.g
          style={{
            rotate: bottomAngle,
            transformOrigin: '200px 200px',
          }}
        >
          {/* Handle ring bottom */}
          <circle cx="68" cy="272" r="36" stroke="url(#handleGrad)" strokeWidth="10" fill="none" />
          <circle cx="68" cy="272" r="16" fill="url(#handleGrad)" opacity="0.3" />
          {/* Finger rest tab */}
          <ellipse cx="50" cy="240" rx="14" ry="9" fill="url(#handleGrad)" />
          {/* Stem */}
          <path
            d="M 68 236 Q 120 215 200 200"
            stroke="url(#handleGrad)" strokeWidth="11" strokeLinecap="round" fill="none"
          />
          {/* Blade body */}
          <path
            d="M 200 200 L 370 292 L 376 278 Z"
            fill="url(#bladeGrad)" filter="url(#glow)"
          />
          {/* Blade sharp edge shimmer */}
          <path
            d="M 200 200 L 370 292 L 374 288"
            stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none"
          />
        </motion.g>

        {/* Pivot screw */}
        <circle cx="200" cy="200" r="12" fill="url(#handleGrad)" />
        <circle cx="200" cy="200" r="5" fill="hsl(220,80%,60%)" />
        <circle cx="200" cy="200" r="2" fill="rgba(255,255,255,0.8)" />
      </svg>
    </motion.div>
  );
}

// ─── FadeUp helper ────────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const features = [
  { icon: Calendar,        title: 'Agenda inteligente',  desc: 'Grade visual por barbeiro, drag & drop, bloqueios e horários de funcionamento.' },
  { icon: Receipt,         title: 'Caixa & Comandas',    desc: 'Abertura e fechamento de comandas com controle de pagamento e histórico.' },
  { icon: TrendingUp,      title: 'Financeiro completo', desc: 'Comissões, balanço, contas a pagar/receber e relatórios detalhados.' },
  { icon: Users,           title: 'Gestão de clientes',  desc: 'Cadastro, histórico de visitas, bloqueio e relatórios de recorrência.' },
  { icon: Repeat2,         title: 'Assinaturas',         desc: 'Planos mensais para fidelizar clientes com benefícios exclusivos.' },
  { icon: Package,         title: 'Estoque',             desc: 'Controle de produtos com baixa automática ao fechar comandas.' },
  { icon: UtensilsCrossed, title: 'Bar / Cozinha',       desc: 'Cardápio integrado na comanda, perfeito para barbearias com bar.' },
  { icon: BarChart3,       title: 'Relatórios',          desc: 'Dashboards de faturamento, origem dos agendamentos e desempenho.' },
  { icon: Shield,          title: 'Multi-filial',        desc: 'Gerencie todas as unidades a partir de um único painel administrativo.' },
];

const plans = [
  {
    name: 'Bronze', price: 'R$ 89', period: '/mês',
    desc: 'Ideal para barbearias com 1 profissional.',
    features: ['1 barbeiro', 'Agenda & Caixa', 'Gestão de clientes', 'Relatórios básicos'],
    cta: 'Começar grátis', highlight: false,
  },
  {
    name: 'Prata', price: 'R$ 149', period: '/mês',
    desc: 'Para equipes em crescimento.',
    features: ['Até 5 barbeiros', 'Tudo do Bronze', 'Financeiro completo', 'Assinaturas', 'Suporte prioritário'],
    cta: 'Começar grátis', highlight: true,
  },
  {
    name: 'Ouro', price: 'R$ 249', period: '/mês',
    desc: 'Para redes e franquias.',
    features: ['Barbeiros ilimitados', 'Tudo do Prata', 'Multi-filial', 'Bar / Cozinha', 'API & integrações'],
    cta: 'Falar com vendas', highlight: false,
  },
];

const testimonials = [
  { name: 'Rodrigo Lima',  role: 'Dono — Barbearia do Ro', text: 'O Barberstack mudou nossa operação. Agenda cheia, financeiro no controle e clientes mais satisfeitos.' },
  { name: 'Carlos Mendes', role: 'Gerente — Studio Black',  text: 'Controlo 3 unidades por um único painel. Nunca foi tão fácil gerenciar minha rede.' },
  { name: 'André Souza',   role: 'Barbeiro — BarberHub',   text: 'A agenda visual é incrível. Meus clientes adoram agendar pelo portal. Profissional demais.' },
];

// ─── Dashboard Mockup ─────────────────────────────────────────────────────────
function DashboardMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border overflow-hidden shadow-2xl"
      style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
    >
      <div className="flex items-center gap-1.5 px-4 py-3 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
        <span className="w-3 h-3 rounded-full bg-red-400/70" />
        <span className="w-3 h-3 rounded-full bg-yellow-400/70" />
        <span className="w-3 h-3 rounded-full bg-green-400/70" />
        <span className="ml-3 text-xs text-muted-foreground font-mono opacity-60">barberstack.app/dashboard</span>
      </div>
      <div className="flex" style={{ height: '300px' }}>
        <div className="w-12 shrink-0 border-r flex flex-col items-center py-3 gap-3" style={{ backgroundColor: 'hsl(var(--sidebar))', borderColor: 'hsl(var(--border))' }}>
          {[BarChart3, Calendar, Receipt, Users, Package].map((Icon, i) => (
            <div key={i} className={`w-7 h-7 rounded-lg flex items-center justify-center ${i === 0 ? 'bg-primary/20' : ''}`}>
              <Icon className="w-3.5 h-3.5" style={{ color: i === 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }} />
            </div>
          ))}
        </div>
        <div className="flex-1 p-4 space-y-3 overflow-hidden">
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
          <div className="rounded-xl p-3 border" style={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}>
            <p className="text-xs text-muted-foreground mb-3">Faturamento mensal</p>
            <div className="flex items-end gap-1 h-14">
              {[40,60,45,75,55,88,65,82,58,90,72,95].map((h, i) => (
                <div key={i} className="flex-1 rounded-t transition-all" style={{ height: `${h}%`, backgroundColor: i === 11 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.22)' }} />
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            {['Samuel — Corte + Barba  R$ 80', 'Pedro — Corte  R$ 45'].map((row, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg px-2.5 py-1.5 border text-xs" style={{ borderColor: 'hsl(var(--border))' }}>
                <span>{row.split('  ')[0]}</span>
                <span style={{ color: 'hsl(var(--primary))' }} className="font-semibold">{row.split('  ')[1]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Scissors sticky section
  const scissorsRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: scissorsProgress } = useScroll({
    target: scissorsRef,
    offset: ['start end', 'end start'],
  });

  const rawAngle  = useTransform(scissorsProgress, [0, 0.25, 0.5, 0.75, 1.0], [2, 38, 42, 38, 2]);
  const rawScale  = useTransform(scissorsProgress, [0, 0.15, 0.45, 0.55, 0.85, 1], [0.35, 0.85, 1.3, 1.3, 0.85, 0.35]);
  const rawOp     = useTransform(scissorsProgress, [0, 0.08, 0.92, 1], [0, 1, 1, 0]);
  const angle     = useSpring(rawAngle,  { stiffness: 60, damping: 20 });
  const scaleVal  = useSpring(rawScale,  { stiffness: 60, damping: 20 });

  // Text that appears in the scissors section
  const textOp    = useTransform(scissorsProgress, [0.3, 0.45, 0.6, 0.75], [0, 1, 1, 0]);
  const textY     = useTransform(scissorsProgress, [0.3, 0.45], [20, 0]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Photo backgrounds (replace with real CDN URLs as needed)
  const heroBg    = 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1920&q=80';
  const featureBg = 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1920&q=80';

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>
      <Grain />

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 inset-x-0 z-40 transition-all duration-300"
        style={{
          backgroundColor: scrolled ? 'hsl(var(--card) / 0.92)' : 'transparent',
          borderBottom: scrolled ? '1px solid hsl(var(--border))' : '1px solid transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: 'hsl(var(--primary))' }}>
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base">Barberstack</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            {['Funcionalidades', 'Como funciona', 'Planos', 'Depoimentos'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} className="hover:text-foreground transition-colors">{item}</a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className="hidden sm:inline-flex text-sm px-4 py-2 rounded-xl border transition-colors hover:bg-accent" style={{ borderColor: 'hsl(var(--border))' }}>
              Entrar
            </Link>
            <Link href="/register" className="text-sm px-4 py-2 rounded-xl font-semibold transition-opacity hover:opacity-90" style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }}>
              Teste grátis
            </Link>
            <button className="md:hidden p-2 rounded-lg hover:bg-accent" onClick={() => setMenuOpen(o => !o)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t px-4 py-4 space-y-3 text-sm" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            {['Funcionalidades', 'Como funciona', 'Planos', 'Depoimentos'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} className="block py-1 text-muted-foreground hover:text-foreground" onClick={() => setMenuOpen(false)}>{item}</a>
            ))}
          </div>
        )}
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Photo background */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroBg}
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.35) saturate(0.8)' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, hsl(var(--background) / 0.7) 0%, hsl(224 44% 4% / 0.85) 100%)' }} />
        </div>

        {/* Animated blurred orbs */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute rounded-full blur-[120px] opacity-20"
            style={{ width: 600, height: 600, top: -100, left: -100, backgroundColor: 'hsl(var(--primary))' }}
            animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute rounded-full blur-[100px] opacity-10"
            style={{ width: 400, height: 400, bottom: 0, right: 0, backgroundColor: 'hsl(260 80% 60%)' }}
            animate={{ x: [0, -20, 0], y: [0, -30, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-20 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <span
                  className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border"
                  style={{ backgroundColor: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))', borderColor: 'hsl(var(--primary) / 0.3)' }}
                >
                  <Zap className="w-3.5 h-3.5" /> Sistema completo para barbearias
                </span>
              </motion.div>

              <motion.h1
                className="text-5xl sm:text-6xl font-extrabold leading-[1.1] mb-6"
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                style={{ color: 'hsl(213 31% 95%)' }}
              >
                Gerencie sua<br />
                barbearia<br />
                <span
                  className="relative inline-block"
                  style={{ color: 'hsl(var(--primary))' }}
                >
                  como nunca antes
                  <motion.span
                    className="absolute -bottom-1 left-0 h-0.5 rounded-full"
                    style={{ backgroundColor: 'hsl(var(--primary))' }}
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.8, delay: 0.9 }}
                  />
                </span>
              </motion.h1>

              <motion.p
                className="text-lg mb-10 max-w-md leading-relaxed"
                style={{ color: 'hsl(213 20% 70%)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
              >
                Agenda, financeiro, estoque e muito mais — tudo em um só lugar. Simplifique sua operação e foque no que importa.
              </motion.p>

              <motion.div
                className="flex flex-wrap gap-3 mb-14"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
              >
                <Link
                  href="/register"
                  className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm shadow-lg transition-all hover:scale-105"
                  style={{ backgroundColor: 'hsl(var(--primary))', color: 'white', boxShadow: '0 12px 32px hsl(var(--primary) / 0.45)' }}
                >
                  Criar conta grátis <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#como-funciona"
                  className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm border transition-all hover:bg-white/5"
                  style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'hsl(213 31% 85%)' }}
                >
                  Ver demonstração
                </a>
              </motion.div>

              <motion.div
                className="flex flex-wrap gap-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                {[
                  { value: '2.500+', label: 'Barbearias' },
                  { value: '156%',   label: 'Aumento de receita' },
                  { value: '99,9%',  label: 'Uptime' },
                ].map(({ value, label }) => (
                  <div key={label}>
                    <p className="text-2xl font-extrabold" style={{ color: 'hsl(var(--primary))' }}>{value}</p>
                    <p className="text-xs" style={{ color: 'hsl(213 20% 60%)' }}>{label}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div
              className="hidden lg:block"
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <DashboardMockup />
            </motion.div>
          </div>

          {/* Scroll cue */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ color: 'hsl(213 20% 55%)' }}
          >
            <span className="text-xs uppercase tracking-widest opacity-60">Scroll</span>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </div>
      </section>

      {/* ── SCISSORS STICKY SECTION ──────────────────────────────────────── */}
      <div ref={scissorsRef} className="relative" style={{ height: '280vh' }}>
        <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden" style={{ backgroundColor: 'hsl(224 44% 5%)' }}>
          {/* Background glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, hsl(var(--primary) / 0.12), transparent)' }}
          />

          {/* Scissors */}
          <ScissorsSVG openAngle={angle} scale={scaleVal} opacity={rawOp} />

          {/* Floating text */}
          <motion.div
            className="absolute text-center px-6 pointer-events-none"
            style={{ opacity: textOp, y: textY }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.3em] mb-3" style={{ color: 'hsl(var(--primary))' }}>
              Precisão em cada detalhe
            </p>
            <h2 className="text-3xl sm:text-5xl font-extrabold" style={{ color: 'hsl(213 31% 92%)' }}>
              Sua barbearia,<br />no próximo nível
            </h2>
          </motion.div>

          {/* Subtle scan-line */}
          <motion.div
            className="absolute inset-x-0 h-px pointer-events-none"
            style={{
              backgroundColor: 'hsl(var(--primary) / 0.25)',
              top: useTransform(scissorsProgress, [0.2, 0.8], ['40%', '60%']),
            }}
          />
        </div>
      </div>

      {/* ── FEATURES ────────────────────────────────────────────────────── */}
      <section id="funcionalidades" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-16">
            <p className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'hsl(var(--primary))' }}>Funcionalidades</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Tudo que sua barbearia precisa</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Uma plataforma unificada que cobre desde o agendamento até o fechamento do caixa.</p>
          </FadeUp>

          {/* Optional photo strip */}
          <div className="rounded-3xl overflow-hidden mb-16 relative h-48 sm:h-64">
            <img
              src={featureBg}
              alt="Barbearia"
              className="w-full h-full object-cover"
              style={{ filter: 'brightness(0.5) saturate(0.7)' }}
              onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white font-extrabold text-2xl sm:text-4xl tracking-tight">Feito para barbeiros</p>
            </div>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, hsl(var(--background)) 0%, transparent 20%, transparent 80%, hsl(var(--background)) 100%)' }} />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <FadeUp key={title} delay={i * 0.04}>
                <motion.div
                  className="group p-5 rounded-2xl border h-full cursor-default"
                  style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                  whileHover={{ y: -5, boxShadow: '0 16px 40px hsl(var(--primary) / 0.14)', borderColor: 'hsl(var(--primary) / 0.4)' }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors group-hover:scale-110" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}>
                    <Icon className="w-5 h-5 transition-colors" style={{ color: 'hsl(var(--primary))' }} />
                  </div>
                  <h3 className="font-semibold text-sm mb-1.5">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section id="como-funciona" className="py-24 px-4 sm:px-6" style={{ backgroundColor: 'hsl(var(--card))' }}>
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-16">
            <p className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'hsl(var(--primary))' }}>Como funciona</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Pronto em minutos</h2>
            <p className="text-muted-foreground">Configure sua barbearia e comece a usar sem necessidade de treinamento.</p>
          </FadeUp>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-8 left-[16.5%] right-[16.5%] h-px" style={{ backgroundColor: 'hsl(var(--border))' }} />
            <div className="grid md:grid-cols-3 gap-10">
              {[
                { step: '01', title: 'Crie sua conta',      desc: 'Cadastre sua barbearia, adicione os profissionais e configure os serviços oferecidos.' },
                { step: '02', title: 'Configure a agenda',  desc: 'Defina horários de funcionamento, bloqueios e o portal do cliente para agendamentos online.' },
                { step: '03', title: 'Gerencie e cresça',   desc: 'Acompanhe o financeiro, estoque e desempenho em tempo real pelo dashboard.' },
              ].map(({ step, title, desc }, i) => (
                <FadeUp key={step} delay={i * 0.12} className="flex flex-col items-center text-center">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center font-extrabold text-lg mb-5 shadow-lg relative z-10"
                    style={{ backgroundColor: 'hsl(var(--primary))', color: 'white', boxShadow: '0 8px 24px hsl(var(--primary) / 0.4)' }}
                  >
                    {step}
                  </div>
                  <h3 className="font-bold mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </FadeUp>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PLANS ───────────────────────────────────────────────────────── */}
      <section id="planos" className="py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-16">
            <p className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'hsl(var(--primary))' }}>Planos</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Simples e transparente</h2>
            <p className="text-muted-foreground">14 dias grátis em qualquer plano. Sem cartão de crédito.</p>
          </FadeUp>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map(({ name, price, period, desc, features: fs, cta, highlight }, i) => (
              <FadeUp key={name} delay={i * 0.08}>
                <motion.div
                  className="rounded-2xl border p-6 h-full flex flex-col relative overflow-hidden"
                  style={{
                    backgroundColor: highlight ? 'hsl(var(--primary))' : 'hsl(var(--card))',
                    borderColor: highlight ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                    color: highlight ? 'white' : 'inherit',
                    boxShadow: highlight ? '0 24px 56px hsl(var(--primary) / 0.4)' : undefined,
                  }}
                  whileHover={{ y: highlight ? -6 : -4 }}
                  transition={{ duration: 0.2 }}
                >
                  {highlight && (
                    <>
                      <div className="absolute inset-0 pointer-events-none opacity-20" style={{ background: 'radial-gradient(ellipse at top left, white, transparent)' }} />
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full bg-white" style={{ color: 'hsl(var(--primary))' }}>
                        Mais popular
                      </span>
                    </>
                  )}
                  <div className="mb-5">
                    <p className="font-extrabold text-base mb-1">{name}</p>
                    <div className="flex items-end gap-1 mb-2">
                      <span className="text-4xl font-extrabold">{price}</span>
                      <span className="text-sm pb-1 opacity-70">{period}</span>
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
                    href="/register"
                    className="block text-center py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                    style={highlight
                      ? { backgroundColor: 'white', color: 'hsl(var(--primary))' }
                      : { backgroundColor: 'hsl(var(--primary))', color: 'white' }
                    }
                  >
                    {cta}
                  </Link>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────── */}
      <section id="depoimentos" className="py-24 px-4 sm:px-6" style={{ backgroundColor: 'hsl(var(--card))' }}>
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-16">
            <p className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'hsl(var(--primary))' }}>Depoimentos</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold">Quem usa, aprova</h2>
          </FadeUp>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(({ name, role, text }, i) => (
              <FadeUp key={name} delay={i * 0.08}>
                <motion.div
                  className="p-6 rounded-2xl border h-full"
                  style={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                  whileHover={{ y: -4, boxShadow: '0 12px 32px hsl(var(--primary) / 0.1)' }}
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
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, hsl(var(--primary)), transparent 50%), radial-gradient(circle at 80% 50%, hsl(260 80% 60%), transparent 50%)' }} />
        </div>
        <FadeUp>
          <div
            className="max-w-3xl mx-auto text-center rounded-3xl p-12 relative overflow-hidden"
            style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }}
          >
            <div className="absolute inset-0 pointer-events-none opacity-15" style={{ background: 'radial-gradient(ellipse at top left, white, transparent 60%)' }} />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Comece hoje mesmo</h2>
              <p className="opacity-80 mb-8 max-w-md mx-auto">14 dias grátis, sem cartão de crédito. Configure em minutos.</p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-extrabold text-sm bg-white transition-all hover:scale-105 shadow-lg"
                style={{ color: 'hsl(var(--primary))' }}
              >
                Criar conta grátis <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t py-10 px-4 sm:px-6" style={{ borderColor: 'hsl(var(--border))' }}>
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
