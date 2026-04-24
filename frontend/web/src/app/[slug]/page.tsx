'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Scissors, MapPin, Phone, Calendar, Loader2, Clock,
  Star, Instagram, ChevronDown, Mail, ArrowRight,
  LogIn, UserPlus, User,
} from 'lucide-react';
import { portalApi, PublicPhoto, PublicBranch, PublicProfessional } from '@/lib/public.api';
import { motion } from 'framer-motion';

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PortalPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [portalUser, setPortalUser] = useState<any>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const aboutRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(`portal-auth-${slug}`);
    if (raw) {
      setPortalUser(JSON.parse(raw).user);
      router.replace(`/${slug}/painel`);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [slug]);

  const { data: shop, isLoading, error } = useQuery({
    queryKey: ['public-shop', slug],
    queryFn: () => portalApi.shop(slug).then(r => r.data),
  });

  const { data: branches = [] } = useQuery<PublicBranch[]>({
    queryKey: ['public-branches', slug],
    queryFn: () => portalApi.branches(slug).then(r => r.data),
    enabled: !!shop,
  });

  const { data: professionals = [] } = useQuery<PublicProfessional[]>({
    queryKey: ['public-professionals', slug, selectedBranchId],
    queryFn: () => portalApi.professionals(slug, selectedBranchId ?? undefined).then(r => r.data),
    enabled: !!shop,
  });

  const { data: photos = [] } = useQuery({
    queryKey: ['public-photos', slug],
    queryFn: () => portalApi.photos(slug).then(r => r.data),
    enabled: !!shop,
  });

  useEffect(() => {
    if (branches.length === 1) setSelectedBranchId(branches[0].id);
    else if (branches.length > 1 && !selectedBranchId) {
      const main = branches.find(b => b.isMain);
      if (main) setSelectedBranchId(main.id);
    }
  }, [branches]);

  const handleBook = () => {
    const query = selectedBranchId ? `?branchId=${selectedBranchId}` : '';
    if (portalUser) router.push(`/${slug}/agendar${query}`);
    else router.push(`/${slug}/entrar?next=agendar${selectedBranchId ? `&branchId=${selectedBranchId}` : ''}`);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(`portal-auth-${slug}`);
    setPortalUser(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--muted))' }}>
          <Scissors className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Barbearia não encontrada</h1>
        <p className="text-muted-foreground text-sm text-center max-w-xs">O link que você acessou não existe ou foi removido.</p>
      </div>
    );
  }

  const allServices = professionals.flatMap(p => p.professionalServices.map(ps => ps.service));
  const uniqueServices = Array.from(new Map(allServices.map(s => [s.id, s])).values()).filter(s => s.isActive);

  // Map embed URL from address
  const mapQuery = [shop as any].map(s => [s.address, s.city, s.state, s.zipCode].filter(Boolean).join(', '))[0];
  const mapUrl = mapQuery ? `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed&z=15` : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 inset-x-0 z-20 border-b transition-all duration-300"
        style={{
          backgroundColor: scrolled ? 'hsla(var(--background), 0.97)' : 'transparent',
          borderColor: scrolled ? 'hsl(var(--border))' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            {shop.logoUrl
              ? <img src={shop.logoUrl} alt={shop.name} className="w-7 h-7 rounded-lg object-cover shrink-0" />
              : <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'hsl(var(--primary))' }}><Scissors className="w-3.5 h-3.5 text-white" /></div>
            }
            <span className="font-bold text-sm truncate">{shop.name}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {portalUser ? (
              <>
                <button
                  onClick={() => router.push(`/${slug}/painel`)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border transition-colors hover:bg-accent"
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{portalUser.name.split(' ')[0]}</span>
                </button>
                <button onClick={handleBook} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors" style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                  <Calendar className="w-3.5 h-3.5" /> Agendar
                </button>
              </>
            ) : (
              <>
                <button onClick={() => router.push(`/${slug}/entrar`)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border transition-colors hover:bg-accent">
                  <LogIn className="w-3.5 h-3.5" /> Entrar
                </button>
                <button onClick={() => router.push(`/${slug}/entrar`)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors" style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                  <UserPlus className="w-3.5 h-3.5" /><span className="hidden sm:inline">Cadastrar</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[70vh] flex items-end pb-16 overflow-hidden">
        {/* Background */}
        {shop.coverUrl ? (
          <>
            <div className="absolute inset-0">
              <img src={shop.coverUrl} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, hsl(var(--background)) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.3) 100%)' }} />
          </>
        ) : (
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--background)) 100%)' }}>
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 25% 35%, hsl(var(--primary)) 0%, transparent 50%), radial-gradient(circle at 75% 65%, hsl(288 100% 44%) 0%, transparent 50%)' }} />
          </div>
        )}

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 w-full">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {/* Logo */}
            <div className="mb-5">
              {shop.logoUrl
                ? <img src={shop.logoUrl} alt={shop.name} className="w-20 h-20 rounded-2xl object-cover border-2 shadow-2xl" style={{ borderColor: 'rgba(255,255,255,0.15)' }} />
                : <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl" style={{ backgroundColor: 'hsl(var(--primary))' }}><Scissors className="w-10 h-10 text-white" /></div>
              }
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold mb-3 leading-tight" style={{ color: shop.coverUrl ? '#fff' : 'hsl(var(--foreground))' }}>
              {shop.name}
            </h1>

            {shop.description && (
              <p className="text-base sm:text-lg max-w-xl mb-6 leading-relaxed" style={{ color: shop.coverUrl ? 'rgba(255,255,255,0.75)' : 'hsl(var(--muted-foreground))' }}>
                {shop.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 mb-8">
              {(shop as any).city && (
                <div className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: shop.coverUrl ? 'rgba(255,255,255,0.85)' : 'hsl(var(--foreground))' }}>
                  <MapPin className="w-3.5 h-3.5" />
                  {(shop as any).city}{(shop as any).state ? `, ${(shop as any).state}` : ''}
                </div>
              )}
              {shop.phone && (
                <a href={`tel:${shop.phone}`} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full transition-colors" style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: shop.coverUrl ? 'rgba(255,255,255,0.85)' : 'hsl(var(--foreground))' }}>
                  <Phone className="w-3.5 h-3.5" /> {shop.phone}
                </a>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={handleBook}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold shadow-lg"
                style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', boxShadow: '0 8px 24px rgba(0,141,210,0.35)' }}
              >
                <Calendar className="w-4 h-4" /> Agendar agora
                <ArrowRight className="w-4 h-4" />
              </motion.button>
              <button
                onClick={() => aboutRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium border transition-colors"
                style={{ borderColor: shop.coverUrl ? 'rgba(255,255,255,0.3)' : 'hsl(var(--border))', color: shop.coverUrl ? 'rgba(255,255,255,0.85)' : 'hsl(var(--foreground))', backgroundColor: 'rgba(0,0,0,0.2)' }}
              >
                Ver mais <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CONTENT ─────────────────────────────────────────────────────── */}
      <section ref={aboutRef} className="max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-16">

        {/* Branch selector */}
        {branches.length > 1 && (
          <div>
            <h2 className="text-xl font-bold mb-5">Escolha a unidade</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {branches.map(b => (
                <button key={b.id} onClick={() => setSelectedBranchId(b.id)}
                  className="text-left p-4 rounded-2xl border transition-all"
                  style={{
                    borderColor: selectedBranchId === b.id ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                    backgroundColor: selectedBranchId === b.id ? 'hsl(var(--primary) / 0.08)' : 'hsl(var(--card))',
                  }}>
                  <p className="font-semibold text-foreground">{b.name}</p>
                  {(b.address || b.city) && <p className="text-sm text-muted-foreground mt-0.5">{[b.address, b.city, b.state].filter(Boolean).join(', ')}</p>}
                  {b.phone && <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1"><Phone className="w-3 h-3" />{b.phone}</p>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Services */}
        {uniqueServices.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-5">Serviços</h2>
            <div className="rounded-2xl border overflow-hidden divide-y" style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}>
              {uniqueServices.map(s => (
                <div key={s.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="font-semibold text-sm">{s.name}</p>
                    {s.description && <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>}
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="font-bold text-base" style={{ color: 'hsl(var(--primary))' }}>R$ {Number(s.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-muted-foreground flex items-center justify-end gap-1 mt-0.5"><Clock className="w-3 h-3" />{s.durationMins} min</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team */}
        {professionals.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-5">Nossa equipe</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {professionals.map(p => {
                const name = p.nickname ?? p.user.name;
                const initials = name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
                return (
                  <motion.div key={p.id} whileHover={{ y: -3 }} transition={{ duration: 0.2 }}
                    className="p-5 rounded-2xl border flex flex-col items-center text-center gap-3"
                    style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold overflow-hidden"
                      style={{ backgroundColor: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' }}>
                      {p.user.avatarUrl ? <img src={p.user.avatarUrl} className="w-full h-full object-cover" alt={name} /> : initials}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{name}</p>
                      <div className="flex flex-wrap justify-center gap-1 mt-2">
                        {p.professionalServices.filter(ps => ps.service.isActive).slice(0, 3).map(ps => (
                          <span key={ps.service.id} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
                            {ps.service.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Gallery */}
        {photos.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-5">Galeria</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((photo: PublicPhoto) => (
                <motion.div key={photo.id} whileHover={{ scale: 1.02 }} className="relative rounded-2xl overflow-hidden aspect-square border" style={{ borderColor: 'hsl(var(--border))' }}>
                  <img src={photo.url} alt={photo.caption ?? ''} className="w-full h-full object-cover" />
                  {photo.caption && (
                    <div className="absolute bottom-0 left-0 right-0 px-3 py-2" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
                      <p className="text-white text-xs truncate">{photo.caption}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Location */}
        {mapUrl && (
          <div>
            <h2 className="text-xl font-bold mb-5">Localização</h2>
            <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'hsl(var(--border))' }}>
              <iframe
                src={mapUrl}
                className="w-full"
                style={{ height: '300px', border: 'none' }}
                loading="lazy"
                title={`Mapa — ${shop.name}`}
              />
              <div className="px-5 py-4 flex items-start justify-between gap-4" style={{ backgroundColor: 'hsl(var(--card))' }}>
                <div>
                  <p className="font-semibold text-sm">{shop.name}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{mapQuery}</p>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-accent"
                  style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                >
                  <MapPin className="w-3.5 h-3.5" /> Ver no Maps
                </a>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="rounded-3xl border p-8 sm:p-12 text-center relative overflow-hidden" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          <div className="absolute inset-0 pointer-events-none opacity-30" style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 100%, hsl(var(--primary)), transparent)' }} />
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Pronto para agendar?</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">Escolha seu horário, profissional e serviço em poucos cliques. Rápido e fácil.</p>
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={handleBook}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold shadow-lg"
            style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', boxShadow: '0 8px 24px rgba(0,141,210,0.35)' }}
          >
            <Calendar className="w-4 h-4" /> Agendar agora
          </motion.button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 mt-8 text-center" style={{ borderColor: 'hsl(var(--border))' }}>
        <p className="text-xs text-muted-foreground">
          Agendamentos por <span className="font-semibold" style={{ color: 'hsl(var(--primary))' }}>Barberstack</span>
        </p>
      </footer>

      {/* Mobile sticky CTA */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 border-t z-10" style={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}>
          <button onClick={handleBook} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold" style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
            <Calendar className="w-4 h-4" /> Agendar horário
          </button>
        </div>
    </div>
  );
}
