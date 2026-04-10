'use client';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import MainWrapper from './MainWrapper';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === '/login';

  if (isLogin) return <>{children}</>;

  return (
    <>
      <Sidebar />
      <MainWrapper>{children}</MainWrapper>
    </>
  );
}
