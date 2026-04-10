'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Scissors, MapPin, Phone, LogIn, UserPlus, Calendar,
  Loader2, Clock, Info,
} from 'lucide-react';
import { portalApi, PublicPhoto, PublicBranch } from '@/lib/public.api';

export default function PortalPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [portalUser, setPortalUser] = useState<any>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(`portal-auth-${slug}`);
    if (raw) {
      const { user } = JSON.parse(raw);
      setPortalUser(user);
    }
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

  // Auto-select main branch if only one branch exists
  useEffect(() => {
    if (branches.length === 1) setSelectedBranchId(branches[0].id);
    else if (branches.length > 1 && !selectedBranchId) {
      const main = branches.find(b => b.isMain);
      if (main) setSelectedBranchId(main.id);
    }
  }, [branches]);

  const effectiveBranchId = branches.length > 0 ? selectedBranchId : null;

  const { data: professionals = [] } = useQuery({
    queryKey: ['public-professionals', slug, effectiveBranchId],
    queryFn: () => portalApi.professionals(slug, effectiveBranchId ?? undefined).then(r => r.data),
    enabled: !!shop && (branches.length === 0 || !!effectiveBranchId),
  });

  const { data: photos = [] } = useQuery({
    queryKey: ['public-photos', slug],
    queryFn: () => portalApi.photos(slug).then(r => r.data),
    enabled: !!shop,
  });

  const handleLogout = () => {
    sessionStorage.removeItem(`portal-auth-${slug}`);
    setPortalUser(null);
  };

  const handleBookClick = () => {
    const query = effectiveBranchId ? `?branchId=${effectiveBranchId}` : '';
    if (portalUser) {
      router.push(`/${slug}/agendar${query}`);
    } else {
      router.push(`/${slug}/entrar${query}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-background px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Scissors className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Barbearia não encontrada</h1>
        <p className="text-muted-foreground text-sm text-center max-w-xs">
          O link que você acessou não existe ou foi removido.
        </p>
      </div>
    );
  }

  const totalServices = professionals.flatMap(p => p.professionalServices.map(ps => ps.service));
  const uniqueServices = Array.from(new Map(totalServices.map(s => [s.id, s])).values()).filter(s => s.isActive);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {shop.logoUrl ? (
              <img src={shop.logoUrl} alt={shop.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <Scissors className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <span className="font-bold text-foreground text-sm truncate">{shop.name}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {portalUser ? (
              <>
                <span className="text-xs text-muted-foreground hidden sm:block">
                  Olá, {portalUser.name.split(' ')[0]}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push(`/${slug}/entrar`)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-accent transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Entrar
                </button>
                <button
                  onClick={() => router.push(`/${slug}/entrar?mode=register`)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Cadastrar
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero / Cover */}
      <div className="relative">
        {shop.coverUrl ? (
          <div className="h-56 sm:h-72 w-full overflow-hidden">
            <img
              src={shop.coverUrl}
              alt={`${shop.name} cover`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          </div>
        ) : (
          <div className="h-36 sm:h-48 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
        )}

        {/* Hero content */}
        <div className="max-w-3xl mx-auto px-4">
          <div className={`relative ${shop.coverUrl ? '-mt-20' : '-mt-6'} pb-6`}>
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              {/* Logo / Avatar */}
              <div className="shrink-0">
                {shop.logoUrl ? (
                  <img
                    src={shop.logoUrl}
                    alt={shop.name}
                    className="w-20 h-20 rounded-2xl object-cover border-4 border-background shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center border-4 border-background shadow-lg">
                    <Scissors className="w-9 h-9 text-primary-foreground" />
                  </div>
                )}
              </div>

              {/* Name + location */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-foreground leading-tight">{shop.name}</h1>
                {(shop.city || shop.phone) && (
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    {shop.city && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        {shop.city}{shop.state ? `, ${shop.state}` : ''}
                      </span>
                    )}
                    {shop.phone && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" />
                        {shop.phone}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* CTA button desktop */}
              <button
                onClick={handleBookClick}
                className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm shrink-0"
              >
                <Calendar className="w-4 h-4" />
                Agendar horário
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 pb-24 space-y-8">

        {/* Branch selector — only shown when multiple branches */}
        {branches.length > 1 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold text-foreground">Escolha a unidade</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {branches.map(b => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBranchId(b.id)}
                  className={`text-left p-3.5 rounded-xl border transition-colors ${
                    selectedBranchId === b.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <p className="font-medium text-foreground text-sm">{b.name}</p>
                  {(b.address || b.city) && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {[b.address, b.city, b.state].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {b.phone && <p className="text-xs text-muted-foreground mt-0.5">{b.phone}</p>}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* About */}
        {shop.description && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold text-foreground">Sobre</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{shop.description}</p>
          </section>
        )}

        {/* Team */}
        {professionals.length > 0 && (
          <section>
            <h2 className="font-semibold text-foreground mb-3">Nossa equipe</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {professionals.map(p => {
                const name = p.nickname ?? p.user.name;
                const initials = name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
                const services = p.professionalServices.filter(ps => ps.service.isActive);
                return (
                  <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0 overflow-hidden">
                      {p.user.avatarUrl
                        ? <img src={p.user.avatarUrl} className="w-full h-full object-cover" alt={name} />
                        : initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">{name}</p>
                      {services.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {services.slice(0, 3).map(ps => (
                            <span key={ps.service.id} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                              {ps.service.name}
                            </span>
                          ))}
                          {services.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{services.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Gallery */}
        {photos.length > 0 && (
          <section>
            <h2 className="font-semibold text-foreground mb-3">Galeria</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {photos.map((photo: PublicPhoto) => (
                <div key={photo.id} className="relative rounded-xl overflow-hidden aspect-square bg-muted">
                  <img
                    src={photo.url}
                    alt={photo.caption ?? ''}
                    className="w-full h-full object-cover"
                  />
                  {photo.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 py-2">
                      <p className="text-white text-xs truncate">{photo.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Services */}
        {uniqueServices.length > 0 && (
          <section>
            <h2 className="font-semibold text-foreground mb-3">Serviços</h2>
            <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
              {uniqueServices.map(s => (
                <div key={s.id} className="flex items-center justify-between px-4 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.name}</p>
                    {s.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-bold text-foreground">
                      R$ {Number(s.price).toFixed(2).replace('.', ',')}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center justify-end gap-0.5 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {s.durationMins} min
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Mobile sticky CTA */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-10">
        <button
          onClick={handleBookClick}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Calendar className="w-4 h-4" />
          Agendar horário
        </button>
      </div>
    </div>
  );
}
