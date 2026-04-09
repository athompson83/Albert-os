'use client';
import { Bell, Search } from 'lucide-react';

export default function TopBar({ title }: { title: string }) {
  return (
    <header style={{ height: 56, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 40 }}>
      <h1 style={{ fontSize: 17, fontWeight: 600, color: '#fff', margin: 0 }}>{title}</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 7, padding: '6px 12px' }}>
          <Search size={14} color="var(--text-muted)" />
          <input placeholder="Search..." style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13, width: 160 }} />
        </div>
        <button style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 7, padding: 7, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
          <Bell size={16} />
        </button>
      </div>
    </header>
  );
}
