'use client';

import Link from 'next/link';

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

const noiseBg = `radial-gradient(ellipse 80% 50% at 50% -10%, ${A}22 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 100% 100%, ${A}11 0%, transparent 60%), ${G.bg}`;

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={A} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function ArrowRightIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17L17 7M7 7h10v10" />
    </svg>
  );
}

function Logo() {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <img src="/bzinho.png" alt="" style={{ height: 28, width: 'auto' }} />
      <span style={{ fontFamily: font.display, fontWeight: 600, fontSize: 18, letterSpacing: '-0.02em', color: G.text }}>
        barberstack
      </span>
    </div>
  );
}

function PrimaryButton({ children, href, size = 'md' }: { children: React.ReactNode; href?: string; size?: 'sm' | 'md' | 'lg' }) {
  const pad = size === 'lg' ? '15px 26px' : size === 'sm' ? '8px 14px' : '12px 20px';
  const fs = size === 'lg' ? 14.5 : size === 'sm' ? 12.5 : 13.5;
  const style: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: pad, borderRadius: 10, fontSize: fs,
    fontFamily: font.sans, fontWeight: 600, letterSpacing: '-0.01em',
    background: `linear-gradient(180deg, ${A} 0%, ${A}dd 100%)`,
    color: '#0B0A09', border: `1px solid ${A}`,
    boxShadow: `0 1px 0 rgba(255,255,255,0.2) inset, 0 10px 30px -10px ${A}66`,
    cursor: 'pointer', textDecoration: 'none',
  };
  if (href) return <Link href={href} style={style}>{children}</Link>;
  return <button style={style}>{children}</button>;
}

function GhostButton({ children, href }: { children: React.ReactNode; href?: string }) {
  const style: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '15px 26px', borderRadius: 10, fontSize: 14.5,
    fontFamily: font.sans, fontWeight: 600, letterSpacing: '-0.01em',
    background: 'transparent', color: G.text,
    border: `1px solid ${G.borderStrong}`,
    cursor: 'pointer', textDecoration: 'none',
  };
  if (href) return <Link href={href} style={style}>{children}</Link>;
  return <button style={style}>{children}</button>;
}

function MiniChip({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 500,
      fontFamily: font.sans, background: 'rgba(52,211,153,0.1)',
      color: '#6EE7B7', border: '1px solid rgba(52,211,153,0.3)',
    }}>
      {children}
    </span>
  );
}

