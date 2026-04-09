import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import MainWrapper from '@/components/MainWrapper';

export const metadata: Metadata = {
  title: 'Albert OS',
  description: 'Personal Command Center',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0f0f0f' }}>
        <Sidebar />
        <MainWrapper>{children}</MainWrapper>
      </body>
    </html>
  );
}
