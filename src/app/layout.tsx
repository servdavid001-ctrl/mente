import type { Metadata, Viewport } from 'next';
import PreferenciasInit from '@/components/PreferenciasInit';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mente',
  description: 'Sistema personal de captura y foco',
  manifest: '/manifest.webmanifest',
  icons: { icon: [{ url: '/icon.svg', type: 'image/svg+xml' }, { url: '/favicon.ico', sizes: '48x48' }] },
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Mente' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5F1E8' },
    { media: '(prefers-color-scheme: dark)', color: '#1C1A17' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <PreferenciasInit />
      </head>
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