function DashboardMockCard() {
  return (
    <div style={{
      background: G.bgCard, borderRadius: 16, border: `1px solid ${G.borderStrong}`,
      padding: 18, boxShadow: `0 40px 80px -30px rgba(0,0,0,0.7), 0 0 0 1px ${A}22`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: font.mono, fontSize: 9.5, letterSpacing: '0.1em', color: G.textDim, textTransform: 'uppercase' }}>
            Faturamento · Abril
          </div>
          <div style={{ fontFamily: font.display, fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em', marginTop: 2, color: G.text }}>
            R$ 38.420<span style={{ color: G.textDim, fontSize: 18 }}>,00</span>
          </div>
        </div>
        <MiniChip>↗ +22%</MiniChip>
      </div>
      <svg viewBox="0 0 300 80" style={{ width: '100%', height: 80 }}>
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={A} stopOpacity="0.35" />
            <stop offset="100%" stopColor={A} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0,60 L20,52 L40,55 L60,42 L80,48 L100,35 L120,40 L140,28 L160,32 L180,22 L200,26 L220,18 L240,22 L260,12 L280,18 L300,8 L300,80 L0,80 Z" fill="url(#chartGrad)" />
        <path d="M0,60 L20,52 L40,55 L60,42 L80,48 L100,35 L120,40 L140,28 L160,32 L180,22 L200,26 L220,18 L240,22 L260,12 L280,18 L300,8" fill="none" stroke={A} strokeWidth="1.5" />
      </svg>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 14 }}>
        {[
          { l: 'Assinantes', v: '128', d: '+12' },
          { l: 'Cortes',     v: '421', d: '+48' },
          { l: 'Ticket',     v: 'R$ 89', d: '+8%' },
        ].map((k, i) => (
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

function FeatureCard({ big, title, body, kpi, kpiLabel, icon }: {
  big?: boolean; title: string; body: string; kpi?: string; kpiLabel?: string; icon: string;
}) {
  const icons: Record<string, React.ReactNode> = {
    wallet:   <svg width={big ? 20 : 16} height={big ? 20 : 16} viewBox="0 0 24 24" fill="none" stroke={A} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a1 1 0 0 1 1 1v3Z"/><path d="M18 12h.01"/></svg>,
    calendar: <svg width={big ? 20 : 16} height={big ? 20 : 16} viewBox="0 0 24 24" fill="none" stroke={A} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
    chart:    <svg width={big ? 20 : 16} height={big ? 20 : 16} viewBox="0 0 24 24" fill="none" stroke={A} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 6-6"/></svg>,
    bank:     <svg width={big ? 20 : 16} height={big ? 20 : 16} viewBox="0 0 24 24" fill="none" stroke={A} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M8 10v11M12 10v11M16 10v11M20 10v11"/></svg>,
    users:    <svg width={big ? 20 : 16} height={big ? 20 : 16} viewBox="0 0 24 24" fill="none" stroke={A} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    box:      <svg width={big ? 20 : 16} height={big ? 20 : 16} viewBox="0 0 24 24" fill="none" stroke={A} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/></svg>,
  };
  return (
    <div style={{
      padding: big ? 32 : 24, borderRadius: 20,
      background: big ? `linear-gradient(135deg, ${G.bgCard2} 0%, ${G.bgCard} 100%)` : G.bgCard,
      border: `1px solid ${big ? A + '33' : G.border}`,
      gridColumn: big ? 'span 1' : 'auto',
      gridRow: big ? 'span 2' : 'auto',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      minHeight: big ? 320 : 140, position: 'relative', overflow: 'hidden',
    }}>
      {big && (
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%',
          background: `radial-gradient(circle, ${A}22 0%, transparent 70%)`,
        }} />
      )}
      <div style={{ position: 'relative' }}>
        <div style={{
          width: big ? 44 : 36, height: big ? 44 : 36, borderRadius: 10,
          background: `${A}18`, border: `1px solid ${A}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icons[icon]}
        </div>
      </div>
      <div style={{ position: 'relative' }}>
        {kpi && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: font.display, fontSize: 56, fontWeight: 600, letterSpacing: '-0.04em', color: A, lineHeight: 1 }}>
              {kpi}
            </div>
            <div style={{ fontFamily: font.mono, fontSize: 10.5, letterSpacing: '0.1em', color: G.textDim, textTransform: 'uppercase', marginTop: 4 }}>
              {kpiLabel}
            </div>
          </div>
        )}
        <div style={{ fontFamily: font.display, fontSize: big ? 22 : 17, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8, color: G.text }}>
          {title}
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.55, color: G.textMuted }}>{body}</div>
      </div>
    </div>
  );
}

function PricingCard({ tier, price, subtitle, features, highlight }: {
  tier: string; price: string; subtitle: string; features: string[]; highlight?: boolean;
}) {
  return (
    <div style={{
      padding: 32, borderRadius: 20,
      background: highlight ? `linear-gradient(180deg, ${A}14 0%, ${G.bgCard} 70%)` : G.bgCard,
      border: `1px solid ${highlight ? A + '66' : G.border}`,
      position: 'relative', display: 'flex', flexDirection: 'column', gap: 20,
    }}>
      {highlight && (
        <div style={{
          position: 'absolute', top: -10, right: 20, padding: '4px 10px',
          background: A, color: '#0B0A09', borderRadius: 999, fontSize: 10,
          fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: font.mono,
        }}>
          + Popular
        </div>
      )}
      <div>
        <div style={{ fontFamily: font.display, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: highlight ? A : G.text }}>
          {tier}
        </div>
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
            <CheckIcon />{f}
          </li>
        ))}
      </ul>
      <Link
        href="/register"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '12px 20px', borderRadius: 10, fontSize: 13.5,
          fontFamily: font.sans, fontWeight: 600, letterSpacing: '-0.01em',
          textDecoration: 'none', marginTop: 'auto',
          ...(highlight
            ? { background: `linear-gradient(180deg, ${A} 0%, ${A}dd 100%)`, color: '#0B0A09', border: `1px solid ${A}` }
            : { background: 'transparent', color: G.text, border: `1px solid ${G.borderStrong}` }),
        }}
      >
        Começar com {tier}
      </Link>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div style={{ width: '100%', minHeight: '100vh', background: noiseBg, fontFamily: font.sans, color: G.text, position: 'relative', overflow: 'hidden' }}>
      {/* Grain */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', opacity: 0.35, zIndex: 0,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3CfeColorMatrix values='0 0 0 0 0.9 0 0 0 0 0.8 0 0 0 0 0.5 0 0 0 0.12 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }} />

      {/* NAV */}
      <nav style={{
        position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 56px', borderBottom: `1px solid ${G.border}`,
      }}>
        <Logo />
        <div style={{ display: 'flex', gap: 36, fontSize: 13, color: G.textMuted }}>
          <span style={{ cursor: 'pointer' }}>Recursos</span>
          <span style={{ cursor: 'pointer' }}>Planos</span>
          <span style={{ cursor: 'pointer' }}>Barbearias</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/login" style={{ fontSize: 13, color: G.textMuted, textDecoration: 'none' }}>Entrar</Link>
          <PrimaryButton href="/register" size="sm">Começar grátis</PrimaryButton>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position: 'relative', zIndex: 1, padding: '70px 56px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center', maxWidth: 1200 }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px',
              border: `1px solid ${A}44`, borderRadius: 999, fontSize: 11.5,
              fontFamily: font.mono, letterSpacing: '0.1em', color: A, marginBottom: 36, textTransform: 'uppercase',
              background: `${A}0D`,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 99, background: A, display: 'inline-block' }} />
              Novo · Asaas White-Label integrado
            </div>
            <h1 style={{
              fontFamily: font.display, fontSize: 68, fontWeight: 600, letterSpacing: '-0.04em',
              lineHeight: 1, margin: 0, color: G.text,
            }}>
              Pare de perder<br />
              dinheiro em<br />
              <span style={{ fontStyle: 'italic', color: A }}>planilhas.</span>
            </h1>
            <p style={{ fontSize: 15, lineHeight: 1.65, color: G.textMuted, marginTop: 28, maxWidth: 460 }}>
              Barberstack unifica agenda, comandas, comissões e pagamentos.
              Banking integrado via Asaas — receba, pague e saque direto do painel.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
              <PrimaryButton href="/register" size="lg">
                Começar grátis <ArrowRightIcon />
              </PrimaryButton>
              <GhostButton href="/login">Já tenho conta</GhostButton>
            </div>
            <div style={{ display: 'flex', gap: 24, marginTop: 32, fontSize: 11.5, color: G.textDim, fontFamily: font.mono, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              <span>✓ 14 dias grátis</span>
              <span>✓ Sem cartão</span>
              <span>✓ Setup em 10 min</span>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <DashboardMockCard />
          </div>
        </div>
      </section>

      {/* LOGO STRIP */}
      <div style={{
        position: 'relative', zIndex: 1, padding: '24px 56px',
        display: 'flex', alignItems: 'center', gap: 48,
        borderTop: `1px solid ${G.border}`, borderBottom: `1px solid ${G.border}`,
        fontFamily: font.mono, fontSize: 10, letterSpacing: '0.15em', color: G.textDim,
        textTransform: 'uppercase', justifyContent: 'space-between',
      }}>
        <span>+480 barbearias confiam</span>
        {['Vintage Barber', 'Corte&Co', 'NAVALHA', 'Barba Negra', 'Don Caetano'].map(name => (
          <span key={name} style={{ fontFamily: font.display, fontSize: 17, fontWeight: 500, color: G.textMuted, letterSpacing: '-0.02em' }}>
            {name}
          </span>
        ))}
      </div>

      {/* FEATURES */}
      <section style={{ position: 'relative', zIndex: 1, padding: '100px 56px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 48 }}>
          <div>
            <div style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: '0.2em', color: A, textTransform: 'uppercase', marginBottom: 14 }}>
              — O stack completo
            </div>
            <h2 style={{ fontFamily: font.display, fontSize: 44, fontWeight: 600, letterSpacing: '-0.035em', margin: 0, lineHeight: 1.05, color: G.text }}>
              Tudo que sua barbearia precisa,<br />
              <span style={{ fontStyle: 'italic', color: A }}>sem mensalidades escondidas.</span>
            </h2>
          </div>
          <div style={{ fontSize: 13.5, color: G.textMuted, maxWidth: 280, lineHeight: 1.6 }}>
            Um só sistema para agenda, comandas, comissões, estoque e pagamentos — com banking integrado via Asaas.
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 16 }}>
          <FeatureCard big title="Assinaturas recorrentes" kpi="+38%" kpiLabel="ticket médio"
            body="Planos mensais com Pix automático. Seu cliente paga, seu caixa não para." icon="wallet" />
          <FeatureCard title="Agenda & comandas" body="Timeline por profissional, fechamento rápido, lembretes via WhatsApp." icon="calendar" />
          <FeatureCard title="Comissões auto." body="Cálculo por serviço, por barbeiro, por período. Sem planilha." icon="chart" />
          <FeatureCard title="Banking Asaas" body="Subconta white-label. Receba, pague e saque dentro do app." icon="bank" />
          <FeatureCard title="Multi-filial" body="Gerencie várias unidades. Dados nunca se cruzam (multi-tenant)." icon="users" />
          <FeatureCard title="Estoque & produtos" body="Baixa automática na comanda. Alertas de ruptura." icon="box" />
        </div>
      </section>

      {/* STATS */}
      <section style={{ position: 'relative', zIndex: 1, padding: '20px 56px 80px' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0,
          border: `1px solid ${G.border}`, borderRadius: 20, overflow: 'hidden',
          background: `linear-gradient(180deg, ${G.bgCard} 0%, ${G.bg} 100%)`,
        }}>
          {[
            { v: '480+',    l: 'Barbearias ativas' },
            { v: '2.1M',    l: 'Cortes agendados' },
            { v: 'R$ 48M',  l: 'Transacionados' },
            { v: '4,9/5',   l: 'Avaliação média' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '32px 28px', borderRight: i < 3 ? `1px solid ${G.border}` : 'none' }}>
              <div style={{ fontFamily: font.display, fontSize: 42, fontWeight: 600, letterSpacing: '-0.04em', color: G.text, marginBottom: 6 }}>
                {s.v}
              </div>
              <div style={{ fontFamily: font.mono, fontSize: 10.5, letterSpacing: '0.1em', color: G.textDim, textTransform: 'uppercase' }}>
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section style={{ position: 'relative', zIndex: 1, padding: '40px 56px 100px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: '0.2em', color: A, textTransform: 'uppercase', marginBottom: 14 }}>— Planos</div>
          <h2 style={{ fontFamily: font.display, fontSize: 40, fontWeight: 600, letterSpacing: '-0.035em', margin: 0, color: G.text }}>
            Do solo-barber à <span style={{ fontStyle: 'italic', color: A }}>rede de filiais.</span>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <PricingCard tier="Bronze" price="49" subtitle="Solo-barber"
            features={['1 profissional', '80 cortes/mês', 'Agenda + comandas', 'WhatsApp básico']} />
          <PricingCard tier="Prata" price="99" subtitle="Barbearia pequena" highlight
            features={['4 profissionais', '400 cortes/mês', 'Assinaturas + Asaas', 'Comissões automáticas', 'Relatórios FinOps']} />
          <PricingCard tier="Ouro" price="199" subtitle="Rede / multi-filial"
            features={['Profissionais ilimitados', 'Cortes ilimitados', 'Multi-filial', 'White-label', 'Suporte prioritário']} />
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        position: 'relative', zIndex: 1, padding: '48px 56px 28px',
        borderTop: `1px solid ${G.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
      }}>
        <div>
          <Logo />
          <div style={{ fontSize: 12, color: G.textDim, marginTop: 12 }}>
            © 2026 Barberstack · Feito para barbeiros que levam o ofício a sério.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 32, fontSize: 12, color: G.textMuted }}>
          <span style={{ cursor: 'pointer' }}>Produto</span>
          <span style={{ cursor: 'pointer' }}>Planos</span>
          <span style={{ cursor: 'pointer' }}>Status</span>
          <span style={{ cursor: 'pointer' }}>Termos</span>
        </div>
      </footer>
    </div>
  );
}
