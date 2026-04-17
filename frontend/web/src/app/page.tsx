'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Scissors, Menu, X, Calendar, Receipt, TrendingUp, Users,
  Repeat2, Package, UtensilsCrossed, Check, ArrowRight,
  BarChart3, Shield, Zap, Star, ChevronDown,
} from 'lucide-react';

// ─── Palette — Old Money / Vintage Barbershop ─────────────────────────────────
const G = {
  bg:          '#0D0D0B',
  card:        '#131210',
  cardGlass:   'rgba(14,12,10,0.82)',
  gold:        '#C4A47C',
  goldBright:  '#D8BC96',
  goldGlow:    'rgba(196,164,124,0.22)',
  goldBorder:  'rgba(196,164,124,0.22)',
  goldBorderBright: 'rgba(196,164,124,0.45)',
  white:       '#F3F0EA',
  offWhite:    '#E4DDD2',
  muted:       '#7A746C',
  faint:       '#2A2620',
  sectionAlt:  '#0F0D0B',
  serif:       "'Inter', 'Helvetica Neue', Arial, sans-serif",
  sans:        "'Inter', 'Helvetica Neue', Arial, sans-serif",
};

// ─── Barber Pole (CSS cylinder, animated stripes) ────────────────────────────
function BarberPole({ width = 12, height = 52 }: { width?: number; height?: number }) {
  return (
    <div style={{
      position: 'relative', width, height,
      borderRadius: 999,
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.12)',
      boxShadow: 'inset 2px 0 4px rgba(0,0,0,0.5), inset -1px 0 3px rgba(255,255,255,0.08), 0 2px 10px rgba(0,0,0,0.4)',
      flexShrink: 0,
    }}>
      {/* Rotating stripes */}
      <div style={{
        position: 'absolute', inset: '-20px',
        background: `repeating-linear-gradient(
          -55deg,
          #B91C1C 0px, #B91C1C 7px,
          #f3f3f3 7px, #f3f3f3 14px,
          #1D4ED8 14px, #1D4ED8 21px,
          #f3f3f3 21px, #f3f3f3 28px
        )`,
        backgroundSize: `${width * 3}px 56px`,
        animation: 'barber-spin 1.8s linear infinite',
      }} />
      {/* 3-D sheen */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to right, rgba(0,0,0,0.35) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.25) 100%)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

