'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import Link from 'next/link';

interface SystemStatus {
  proxy: string;
  agents: number;
  workflows: number;
  activeWorkflows: number;
  session: {
    date: string;
    summary: string[];
    pending: string[];
  };
}

export default function Dashboard() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      setDate(now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));
    };
    update();
    const t = setInterval(update, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch('/api/status').then(r => r.json()).then(setStatus).catch(() => {});
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const statCards = [
    { label: 'System Status', value: status?.proxy === 'online' ? 'Online' : status ? 'Offline' : '...', color: status?.proxy === 'online' ? '#10b981' : '#ef4444', emoji: '🟢', href: null },
    { label: 'AI Agents', value: status?.agents ?? '...', color: '#6366f1', emoji: '🤖', href: '/agents' },
    { label: 'Workflows', value: status?.workflows ?? '...', color: '#8b5cf6', emoji: '⚡', href: '/workflows' },
    { label: 'Active Workflows', value: status?.activeWorkflows ?? '...', color: '#f59e0b', emoji: '▶', href: '/workflows' },
  ];

  const quickLinks = [
    { href: '/chat', label: 'Chat with Albert', emoji: '💬', desc: 'Start a conversation' },
    { href: '/agents', label: 'Manage Agents', emoji: '🤖', desc: 'Edit specialist agents' },
    { href: '/workflows', label: 'Build Workflows', emoji: '⚡', desc: 'Automate tasks' },
    { href: '/tasks', label: 'Task Board', emoji: '✅', desc: 'View & manage tasks' },
    { href: '/files', label: 'Files', emoji: '📁', desc: 'Browse uploads' },
    { href: '/vibe', label: 'Vibe Coder', emoji: '⌨️', desc: 'AI code editor' },
  ];

  return (
    <div>
      <TopBar title="Dashboard" />
      <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>

        {/* Welcome */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>{greeting}, Adam 👋</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14 }}>{date} · {time}</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          {statCards.map(s => {
            const inner = (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '18px 20px', cursor: s.href ? 'pointer' : 'default', transition: 'border-color 0.15s' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{s.emoji}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
              </div>
            );
            return s.href ? <Link key={s.label} href={s.href} style={{ textDecoration: 'none' }}>{inner}</Link> : <div key={s.label}>{inner}</div>;
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
          {/* Session Summary */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: '#fff' }}>🎩 Today&apos;s Session — {status?.session.date || new Date().toISOString().split('T')[0]}</h3>
            {status?.session.summary.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                <span style={{ color: '#10b981', marginTop: 1, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 13, color: 'var(--text)' }}>{item}</span>
              </div>
            ))}
            {!status && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading session data...</div>}
          </div>

          {/* Pending Items */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: '#fff' }}>⏳ Needs Your Attention</h3>
            {status?.session.pending.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'flex-start', padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <span style={{ color: '#f59e0b', flexShrink: 0 }}>→</span>
                <span style={{ fontSize: 13, color: 'var(--text)' }}>{item}</span>
              </div>
            ))}
            {status?.session.pending.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Nothing pending 🎉</div>
            )}
            {!status && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading...</div>}
          </div>
        </div>

        {/* Quick Links */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#fff' }}>Quick Access</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {quickLinks.map(l => (
              <Link key={l.href} href={l.href} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', cursor: 'pointer' }}>
                  <span style={{ fontSize: 20 }}>{l.emoji}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#e5e5e5' }}>{l.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.desc}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
