import Link from 'next/link';
import { Scissors, BarChart3, Users, Repeat2, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Scissors className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl text-foreground">Barberstack</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Cadastrar
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          <Scissors className="w-3 h-3" />
          Gestão completa para sua barbearia
        </div>
        <h1 className="text-5xl font-bold text-foreground mb-6 leading-tight">
          Sua barbearia no{' '}
          <span className="text-primary">próximo nível</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Agenda online, controle financeiro, assinaturas de clientes e muito mais.
          Tudo em um lugar só.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Começar agora
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border text-foreground font-medium hover:bg-accent transition-colors"
          >
            Já tenho conta
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Dashboard em tempo real</h3>
            <p className="text-sm text-muted-foreground">
              Acompanhe faturamento, cortes e profissionais em um único painel.
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Gestão de clientes</h3>
            <p className="text-sm text-muted-foreground">
              Histórico completo, preferências e controle de fidelidade dos seus clientes.
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Repeat2 className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Assinaturas recorrentes</h3>
            <p className="text-sm text-muted-foreground">
              Crie planos mensais e garanta receita previsível para sua barbearia.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6 text-center text-sm text-muted-foreground">
        © 2026 Barberstack. Todos os direitos reservados.
      </footer>
    </div>
  );
}
