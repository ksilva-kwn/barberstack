'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserX, Search, X, Loader2, Phone, Mail, ShieldCheck } from 'lucide-react';
import { barbershopApi, Client } from '@/lib/barbershop.api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ClientesBloqueadosPage() {
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients-blocked', search],
    queryFn: () => barbershopApi.clientsBlocked(search || undefined).then(r => r.data),
  });

  const unblockMutation = useMutation({
    mutationFn: (id: string) => barbershopApi.unblockClient(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients-blocked'] });
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const initials = (name: string) =>
    name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Clientes bloqueados</h1>
        <p className="text-muted-foreground text-sm">
          Clientes que não podem realizar novos agendamentos.
          {clients.length > 0 && ` ${clients.length} bloqueado${clients.length !== 1 ? 's' : ''}.`}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          className="w-full pl-9 pr-4 py-2 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          placeholder="Buscar por nome, e-mail ou telefone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <UserX className="w-12 h-12 text-muted-foreground mb-4 opacity-30" />
          <p className="text-foreground font-medium mb-1">
            {search ? 'Nenhum cliente encontrado' : 'Nenhum cliente bloqueado'}
          </p>
          <p className="text-sm text-muted-foreground">
            {search ? 'Tente buscar por outro termo.' : 'Bloqueie clientes na lista de clientes cadastrados.'}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="divide-y divide-border">
            {clients.map((client: Client) => (
              <div key={client.id} className="flex items-center gap-4 px-4 py-3 hover:bg-accent/30 transition-colors">
                <div className="w-9 h-9 rounded-full bg-destructive/20 flex items-center justify-center text-destructive font-bold text-xs shrink-0">
                  {initials(client.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{client.name}</p>
                    <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">Bloqueado</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {client.email && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3" />{client.email}
                      </span>
                    )}
                    {client.phone && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" />{client.phone}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    desde {format(new Date(client.createdAt), "MMM 'de' yyyy", { locale: ptBR })}
                  </span>
                  <button
                    onClick={() => unblockMutation.mutate(client.id)}
                    disabled={unblockMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Desbloquear
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
