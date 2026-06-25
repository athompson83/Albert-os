'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import TopBar from '@/components/TopBar';
import useIsMobile from '@/components/useIsMobile';

type ProgressUpdate = {
  id: string;
  title: string;
  detail: string;
  source: 'github' | 'report' | 'status';
  timestamp: string;
  agentId: string;
  url?: string;
  author?: string;
  sha?: string;
};

type ProgressSnapshot = {
  generatedAt: string;
  repo: string;
  githubUrl: string;
  latest?: ProgressUpdate;
  counts: { github: number; reports: number; status: number; blockers: number; capabilities?: number; readyCapabilities?: number };
  blockers: Array<{ issue: string; action: string; priority: string }>;
  agents: Array<{ id: string; name: string; updates: number; blockers: number; capabilities: number; readyCapabilities: number; latest?: ProgressUpdate }>;
  updates: ProgressUpdate[];
  capabilities?: {
    summary: { total: number; ready: number; needsSetup: number; blocked: number };
    readiness: Array<{ id: string; name: string; status: 'ready' | 'needs_setup' | 'blocked'; mode: string; agentId: string; endpoint?: string; nextAction?: string }>;
  };
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
  const isMobile = useIsMobile();
  const [snapshot, setSnapshot] = useState<ProgressSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | ProgressUpdate['source']>('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [feedback, setFeedback] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);

  const load = useCallback(async (agent = agentFilter) => {
    setLoading(true);
    setError('');
    try {
      const query = agent && agent !== 'all' ? `?agent=${encodeURIComponent(agent)}` : '';
      const res = await fetch(`/api/progress${query}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setSnapshot(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  }, [agentFilter]);

  useEffect(() => {
    load(agentFilter);
  }, [agentFilter, load]);

  const updates = useMemo(() => {
    const all = snapshot?.updates || [];
    return filter === 'all' ? all : all.filter(update => update.source === filter);
  }, [snapshot, filter]);

  async function sendFeedback() {
    const message = feedback.trim();
    if (!message) return;
    setSendingFeedback(true);
    setFeedbackStatus('');
    try {
      const res = await fetch('/api/progress/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          agentId: agentFilter === 'all' ? 'albert' : agentFilter,
          sourceFilter: filter,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setFeedback('');
      setFeedbackStatus('Saved to logs and sent to Albert.');
      await load(agentFilter);
    } catch (err) {
      setFeedbackStatus(err instanceof Error ? err.message : String(err));
    } finally {
      setSendingFeedback(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--background)' }}>
      <TopBar title="Progress" />
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? 14 : 24, minWidth: 0 }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 22 }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: 22, color: '#fff' }}>Hermes Progress Feed</h2>
            <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
              GitHub commits, status reports, and blockers for {snapshot?.repo || 'athompson83/Albert-os'}.
            </p>
          </div>
          <button onClick={() => load()} disabled={loading} style={{ background: 'var(--primary)', border: 'none', borderRadius: 8, padding: '9px 16px', color: '#fff', cursor: 'pointer', opacity: loading ? 0.6 : 1, width: isMobile ? '100%' : 'auto' }}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div style={{ border: '1px solid rgba(239,68,68,0.45)', color: '#fca5a5', background: 'rgba(239,68,68,0.08)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: isMobile ? 12 : 14, marginBottom: 18 }}>
          <div style={{ color: '#fff', fontSize: 13, fontWeight: 650, marginBottom: 10 }}>Filter by agent</div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
            {[{ id: 'all', name: 'All agents' }, ...(snapshot?.agents || [])].map(agent => {
              const active = agentFilter === agent.id;
              return (
                <button
                  key={agent.id}
                  onClick={() => setAgentFilter(agent.id)}
                  style={{
                    flex: '0 0 auto',
                    minHeight: 36,
                    background: active ? 'rgba(99,102,241,0.2)' : 'var(--surface-2)',
                    border: `1px solid ${active ? '#6366f1' : 'var(--border)'}`,
                    borderRadius: 8,
                    color: active ? '#d8b4fe' : 'var(--text)',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  {agent.name}
                  {'updates' in agent && <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>{agent.updates}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(140px, 1fr))', gap: isMobile ? 8 : 12, marginBottom: 18 }}>
          {[
            ['GitHub updates', snapshot?.counts.github ?? 0, '#10b981'],
            ['Report items', snapshot?.counts.reports ?? 0, '#6366f1'],
            ['Status items', snapshot?.counts.status ?? 0, '#f59e0b'],
            ['Blockers', snapshot?.counts.blockers ?? 0, '#ef4444'],
          ].map(([label, value, color]) => (
            <div key={String(label)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: isMobile ? 12 : 16, minWidth: 0 }}>
              <div style={{ fontSize: isMobile ? 22 : 26, fontWeight: 700, color: String(color) }}>{String(value)}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{String(label)}</div>
            </div>
          ))}
        </div>

        {snapshot?.capabilities && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: isMobile ? 14 : 18, marginBottom: 18 }}>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: 15 }}>Hermes Capability Readiness</h3>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 3 }}>
                  {snapshot.capabilities.summary.ready} of {snapshot.capabilities.summary.total} capabilities ready.
                </div>
              </div>
              <a href="/capabilities" style={{ color: '#a5b4fc', fontSize: 13, textDecoration: 'none' }}>Open catalog</a>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
              {snapshot.capabilities.readiness.slice(0, 6).map(capability => {
                const color = capability.status === 'ready' ? '#10b981' : capability.status === 'blocked' ? '#ef4444' : '#f59e0b';
                return (
                  <div key={capability.id} style={{ border: '1px solid var(--border)', borderRadius: 7, padding: 10, background: 'var(--surface-2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 7, height: 7, borderRadius: 999, background: color, flexShrink: 0 }} />
                      <span style={{ color: '#fff', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{capability.name}</span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 5 }}>
                      {capability.agentId} / {capability.mode} / {capability.status.replace('_', ' ')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {snapshot?.latest && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: isMobile ? 14 : 18, marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: sourceColor[snapshot.latest.source] }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Latest update</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: isMobile ? 0 : 'auto', width: isMobile ? '100%' : 'auto' }}>{formatTime(snapshot.latest.timestamp)}</span>
            </div>
            <div style={{ fontSize: 16, color: '#fff', fontWeight: 650 }}>{snapshot.latest.title}</div>
            {snapshot.latest.url && (
              <a href={snapshot.latest.url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 8, color: '#a5b4fc', fontSize: 13 }}>
                Open in GitHub
              </a>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 340px', gap: 18 }}>
          <section style={{ minWidth: 0 }}>
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
                <div key={update.id} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '120px minmax(0, 1fr)', gap: isMobile ? 8 : 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: isMobile ? 12 : 14, minWidth: 0 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: sourceColor[update.source], fontWeight: 700, textTransform: 'uppercase' }}>{update.source}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>{formatTime(update.timestamp)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>{update.agentId}</div>
                    {update.sha && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>{update.sha}</div>}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: '#fff', fontWeight: 600, lineHeight: 1.35 }}>{update.title}</div>
                    {update.author && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>By {update.author}</div>}
                    {update.url && <a href={update.url} target="_blank" rel="noreferrer" style={{ color: '#a5b4fc', fontSize: 12, display: 'inline-block', marginTop: 8 }}>View commit</a>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: isMobile ? 14 : 16, alignSelf: 'start', minWidth: 0 }}>
            <h3 style={{ margin: '0 0 10px', color: '#fff', fontSize: 15 }}>Send Progress Feedback</h3>
            <textarea
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              rows={4}
              placeholder="Tell Albert what to change, prioritize, explain, or stop."
              style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, color: '#fff', padding: 10, fontSize: 13, resize: 'vertical', marginBottom: 10 }}
            />
            <button
              onClick={sendFeedback}
              disabled={sendingFeedback || !feedback.trim()}
              style={{ width: '100%', background: 'var(--primary)', border: 'none', borderRadius: 8, color: '#fff', padding: '9px 12px', cursor: feedback.trim() ? 'pointer' : 'not-allowed', opacity: sendingFeedback || !feedback.trim() ? 0.65 : 1, marginBottom: 8 }}
            >
              {sendingFeedback ? 'Saving...' : 'Send to Albert'}
            </button>
            {feedbackStatus && <div style={{ color: feedbackStatus.includes('Saved') ? '#10b981' : '#fca5a5', fontSize: 12, marginBottom: 16 }}>{feedbackStatus}</div>}

            <div style={{ borderTop: '1px solid var(--border)', margin: '14px 0' }} />
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
