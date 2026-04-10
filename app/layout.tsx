import type { Metadata, Viewport } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import MainWrapper from '@/components/MainWrapper';
import PWAInit from '@/components/PWAInit';

export const metadata: Metadata = {
  title: 'Albert OS',
  description: 'Your personal AI command center',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Albert OS',
    startupImage: '/apple-touch-icon.png',
  },
  icons: {
    apple: '/apple-touch-icon.png',
    icon: '/favicon-32.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0f0f0f' }}>
        <PWAInit />
        <Sidebar />
        <MainWrapper>{children}</MainWrapper>
      </body>
    </html>
  );
}