// ─── FadeUp helper ────────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, className = '', style }: { children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div className={className} style={style}
      initial={{ opacity: 0, y: 36 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >{children}</motion.div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const features = [
  { icon: Calendar,        title: 'Agenda inteligente',  desc: 'Grade visual por barbeiro, drag & drop, bloqueios de horário e recorrências automáticas.' },
  { icon: Receipt,         title: 'Caixa & Comandas',    desc: 'Abertura e fechamento de comandas com controle completo de formas de pagamento.' },
  { icon: TrendingUp,      title: 'Financeiro completo', desc: 'Comissões, balanço, contas a pagar/receber e relatórios detalhados por período.' },
  { icon: Users,           title: 'Gestão de clientes',  desc: 'Cadastro, histórico de visitas, bloqueio e métricas de recorrência.' },
  { icon: Repeat2,         title: 'Assinaturas',         desc: 'Planos mensais para fidelizar clientes com benefícios exclusivos.' },
  { icon: Package,         title: 'Estoque',             desc: 'Controle de produtos com baixa automática ao fechar comandas.' },
  { icon: UtensilsCrossed, title: 'Bar / Cozinha',       desc: 'Cardápio integrado na comanda — ideal para barbearias com bar.' },
  { icon: BarChart3,       title: 'Relatórios',          desc: 'Dashboards de faturamento, origem dos agendamentos e desempenho da equipe.' },
  { icon: Shield,          title: 'Multi-filial',        desc: 'Gerencie todas as unidades a partir de um único painel administrativo.' },
];

const plans = [
  { name: 'Bronze', price: 'R$ 89',  period: '/mês', desc: '1 profissional', features: ['1 barbeiro', 'Agenda & Caixa', 'Clientes', 'Relatórios básicos'],                          cta: 'Começar grátis',  h: false },
  { name: 'Prata',  price: 'R$ 149', period: '/mês', desc: 'Equipe crescendo', features: ['Até 5 barbeiros', 'Tudo do Bronze', 'Financeiro', 'Assinaturas', 'Suporte prioritário'], cta: 'Começar grátis',  h: true  },
  { name: 'Ouro',   price: 'R$ 249', period: '/mês', desc: 'Redes e franquias', features: ['Ilimitados', 'Tudo do Prata', 'Multi-filial', 'Bar/Cozinha', 'API'],                   cta: 'Falar com vendas', h: false },
];

const testimonials = [
  { name: 'Rodrigo Lima',  role: 'Barbearia do Ro',  text: 'Agenda cheia, financeiro no controle e clientes mais satisfeitos. Não consigo imaginar sem o Barberstack.' },
  { name: 'Carlos Mendes', role: 'Studio Black',     text: 'Controlo 3 unidades por um único painel. Nunca foi tão fácil gerenciar minha rede de barbearias.' },
  { name: 'André Souza',   role: 'BarberHub',        text: 'A agenda visual é incrível. Meus clientes adoram agendar pelo portal. Extremamente profissional.' },
];

// ─── Dashboard mockup ─────────────────────────────────────────────────────────
function DashMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateY: -8 }} animate={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      style={{ borderRadius: 18, overflow: 'hidden', border: `1px solid ${G.goldBorder}`, boxShadow: `0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px ${G.goldBorder}, inset 0 1px 0 ${G.goldBorderBright}`, backgroundColor: G.card, backdropFilter: 'blur(20px)' }}
    >
      {/* Titlebar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderBottom: `1px solid ${G.goldBorder}`, background: 'rgba(0,0,0,0.3)' }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#FF5F57' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#FFBD2E' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#28C840' }} />
        <span style={{ marginLeft: 10, fontSize: 10, fontFamily: 'monospace', color: G.muted }}>barberstack.app/dashboard</span>
      </div>
      <div style={{ display: 'flex', height: 290 }}>
        {/* Sidebar */}
        <div style={{ width: 44, background: 'rgba(0,0,0,0.4)', borderRight: `1px solid ${G.goldBorder}`, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 12, gap: 10 }}>
          {[BarChart3, Calendar, Receipt, Users, Package].map((Icon, i) => (
            <div key={i} style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: i === 0 ? `${G.gold}20` : 'transparent', border: i === 0 ? `1px solid ${G.goldBorder}` : 'none' }}>
              <Icon style={{ width: 14, height: 14, color: i === 0 ? G.gold : G.muted }} />
            </div>
          ))}
        </div>
        {/* Main */}
        <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {[{ l: 'Faturamento', v: 'R$ 8.4k', c: G.gold }, { l: 'Clientes', v: '312', c: '#4ade80' }, { l: 'Concluídos', v: '47', c: '#a78bfa' }].map(({ l, v, c }) => (
              <div key={l} style={{ background: G.cardGlass, border: `1px solid ${G.goldBorder}`, borderRadius: 10, padding: '8px 10px', backdropFilter: 'blur(8px)' }}>
                <div style={{ fontSize: 9, color: G.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: c, fontFamily: G.serif }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ background: G.cardGlass, border: `1px solid ${G.goldBorder}`, borderRadius: 10, padding: '10px 12px', flex: 1, backdropFilter: 'blur(8px)' }}>
            <div style={{ fontSize: 9, color: G.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Faturamento mensal</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 60 }}>
              {[38,56,44,72,52,84,62,78,55,88,68,96].map((h, i) => (
                <div key={i} style={{ flex: 1, borderRadius: '3px 3px 0 0', height: `${h}%`, backgroundColor: i === 11 ? G.gold : `${G.gold}2A`, transition: 'height 0.3s' }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[['Samuel — Corte + Barba', 'R$ 80'], ['Pedro — Corte', 'R$ 45']].map(([name, val]) => (
              <div key={name} style={{ display: 'flex', justifyContent: 'space-between', background: G.cardGlass, border: `1px solid ${G.goldBorder}`, borderRadius: 8, padding: '5px 10px', fontSize: 11, backdropFilter: 'blur(8px)' }}>
                <span style={{ color: G.offWhite }}>{name}</span>
                <span style={{ color: G.gold, fontWeight: 700 }}>{val}</span>
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

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const heroBg = 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1920&q=85';

  const dividerStyle = { height: 1, background: `linear-gradient(to right, transparent, ${G.goldBorder}, transparent)`, margin: '0 auto', maxWidth: 600 };

  return (
    <div style={{ backgroundColor: G.bg, color: G.white, minHeight: '100vh', overflowX: 'hidden', fontFamily: G.sans }}>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
        transition: 'all 0.3s ease',
        backgroundColor: scrolled ? 'rgba(13,13,11,0.94)' : 'transparent',
        borderBottom: scrolled ? `1px solid ${G.goldBorder}` : '1px solid transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${G.gold}, ${G.goldBright})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px ${G.goldGlow}` }}>
              <Scissors style={{ width: 17, height: 17, color: '#0D0D0B' }} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em', fontFamily: G.serif }}><span style={{ color: G.gold }}>Barber</span>stack</span>
          </div>

          {/* Links */}
          <nav style={{ display: 'flex', gap: 28, fontSize: 13 }} className="hidden md:flex">
            {['Funcionalidades', 'Como funciona', 'Planos', 'Depoimentos'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                style={{ color: G.muted, textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = G.white)}
                onMouseLeave={e => (e.currentTarget.style.color = G.muted)}
              >{item}</a>
            ))}
          </nav>

          {/* Right cluster */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/login" className="hidden sm:inline-flex" style={{ fontSize: 13, padding: '7px 16px', borderRadius: 10, border: `1px solid ${G.goldBorder}`, color: G.muted, textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = G.white; (e.currentTarget as HTMLElement).style.borderColor = G.goldBorderBright; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = G.muted;  (e.currentTarget as HTMLElement).style.borderColor = G.goldBorder; }}
            >Entrar</Link>

            <Link href="/register" style={{
              fontSize: 13, fontWeight: 700, padding: '8px 20px', borderRadius: 10, textDecoration: 'none',
              background: `linear-gradient(135deg, ${G.gold}, ${G.goldBright})`,
              color: '#0D0D0B', boxShadow: `0 4px 18px ${G.goldGlow}`,
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 28px ${G.goldGlow}`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 18px ${G.goldGlow}`; }}
            >Teste grátis</Link>

            <button className="md:hidden" onClick={() => setMenuOpen(o => !o)} style={{ padding: 8, borderRadius: 8, backgroundColor: 'transparent', border: `1px solid ${G.goldBorder}`, color: G.muted, cursor: 'pointer' }}>
              {menuOpen ? <X style={{ width: 18, height: 18 }} /> : <Menu style={{ width: 18, height: 18 }} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div style={{ background: G.card, borderTop: `1px solid ${G.goldBorder}`, padding: '16px 24px' }} className="md:hidden">
            {['Funcionalidades', 'Como funciona', 'Planos', 'Depoimentos'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} style={{ display: 'block', padding: '8px 0', color: G.muted, textDecoration: 'none', fontSize: 14, borderBottom: `1px solid ${G.faint}` }} onClick={() => setMenuOpen(false)}>{item}</a>
            ))}
          </div>
        )}
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>

        {/* Photo background */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <img src={heroBg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          {/* 80% dark overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,9,7,0.82)' }} />
          {/* Vignette */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 120% 100% at 50% 50%, transparent 30%, rgba(0,0,0,0.5) 100%)' }} />
          {/* Left side darker for text legibility */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(10,9,7,0.55) 0%, transparent 60%)' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1100, margin: '0 auto', padding: '110px 24px 80px', width: '100%' }}>
          <div style={{ display: 'grid', gap: 56, alignItems: 'center' }} className="grid grid-cols-1 lg:grid-cols-2">

            {/* Left */}
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
                  padding: '6px 14px', borderRadius: 999, marginBottom: 28,
                  background: `${G.gold}14`, border: `1px solid ${G.goldBorder}`, color: G.gold,
                }}>
                  <Zap style={{ width: 11, height: 11 }} /> Sistema completo para barbearias
                </span>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                style={{ fontFamily: G.serif, fontSize: 'clamp(40px, 5vw, 62px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: 24, color: G.white }}
              >
                Gerencie sua<br />barbearia<br />
                <em style={{ fontStyle: 'italic', color: G.gold, fontFamily: G.serif }}>como nunca antes</em>
              </motion.h1>

              {/* Decorative gold rule */}
              <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.7, delay: 0.6 }}
                style={{ width: 80, height: 1, background: `linear-gradient(to right, ${G.gold}, transparent)`, marginBottom: 24, transformOrigin: 'left' }}
              />

              <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
                style={{ fontSize: 16, color: G.muted, lineHeight: 1.7, maxWidth: 420, marginBottom: 36 }}
              >
                Agenda, financeiro, estoque e muito mais — tudo em um só lugar. Simplifique sua operação e foque no que importa.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.38 }}
                style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 48 }}
              >
                <Link href="/register" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px',
                  borderRadius: 12, fontWeight: 800, fontSize: 14, textDecoration: 'none',
                  background: `linear-gradient(135deg, ${G.gold}, ${G.goldBright})`,
                  color: '#0D0D0B', boxShadow: `0 12px 36px ${G.goldGlow}`,
                  transition: 'transform 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                >Criar conta grátis <ArrowRight style={{ width: 16, height: 16 }} /></Link>

                <a href="#como-funciona" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px',
                  borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none',
                  border: `1px solid ${G.goldBorder}`, color: G.muted, transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = G.white; (e.currentTarget as HTMLElement).style.borderColor = G.goldBorderBright; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = G.muted; (e.currentTarget as HTMLElement).style.borderColor = G.goldBorder; }}
                >Ver demonstração</a>
              </motion.div>

              {/* Stats — glassmorphism chips */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.52 }}
                style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}
              >
                {[{ v: '2.500+', l: 'Barbearias ativas' }, { v: '156%', l: 'Aumento de receita' }, { v: '99,9%', l: 'Uptime' }].map(({ v, l }) => (
                  <div key={l} style={{
                    padding: '10px 16px', borderRadius: 12, background: G.cardGlass,
                    border: `1px solid ${G.goldBorder}`, backdropFilter: 'blur(16px)',
                    boxShadow: `inset 0 1px 0 ${G.goldBorderBright}`,
                  }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: G.gold, fontFamily: G.serif, letterSpacing: '-0.01em' }}>{v}</div>
                    <div style={{ fontSize: 10, color: G.muted, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{l}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right — Dashboard */}
            <div className="hidden lg:block">
              <DashMockup />
            </div>
          </div>

          {/* Scroll cue */}
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2.5, repeat: Infinity }}
            style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: G.muted, opacity: 0.5 }}
          >
            <span style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Scroll</span>
            <ChevronDown style={{ width: 14, height: 14 }} />
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────── */}
      <section id="funcionalidades" style={{ padding: '100px 24px', backgroundColor: G.sectionAlt }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <FadeUp style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: G.gold, marginBottom: 14 }}>Funcionalidades</p>
            <h2 style={{ fontFamily: G.serif, fontSize: 'clamp(28px,4vw,40px)', fontWeight: 800, color: G.white, marginBottom: 14, letterSpacing: '-0.02em' }}>Tudo que sua barbearia precisa</h2>
            <p style={{ fontSize: 15, color: G.muted, maxWidth: 460, margin: '0 auto', lineHeight: 1.65 }}>Uma plataforma unificada desde o agendamento até o fechamento do caixa.</p>
          </FadeUp>

          <div style={{ display: 'grid', gap: 14 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <FadeUp key={title} delay={i * 0.04}>
                <motion.div
                  style={{
                    padding: '22px 20px', borderRadius: 16,
                    border: `1px solid ${G.goldBorder}`,
                    background: `repeating-linear-gradient(135deg, rgba(255,255,255,0.008) 0px, rgba(255,255,255,0.008) 1px, transparent 1px, transparent 6px), ${G.card}`,
                    height: '100%', cursor: 'default',
                    boxShadow: `inset 0 1px 0 ${G.goldBorder}`,
                  }}
                  whileHover={{ y: -5, borderColor: G.goldBorderBright, boxShadow: `0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 ${G.goldBorderBright}` }}
                  transition={{ duration: 0.2 }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${G.gold}16`, border: `1px solid ${G.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <Icon style={{ width: 18, height: 18, color: G.gold }} />
                  </div>
                  <p style={{ fontFamily: G.serif, fontWeight: 700, fontSize: 15, color: G.white, marginBottom: 6 }}>{title}</p>
                  <p style={{ fontSize: 13, color: G.muted, lineHeight: 1.65 }}>{desc}</p>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      <div style={dividerStyle} />

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section id="como-funciona" style={{ padding: '100px 24px', backgroundColor: G.bg }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <FadeUp style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: G.gold, marginBottom: 14 }}>Como funciona</p>
            <h2 style={{ fontFamily: G.serif, fontSize: 'clamp(28px,4vw,40px)', fontWeight: 800, color: G.white, letterSpacing: '-0.02em' }}>Pronto em minutos</h2>
          </FadeUp>
          <div style={{ display: 'grid', gap: 40 }} className="grid grid-cols-1 md:grid-cols-3">
            {[
              { n: '01', t: 'Crie sua conta',     d: 'Cadastre sua barbearia, adicione os profissionais e configure os serviços.' },
              { n: '02', t: 'Configure a agenda', d: 'Defina horários, bloqueios e ative o portal do cliente para agendamentos.' },
              { n: '03', t: 'Gerencie e cresça',  d: 'Acompanhe financeiro, estoque e desempenho em tempo real.' },
            ].map(({ n, t, d }, i) => (
              <FadeUp key={n} delay={i * 0.12}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14 }}>
                  <div style={{ width: 60, height: 60, borderRadius: 16, background: `linear-gradient(135deg, ${G.gold}, ${G.goldBright})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: G.serif, fontWeight: 900, fontSize: 20, color: '#0D0D0B', boxShadow: `0 8px 24px ${G.goldGlow}` }}>{n}</div>
                  <p style={{ fontFamily: G.serif, fontWeight: 700, fontSize: 16, color: G.white }}>{t}</p>
                  <p style={{ fontSize: 13, color: G.muted, lineHeight: 1.65 }}>{d}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      <div style={dividerStyle} />

      {/* ── PLANS ───────────────────────────────────────────────────────── */}
      <section id="planos" style={{ padding: '100px 24px', backgroundColor: G.sectionAlt }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <FadeUp style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: G.gold, marginBottom: 14 }}>Planos</p>
            <h2 style={{ fontFamily: G.serif, fontSize: 'clamp(28px,4vw,40px)', fontWeight: 800, color: G.white, letterSpacing: '-0.02em', marginBottom: 10 }}>Simples e transparente</h2>
            <p style={{ fontSize: 14, color: G.muted }}>14 dias grátis em qualquer plano. Sem cartão de crédito.</p>
          </FadeUp>
          <div style={{ display: 'grid', gap: 18 }} className="grid grid-cols-1 md:grid-cols-3">
            {plans.map(({ name, price, period, desc, features: fs, cta, h }, i) => (
              <FadeUp key={name} delay={i * 0.08}>
                <motion.div
                  style={{
                    borderRadius: 18, padding: '26px 22px', height: '100%', display: 'flex', flexDirection: 'column',
                    border: `1px solid ${h ? G.goldBorderBright : G.goldBorder}`,
                    background: h
                      ? `linear-gradient(135deg, rgba(196,164,124,0.18) 0%, rgba(196,164,124,0.08) 100%), ${G.card}`
                      : `repeating-linear-gradient(135deg, rgba(255,255,255,0.006) 0px, rgba(255,255,255,0.006) 1px, transparent 1px, transparent 6px), ${G.card}`,
                    backdropFilter: 'blur(16px)',
                    boxShadow: h ? `0 24px 60px ${G.goldGlow}, inset 0 1px 0 ${G.goldBorderBright}` : `inset 0 1px 0 ${G.goldBorder}`,
                    position: 'relative', overflow: 'hidden',
                  }}
                  whileHover={{ y: -6 }} transition={{ duration: 0.2 }}
                >
                  {h && <div style={{ position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)', background: `linear-gradient(90deg, ${G.gold}, ${G.goldBright})`, color: '#0D0D0B', fontSize: 9, fontWeight: 800, padding: '4px 14px', borderRadius: 999, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Mais popular</div>}
                  <p style={{ fontFamily: G.serif, fontWeight: 700, fontSize: 16, color: G.white, marginBottom: 6, marginTop: h ? 10 : 0 }}>{name}</p>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 5 }}>
                    <span style={{ fontFamily: G.serif, fontSize: 38, fontWeight: 900, color: h ? G.gold : G.white }}>{price}</span>
                    <span style={{ fontSize: 12, color: G.muted, paddingBottom: 8 }}>{period}</span>
                  </div>
                  <p style={{ fontSize: 11, color: G.muted, marginBottom: 20 }}>{desc}</p>
                  <ul style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
                    {fs.map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: G.offWhite }}>
                        <Check style={{ width: 14, height: 14, flexShrink: 0, color: G.gold }} />{f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/register" style={{
                    display: 'block', textAlign: 'center', padding: '11px', borderRadius: 10, fontWeight: 700, fontSize: 13, textDecoration: 'none',
                    background: h ? `linear-gradient(135deg, ${G.gold}, ${G.goldBright})` : 'transparent',
                    color: h ? '#0D0D0B' : G.gold,
                    border: h ? 'none' : `1px solid ${G.goldBorder}`,
                    transition: 'opacity 0.2s',
                  }}>{cta}</Link>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      <div style={dividerStyle} />

      {/* ── TESTIMONIALS ────────────────────────────────────────────────── */}
      <section id="depoimentos" style={{ padding: '100px 24px', backgroundColor: G.bg }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <FadeUp style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: G.gold, marginBottom: 14 }}>Depoimentos</p>
            <h2 style={{ fontFamily: G.serif, fontSize: 'clamp(28px,4vw,40px)', fontWeight: 800, color: G.white, letterSpacing: '-0.02em' }}>
              Quem usa, <em style={{ fontStyle: 'italic', color: G.gold }}>aprova</em>
            </h2>
          </FadeUp>
          <div style={{ display: 'grid', gap: 16 }} className="grid grid-cols-1 md:grid-cols-3">
            {testimonials.map(({ name, role, text }, i) => (
              <FadeUp key={name} delay={i * 0.08}>
                <motion.div
                  style={{
                    padding: '24px 20px', borderRadius: 16,
                    border: `1px solid ${G.goldBorder}`,
                    background: `${G.card}CC`,
                    backdropFilter: 'blur(12px)',
                    boxShadow: `inset 0 1px 0 ${G.goldBorder}`,
                  }}
                  whileHover={{ y: -4, borderColor: G.goldBorderBright }} transition={{ duration: 0.2 }}
                >
                  <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                    {Array.from({ length: 5 }).map((_, k) => (<Star key={k} style={{ width: 13, height: 13, color: G.gold, fill: G.gold }} />))}
                  </div>
                  <p style={{ fontSize: 13, color: G.muted, lineHeight: 1.75, marginBottom: 20 }}>"{text}"</p>
                  <div style={{ borderTop: `1px solid ${G.faint}`, paddingTop: 14 }}>
                    <p style={{ fontFamily: G.serif, fontSize: 14, fontWeight: 700, color: G.white }}>{name}</p>
                    <p style={{ fontSize: 11, color: G.muted, marginTop: 2 }}>{role}</p>
                  </div>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', backgroundColor: G.sectionAlt }}>
        <FadeUp>
          <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center', borderRadius: 24, padding: '64px 40px', position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, rgba(196,164,124,0.22) 0%, rgba(196,164,124,0.08) 100%), ${G.card}`, border: `1px solid ${G.goldBorderBright}`, boxShadow: `0 32px 80px ${G.goldGlow}` }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(255,255,255,0.04), transparent)', pointerEvents: 'none' }} />
            {/* Decorative barber pole in corner */}
            <div style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', opacity: 0.35 }}>
              <BarberPole width={14} height={80} />
            </div>
            <div style={{ position: 'relative' }}>
              <h2 style={{ fontFamily: G.serif, fontSize: 'clamp(28px,4vw,40px)', fontWeight: 900, color: G.white, marginBottom: 12, letterSpacing: '-0.02em' }}>
                Comece <em style={{ fontStyle: 'italic', color: G.gold }}>hoje mesmo</em>
              </h2>
              <p style={{ fontSize: 15, color: G.muted, marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>14 dias grátis, sem cartão de crédito. Configure em minutos.</p>
              <Link href="/register" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px',
                borderRadius: 12, fontWeight: 800, fontSize: 14, textDecoration: 'none',
                background: `linear-gradient(135deg, ${G.gold}, ${G.goldBright})`,
                color: '#0D0D0B', boxShadow: `0 10px 30px ${G.goldGlow}`,
                transition: 'transform 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              >Criar conta grátis <ArrowRight style={{ width: 16, height: 16 }} /></Link>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${G.goldBorder}`, padding: '32px 24px', backgroundColor: G.bg }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: `linear-gradient(135deg, ${G.gold}, ${G.goldBright})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Scissors style={{ width: 12, height: 12, color: '#0D0D0B' }} />
            </div>
            <span style={{ fontFamily: G.serif, fontWeight: 800, fontSize: 14 }}><span style={{ color: G.gold }}>Barber</span>stack</span>
          </div>
          <p style={{ fontSize: 12, color: G.muted }}>© 2026 Barberstack. Todos os direitos reservados.</p>
          <div style={{ display: 'flex', gap: 20, fontSize: 12, color: G.muted }}>
            {['Privacidade', 'Termos', 'Suporte'].map(l => (
              <a key={l} href="#" style={{ color: G.muted, textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = G.white)}
                onMouseLeave={e => (e.currentTarget.style.color = G.muted)}
              >{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
