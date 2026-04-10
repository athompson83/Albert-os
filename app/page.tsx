'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import Link from 'next/link';

type PendingItem = {
  id: string;
  text: string;
  type: 'navigate' | 'chat' | 'external' | 'task';
  href?: string;
  chatPrompt?: string;
  externalUrl?: string;
  priority?: 'high' | 'medium' | 'low';
  tag?: string;
};

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  project: string;
  dueDate?: string;
  source?: string;
  archivedAt?: string;
};

interface SystemStatus {
  proxy: string;
  agents: number;
  workflows: number;
  activeWorkflows: number;
  session: {
    date: string;
    summary: string[];
    pending: PendingItem[];
  };
}

const PRIORITY_COLOR: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#6366f1',
};

const TAG_COLOR: Record<string, string> = {
  System: '#6366f1',
  Revenue: '#10b981',
  EMS: '#ef4444',
  Tech: '#8b5cf6',
};

export default function Dashboard() {
  const router = useRouter();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [askingId, setAskingId] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      setDate(now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));
    };
    update();
    const t = setInterval(update, 30000);
    // Load dismissed from localStorage
    try {
      const d = JSON.parse(localStorage.getItem('dismissed-pending') || '[]');
      setDismissed(d);
    } catch {}
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch('/api/status').then(r => r.json()).then(setStatus).catch(() => {});
    fetch('/api/tasks').then(r => r.json()).then(d => {
      const active = (d.tasks || []).filter((t: Task) => !t.archivedAt && t.status !== 'done');
      setTasks(active.slice(0, 5));
    }).catch(() => {});
  }, []);

  const dismiss = useCallback((id: string) => {
    setDismissed(prev => {
      const next = [...prev, id];
      localStorage.setItem('dismissed-pending', JSON.stringify(next));
      return next;
    });
    setExpandedId(null);
  }, []);

  const handleAction = useCallback((item: PendingItem) => {
    if (item.type === 'navigate' && item.href) {
      router.push(item.href);
    } else if (item.type === 'external' && item.externalUrl) {
      window.open(item.externalUrl, '_blank');
    } else if (item.type === 'chat' && item.chatPrompt) {
      // Store prompt and go to chat
      localStorage.setItem('chat-prefill', item.chatPrompt);
      router.push('/chat');
    }
  }, [router]);

  const markTaskDone = useCallback(async (taskId: string) => {
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId, status: 'done' }),
    });
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const statCards = [
    { label: 'System', value: status?.proxy === 'online' ? 'Online' : status ? 'Offline' : '…', color: status?.proxy === 'online' ? '#10b981' : '#ef4444', emoji: status?.proxy === 'online' ? '🟢' : '🔴', href: null },
    { label: 'AI Agents', value: status?.agents ?? '…', color: '#6366f1', emoji: '🤖', href: '/agents' },
    { label: 'Workflows', value: status?.workflows ?? '…', color: '#8b5cf6', emoji: '⚡', href: '/workflows' },
    { label: 'Active', value: status?.activeWorkflows ?? '…', color: '#f59e0b', emoji: '▶️', href: '/workflows' },
  ];

  const quickLinks = [
    { href: '/chat', label: 'Chat', emoji: '💬', desc: 'Talk to Albert' },
    { href: '/agents', label: 'Agents', emoji: '🤖', desc: 'Manage specialists' },
    { href: '/workflows', label: 'Workflows', emoji: '⚡', desc: 'Automate tasks' },
    { href: '/tasks', label: 'Tasks', emoji: '✅', desc: 'Task board' },
    { href: '/files', label: 'Files', emoji: '📁', desc: 'Browse uploads' },
    { href: '/logs', label: 'Logs', emoji: '📋', desc: 'Chat history' },
  ];

  const visiblePending = (status?.session.pending || []).filter(p => !dismissed.includes(p.id));

  return (
    <div>
      <TopBar title="Dashboard" />
      <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>

        {/* Welcome */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>{greeting}, Adam 👋</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14 }}>{date} · {time}</p>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {statCards.map(s => {
            const inner = (
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
                padding: '18px 20px', cursor: s.href ? 'pointer' : 'default',
                transition: 'border-color 0.15s, transform 0.1s',
              }}
                onMouseEnter={e => { if (s.href) (e.currentTarget as HTMLDivElement).style.borderColor = s.color; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; }}
              >
                <div style={{ fontSize: 22, marginBottom: 8 }}>{s.emoji}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{String(s.value)}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
              </div>
            );
            return s.href
              ? <Link key={s.label} href={s.href} style={{ textDecoration: 'none' }}>{inner}</Link>
              : <div key={s.label}>{inner}</div>;
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

          {/* Needs Attention */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
              ⏳ Needs Your Attention
              {visiblePending.length > 0 && (
                <span style={{ background: '#ef4444', color: '#fff', borderRadius: 20, fontSize: 11, padding: '1px 7px', fontWeight: 700 }}>
                  {visiblePending.length}
                </span>
              )}
            </h3>

            {visiblePending.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>All clear 🎉</div>
            )}

            {visiblePending.map(item => {
              const isExpanded = expandedId === item.id;
              const isAsking = askingId === item.id;
              const pColor = PRIORITY_COLOR[item.priority || 'medium'];
              const tColor = TAG_COLOR[item.tag || 'System'] || '#6366f1';

              return (
                <div key={item.id} style={{ marginBottom: 8 }}>
                  {/* Item row */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    style={{
                      display: 'flex', gap: 10, alignItems: 'flex-start',
                      padding: '10px 12px',
                      background: isExpanded ? 'rgba(99,102,241,0.08)' : 'var(--surface-2)',
                      borderRadius: isExpanded ? '8px 8px 0 0' : 8,
                      border: `1px solid ${isExpanded ? 'rgba(99,102,241,0.4)' : 'var(--border)'}`,
                      borderBottom: isExpanded ? 'none' : undefined,
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                  >
                    <span style={{ color: pColor, fontSize: 12, marginTop: 1, flexShrink: 0 }}>●</span>
                    <span style={{ fontSize: 13, color: 'var(--text)', flex: 1, lineHeight: 1.4 }}>{item.text}</span>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexShrink: 0 }}>
                      {item.tag && (
                        <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 10, background: `${tColor}22`, color: tColor, fontWeight: 600 }}>
                          {item.tag}
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {/* Expanded actions */}
                  {isExpanded && (
                    <div style={{
                      padding: '10px 12px', background: 'rgba(99,102,241,0.05)',
                      border: '1px solid rgba(99,102,241,0.4)', borderTop: 'none',
                      borderRadius: '0 0 8px 8px', display: 'flex', gap: 8, flexWrap: 'wrap',
                    }}>
                      {/* Primary action */}
                      {(item.type === 'navigate' || item.type === 'external') && (
                        <button onClick={() => handleAction(item)} style={actionBtn('#6366f1')}>
                          {item.type === 'external' ? '↗ Open' : '→ Go There'}
                        </button>
                      )}
                      {item.type === 'chat' && (
                        <button
                          onClick={() => { setAskingId(item.id); handleAction(item); }}
                          disabled={isAsking}
                          style={actionBtn('#10b981')}
                        >
                          💬 Ask Albert
                        </button>
                      )}
                      {item.type === 'task' && item.href && (
                        <button onClick={() => router.push(item.href!)} style={actionBtn('#6366f1')}>
                          → View Task
                        </button>
                      )}
                      {/* Mark done — always available */}
                      <button onClick={() => dismiss(item.id)} style={actionBtn('#374151', true)}>
                        ✓ Mark Done
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tasks from board */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>✅ Open Tasks</span>
              <Link href="/tasks" style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none' }}>View all →</Link>
            </h3>

            {tasks.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                {status ? 'No open tasks 🎉' : 'Loading...'}
              </div>
            )}

            {tasks.map(task => (
              <div
                key={task.id}
                style={{
                  display: 'flex', gap: 10, alignItems: 'center',
                  padding: '9px 12px', marginBottom: 6,
                  background: 'var(--surface-2)', borderRadius: 8,
                  border: '1px solid var(--border)',
                  cursor: 'pointer', transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#6366f1')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                onClick={() => router.push('/tasks')}
              >
                <span style={{ fontSize: 10, color: PRIORITY_COLOR[task.priority] || '#f59e0b' }}>●</span>
                <span style={{ fontSize: 13, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {task.title}
                </span>
                {task.project && (
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>{task.project}</span>
                )}
                <button
                  onClick={e => { e.stopPropagation(); markTaskDone(task.id); }}
                  title="Mark done"
                  style={{
                    background: 'transparent', border: '1px solid var(--border)',
                    borderRadius: 4, color: 'var(--text-muted)', fontSize: 11,
                    padding: '2px 6px', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  ✓
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Session Summary + Quick Links */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Session summary */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: '#fff' }}>
              🎩 Built This Session
            </h3>
            {(status?.session.summary || []).map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7, alignItems: 'flex-start' }}>
                <span style={{ color: '#10b981', marginTop: 1, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 13, color: 'var(--text)' }}>{item}</span>
              </div>
            ))}
            {!status && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading...</div>}
          </div>

          {/* Quick links */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: '#fff' }}>Quick Access</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {quickLinks.map(l => (
                <Link key={l.href} href={l.href} style={{ textDecoration: 'none' }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#6366f1')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    <span style={{ fontSize: 18 }}>{l.emoji}</span>
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
    </div>
  );
}

function actionBtn(color: string, muted = false): React.CSSProperties {
  return {
    background: muted ? 'transparent' : `${color}22`,
    border: `1px solid ${muted ? 'var(--border)' : color}`,
    borderRadius: 6,
    color: muted ? 'var(--text-muted)' : color,
    fontSize: 12,
    padding: '5px 12px',
    cursor: 'pointer',
    fontWeight: 500,
  };
}
