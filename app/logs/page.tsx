'use client';
import { useEffect, useState, useCallback } from 'react';
import TopBar from '@/components/TopBar';

interface Conversation {
  id: string;
  source: 'web' | 'whatsapp';
  channel: string;
  timestamp: string;
  project: string;
  domain: string;
  user: string;
  albert: string;
  durationMs?: number;
}

const SOURCE_COLORS: Record<string, string> = {
  web: '#6366f1',
  whatsapp: '#10b981',
};

const SOURCE_ICONS: Record<string, string> = {
  web: '🖥️',
  whatsapp: '📱',
};

function formatTs(ts: string) {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' · ' +
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return ts; }
}

export default function LogsPage() {
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ date, limit: '200' });
      if (filter !== 'all') params.set('source', filter);
      const r = await fetch(`/api/history?${params}`);
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setConvos(d.conversations || []);
    } catch (e) {
      setError(String(e));
    }
    setLoading(false);
  }, [date, filter]);

  useEffect(() => { load(); }, [load]);

  const filtered = convos.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.user.toLowerCase().includes(q) || c.albert.toLowerCase().includes(q) || c.project.toLowerCase().includes(q);
  });

  const projects = [...new Set(convos.map(c => c.project).filter(Boolean))].sort();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--background)' }}>
      <TopBar title="Chat History" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="date" value={date}
            onChange={e => setDate(e.target.value)}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13 }}
          />
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13 }}>
            <option value="all">All Sources</option>
            <option value="web">Albert OS (Web)</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search conversations..."
            style={{ flex: 1, minWidth: 200, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13 }}
          />
          <button onClick={load} style={{ background: 'var(--primary)', border: 'none', borderRadius: 8, padding: '8px 16px', color: '#fff', cursor: 'pointer', fontSize: 13 }}>Refresh</button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 16px', fontSize: 13 }}>
            <span style={{ color: 'var(--text-muted)' }}>Total: </span>
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>{filtered.length}</span>
          </div>
          {['web','whatsapp'].map(src => {
            const count = filtered.filter(c => c.source === src).length;
            if (!count) return null;
            return (
              <div key={src} style={{ background: 'var(--surface)', border: `1px solid ${SOURCE_COLORS[src]}44`, borderRadius: 8, padding: '10px 16px', fontSize: 13 }}>
                <span style={{ color: SOURCE_COLORS[src] }}>{SOURCE_ICONS[src]} {src}: </span>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>{count}</span>
              </div>
            );
          })}
          {projects.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 16px', fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>Projects: </span>
              {projects.map(p => (
                <span key={p} style={{ marginLeft: 4, color: '#a5b4fc', cursor: 'pointer' }} onClick={() => setSearch(p)}>{p}</span>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div style={{ color: '#fca5a5', background: '#7f1d1d22', border: '1px solid #7f1d1d', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>⚠️ {error}</span>
            <button onClick={load} style={{ background: 'transparent', border: '1px solid #fca5a5', borderRadius: 6, padding: '4px 10px', color: '#fca5a5', cursor: 'pointer', fontSize: 12 }}>Retry</button>
          </div>
        )}

        {loading && <div style={{ color: 'var(--text-muted)', padding: 40, textAlign: 'center' }}>⏳ Loading conversations...</div>}

        {!loading && filtered.length === 0 && !error && (
          <div style={{ color: 'var(--text-muted)', padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
            <div>No conversations found for {date}</div>
          </div>
        )}

        {/* Conversation list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(c => {
            const isOpen = expanded === c.id;
            return (
              <div key={c.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                {/* Header row */}
                <div
                  onClick={() => setExpanded(isOpen ? null : c.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: 11, borderRadius: 5, padding: '2px 7px', background: SOURCE_COLORS[c.source] + '22', color: SOURCE_COLORS[c.source], border: '1px solid ' + SOURCE_COLORS[c.source] + '44', flexShrink: 0 }}>
                    {SOURCE_ICONS[c.source]} {c.channel}
                  </span>
                  {c.project && c.project !== 'General' && (
                    <span style={{ fontSize: 11, borderRadius: 5, padding: '2px 7px', background: '#6366f122', color: '#a5b4fc', border: '1px solid #6366f144', flexShrink: 0 }}>{c.project}</span>
                  )}
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.user}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{formatTs(c.timestamp)}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{isOpen ? '▲' : '▼'}</span>
                </div>
                {/* Expanded */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>YOU</div>
                      <div style={{ fontSize: 13, color: 'var(--text)', background: 'var(--primary)22', borderRadius: 8, padding: '10px 14px', whiteSpace: 'pre-wrap' }}>{c.user}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>🎩 ALBERT</div>
                      <div style={{ fontSize: 13, color: 'var(--text)', background: 'var(--surface-2)', borderRadius: 8, padding: '10px 14px', whiteSpace: 'pre-wrap', border: '1px solid var(--border)' }}>{c.albert}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
