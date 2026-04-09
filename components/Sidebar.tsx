'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, MessageSquare, FolderKanban,
  CheckSquare, Plug, FileText, Terminal, ScrollText
} from 'lucide-react';

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/apps', label: 'Apps', icon: Plug },
  { href: '/files', label: 'Files', icon: FileText },
  { href: '/vibe', label: 'Vibe Coder', icon: Terminal },
  { href: '/logs', label: 'Logs', icon: ScrollText },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside style={{ width: 220, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100vh', position: 'fixed', left: 0, top: 0, zIndex: 50 }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: 'var(--primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎩</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>Albert OS</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Personal Command Center</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', overflow: 'auto' }}>
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <Link key={href} href={href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 7, marginBottom: 2, textDecoration: 'none', background: active ? 'rgba(99,102,241,0.15)' : 'transparent', color: active ? '#a5b4fc' : 'var(--text-muted)', fontWeight: active ? 600 : 400, fontSize: 14, transition: 'all 0.15s' }}>
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, background: '#374151', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>A</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e5e5' }}>Adam</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Division Chief</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
