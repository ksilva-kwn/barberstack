'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Scissors, MapPin, Phone, LogIn, UserPlus, Calendar, ChevronRight, Loader2 } from 'lucide-react';
import { portalApi, PublicShop } from '@/lib/public.api';
import { PortalLoginModal } from '@/components/portal/portal-login-modal';
import { PortalBookingModal } from '@/components/portal/portal-booking-modal';

export default function PortalPage() {
  const { slug } = useParams<{ slug: string }>();
  const [authModal, setAuthModal] = useState<'login' | 'register' | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [portalToken, setPortalToken] = useState<string | null>(null);
  const [portalUser, setPortalUser] = useState<any>(null);

  // Persiste sessão do portal separado do admin
  useEffect(() => {
    const raw = sessionStorage.getItem(`portal-auth-${slug}`);
    if (raw) {
      const { token, user } = JSON.parse(raw);
      setPortalToken(token);
      setPortalUser(user);
    }
  }, [slug]);

  const { data: shop, isLoading, error } = useQuery({
    queryKey: ['public-shop', slug],
    queryFn: () => portalApi.shop(slug).then(r => r.data),
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ['public-professionals', slug],
    queryFn: () => portalApi.professionals(slug).then(r => r.data),
    enabled: !!shop,
  });

  const handleAuth = (token: string, user: any) => {
    sessionStorage.setItem(`portal-auth-${slug}`, JSON.stringify({ token, user }));
    setPortalToken(token);
    setPortalUser(user);
    setAuthModal(null);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(`portal-auth-${slug}`);
    setPortalToken(null);
    setPortalUser(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <Scissors className="w-12 h-12 text-muted-foreground" />
        <h1 className="text-xl font-semibold text-foreground">Barbearia não encontrada</h1>
        <p className="text-muted-foreground text-sm">O link que você acessou não existe ou foi removido.</p>
      </div>
    );
  }

  const totalServices = professionals.flatMap(p => p.professionalServices.map(ps => ps.service));
  const uniqueServices = Array.from(new Map(totalServices.map(s => [s.id, s])).values());

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Scissors className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground text-sm leading-tight">{shop.name}</h1>
              {shop.city && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{shop.city}{shop.state ? `, ${shop.state}` : ''}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {portalUser ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:block">Olá, {portalUser.name.split(' ')[0]}</span>
                <button
                  onClick={handleLogout}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  Sair
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setAuthModal('login')}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-accent transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />Entrar
                </button>
                <button
                  onClick={() => setAuthModal('register')}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />Cadastrar
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* CTA de agendamento */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-foreground">Agende seu horário</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Escolha o profissional, serviço e horário disponível.</p>
          </div>
          <button
            onClick={() => portalUser ? setBookingOpen(true) : setAuthModal('login')}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
          >
            <Calendar className="w-4 h-4" />
            Agendar
          </button>
        </div>

        {/* Profissionais */}
        {professionals.length > 0 && (
          <div>
            <h3 className="font-semibold text-foreground mb-3">Nossa equipe</h3>
            <div className="space-y-2">
              {professionals.map(p => {
                const name = p.nickname ?? p.user.name;
                const initials = name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
                const services = p.professionalServices.filter(ps => ps.service.isActive);
                return (
                  <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {p.user.avatarUrl
                        ? <img src={p.user.avatarUrl} className="w-10 h-10 rounded-full object-cover" alt={name} />
                        : initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">{name}</p>
                      {services.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {services.map(ps => (
                            <span key={ps.service.id} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                              {ps.service.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Serviços */}
        {uniqueServices.length > 0 && (
          <div>
            <h3 className="font-semibold text-foreground mb-3">Serviços</h3>
            <div className="bg-card border border-border rounded-xl divide-y divide-border">
              {uniqueServices.filter(s => s.isActive).map(s => (
                <div key={s.id} className="flex items-center justify-between px-4 py-3">
                  <p className="text-sm text-foreground">{s.name}</p>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-semibold text-foreground">R$ {Number(s.price).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{s.durationMins} min</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contato */}
        {shop.phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="w-4 h-4" />
            <span>{shop.phone}</span>
          </div>
        )}
      </main>

      {/* Modais */}
      {authModal && (
        <PortalLoginModal
          mode={authModal}
          shopId={shop.id}
          onAuth={handleAuth}
          onClose={() => setAuthModal(null)}
          onSwitchMode={(m) => setAuthModal(m)}
        />
      )}

      {bookingOpen && portalToken && shop && (
        <PortalBookingModal
          shop={shop}
          professionals={professionals}
          token={portalToken}
          onClose={() => setBookingOpen(false)}
          onBooked={() => { setBookingOpen(false); }}
        />
      )}
    </div>
  );
}
