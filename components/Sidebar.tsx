'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, MessageSquare, FolderKanban,
  CheckSquare, Plug, FileText, Terminal, ScrollText,
  Menu, X
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
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close sidebar on nav on mobile
  const handleNav = () => { if (isMobile) setOpen(false); };

  const sidebarVisible = !isMobile || open;

  return (
    <>
      {/* Mobile hamburger */}
      {isMobile && (
        <button
          onClick={() => setOpen(o => !o)}
          style={{ position: 'fixed', top: 12, left: 12, zIndex: 200, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, cursor: 'pointer', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}

      {/* Overlay on mobile */}
      {isMobile && open && (
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99 }} />
      )}

      {/* Sidebar */}
      {sidebarVisible && (
        <aside style={{ width: 220, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100vh', position: 'fixed', left: 0, top: 0, zIndex: 100, transition: 'transform 0.2s' }}>
          {/* Logo */}
          <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, background: 'var(--primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎩</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>Albert OS</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Personal Command Center</div>
              </div>
              {!isMobile && (
                <button onClick={() => setOpen(o => !o)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '12px 8px', overflow: 'auto' }}>
            {nav.map(({ href, label, icon: Icon }) => {
              const active = path === href;
              return (
                <Link key={href} href={href} onClick={handleNav} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 10px', borderRadius: 7, marginBottom: 2, textDecoration: 'none', background: active ? 'rgba(99,102,241,0.15)' : 'transparent', color: active ? '#a5b4fc' : 'var(--text-muted)', fontWeight: active ? 600 : 400, fontSize: 15, transition: 'all 0.15s' }}>
                  <Icon size={18} />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, background: '#374151', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: '#fff' }}>A</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e5e5' }}>Adam</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Division Chief</div>
              </div>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}
