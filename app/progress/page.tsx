'use client';

import { useEffect, useMemo, useState } from 'react';
import TopBar from '@/components/TopBar';

type ProgressUpdate = {
  id: string;
  title: string;
  detail: string;
  source: 'github' | 'report' | 'status';
  timestamp: string;
  url?: string;
  author?: string;
  sha?: string;
};

type ProgressSnapshot = {
  generatedAt: string;
  repo: string;
  githubUrl: string;
  latest?: ProgressUpdate;
  counts: { github: number; reports: number; status: number; blockers: number };
  blockers: Array<{ issue: string; action: string; priority: string }>;
  updates: ProgressUpdate[];
};

const sourceColor: Record<ProgressUpdate['source'], string> = {
  github: '#10b981',
  report: '#6366f1',
  status: '#f59e0b',
};

function formatTime(value: string) {
  try {
    const date = new Date(value);
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return value;
  }
}

export default function ProgressPage() {
  const [snapshot, setSnapshot] = useState<ProgressSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | ProgressUpdate['source']>('all');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/progress', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setSnapshot(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const updates = useMemo(() => {
    const all = snapshot?.updates || [];
    return filter === 'all' ? all : all.filter(update => update.source === filter);
  }, [snapshot, filter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--background)' }}>
      <TopBar title="Progress" />
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 22 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, color: '#fff' }}>Hermes Progress Feed</h2>
            <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
              GitHub commits, status reports, and blockers for {snapshot?.repo || 'athompson83/Albert-os'}.
            </p>
          </div>
          <button onClick={load} disabled={loading} style={{ background: 'var(--primary)', border: 'none', borderRadius: 8, padding: '9px 16px', color: '#fff', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div style={{ border: '1px solid rgba(239,68,68,0.45)', color: '#fca5a5', background: 'rgba(239,68,68,0.08)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(140px, 1fr))', gap: 12, marginBottom: 18 }}>
          {[
            ['GitHub updates', snapshot?.counts.github ?? 0, '#10b981'],
            ['Report items', snapshot?.counts.reports ?? 0, '#6366f1'],
            ['Status items', snapshot?.counts.status ?? 0, '#f59e0b'],
            ['Blockers', snapshot?.counts.blockers ?? 0, '#ef4444'],
          ].map(([label, value, color]) => (
            <div key={String(label)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: String(color) }}>{String(value)}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{String(label)}</div>
            </div>
          ))}
        </div>

        {snapshot?.latest && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 18, marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: sourceColor[snapshot.latest.source] }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Latest update</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>{formatTime(snapshot.latest.timestamp)}</span>
            </div>
            <div style={{ fontSize: 16, color: '#fff', fontWeight: 650 }}>{snapshot.latest.title}</div>
            {snapshot.latest.url && (
              <a href={snapshot.latest.url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 8, color: '#a5b4fc', fontSize: 13 }}>
                Open in GitHub
              </a>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 18 }}>
          <section>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              {(['all', 'github', 'report', 'status'] as const).map(item => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  style={{
                    background: filter === item ? 'rgba(99,102,241,0.18)' : 'transparent',
                    border: `1px solid ${filter === item ? '#6366f1' : 'var(--border)'}`,
                    borderRadius: 20,
                    color: filter === item ? '#c4b5fd' : 'var(--text-muted)',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontSize: 12,
                    textTransform: 'capitalize',
                  }}
                >
                  {item}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {loading && <div style={{ color: 'var(--text-muted)', padding: 32, textAlign: 'center' }}>Loading progress...</div>}
              {!loading && updates.map(update => (
                <div key={update.id} style={{ display: 'grid', gridTemplateColumns: '120px minmax(0, 1fr)', gap: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, color: sourceColor[update.source], fontWeight: 700, textTransform: 'uppercase' }}>{update.source}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>{formatTime(update.timestamp)}</div>
                    {update.sha && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>{update.sha}</div>}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, color: '#fff', fontWeight: 600, lineHeight: 1.35 }}>{update.title}</div>
                    {update.author && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>By {update.author}</div>}
                    {update.url && <a href={update.url} target="_blank" rel="noreferrer" style={{ color: '#a5b4fc', fontSize: 12, display: 'inline-block', marginTop: 8 }}>View commit</a>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, alignSelf: 'start' }}>
            <h3 style={{ margin: '0 0 12px', color: '#fff', fontSize: 15 }}>Needs Adam</h3>
            {(snapshot?.blockers || []).length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No blockers listed.</div>}
            {(snapshot?.blockers || []).map(item => (
              <div key={`${item.issue}-${item.action}`} style={{ borderTop: '1px solid var(--border)', padding: '12px 0' }}>
                <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{item.issue}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.45, marginTop: 4 }}>{item.action}</div>
                <div style={{ fontSize: 11, color: item.priority.toLowerCase().includes('high') ? '#f87171' : '#f59e0b', marginTop: 6 }}>{item.priority}</div>
              </div>
            ))}
            <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 10 }}>
              Last refreshed {snapshot ? formatTime(snapshot.generatedAt) : 'not yet'}.
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
