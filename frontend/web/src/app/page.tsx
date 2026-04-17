'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  motion, useScroll, useTransform, useSpring, MotionValue,
} from 'framer-motion';
import {
  Scissors, Menu, X, Calendar, Receipt, TrendingUp, Users,
  Repeat2, Package, UtensilsCrossed, Check, ArrowRight,
  BarChart3, Shield, Zap, Star, ChevronDown,
} from 'lucide-react';

// ─── Brand palette (landing-page-specific, dark barbershop) ──────────────────
const P = {
  bg:     '#0A0908',
  card:   '#131210',
  card2:  '#1A1816',
  border: '#2A2724',
  gold:   '#C9963A',
  goldLt: '#E0B558',
  text:   '#F0ECE4',
  muted:  '#7A746E',
  faint:  '#3A3530',
};

// ─── Straight razor (HTML-based, reliable transform) ─────────────────────────
function Razor({ progress }: { progress: MotionValue<number> }) {
  const rawAngle = useTransform(progress, [0, 0.25, 0.55, 0.75, 1], [0, 42, 44, 42, 0]);
  const rawScale = useTransform(progress, [0, 0.12, 0.45, 0.55, 0.88, 1], [0.4, 0.85, 1.35, 1.35, 0.85, 0.4]);
  const rawOp    = useTransform(progress, [0, 0.08, 0.92, 1], [0, 1, 1, 0]);

  const angle = useSpring(rawAngle, { stiffness: 55, damping: 18 });
  const scale = useSpring(rawScale, { stiffness: 55, damping: 18 });

  // Glow intensity follows opening
  const glowOp = useTransform(rawAngle, [0, 44], [0.15, 0.6]);

  const W = 440; const H = 260;
  const pivotX = 180; const pivotY = H / 2;
  const handleW = pivotX; const handleH = 38;
  const bladeW = 250; const bladeH = 24;

  return (
    <motion.div style={{ opacity: rawOp, scale, position: 'relative', width: W, height: H }}>

      {/* Glow behind razor */}
      <motion.div style={{
        position: 'absolute',
        left: pivotX - 80, top: pivotY - 80,
        width: 160, height: 160,
        borderRadius: '50%',
        backgroundColor: P.gold,
        filter: 'blur(48px)',
        opacity: glowOp,
        pointerEvents: 'none',
      }} />

      {/* ─ Handle (fixed) ─ */}
      <div style={{
        position: 'absolute',
        left: 0, top: pivotY - handleH / 2,
        width: handleW + 6, height: handleH,
        borderRadius: '8px 4px 4px 8px',
        background: `linear-gradient(to bottom, #5C4A2A, #3A2E18, #5C4A2A)`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.4)',
      }}>
        {/* Wood grain lines */}
        {[18, 36, 54, 72, 90, 110, 130].map(x => (
          <div key={x} style={{ position: 'absolute', left: x, top: 4, bottom: 4, width: 1, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 1 }} />
        ))}
        {/* Metal bolster */}
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: 14,
          background: 'linear-gradient(to right, #888, #ccc, #888)',
          borderRadius: '0 4px 4px 0',
        }} />
      </div>

      {/* ─ Pivot pin ─ */}
      <div style={{
        position: 'absolute',
        left: pivotX - 9, top: pivotY - 9,
        width: 18, height: 18,
        borderRadius: '50%',
        background: `radial-gradient(circle at 35% 35%, ${P.goldLt}, ${P.gold}, #7A5A1A)`,
        boxShadow: `0 2px 8px rgba(0,0,0,0.6), 0 0 0 2px rgba(201,150,58,0.3)`,
        zIndex: 3,
      }}>
        <div style={{ position: 'absolute', left: 5, top: 5, width: 4, height: 4, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.55)' }} />
      </div>

      {/* ─ Blade (rotates from pivot) ─ */}
      <motion.div style={{
        position: 'absolute',
        left: pivotX, top: pivotY,
        transformOrigin: '0px 0px',
        rotate: angle,
      }}>
        {/* Blade body */}
        <div style={{
          position: 'relative',
          marginTop: -bladeH / 2,
          width: bladeW, height: bladeH,
        }}>
          {/* Main blade face */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, #A8A8A8 0%, #E8E8E8 40%, #D0D0D0 60%, #909090 100%)',
            clipPath: `polygon(0 15%, 82% 0%, 94% 20%, 100% 50%, 94% 80%, 82% 100%, 0 85%)`,
            borderRadius: '0 6px 6px 0',
          }} />
          {/* Edge highlight (sharp side) */}
          <div style={{
            position: 'absolute', top: 2, left: 0, right: '8%', height: 2,
            background: 'linear-gradient(to right, rgba(255,255,255,0.2), rgba(255,255,255,0.8), rgba(255,255,255,0.1))',
            clipPath: 'polygon(0 0, 90% 0, 100% 100%, 0 100%)',
          }} />
          {/* Blade hollow grind (spine) */}
          <div style={{
            position: 'absolute', bottom: 4, left: 8, right: '14%', height: 3,
            background: 'linear-gradient(to right, rgba(0,0,0,0.15), rgba(0,0,0,0.05))',
          }} />
          {/* Tang connect */}
          <div style={{
            position: 'absolute', left: -6, top: '25%', bottom: '25%', width: 8,
            background: 'linear-gradient(to right, #A0A0A0, #C8C8C8)',
          }} />
          {/* Gold collar */}
          <div style={{
            position: 'absolute', left: -4, top: 0, bottom: 0, width: 10,
            background: `linear-gradient(to right, ${P.gold}, ${P.goldLt}, ${P.gold})`,
            borderRadius: '2px 0 0 2px',
          }} />
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Animation helpers ────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, className = '', style }: { children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const features = [
  { icon: Calendar,        title: 'Agenda inteligente',  desc: 'Grade visual por barbeiro, drag & drop, bloqueios de horário e recorrências.' },
  { icon: Receipt,         title: 'Caixa & Comandas',    desc: 'Abertura e fechamento de comandas com controle completo de pagamento.' },
  { icon: TrendingUp,      title: 'Financeiro completo', desc: 'Comissões, balanço, contas a pagar/receber e relatórios detalhados.' },
  { icon: Users,           title: 'Gestão de clientes',  desc: 'Cadastro, histórico de visitas, bloqueio e relatórios de recorrência.' },
  { icon: Repeat2,         title: 'Assinaturas',         desc: 'Planos mensais para fidelizar clientes com benefícios exclusivos.' },
  { icon: Package,         title: 'Estoque',             desc: 'Controle de produtos com baixa automática ao fechar comandas.' },
  { icon: UtensilsCrossed, title: 'Bar / Cozinha',       desc: 'Cardápio integrado na comanda, perfeito para barbearias com bar.' },
  { icon: BarChart3,       title: 'Relatórios',          desc: 'Dashboards de faturamento, origem dos agendamentos e desempenho.' },
  { icon: Shield,          title: 'Multi-filial',        desc: 'Gerencie todas as unidades a partir de um único painel administrativo.' },
];

const plans = [
  { name: 'Bronze', price: 'R$ 89',  period: '/mês', desc: '1 profissional.',      features: ['1 barbeiro', 'Agenda & Caixa', 'Clientes', 'Relatórios básicos'],                       cta: 'Começar grátis',  highlight: false },
  { name: 'Prata',  price: 'R$ 149', period: '/mês', desc: 'Equipe em crescimento.', features: ['Até 5 barbeiros', 'Tudo do Bronze', 'Financeiro', 'Assinaturas', 'Suporte prioritário'], cta: 'Começar grátis',  highlight: true  },
  { name: 'Ouro',   price: 'R$ 249', period: '/mês', desc: 'Redes e franquias.',    features: ['Ilimitados', 'Tudo do Prata', 'Multi-filial', 'Bar/Cozinha', 'API'],                     cta: 'Falar com vendas', highlight: false },
];

const testimonials = [
  { name: 'Rodrigo Lima',  role: 'Barbearia do Ro',  text: 'Agenda cheia, financeiro no controle e clientes mais satisfeitos. Não consigo mais imaginar sem o Barberstack.' },
  { name: 'Carlos Mendes', role: 'Studio Black',     text: 'Controlo 3 unidades por um único painel. Nunca foi tão fácil gerenciar minha rede de barbearias.' },
  { name: 'André Souza',   role: 'BarberHub',        text: 'A agenda visual é incrível. Meus clientes adoram agendar pelo portal. Muito profissional.' },
];

// ─── Dashboard preview ────────────────────────────────────────────────────────
function DashMockup() {
  return (
    <div style={{ backgroundColor: P.card2, border: `1px solid ${P.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}>
      {/* Titlebar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderBottom: `1px solid ${P.border}` }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#FF5F57' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#FFBD2E' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#28C840' }} />
        <span style={{ marginLeft: 10, fontSize: 11, fontFamily: 'monospace', color: P.muted }}>barberstack.app/dashboard</span>
      </div>
      <div style={{ display: 'flex', height: 280 }}>
        {/* Sidebar */}
        <div style={{ width: 44, backgroundColor: '#0C0A08', borderRight: `1px solid ${P.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 12, gap: 10 }}>
          {[BarChart3, Calendar, Receipt, Users, Package].map((Icon, i) => (
            <div key={i} style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: i === 0 ? `${P.gold}22` : 'transparent' }}>
              <Icon style={{ width: 14, height: 14, color: i === 0 ? P.gold : P.muted }} />
            </div>
          ))}
        </div>
        {/* Main */}
        <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {[
              { l: 'Faturamento', v: 'R$ 8.4k', c: P.gold },
              { l: 'Clientes',    v: '312',      c: '#48BB78' },
              { l: 'Concluídos', v: '47',        c: '#A78BFA' },
            ].map(({ l, v, c }) => (
              <div key={l} style={{ backgroundColor: P.card, border: `1px solid ${P.border}`, borderRadius: 10, padding: '8px 10px' }}>
                <div style={{ fontSize: 10, color: P.muted, marginBottom: 4 }}>{l}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: c }}>{v}</div>
              </div>
            ))}
          </div>
          {/* Chart */}
          <div style={{ backgroundColor: P.card, border: `1px solid ${P.border}`, borderRadius: 10, padding: '10px 12px', flex: 1 }}>
            <div style={{ fontSize: 10, color: P.muted, marginBottom: 10 }}>Faturamento mensal</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
              {[38, 56, 44, 72, 52, 84, 62, 78, 55, 88, 68, 96].map((h, i) => (
                <div key={i} style={{ flex: 1, borderRadius: '3px 3px 0 0', height: `${h}%`, backgroundColor: i === 11 ? P.gold : `${P.gold}2A` }} />
              ))}
            </div>
          </div>
          {/* Recent */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[['Samuel — Corte + Barba', 'R$ 80'], ['Pedro — Corte', 'R$ 45']].map(([name, val]) => (
              <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: P.card, border: `1px solid ${P.border}`, borderRadius: 8, padding: '5px 10px', fontSize: 11 }}>
                <span style={{ color: P.text }}>{name}</span>
                <span style={{ color: P.gold, fontWeight: 600 }}>{val}</span>
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

  const razorRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: razorRef, offset: ['start end', 'end start'] });
  const textOpacity = useTransform(scrollYProgress, [0.3, 0.45, 0.65, 0.78], [0, 1, 1, 0]);
  const textY       = useTransform(scrollYProgress, [0.3, 0.45], [20, 0]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <div style={{ backgroundColor: P.bg, color: P.text, minHeight: '100vh', overflowX: 'hidden', fontFamily: "'Inter','Helvetica Neue',Arial,sans-serif" }}>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
        transition: 'all 0.25s',
        backgroundColor: scrolled ? 'rgba(10,9,8,0.92)' : 'transparent',
        borderBottom: scrolled ? `1px solid ${P.border}` : '1px solid transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: P.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 14px ${P.gold}55` }}>
              <Scissors style={{ width: 16, height: 16, color: '#fff' }} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.01em' }}>Barberstack</span>
          </div>

          {/* Nav links */}
          <nav style={{ display: 'flex', gap: 28, fontSize: 13.5, color: P.muted }} className="hidden md:flex">
            {['Funcionalidades', 'Como funciona', 'Planos', 'Depoimentos'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                style={{ color: P.muted, textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = P.text)}
                onMouseLeave={e => (e.currentTarget.style.color = P.muted)}
              >{item}</a>
            ))}
          </nav>

          {/* CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="/login" style={{
              display: 'none', fontSize: 13, padding: '7px 16px', borderRadius: 10,
              border: `1px solid ${P.border}`, color: P.muted, textDecoration: 'none',
              transition: 'all 0.2s',
            }} className="sm:inline-flex hover:text-white">Entrar</Link>
            <Link href="/register" style={{
              fontSize: 13, fontWeight: 700, padding: '8px 18px', borderRadius: 10,
              backgroundColor: P.gold, color: '#fff', textDecoration: 'none',
              boxShadow: `0 4px 16px ${P.gold}44`,
              transition: 'opacity 0.2s',
            }}>Teste grátis</Link>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="md:hidden"
              style={{ padding: 8, borderRadius: 8, backgroundColor: 'transparent', border: `1px solid ${P.border}`, color: P.muted, cursor: 'pointer' }}
            >
              {menuOpen ? <X style={{ width: 18, height: 18 }} /> : <Menu style={{ width: 18, height: 18 }} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div style={{ backgroundColor: P.card, borderTop: `1px solid ${P.border}`, padding: '16px 24px' }} className="md:hidden">
            {['Funcionalidades', 'Como funciona', 'Planos', 'Depoimentos'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                style={{ display: 'block', padding: '8px 0', color: P.muted, textDecoration: 'none', fontSize: 14 }}
                onClick={() => setMenuOpen(false)}
              >{item}</a>
            ))}
          </div>
        )}
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        {/* Background gradient */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: `radial-gradient(ellipse 80% 70% at 60% 40%, rgba(201,150,58,0.07), transparent),
                       radial-gradient(ellipse 50% 50% at 10% 80%, rgba(100,60,20,0.12), transparent),
                       linear-gradient(135deg, ${P.bg} 0%, #120E0A 100%)`,
        }} />
        {/* Subtle grid */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, opacity: 0.035,
          backgroundImage: `linear-gradient(${P.border} 1px, transparent 1px), linear-gradient(90deg, ${P.border} 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '100px 24px 80px', width: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }} className="grid-cols-1 lg:grid-cols-2">
            {/* Left */}
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  padding: '6px 14px', borderRadius: 100, marginBottom: 24,
                  backgroundColor: `${P.gold}18`, color: P.gold,
                  border: `1px solid ${P.gold}30`,
                }}>
                  <Zap style={{ width: 12, height: 12 }} /> Sistema completo para barbearias
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.03em', marginBottom: 24, color: P.text }}
              >
                Gerencie sua<br />barbearia<br />
                <span style={{ color: P.gold }}>como nunca antes</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                style={{ fontSize: 17, color: P.muted, lineHeight: 1.65, maxWidth: 420, marginBottom: 36 }}
              >
                Agenda, financeiro, estoque e muito mais — tudo em um só lugar. Simplifique sua operação e foque no que importa.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.33 }}
                style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 48 }}
              >
                <Link href="/register" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px',
                  borderRadius: 12, fontWeight: 800, fontSize: 14, textDecoration: 'none',
                  backgroundColor: P.gold, color: '#fff',
                  boxShadow: `0 12px 32px ${P.gold}50`,
                  transition: 'transform 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  Criar conta grátis <ArrowRight style={{ width: 16, height: 16 }} />
                </Link>
                <a href="#como-funciona" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px',
                  borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none',
                  border: `1px solid ${P.border}`, color: P.muted,
                  transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.color = P.text; e.currentTarget.style.borderColor = P.faint; }}
                  onMouseLeave={e => { e.currentTarget.style.color = P.muted; e.currentTarget.style.borderColor = P.border; }}
                >Ver demonstração</a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                style={{ display: 'flex', gap: 36 }}
              >
                {[
                  { v: '2.500+', l: 'Barbearias' },
                  { v: '156%',   l: 'Aumento de receita' },
                  { v: '99,9%',  l: 'Uptime' },
                ].map(({ v, l }) => (
                  <div key={l}>
                    <div style={{ fontSize: 24, fontWeight: 900, color: P.gold }}>{v}</div>
                    <div style={{ fontSize: 11, color: P.muted, marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right — Dashboard mockup */}
            <motion.div
              className="hidden lg:block"
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <DashMockup />
            </motion.div>
          </div>

          {/* Scroll cue */}
          <motion.div
            animate={{ y: [0, 8, 0] }} transition={{ duration: 2.5, repeat: Infinity }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', color: P.faint }}
          >
            <span style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Scroll</span>
            <ChevronDown style={{ width: 14, height: 14 }} />
          </motion.div>
        </div>
      </section>

      {/* ── RAZOR STICKY SECTION ─────────────────────────────────────────── */}
      <div ref={razorRef} style={{ position: 'relative', height: '260vh' }}>
        <div style={{
          position: 'sticky', top: 0, height: '100vh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: '#080706', overflow: 'hidden',
        }}>
          {/* Background radial */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${P.gold}0D, transparent)`,
          }} />
          {/* Horizontal rule */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, backgroundColor: `${P.gold}10` }} />

          {/* Razor */}
          <Razor progress={scrollYProgress} />

          {/* Text overlay */}
          <motion.div
            style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none', opacity: textOpacity, y: textY }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: P.gold, marginBottom: 12 }}>
              Precisão em cada detalhe
            </p>
            <h2 style={{ fontSize: 42, fontWeight: 900, color: P.text, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Sua barbearia,<br />no próximo nível
            </h2>
          </motion.div>
        </div>
      </div>

      {/* ── FEATURES ────────────────────────────────────────────────────── */}
      <section id="funcionalidades" style={{ padding: '96px 24px', backgroundColor: P.bg }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <FadeUp className="text-center" style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: P.gold, marginBottom: 16 }}>Funcionalidades</p>
            <h2 style={{ fontSize: 36, fontWeight: 900, color: P.text, marginBottom: 16, letterSpacing: '-0.02em' }}>Tudo que sua barbearia precisa</h2>
            <p style={{ fontSize: 15, color: P.muted, maxWidth: 480, margin: '0 auto' }}>Uma plataforma unificada desde o agendamento até o fechamento do caixa.</p>
          </FadeUp>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <FadeUp key={title} delay={i * 0.04}>
                <motion.div
                  style={{ padding: 20, borderRadius: 14, border: `1px solid ${P.border}`, backgroundColor: P.card, height: '100%', cursor: 'default' }}
                  whileHover={{ y: -5, borderColor: `${P.gold}50`, boxShadow: `0 16px 40px rgba(0,0,0,0.5)` }}
                  transition={{ duration: 0.2 }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: `${P.gold}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <Icon style={{ width: 18, height: 18, color: P.gold }} />
                  </div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: P.text, marginBottom: 6 }}>{title}</p>
                  <p style={{ fontSize: 13, color: P.muted, lineHeight: 1.6 }}>{desc}</p>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section id="como-funciona" style={{ padding: '96px 24px', backgroundColor: P.card }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <FadeUp style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: P.gold, marginBottom: 16 }}>Como funciona</p>
            <h2 style={{ fontSize: 36, fontWeight: 900, color: P.text, letterSpacing: '-0.02em' }}>Pronto em minutos</h2>
          </FadeUp>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 40 }} className="grid-cols-1 md:grid-cols-3">
            {[
              { n: '01', t: 'Crie sua conta',      d: 'Cadastre sua barbearia, adicione os profissionais e configure os serviços.' },
              { n: '02', t: 'Configure a agenda',  d: 'Defina horários, bloqueios e ative o portal do cliente para agendamentos.' },
              { n: '03', t: 'Gerencie e cresça',   d: 'Acompanhe financeiro, estoque e desempenho em tempo real pelo dashboard.' },
            ].map(({ n, t, d }, i) => (
              <FadeUp key={n} delay={i * 0.12}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
                  <div style={{ width: 60, height: 60, borderRadius: 16, backgroundColor: P.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18, color: '#fff', boxShadow: `0 8px 24px ${P.gold}44` }}>
                    {n}
                  </div>
                  <p style={{ fontWeight: 700, fontSize: 15, color: P.text }}>{t}</p>
                  <p style={{ fontSize: 13, color: P.muted, lineHeight: 1.65 }}>{d}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANS ───────────────────────────────────────────────────────── */}
      <section id="planos" style={{ padding: '96px 24px', backgroundColor: P.bg }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <FadeUp style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: P.gold, marginBottom: 16 }}>Planos</p>
            <h2 style={{ fontSize: 36, fontWeight: 900, color: P.text, letterSpacing: '-0.02em', marginBottom: 12 }}>Simples e transparente</h2>
            <p style={{ fontSize: 14, color: P.muted }}>14 dias grátis em qualquer plano. Sem cartão de crédito.</p>
          </FadeUp>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }} className="grid-cols-1 md:grid-cols-3">
            {plans.map(({ name, price, period, desc, features: fs, cta, highlight }, i) => (
              <FadeUp key={name} delay={i * 0.08}>
                <motion.div
                  style={{
                    borderRadius: 16, border: `1px solid ${highlight ? P.gold : P.border}`,
                    padding: 24, height: '100%', display: 'flex', flexDirection: 'column',
                    position: 'relative', overflow: 'hidden',
                    backgroundColor: highlight ? P.gold : P.card,
                    color: highlight ? '#fff' : P.text,
                    boxShadow: highlight ? `0 24px 60px ${P.gold}40` : undefined,
                  }}
                  whileHover={{ y: -5 }} transition={{ duration: 0.2 }}
                >
                  {highlight && <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at top left, rgba(255,255,255,0.12), transparent)', pointerEvents: 'none' }} />}
                  {highlight && (
                    <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#fff', color: P.gold, fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 100, whiteSpace: 'nowrap' }}>
                      Mais popular
                    </div>
                  )}
                  <p style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>{name}</p>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 6 }}>
                    <span style={{ fontSize: 36, fontWeight: 900 }}>{price}</span>
                    <span style={{ fontSize: 13, opacity: 0.7, paddingBottom: 6 }}>{period}</span>
                  </div>
                  <p style={{ fontSize: 12, opacity: 0.65, marginBottom: 20 }}>{desc}</p>
                  <ul style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                    {fs.map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                        <Check style={{ width: 14, height: 14, flexShrink: 0, color: highlight ? '#fff' : P.gold }} />{f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/register" style={{
                    display: 'block', textAlign: 'center', padding: '11px', borderRadius: 10,
                    fontWeight: 800, fontSize: 13, textDecoration: 'none',
                    backgroundColor: highlight ? '#fff' : P.gold,
                    color: highlight ? P.gold : '#fff',
                    transition: 'opacity 0.2s',
                  }}>{cta}</Link>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────── */}
      <section id="depoimentos" style={{ padding: '96px 24px', backgroundColor: P.card }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <FadeUp style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: P.gold, marginBottom: 16 }}>Depoimentos</p>
            <h2 style={{ fontSize: 36, fontWeight: 900, color: P.text, letterSpacing: '-0.02em' }}>Quem usa, aprova</h2>
          </FadeUp>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }} className="grid-cols-1 md:grid-cols-3">
            {testimonials.map(({ name, role, text }, i) => (
              <FadeUp key={name} delay={i * 0.08}>
                <motion.div
                  style={{ padding: 22, borderRadius: 14, border: `1px solid ${P.border}`, backgroundColor: P.bg }}
                  whileHover={{ y: -4, borderColor: `${P.gold}30` }} transition={{ duration: 0.2 }}
                >
                  <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                    {Array.from({ length: 5 }).map((_, k) => (
                      <Star key={k} style={{ width: 13, height: 13, color: P.gold, fill: P.gold }} />
                    ))}
                  </div>
                  <p style={{ fontSize: 13, color: P.muted, lineHeight: 1.7, marginBottom: 18 }}>"{text}"</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: P.text }}>{name}</p>
                  <p style={{ fontSize: 11, color: P.muted }}>{role}</p>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────────────── */}
      <section style={{ padding: '96px 24px', backgroundColor: P.bg }}>
        <FadeUp>
          <div style={{
            maxWidth: 700, margin: '0 auto', textAlign: 'center', borderRadius: 24,
            padding: '64px 40px', position: 'relative', overflow: 'hidden',
            backgroundColor: P.gold,
            boxShadow: `0 32px 80px ${P.gold}40`,
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at top left, rgba(255,255,255,0.15), transparent 60%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative' }}>
              <h2 style={{ fontSize: 34, fontWeight: 900, color: '#fff', marginBottom: 12, letterSpacing: '-0.02em' }}>Comece hoje mesmo</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', marginBottom: 32 }}>14 dias grátis, sem cartão de crédito. Configure em minutos.</p>
              <Link href="/register" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 32px', borderRadius: 12, fontWeight: 900, fontSize: 14,
                backgroundColor: '#fff', color: P.gold, textDecoration: 'none',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                transition: 'transform 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                Criar conta grátis <ArrowRight style={{ width: 16, height: 16 }} />
              </Link>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${P.border}`, padding: '32px 24px', backgroundColor: P.bg }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', justifyContent: 'space-between' }} className="sm:flex-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, backgroundColor: P.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Scissors style={{ width: 12, height: 12, color: '#fff' }} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 13 }}>Barberstack</span>
          </div>
          <p style={{ fontSize: 12, color: P.muted }}>© 2026 Barberstack. Todos os direitos reservados.</p>
          <div style={{ display: 'flex', gap: 20, fontSize: 12, color: P.muted }}>
            {['Privacidade', 'Termos', 'Suporte'].map(l => (
              <a key={l} href="#" style={{ color: P.muted, textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = P.text)}
                onMouseLeave={e => (e.currentTarget.style.color = P.muted)}
              >{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
