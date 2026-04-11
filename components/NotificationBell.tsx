'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, ExternalLink, ChevronRight, CheckCheck } from 'lucide-react';
import Link from 'next/link';

type Notification = {
  id: string;
  title: string;
  body: string;
  type: 'alert' | 'task' | 'info' | 'success';
  priority: 'high' | 'medium' | 'low';
  tag?: string;
  link?: string;
  externalUrl?: string;
  actionLabel?: string;
  createdAt: string;
  cleared: boolean;
};

const TYPE_STYLES: Record<string, { color: string; bg: string; dot: string }> = {
  alert:   { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   dot: '#ef4444' },
  task:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  dot: '#f59e0b' },
  info:    { color: '#a5b4fc', bg: 'rgba(99,102,241,0.08)', dot: '#6366f1' },
  success: { color: '#10b981', bg: 'rgba(16,185,129,0.08)', dot: '#10b981' },
};

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [uncleared, setUncleared] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      setNotifs(data.notifications || []);
      setUncleared(data.uncleared || 0);
    } catch {}
  }, []);

  // Poll every 30s
  useEffect(() => {
    fetchNotifs();
    const t = setInterval(fetchNotifs, 30000);
    return () => clearInterval(t);
  }, [fetchNotifs]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) &&
          bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const clearOne = async (id: string) => {
    setLoading(true);
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    await fetchNotifs();
    setLoading(false);
  };

  const clearAll = async () => {
    setLoading(true);
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clearAll: true }) });
    await fetchNotifs();
    setLoading(false);
  };

  const highCount = notifs.filter(n => n.priority === 'high').length;

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        ref={bellRef}
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'relative',
          background: open ? 'rgba(99,102,241,0.15)' : 'transparent',
          border: `1px solid ${open ? 'rgba(99,102,241,0.4)' : 'var(--border)'}`,
          borderRadius: 8,
          width: 36, height: 36,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          color: uncleared > 0 ? '#a5b4fc' : 'var(--text-muted)',
          transition: 'all 0.15s',
        }}
        title="Notifications"
      >
        <Bell size={16} />
        {uncleared > 0 && (
          <span style={{
            position: 'absolute', top: -5, right: -5,
            background: highCount > 0 ? '#ef4444' : '#f59e0b',
            color: '#fff', borderRadius: '50%',
            width: 17, height: 17,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700,
            border: '2px solid var(--bg)',
            animation: highCount > 0 ? 'pulse 2s ease-in-out infinite' : 'none',
          }}>
            {uncleared > 9 ? '9+' : uncleared}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position: 'absolute', top: 44, right: 0, zIndex: 300,
            width: 360, maxWidth: 'calc(100vw - 24px)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={14} style={{ color: '#a5b4fc' }} />
              <span style={{ fontWeight: 700, fontSize: 14 }}>Notifications</span>
              {uncleared > 0 && (
                <span style={{ fontSize: 11, background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', padding: '1px 7px', borderRadius: 20 }}>
                  {uncleared} unread
                </span>
              )}
            </div>
            {uncleared > 0 && (
              <button
                onClick={clearAll}
                disabled={loading}
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '3px 6px', borderRadius: 5 }}
              >
                <CheckCheck size={12} /> Clear all
              </button>
            )}
          </div>

          {/* Notifications list */}
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {notifs.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No notifications
              </div>
            ) : (
              notifs
                .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || b.createdAt.localeCompare(a.createdAt))
                .map(n => {
                  const s = TYPE_STYLES[n.type] || TYPE_STYLES.info;
                  return (
                    <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: s.bg, position: 'relative' }}>
                      {/* Dot + title row */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, marginTop: 5, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#e5e5e5' }}>{n.title}</span>
                            {n.tag && <span style={{ fontSize: 10, color: s.color, background: 'transparent', border: `1px solid ${s.color}40`, padding: '1px 5px', borderRadius: 4 }}>{n.tag}</span>}
                            {n.priority === 'high' && <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 700 }}>!</span>}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: n.link || n.externalUrl ? 8 : 0 }}>
                            {n.body}
                          </div>
                          {(n.link || n.externalUrl) && (
                            n.link ? (
                              <Link
                                href={n.link}
                                onClick={() => { clearOne(n.id); setOpen(false); }}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: s.color, textDecoration: 'none', border: `1px solid ${s.color}40`, borderRadius: 5, padding: '3px 8px' }}
                              >
                                {n.actionLabel || 'Go'} <ChevronRight size={10} />
                              </Link>
                            ) : (
                              <a
                                href={n.externalUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => clearOne(n.id)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: s.color, textDecoration: 'none', border: `1px solid ${s.color}40`, borderRadius: 5, padding: '3px 8px' }}
                              >
                                {n.actionLabel || 'Open'} <ExternalLink size={10} />
                              </a>
                            )
                          )}
                        </div>
                        {/* Clear button */}
                        <button
                          onClick={() => clearOne(n.id)}
                          disabled={loading}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, flexShrink: 0, opacity: 0.6 }}
                          title="Dismiss"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
            )}
          </div>

          {notifs.length > 0 && (
            <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tap × to dismiss each item</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
