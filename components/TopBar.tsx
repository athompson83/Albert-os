'use client';
import NotificationBell from './NotificationBell';

export default function TopBar({ title }: { title: string }) {
  return (
    <header style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      paddingLeft: 56,
      paddingTop: 'env(safe-area-inset-top, 0px)',
      minHeight: 'calc(56px + env(safe-area-inset-top, 0px))',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      <h1 style={{ fontSize: 17, fontWeight: 600, color: '#fff', margin: 0 }}>{title}</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <NotificationBell />
      </div>
    </header>
  );
}
