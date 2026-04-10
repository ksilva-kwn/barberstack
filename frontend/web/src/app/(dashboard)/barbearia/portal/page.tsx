'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, ExternalLink, Loader2, Image, Globe, FileText, Link2, Plus, X, GripVertical } from 'lucide-react';
import { barbershopApi } from '@/lib/barbershop.api';
import { useAuthStore } from '@/store/auth.store';

export default function PortalPage() {
  const { user } = useAuthStore();
  const barbershopId = user?.barbershopId ?? '';
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    slug: '',
    coverUrl: '',
    logoUrl: '',
    description: '',
  });
  const [saved, setSaved] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');

  const { data: portal, isLoading } = useQuery({
    queryKey: ['portal-config', barbershopId],
    queryFn: () => barbershopApi.getPortal(barbershopId).then(r => r.data),
    enabled: !!barbershopId,
  });

  useEffect(() => {
    if (portal) {
      setForm({
        slug: portal.slug ?? '',
        coverUrl: portal.coverUrl ?? '',
        logoUrl: portal.logoUrl ?? '',
        description: portal.description ?? '',
      });
    }
  }, [portal]);

  const { data: photos = [] } = useQuery({
    queryKey: ['barbershop-photos', barbershopId],
    queryFn: () => barbershopApi.photos(barbershopId).then(r => r.data),
    enabled: !!barbershopId,
  });

  const addPhotoMutation = useMutation({
    mutationFn: () => barbershopApi.addPhoto(barbershopId, {
      url: newPhotoUrl,
      caption: newPhotoCaption || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barbershop-photos', barbershopId] });
      setNewPhotoUrl('');
      setNewPhotoCaption('');
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: (photoId: string) => barbershopApi.deletePhoto(barbershopId, photoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['barbershop-photos', barbershopId] }),
  });

  const mutation = useMutation({
    mutationFn: () =>
      barbershopApi.updatePortal(barbershopId, {
        slug: form.slug || undefined,
        coverUrl: form.coverUrl || null,
        logoUrl: form.logoUrl || null,
        description: form.description || null,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['portal-config', barbershopId] });
      // Update slug in auth store user if changed
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const portalUrl = form.slug
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/${form.slug}`
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Página do Cliente</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Personalize a página pública da sua barbearia que os clientes acessam para agendar.
        </p>
      </div>

      {/* Link do portal */}
      {portalUrl && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground mb-1">Link do seu portal</p>
            <p className="text-sm font-mono text-foreground truncate">{portalUrl}</p>
          </div>
          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-accent transition-colors shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Abrir
          </a>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl divide-y divide-border">
        {/* Slug */}
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-medium text-foreground text-sm">URL do Portal</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Endereço único da sua barbearia. Apenas letras minúsculas e números, sem espaços.
          </p>
          <div className="flex items-center gap-0">
            <span className="text-sm text-muted-foreground bg-muted border border-border border-r-0 rounded-l-lg px-3 py-2 select-none">
              {typeof window !== 'undefined' ? window.location.host : 'barberstack.app'}/
            </span>
            <input
              type="text"
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') }))}
              placeholder="minha-barbearia"
              className="flex-1 text-sm bg-background border border-border rounded-r-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Descrição */}
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-medium text-foreground text-sm">Sobre a Barbearia</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Texto de apresentação exibido no portal. Máximo 500 caracteres.
          </p>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value.slice(0, 500) }))}
            placeholder="Conte um pouco sobre sua barbearia, história, diferenciais..."
            rows={4}
            className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">{form.description.length}/500</p>
        </div>

        {/* Logo URL */}
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-medium text-foreground text-sm">Logo</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            URL da imagem do logo. Exibida no cabeçalho do portal.
          </p>
          <input
            type="url"
            value={form.logoUrl}
            onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
            placeholder="https://..."
            className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {form.logoUrl && (
            <div className="flex items-center gap-3 mt-2">
              <img
                src={form.logoUrl}
                alt="Logo preview"
                className="w-12 h-12 rounded-lg object-cover border border-border"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <span className="text-xs text-muted-foreground">Preview do logo</span>
            </div>
          )}
        </div>

        {/* Cover URL */}
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-medium text-foreground text-sm">Foto de Capa</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Imagem exibida no banner principal do portal. Recomendado: 1200×400px.
          </p>
          <input
            type="url"
            value={form.coverUrl}
            onChange={e => setForm(f => ({ ...f, coverUrl: e.target.value }))}
            placeholder="https://..."
            className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {form.coverUrl && (
            <div className="rounded-xl overflow-hidden border border-border mt-2 aspect-[3/1]">
              <img
                src={form.coverUrl}
                alt="Cover preview"
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Galeria de fotos */}
      <div className="bg-card border border-border rounded-xl divide-y divide-border">
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-medium text-foreground text-sm">Galeria de Fotos</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Fotos de cortes e do ambiente exibidas no portal. Cole a URL de cada imagem.
          </p>

          {/* Adicionar foto */}
          <div className="space-y-2 pt-1">
            <input
              type="url"
              value={newPhotoUrl}
              onChange={e => setNewPhotoUrl(e.target.value)}
              placeholder="https://... (URL da foto)"
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={newPhotoCaption}
                onChange={e => setNewPhotoCaption(e.target.value)}
                placeholder="Legenda (opcional)"
                className="flex-1 text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={() => newPhotoUrl && addPhotoMutation.mutate()}
                disabled={!newPhotoUrl || addPhotoMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0"
              >
                {addPhotoMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Adicionar
              </button>
            </div>
            {/* Preview da nova foto */}
            {newPhotoUrl && (
              <div className="rounded-lg overflow-hidden border border-border aspect-video mt-1">
                <img
                  src={newPhotoUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}
          </div>

          {/* Grid de fotos existentes */}
          {photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {photos.map(photo => (
                <div key={photo.id} className="relative group rounded-lg overflow-hidden border border-border aspect-square">
                  <img src={photo.url} alt={photo.caption ?? ''} className="w-full h-full object-cover" />
                  {photo.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                      <p className="text-white text-xs truncate">{photo.caption}</p>
                    </div>
                  )}
                  <button
                    onClick={() => deletePhotoMutation.mutate(photo.id)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {photos.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4 border border-dashed border-border rounded-lg">
              Nenhuma foto adicionada ainda.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        {saved && (
          <p className="text-sm text-green-600 dark:text-green-400">Configurações salvas!</p>
        )}
        {mutation.isError && (
          <p className="text-sm text-destructive">Erro ao salvar. Tente novamente.</p>
        )}
        {!saved && !mutation.isError && <span />}
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar
        </button>
      </div>
    </div>
  );
}
