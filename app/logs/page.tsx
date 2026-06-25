'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import TopBar from '@/components/TopBar';
import useIsMobile from '@/components/useIsMobile';

type ExchangeLog = {
  id: string;
  timestamp: string;
  source: 'web' | 'hermes' | 'slack' | 'system' | 'stripe';
  direction: 'inbound' | 'outbound' | 'internal';
  channel: string;
  kind: string;
  actor: string;
  targetAgentId?: string;
  summary: string;
  relatedId?: string;
  persisted: boolean;
};

const sourceColor: Record<string, string> = {
  web: '#6366f1',
  hermes: '#38bdf8',
  slack: '#10b981',
  system: '#f59e0b',
  stripe: '#a5b4fc',
};

function formatTs(ts: string) {
  try {
    const d = new Date(ts);
    return `${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} / ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  } catch {
    return ts;
  }
}

export default function LogsPage() {
  const isMobile = useIsMobile();
  const [logs, setLogs] = useState<ExchangeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [source, setSource] = useState('all');
  const [kind, setKind] = useState('all');
  const [search, setSearch] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ date, limit: '300' });
      if (source !== 'all') params.set('source', source);
      if (kind !== 'all') params.set('kind', kind);
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/logs/exchanges?${params}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setLogs(data.logs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [date, source, kind, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const kinds = useMemo(() => ['all', ...Array.from(new Set(logs.map(log => log.kind))).sort()], [logs]);
  const counts = useMemo(() => ({
    total: logs.length,
    inbound: logs.filter(log => log.direction === 'inbound').length,
    persisted: logs.filter(log => log.persisted).length,
  }), [logs]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--background)' }}>
      <TopBar title="Logs" />
      <main style={{ flex: 1, overflowY: 'auto', padding: isMobile ? 14 : 22 }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: 14, marginBottom: 18 }}>
          <div>
            <h2 style={{ margin: 0, color: '#fff', fontSize: 22 }}>Albert Exchange Log</h2>
            <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
              Product feedback, progress feedback, chats, Slack, Hermes inbox, and system updates.
            </p>
          </div>
          <button onClick={load} disabled={loading} style={{ background: 'var(--primary)', border: 'none', borderRadius: 8, padding: '9px 16px', color: '#fff', cursor: 'pointer', opacity: loading ? 0.65 : 1 }}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, minmax(0, 160px))', gap: 10, marginBottom: 14 }}>
          <Metric label="Entries" value={String(counts.total)} />
          <Metric label="Inbound" value={String(counts.inbound)} />
          <Metric label="Saved" value={String(counts.persisted)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '180px 170px 210px minmax(220px, 1fr)', gap: 10, marginBottom: 14 }}>
          <input type="date" value={date} onChange={event => setDate(event.target.value)} style={controlStyle} />
          <select value={source} onChange={event => setSource(event.target.value)} style={controlStyle}>
            <option value="all">All sources</option>
            <option value="web">Web</option>
            <option value="hermes">Hermes</option>
            <option value="slack">Slack</option>
            <option value="system">System</option>
            <option value="stripe">Stripe</option>
          </select>
          <select value={kind} onChange={event => setKind(event.target.value)} style={controlStyle}>
            {kinds.map(item => <option key={item} value={item}>{item.replace(/_/g, ' ')}</option>)}
          </select>
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search logs..." style={controlStyle} />
        </div>

        {error && <div style={{ color: '#fca5a5', border: '1px solid rgba(239,68,68,0.45)', background: 'rgba(239,68,68,0.08)', borderRadius: 8, padding: 12, marginBottom: 14 }}>{error}</div>}
        {loading && <div style={{ color: 'var(--text-muted)', padding: 34, textAlign: 'center' }}>Loading logs...</div>}

        {!loading && logs.length === 0 && (
          <div style={{ color: 'var(--text-muted)', padding: 44, textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
            No exchanges found for this view yet.
          </div>
        )}

        <div style={{ display: 'grid', gap: 8 }}>
          {logs.map(log => {
            const open = expanded === log.id;
            const color = sourceColor[log.source] || '#94a3b8';
            return (
              <article key={log.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <button
                  onClick={() => setExpanded(open ? null : log.id)}
                  style={{ width: '100%', border: 'none', background: 'transparent', color: 'inherit', textAlign: 'left', padding: isMobile ? 12 : 14, cursor: 'pointer', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '170px minmax(0, 1fr) 160px', gap: 10, alignItems: 'center' }}
                >
                  <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ color, background: `${color}18`, border: `1px solid ${color}55`, borderRadius: 999, padding: '3px 8px', fontSize: 11 }}>{log.source}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{log.direction}</span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: '#fff', fontSize: 13, fontWeight: 650, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isMobile ? 'normal' : 'nowrap' }}>{log.summary}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 3 }}>{log.kind.replace(/_/g, ' ')} / {log.channel} / {log.actor}{log.targetAgentId ? ` to ${log.targetAgentId}` : ''}</div>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11, textAlign: isMobile ? 'left' : 'right' }}>{formatTs(log.timestamp)}</div>
                </button>
                {open && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: 14, color: 'var(--text)', fontSize: 13, lineHeight: 1.5 }}>
                    <div><strong>Saved:</strong> {log.persisted ? 'Yes' : 'Memory fallback'}</div>
                    <div><strong>Related:</strong> {log.relatedId || 'None'}</div>
                    <div><strong>ID:</strong> {log.id}</div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
      <div style={{ color: '#fff', fontSize: 22, fontWeight: 750 }}>{value}</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{label}</div>
    </div>
  );
}

const controlStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '9px 11px',
  color: 'var(--text)',
  fontSize: 13,
};
