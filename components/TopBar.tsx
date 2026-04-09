'use client';
import { Bell } from 'lucide-react';

export default function TopBar({ title }: { title: string }) {
  return (
    <header style={{ height: 56, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 0 56px', position: 'sticky', top: 0, zIndex: 40 }}>
      <h1 style={{ fontSize: 17, fontWeight: 600, color: '#fff', margin: 0 }}>{title}</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 7, padding: 7, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
          <Bell size={16} />
        </button>
      </div>
    </header>
  );
}
