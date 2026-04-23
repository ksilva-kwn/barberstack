'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const A = '#D4A24C';
const G = {
  bg:           '#0B0A09',
  bgCard:       '#1A1714',
  bgCard2:      '#221E1A',
  border:       'rgba(255,240,210,0.06)',
  borderStrong: 'rgba(255,240,210,0.12)',
  text:         '#F5EFE4',
  textMuted:    '#A79E8F',
  textDim:      '#6B6459',
};

const font = {
  sans:    "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  display: "'Space Grotesk', 'Inter', sans-serif",
  mono:    "'JetBrains Mono', ui-monospace, monospace",
};

const css = `
  .lp { font-family: ${font.sans}; color: ${G.text}; overflow-x: hidden; }
  .lp-nav { padding: 18px 56px; }
  .lp-nav-links { display: flex; gap: 36px; }
  .lp-hero { padding: 72px 56px 80px; }
  .lp-hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; max-width: 1200px; }
  .lp-strip { padding: 22px 56px; }
  .lp-strip-names { display: flex; gap: 40px; align-items: center; }
  .lp-features { padding: 80px 56px 60px; }
  .lp-feature-header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 48px; }
  .lp-feature-grid { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 16px; }
  .lp-stats { padding: 20px 56px 80px; }
  .lp-stats-grid { display: grid; grid-template-columns: repeat(4,1fr); }
  .lp-pricing { padding: 40px 56px 100px; }
  .lp-pricing-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
  .lp-footer { padding: 48px 56px 28px; display: flex; justify-content: space-between; align-items: flex-end; }

  @media (max-width: 1024px) {
    .lp-feature-grid { grid-template-columns: 1fr 1fr; }
    .lp-feature-big { grid-column: span 2 !important; grid-row: span 1 !important; }
    .lp-pricing-grid { grid-template-columns: 1fr 1fr; }
  }

  @media (max-width: 768px) {
    .lp-nav { padding: 14px 20px; }
    .lp-nav-links { display: none; }
    .lp-hero { padding: 48px 20px 56px; }
    .lp-hero-grid { grid-template-columns: 1fr; gap: 40px; }
    .lp-hero-h1 { font-size: clamp(42px,11vw,68px) !important; }
    .lp-mock-card { display: none; }
    .lp-strip { padding: 16px 20px; }
    .lp-strip-names { gap: 24px; overflow-x: auto; }
    .lp-strip-label { display: none; }
    .lp-features { padding: 56px 20px 40px; }
    .lp-feature-header { flex-direction: column; gap: 16px; }
    .lp-feature-right { display: none; }
    .lp-feature-h2 { font-size: 32px !important; }
    .lp-feature-grid { grid-template-columns: 1fr; }
    .lp-feature-big { grid-column: span 1 !important; grid-row: span 1 !important; min-height: 220px !important; }
    .lp-stats { padding: 0 20px 56px; }
    .lp-stats-grid { grid-template-columns: 1fr 1fr; }
    .lp-stats-cell { border-right: none !important; border-bottom: 1px solid ${G.border}; }
    .lp-pricing { padding: 24px 20px 80px; }
    .lp-pricing-grid { grid-template-columns: 1fr; }
    .lp-footer { padding: 32px 20px 24px; flex-direction: column; align-items: flex-start; gap: 20px; }
  }
`;

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed'); }),
      { threshold: 0.08 }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

function Logo({ size = 20 }: { size?: number }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <img src="/bzinho.png" alt="" style={{ width: size, height: size * (183 / 148), objectFit: 'contain' }} />
      <span style={{ fontFamily: font.display, fontWeight: 600, fontSize: size * 0.9, letterSpacing: '-0.02em', color: G.text }}>
        barberstack
      </span>
    </div>
  );
}

