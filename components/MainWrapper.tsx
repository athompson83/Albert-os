'use client';
import { useEffect, useState } from 'react';

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <main style={{
      marginLeft: isMobile ? 0 : 220,
      minHeight: '100vh',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      background: 'var(--background)',
      transition: 'margin-left 0.2s',
    }}>
      {children}
    </main>
  );
}
