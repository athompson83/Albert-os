import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'Albert OS',
  description: 'Personal Command Center',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0f0f0f' }}>
        <Sidebar />
        <main style={{ marginLeft: 220, minHeight: '100vh', background: 'var(--background)' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
