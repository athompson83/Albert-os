'use client';

import { useEffect, useMemo, useState } from 'react';
import TopBar from '@/components/TopBar';

type CapabilityStatus = 'ready' | 'needs_setup' | 'blocked';
type CapabilityMode = 'on-demand' | 'scheduled' | 'continuous';

type Capability = {
  id: string;
  name: string;
  description: string;
  agentId: string;
  mode: CapabilityMode;
  status: CapabilityStatus;
  endpoint?: string;
  workflowId?: string;
  sources: string[];
  keywords: string[];
  nextAction?: string;
};

type CapabilityResponse = {
  summary: {
    total: number;
    ready: number;
    needsSetup: number;
    blocked: number;
    modes: { onDemand: number; scheduled: number; continuous: number };
  };
  capabilities: Capability[];
};

const statusColor: Record<CapabilityStatus, string> = {
  ready: '#10b981',
  needs_setup: '#f59e0b',
  blocked: '#ef4444',
};

const modeLabel: Record<CapabilityMode, string> = {
  'on-demand': 'On demand',
  scheduled: 'Scheduled',
  continuous: 'Continuous',
};

function statusLabel(status: CapabilityStatus) {
  return status.replace('_', ' ');
}

export default function CapabilitiesPage() {
  const [data, setData] = useState<CapabilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | CapabilityStatus>('all');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/capabilities', { cache: 'no-store' });
      const next = await res.json();
      if (!res.ok) throw new Error(next?.error || `HTTP ${res.status}`);
      setData(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const capabilities = useMemo(() => {
    const all = data?.capabilities || [];
    return filter === 'all' ? all : all.filter(item => item.status === filter);
  }, [data, filter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--background)' }}>
      <TopBar title="Capabilities" />
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 22 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, color: '#fff' }}>Albert Capability Catalog</h2>
            <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: 13, maxWidth: 720 }}>
              OpenJarvis-style discoverable abilities mapped to Albert agents, Hermes endpoints, and workflow surfaces.
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
            ['Total', data?.summary.total ?? 0, '#a5b4fc'],
            ['Ready', data?.summary.ready ?? 0, '#10b981'],
            ['Needs setup', data?.summary.needsSetup ?? 0, '#f59e0b'],
            ['Continuous', data?.summary.modes.continuous ?? 0, '#38bdf8'],
          ].map(([label, value, color]) => (
            <div key={String(label)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: String(color) }}>{String(value)}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{String(label)}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {(['all', 'ready', 'needs_setup', 'blocked'] as const).map(item => (
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
              {item.replace('_', ' ')}
            </button>
          ))}
        </div>

        {loading && <div style={{ color: 'var(--text-muted)', padding: 32, textAlign: 'center' }}>Loading capabilities...</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {!loading && capabilities.map(capability => (
            <article key={capability.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <div style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{capability.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 3 }}>Agent: {capability.agentId}</div>
                </div>
                <span style={{ border: `1px solid ${statusColor[capability.status]}66`, background: `${statusColor[capability.status]}18`, color: statusColor[capability.status], borderRadius: 999, padding: '4px 8px', fontSize: 11, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                  {statusLabel(capability.status)}
                </span>
              </div>

              <p style={{ margin: 0, color: 'var(--text)', fontSize: 13, lineHeight: 1.45 }}>{capability.description}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 7, padding: 10 }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>Mode</div>
                  <div style={{ color: '#fff', fontSize: 13 }}>{modeLabel[capability.mode]}</div>
                </div>
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 7, padding: 10 }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>Endpoint</div>
                  <div style={{ color: '#fff', fontSize: 13, overflowWrap: 'anywhere' }}>{capability.endpoint || capability.workflowId || 'Albert OS'}</div>
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 6 }}>Sources</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {capability.sources.map(source => (
                    <span key={source} style={{ border: '1px solid var(--border)', borderRadius: 999, padding: '3px 8px', color: 'var(--text-muted)', fontSize: 11 }}>
                      {source}
                    </span>
                  ))}
                </div>
              </div>

              {capability.nextAction && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, color: '#fbbf24', fontSize: 12, lineHeight: 1.4 }}>
                  Needs Adam: {capability.nextAction}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
