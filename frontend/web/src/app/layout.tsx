import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/components/providers/query-provider';

export const metadata: Metadata = {
  title: 'Barberstack — Gestão de Barbearias',
  description: 'SaaS completo para gestão de barbearias: agenda, financeiro, estoque, bar e muito mais.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "'Helvetica Now Display', 'Helvetica Neue', 'Barlow', Helvetica, Arial, sans-serif" }}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