function DashboardMockCard() {
  return (
    <div className="lp-mock-card" style={{
      background: G.bgCard, borderRadius: 16, border: `1px solid ${G.borderStrong}`,
      padding: 18,
      boxShadow: `0 40px 80px -30px rgba(0,0,0,0.8), 0 0 0 1px ${A}22, 0 0 80px -20px ${A}33`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: font.mono, fontSize: 9.5, letterSpacing: '0.1em', color: G.textDim, textTransform: 'uppercase' }}>Faturamento · Abril</div>
          <div style={{ fontFamily: font.display, fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em', marginTop: 2, color: G.text }}>
            R$ 38.420<span style={{ color: G.textDim, fontSize: 18 }}>,00</span>
          </div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: 'rgba(52,211,153,0.1)', color: '#6EE7B7', border: '1px solid rgba(52,211,153,0.3)' }}>
          ↗ +22%
        </span>
      </div>
      <svg viewBox="0 0 300 80" style={{ width: '100%', height: 80 }}>
        <defs>
          <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={A} stopOpacity="0.35" />
            <stop offset="100%" stopColor={A} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0,60 L20,52 L40,55 L60,42 L80,48 L100,35 L120,40 L140,28 L160,32 L180,22 L200,26 L220,18 L240,22 L260,12 L280,18 L300,8 L300,80 L0,80 Z" fill="url(#cg)" />
        <path d="M0,60 L20,52 L40,55 L60,42 L80,48 L100,35 L120,40 L140,28 L160,32 L180,22 L200,26 L220,18 L240,22 L260,12 L280,18 L300,8" fill="none" stroke={A} strokeWidth="1.5" />
      </svg>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 14 }}>
        {[{ l: 'Assinantes', v: '128', d: '+12' }, { l: 'Cortes', v: '421', d: '+48' }, { l: 'Ticket', v: 'R$ 89', d: '+8%' }].map((k, i) => (
          <div key={i} style={{ background: G.bg, borderRadius: 10, padding: 10, border: `1px solid ${G.border}` }}>
            <div style={{ fontSize: 9.5, color: G.textDim, fontFamily: font.mono, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{k.l}</div>
            <div style={{ fontFamily: font.display, fontSize: 18, fontWeight: 600, marginTop: 2, color: G.text }}>{k.v}</div>
            <div style={{ fontSize: 10, color: '#6EE7B7', marginTop: 1 }}>↗ {k.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureCard({ big, title, body, kpi, kpiLabel, icon, delay = 0 }: {
  big?: boolean; title: string; body: string; kpi?: string; kpiLabel?: string; icon: string; delay?: number;
}) {
  const icons: Record<string, React.ReactNode> = {
    wallet:   <svg width={big?20:16} height={big?20:16} viewBox="0 0 24 24" fill="none" stroke={A} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a1 1 0 0 1 1 1v3Z"/><path d="M18 12h.01"/></svg>,
    calendar: <svg width={big?20:16} height={big?20:16} viewBox="0 0 24 24" fill="none" stroke={A} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
    chart:    <svg width={big?20:16} height={big?20:16} viewBox="0 0 24 24" fill="none" stroke={A} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 6-6"/></svg>,
    bank:     <svg width={big?20:16} height={big?20:16} viewBox="0 0 24 24" fill="none" stroke={A} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M8 10v11M12 10v11M16 10v11M20 10v11"/></svg>,
    users:    <svg width={big?20:16} height={big?20:16} viewBox="0 0 24 24" fill="none" stroke={A} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    box:      <svg width={big?20:16} height={big?20:16} viewBox="0 0 24 24" fill="none" stroke={A} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/></svg>,
  };
  return (
    <div
      className={`lp-card reveal ${big ? 'lp-feature-big lp-card-big' : ''}`}
      style={{
        padding: big ? 32 : 24, borderRadius: 20, transitionDelay: `${delay}s`,
        background: big ? `linear-gradient(135deg, ${G.bgCard2} 0%, ${G.bgCard} 100%)` : G.bgCard,
        border: `1px solid ${big ? A + '33' : G.border}`,
        gridColumn: big ? 'span 1' : 'auto',
        gridRow: big ? 'span 2' : 'auto',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        minHeight: big ? 300 : 150, position: 'relative', overflow: 'hidden',
      }}
    >
      {big && (
        <div style={{ position: 'absolute', top: -40, right: -40, width: 220, height: 220, borderRadius: '50%', background: `radial-gradient(circle, ${A}28 0%, transparent 70%)`, animation: 'glow-pulse 3s ease-in-out infinite' }} />
      )}
      <div style={{ position: 'relative' }}>
        <div style={{ width: big?44:36, height: big?44:36, borderRadius: 10, background: `${A}18`, border: `1px solid ${A}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icons[icon]}
        </div>
      </div>
      <div style={{ position: 'relative' }}>
        {kpi && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: font.display, fontSize: 56, fontWeight: 600, letterSpacing: '-0.04em', color: A, lineHeight: 1 }}>{kpi}</div>
            <div style={{ fontFamily: font.mono, fontSize: 10.5, letterSpacing: '0.1em', color: G.textDim, textTransform: 'uppercase', marginTop: 4 }}>{kpiLabel}</div>
          </div>
        )}
        <div style={{ fontFamily: font.display, fontSize: big?22:17, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8, color: G.text }}>{title}</div>
        <div style={{ fontSize: 13, lineHeight: 1.55, color: G.textMuted }}>{body}</div>
      </div>
    </div>
  );
}

function PricingCard({ tier, price, subtitle, features, highlight }: {
  tier: string; price: string; subtitle: string; features: string[]; highlight?: boolean;
}) {
  return (
    <div className="lp-card reveal" style={{
      padding: 32, borderRadius: 20,
      background: highlight ? `linear-gradient(180deg, ${A}14 0%, ${G.bgCard} 70%)` : G.bgCard,
      border: `1px solid ${highlight ? A + '66' : G.border}`,
      position: 'relative', display: 'flex', flexDirection: 'column', gap: 20,
      boxShadow: highlight ? `0 0 60px -20px ${A}44` : 'none',
    }}>
      {highlight && (
        <div style={{ position: 'absolute', top: -10, right: 20, padding: '4px 10px', background: A, color: '#0B0A09', borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: font.mono }}>
          + Popular
        </div>
      )}
      <div>
        <div style={{ fontFamily: font.display, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: highlight ? A : G.text }}>{tier}</div>
        <div style={{ fontSize: 12.5, color: G.textMuted, marginTop: 2 }}>{subtitle}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 15, color: G.textMuted, fontFamily: font.mono }}>R$</span>
        <span style={{ fontFamily: font.display, fontSize: 54, fontWeight: 600, letterSpacing: '-0.04em', color: G.text }}>{price}</span>
        <span style={{ fontSize: 13, color: G.textMuted }}>/mês</span>
      </div>
      <div style={{ height: 1, background: G.border }} />
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {features.map((f, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: G.text }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={A} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
            {f}
          </li>
        ))}
      </ul>
      <Link
        href="/register"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '12px 20px', borderRadius: 10, fontSize: 13.5,
          fontFamily: font.sans, fontWeight: 600, letterSpacing: '-0.01em', textDecoration: 'none', marginTop: 'auto',
          ...(highlight
            ? { background: `linear-gradient(180deg, ${A} 0%, ${A}dd 100%)`, color: '#0B0A09', border: `1px solid ${A}`, boxShadow: `0 8px 24px ${A}44` }
            : { background: 'transparent', color: G.text, border: `1px solid ${G.borderStrong}` }),
        }}
      >
        Começar com {tier}
      </Link>
    </div>
  );
}

export default function LandingPage() {
  useReveal();

  return (
    <>
      <style>{css}</style>
      <div
        className="lp"
        style={{
          width: '100%', minHeight: '100vh', position: 'relative',
          background: `radial-gradient(ellipse 80% 50% at 50% -10%, ${A}22 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 100% 100%, ${A}11 0%, transparent 60%), ${G.bg}`,
        }}
      >
        {/* Grain */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', opacity: 0.3, zIndex: 0,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3CfeColorMatrix values='0 0 0 0 0.9 0 0 0 0 0.8 0 0 0 0 0.5 0 0 0 0.12 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }} />

        {/* NAV */}
        <nav className="lp-nav" style={{
          position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${G.border}`,
          background: `${G.bg}ee`, backdropFilter: 'blur(20px)',
        }}>
          <Logo size={22} />
          <div className="lp-nav-links" style={{ fontSize: 13, color: G.textMuted }}>
            {[['Recursos', 'recursos'], ['Planos', 'planos'], ['Barbearias', 'barbearias']].map(([label, id]) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: G.textMuted, fontSize: 13, fontFamily: font.sans, padding: 0, transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = G.text)}
                onMouseLeave={e => (e.currentTarget.style.color = G.textMuted)}
              >
                {label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link href="/login" style={{ fontSize: 13, color: G.textMuted, textDecoration: 'none' }}>Entrar</Link>
            <Link
              href="/register"
              className="btn-gold"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '8px 16px', borderRadius: 9, fontSize: 13,
                fontFamily: font.sans, fontWeight: 600,
                background: `linear-gradient(180deg, ${A} 0%, ${A}dd 100%)`,
                color: '#0B0A09', textDecoration: 'none', border: `1px solid ${A}`,
                boxShadow: `0 1px 0 rgba(255,255,255,0.2) inset, 0 8px 24px -8px ${A}66`,
              }}
            >
              Começar grátis
            </Link>
          </div>
        </nav>

        {/* HERO */}
        <section id="inicio" className="lp-hero" style={{ position: 'relative', zIndex: 1 }}>
          <div className="lp-hero-grid">
            {/* Copy */}
            <div>
              {/* Badge */}
              <div className="animate-fade-in-up" style={{ transitionDelay: '0s',
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px',
                border: `1px solid ${A}44`, borderRadius: 999, fontSize: 11, fontFamily: font.mono,
                letterSpacing: '0.12em', color: A, marginBottom: 32, textTransform: 'uppercase', background: `${A}0D`,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: 99, background: A, display: 'inline-block', animation: 'glow-pulse 2s ease-in-out infinite' }} />
                Novo · Asaas White-Label integrado
              </div>

              {/* Headline */}
              <h1
                className="lp-hero-h1 animate-fade-in-up"
                style={{
                  fontFamily: font.display, fontSize: 68, fontWeight: 600,
                  letterSpacing: '-0.04em', lineHeight: 1, margin: 0, color: G.text,
                  animationDelay: '0.1s',
                }}
              >
                O sistema que<br />
                a <span style={{ fontStyle: 'italic', color: A }}>barbearia</span><br />
                do século <span style={{ fontStyle: 'italic', color: A }}>XXI</span> merece.
              </h1>

              <p className="animate-fade-in-up" style={{ fontSize: 15, lineHeight: 1.65, color: G.textMuted, marginTop: 26, maxWidth: 460, animationDelay: '0.2s' }}>
                Agenda, comandas, comissões, assinaturas e banking — em um stack único, multi-tenant, pronto para a sua rede crescer.
              </p>

              {/* CTAs */}
              <div className="animate-fade-in-up" style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap', animationDelay: '0.3s' }}>
                <Link
                  href="/register"
                  className="btn-gold"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '14px 26px', borderRadius: 10, fontSize: 14,
                    fontFamily: font.sans, fontWeight: 600,
                    background: `linear-gradient(180deg, ${A} 0%, ${A}dd 100%)`,
                    color: '#0B0A09', textDecoration: 'none', border: `1px solid ${A}`,
                    boxShadow: `0 1px 0 rgba(255,255,255,0.2) inset, 0 12px 30px -10px ${A}66`,
                  }}
                >
                  Agendar uma demo
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
                <Link
                  href="/login"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '14px 26px', borderRadius: 10, fontSize: 14,
                    fontFamily: font.sans, fontWeight: 600,
                    background: 'transparent', color: G.text,
                    border: `1px solid ${G.borderStrong}`,
                    textDecoration: 'none',
                  }}
                >
                  Já tenho conta
                </Link>
              </div>

              {/* Trust */}
              <div className="animate-fade-in-up" style={{ display: 'flex', gap: 24, marginTop: 28, fontSize: 11, color: G.textDim, fontFamily: font.mono, letterSpacing: '0.05em', textTransform: 'uppercase', flexWrap: 'wrap', animationDelay: '0.4s' }}>
                <span>✓ 14 dias grátis</span>
                <span>✓ Sem cartão</span>
                <span>✓ Setup em 10 min</span>
              </div>
            </div>

            {/* Mock */}
            <div className="animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
              <DashboardMockCard />
            </div>
          </div>
        </section>

        {/* LOGO STRIP */}
        <div id="barbearias" className="lp-strip" style={{
          position: 'relative', zIndex: 1,
          borderTop: `1px solid ${G.border}`, borderBottom: `1px solid ${G.border}`,
          fontFamily: font.mono, fontSize: 10, letterSpacing: '0.15em', color: G.textDim,
          textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 48, justifyContent: 'space-between',
        }}>
          <span className="lp-strip-label" style={{ whiteSpace: 'nowrap' }}>+480 barbearias confiam</span>
          <div className="lp-strip-names" style={{ flex: 1, justifyContent: 'flex-end' }}>
            {['VINTAGE BARBER', 'CORTE&CO', 'NAVALHA', 'BARBA NEGRA', 'DON CAETANO'].map(name => (
              <span key={name} style={{ fontFamily: font.display, fontSize: 15, fontWeight: 500, color: G.textMuted, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                {name}
              </span>
            ))}
          </div>
        </div>

        {/* FEATURES */}
        <section id="recursos" className="lp-features" style={{ position: 'relative', zIndex: 1 }}>
          <div className="lp-feature-header">
            <div>
              <div className="reveal" style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: '0.2em', color: A, textTransform: 'uppercase', marginBottom: 14 }}>
                — O stack completo
              </div>
              <h2 className="lp-feature-h2 reveal" style={{ fontFamily: font.display, fontSize: 44, fontWeight: 600, letterSpacing: '-0.035em', margin: 0, lineHeight: 1.05, color: G.text, transitionDelay: '0.1s' }}>
                Tudo que sua barbearia precisa,<br />
                <span style={{ fontStyle: 'italic', color: A }}>sem mensalidades escondidas.</span>
              </h2>
            </div>
            <div className="lp-feature-right reveal" style={{ fontSize: 13.5, color: G.textMuted, maxWidth: 280, lineHeight: 1.6, transitionDelay: '0.2s' }}>
              Um só sistema para agenda, comandas, comissões, estoque e pagamentos — com banking integrado via Asaas.
            </div>
          </div>
          <div className="lp-feature-grid">
            <FeatureCard big title="Assinaturas recorrentes" kpi="+38%" kpiLabel="ticket médio" body="Planos mensais com Pix automático. Seu cliente paga, seu caixa não para." icon="wallet" delay={0} />
            <FeatureCard title="Agenda & comandas" body="Timeline por profissional, fechamento rápido, lembretes via WhatsApp." icon="calendar" delay={0.1} />
            <FeatureCard title="Comissões auto." body="Cálculo por serviço, por barbeiro, por período. Sem planilha." icon="chart" delay={0.15} />
            <FeatureCard title="Banking Asaas" body="Subconta white-label. Receba, pague e saque dentro do app." icon="bank" delay={0.2} />
            <FeatureCard title="Multi-filial" body="Gerencie várias unidades. Dados nunca se cruzam (multi-tenant)." icon="users" delay={0.25} />
            <FeatureCard title="Estoque & produtos" body="Baixa automática na comanda. Alertas de ruptura." icon="box" delay={0.3} />
          </div>
        </section>

        {/* STATS */}
        <section className="lp-stats" style={{ position: 'relative', zIndex: 1 }}>
          <div className="lp-stats-grid reveal" style={{
            border: `1px solid ${G.border}`, borderRadius: 20, overflow: 'hidden',
            background: `linear-gradient(180deg, ${G.bgCard} 0%, ${G.bg} 100%)`,
          }}>
            {[
              { v: '480+',   l: 'Barbearias ativas' },
              { v: '2.1M',   l: 'Cortes agendados' },
              { v: 'R$ 48M', l: 'Transacionados' },
              { v: '4,9/5',  l: 'Avaliação média' },
            ].map((s, i) => (
              <div key={i} className="lp-stats-cell" style={{ padding: '32px 28px', borderRight: i < 3 ? `1px solid ${G.border}` : 'none' }}>
                <div style={{ fontFamily: font.display, fontSize: 42, fontWeight: 600, letterSpacing: '-0.04em', color: G.text, marginBottom: 6 }}>{s.v}</div>
                <div style={{ fontFamily: font.mono, fontSize: 10.5, letterSpacing: '0.1em', color: G.textDim, textTransform: 'uppercase' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* PRICING */}
        <section id="planos" className="lp-pricing" style={{ position: 'relative', zIndex: 1 }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: '0.2em', color: A, textTransform: 'uppercase', marginBottom: 14 }}>— Planos</div>
            <h2 style={{ fontFamily: font.display, fontSize: 40, fontWeight: 600, letterSpacing: '-0.035em', margin: 0, color: G.text }}>
              Do solo-barber à <span style={{ fontStyle: 'italic', color: A }}>rede de filiais.</span>
            </h2>
          </div>
          <div className="lp-pricing-grid">
            <PricingCard tier="Bronze" price="49" subtitle="Solo-barber"
              features={['1 profissional', '80 cortes/mês', 'Agenda + comandas', 'WhatsApp básico']} />
            <PricingCard tier="Prata" price="99" subtitle="Barbearia pequena" highlight
              features={['4 profissionais', '400 cortes/mês', 'Assinaturas + Asaas', 'Comissões automáticas', 'Relatórios FinOps']} />
            <PricingCard tier="Ouro" price="199" subtitle="Rede / multi-filial"
              features={['Profissionais ilimitados', 'Cortes ilimitados', 'Multi-filial', 'White-label', 'Suporte prioritário']} />
          </div>
        </section>

        {/* FOOTER */}
        <footer className="lp-footer" style={{ position: 'relative', zIndex: 1, borderTop: `1px solid ${G.border}` }}>
          <div>
            <Logo size={20} />
            <div style={{ fontSize: 12, color: G.textDim, marginTop: 10 }}>
              © 2026 Barberstack · Feito para barbeiros que levam o ofício a sério.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 32, fontSize: 12, color: G.textMuted, flexWrap: 'wrap' }}>
            {['Produto', 'Planos', 'Status', 'Termos'].map(l => (
              <span key={l} style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = G.text)}
                onMouseLeave={e => (e.currentTarget.style.color = G.textMuted)}
              >{l}</span>
            ))}
          </div>
        </footer>
      </div>
    </>
  );
}
