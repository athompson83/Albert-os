'use client';
import { useState, useEffect, useCallback } from 'react';
import TopBar from '@/components/TopBar';

type Status = 'todo' | 'inprogress' | 'review' | 'done';
type Priority = 'high' | 'medium' | 'low';

interface Task {
  id: string;
  title: string;
  description?: string;
  project?: string;
  priority: Priority;
  status: Status;
  dueDate?: string;
  source?: string;
  archivedAt?: string;
}

const COLUMNS: { id: Status; label: string; color: string }[] = [
  { id: 'todo',       label: 'To Do',       color: '#888'    },
  { id: 'inprogress', label: 'In Progress',  color: '#6366f1' },
  { id: 'review',     label: 'Review',       color: '#f59e0b' },
  { id: 'done',       label: 'Done',         color: '#10b981' },
];

const PRIORITY_COLOR: Record<Priority, string> = {
  high: '#ef4444', medium: '#f59e0b', low: '#6b7280',
};

const SOURCE_BADGE: Record<string, { label: string; color: string }> = {
  queue:            { label: 'Albert',  color: '#6366f1' },
  local:            { label: 'Local',   color: '#10b981' },
  monday_guideline: { label: 'Monday',  color: '#f59e0b' },
  monday_tech:      { label: 'Monday',  color: '#f59e0b' },
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const STORAGE_KEY = 'albert-tasks-overrides';

  // Load local overrides (status/deleted changes made while proxy was offline)
  const getOverrides = (): Record<string, { status?: Status; deleted?: boolean }> => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
  };
  const saveOverride = (id: string, patch: { status?: Status; deleted?: boolean }) => {
    const ov = getOverrides();
    ov[id] = { ...ov[id], ...patch };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ov));
  };
  const clearOverride = (id: string) => {
    const ov = getOverrides();
    delete ov[id];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ov));
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      const raw: Task[] = (data.tasks || []).filter((t: Task) => !t.archivedAt);
      // Apply local overrides on top of server data
      const overrides = getOverrides();
      const merged = raw
        .filter(t => !overrides[t.id]?.deleted)
        .map(t => overrides[t.id]?.status ? { ...t, status: overrides[t.id].status! } : t);
      setTasks(merged);
    } catch {
      // Proxy offline — load from previous state if any
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  const moveTask = async (id: string, status: Status) => {
    // Optimistic update + persist locally immediately
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    saveOverride(id, { status });
    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) clearOverride(id); // synced — clear local override
    } catch {
      // Proxy offline — change saved locally, will sync on next successful load
    }
  };

  const deleteTask = async (id: string) => {
    // Optimistic update + persist locally immediately
    setTasks(prev => prev.filter(t => t.id !== id));
    saveOverride(id, { deleted: true });
    try {
      const res = await fetch('/api/tasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) clearOverride(id);
    } catch {
      // Saved locally
    }
  };

  const syncMonday = async () => {
    setSyncing(true);
    await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _action: 'sync' }) });
    await load();
    setSyncing(false);
  };

  const projects = ['all', ...Array.from(new Set(tasks.map(t => t.project || 'General').filter(Boolean)))];
  const filtered = filter === 'all' ? tasks : tasks.filter(t => (t.project || 'General') === filter);

  const onDragStart = (id: string) => setDragging(id);
  const onDrop = (status: Status) => {
    if (dragging) { moveTask(dragging, status); setDragging(null); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopBar title="Tasks" />
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Project filter */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
          {projects.slice(0, 8).map(p => (
            <button key={p} onClick={() => setFilter(p)} style={{
              background: filter === p ? 'rgba(99,102,241,0.15)' : 'transparent',
              border: `1px solid ${filter === p ? '#6366f1' : 'var(--border)'}`,
              borderRadius: 20, padding: '4px 12px', color: filter === p ? '#a5b4fc' : 'var(--text-muted)',
              fontSize: 12, cursor: 'pointer',
            }}>{p === 'all' ? `All (${tasks.length})` : p}</button>
          ))}
        </div>
        <button onClick={syncMonday} disabled={syncing} style={{
          background: 'transparent', border: '1px solid var(--border)', borderRadius: 8,
          padding: '6px 14px', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
        }}>
          {syncing ? '⏳ Syncing...' : '↻ Sync Monday'}
        </button>
        <button onClick={load} style={{
          background: 'transparent', border: '1px solid var(--border)', borderRadius: 8,
          padding: '6px 14px', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
        }}>↺ Refresh</button>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>⏳ Loading tasks...</div>
      ) : (
        <div style={{ flex: 1, overflowX: 'auto', padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: 14, minWidth: 900, height: '100%' }}>
            {COLUMNS.map(col => {
              const colTasks = filtered.filter(t => t.status === col.id);
              return (
                <div key={col.id}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => onDrop(col.id)}
                  style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column' }}>
                  {/* Column header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.color }} />
                    <span style={{ fontWeight: 600, fontSize: 13, color: '#e5e5e5' }}>{col.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto',
                      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '1px 7px' }}>
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Drop zone */}
                  <div style={{ flex: 1, minHeight: 100, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {colTasks.map(task => (
                      <div key={task.id}
                        draggable
                        onDragStart={() => onDragStart(task.id)}
                        style={{
                          background: 'var(--surface)', border: '1px solid var(--border)',
                          borderRadius: 10, padding: '12px 14px', cursor: 'grab',
                          transition: 'border-color 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = '#6366f1')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                      >
                        {/* Title */}
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#e5e5e5', marginBottom: 8, lineHeight: 1.4 }}>
                          {task.title}
                        </div>

                        {/* Meta row */}
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ fontSize: 10, color: PRIORITY_COLOR[task.priority], fontWeight: 600 }}>
                            ● {task.priority}
                          </span>
                          {task.project && task.project !== 'Albert Queue' && (
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '1px 6px', borderRadius: 8, border: '1px solid var(--border)' }}>
                              {task.project}
                            </span>
                          )}
                          {task.source && SOURCE_BADGE[task.source] && (
                            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: SOURCE_BADGE[task.source].color + '22', color: SOURCE_BADGE[task.source].color, border: `1px solid ${SOURCE_BADGE[task.source].color}44` }}>
                              {SOURCE_BADGE[task.source].label}
                            </span>
                          )}
                          {task.dueDate && (
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                              📅 {task.dueDate}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                          {col.id !== 'done' && (
                            <button onClick={() => moveTask(task.id, 'done')} style={{
                              background: '#10b98115', border: '1px solid #10b98144', borderRadius: 5,
                              color: '#10b981', fontSize: 11, padding: '2px 8px', cursor: 'pointer',
                            }}>✓ Done</button>
                          )}
                          {col.id === 'todo' && (
                            <button onClick={() => moveTask(task.id, 'inprogress')} style={{
                              background: '#6366f115', border: '1px solid #6366f144', borderRadius: 5,
                              color: '#a5b4fc', fontSize: 11, padding: '2px 8px', cursor: 'pointer',
                            }}>→ Start</button>
                          )}
                          <button onClick={() => deleteTask(task.id)} style={{
                            background: 'transparent', border: '1px solid var(--border)', borderRadius: 5,
                            color: 'var(--text-muted)', fontSize: 11, padding: '2px 8px', cursor: 'pointer', marginLeft: 'auto',
                          }}>✕</button>
                        </div>
                      </div>
                    ))}

                    {colTasks.length === 0 && (
                      <div style={{ border: '1px dashed var(--border)', borderRadius: 10, padding: 20,
                        textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                        Drop here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
