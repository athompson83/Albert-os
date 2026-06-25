'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import TopBar from '@/components/TopBar';
import useIsMobile from '@/components/useIsMobile';

type MarketingAsset = {
  id: string;
  title: string;
  type: 'outreach' | 'experiment' | 'prospects' | 'site' | 'product';
  source: string;
  summary: string;
  status: 'draft' | 'active' | 'review' | 'ready';
  agentId: string;
};

type MarketingSnapshot = {
  generatedAt: string;
  summary: {
    activeCampaigns: number;
    prospectLists: number;
    productAssets: number;
    openMarketingTasks: number;
  };
  assets: MarketingAsset[];
  tasks: Array<{ id: string; title: string; status: string; priority: string; assignedTo?: string; project?: string }>;
  recentEvents: Array<{ id: string; title: string; detail: string; timestamp: string }>;
};

const statusColor: Record<string, string> = {
  active: '#10b981',
  ready: '#38bdf8',
  review: '#f59e0b',
  draft: '#94a3b8',
};

export default function MarketingPage() {
  const isMobile = useIsMobile();
  const [snapshot, setSnapshot] = useState<MarketingSnapshot | null>(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/marketing', { cache: 'no-store' });
      setSnapshot(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const assets = useMemo(() => {
    const all = snapshot?.assets || [];
    return filter === 'all' ? all : all.filter(asset => asset.type === filter || asset.agentId === filter);
  }, [snapshot, filter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--background)' }}>
      <TopBar title="Marketing" />
      <main style={{ flex: 1, padding: isMobile ? 14 : 24, maxWidth: 1180, width: '100%', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: 14, marginBottom: 18 }}>
          <div>
            <h2 style={{ margin: 0, color: '#fff', fontSize: 22 }}>Marketing Workbench</h2>
            <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
              Campaigns, prospect lists, product assets, and revenue work Albert&apos;s team is moving.
            </p>
          </div>
          <button onClick={load} disabled={loading} style={{ background: 'var(--primary)', border: 'none', borderRadius: 8, padding: '9px 16px', color: '#fff', cursor: 'pointer', opacity: loading ? 0.65 : 1 }}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))', gap: isMobile ? 8 : 12, marginBottom: 16 }}>
          <Metric label="Active campaigns" value={String(snapshot?.summary.activeCampaigns || 0)} tone="#10b981" />
          <Metric label="Prospect lists" value={String(snapshot?.summary.prospectLists || 0)} tone="#38bdf8" />
          <Metric label="Product assets" value={String(snapshot?.summary.productAssets || 0)} tone="#a5b4fc" />
          <Metric label="Open tasks" value={String(snapshot?.summary.openMarketingTasks || 0)} tone="#f59e0b" />
        </div>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 14, paddingBottom: 2 }}>
          {['all', 'albert', 'hermes', 'outreach', 'prospects', 'product', 'site'].map(item => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              style={{
                flex: '0 0 auto',
                background: filter === item ? 'rgba(99,102,241,0.2)' : 'var(--surface)',
                border: `1px solid ${filter === item ? '#6366f1' : 'var(--border)'}`,
                borderRadius: 8,
                color: filter === item ? '#d8b4fe' : 'var(--text)',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: 12,
                textTransform: 'capitalize',
              }}
            >
              {item}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 330px', gap: 16 }}>
          <section style={{ display: 'grid', gap: 10, alignSelf: 'start' }}>
            {assets.map(asset => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
            {!loading && assets.length === 0 && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 24, color: 'var(--text-muted)', textAlign: 'center' }}>
                No marketing assets match this filter.
              </div>
            )}
          </section>

          <aside style={{ display: 'grid', gap: 16, alignSelf: 'start' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
              <h3 style={{ margin: '0 0 12px', color: '#fff', fontSize: 15 }}>Open Marketing Tasks</h3>
              <div style={{ display: 'grid', gap: 8 }}>
                {(snapshot?.tasks || []).slice(0, 8).map(task => (
                  <Link key={task.id} href="/tasks" style={{ textDecoration: 'none', border: '1px solid var(--border)', background: 'var(--surface-2)', borderRadius: 8, padding: 10 }}>
                    <div style={{ color: '#fff', fontSize: 13, fontWeight: 650 }}>{task.title}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>{task.status} / {task.priority}</div>
                  </Link>
                ))}
                {(snapshot?.tasks || []).length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No marketing tasks are waiting.</div>}
              </div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
              <h3 style={{ margin: '0 0 12px', color: '#fff', fontSize: 15 }}>Useful Paths</h3>
              <div style={{ display: 'grid', gap: 8 }}>
                <Link href="/products" style={quickLink}>Products</Link>
                <Link href="/revenue" style={quickLink}>Revenue</Link>
                <Link href="/customers" style={quickLink}>Customers</Link>
                <Link href="/content" style={quickLink}>Content</Link>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
      <div style={{ color: tone, fontSize: 24, fontWeight: 750 }}>{value}</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 3 }}>{label}</div>
    </div>
  );
}

function AssetCard({ asset }: { asset: MarketingAsset }) {
  const color = statusColor[asset.status] || '#94a3b8';
  const href = asset.source.startsWith('http') ? asset.source : asset.type === 'product' || asset.type === 'site' ? '/products' : '/files';
  return (
    <Link href={href} target={href.startsWith('http') ? '_blank' : undefined} style={{ textDecoration: 'none' }}>
      <article style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 15 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div>
            <div style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{asset.title}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>{asset.type} / {asset.agentId}</div>
          </div>
          <span style={{ color, border: `1px solid ${color}55`, background: `${color}18`, borderRadius: 999, padding: '4px 8px', fontSize: 11, whiteSpace: 'nowrap' }}>{asset.status}</span>
        </div>
        <p style={{ color: 'var(--text)', fontSize: 13, lineHeight: 1.45, margin: '10px 0 0' }}>{asset.summary}</p>
        <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 10, overflowWrap: 'anywhere' }}>{asset.source}</div>
      </article>
    </Link>
  );
}

const quickLink: React.CSSProperties = {
  color: 'var(--text)',
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '10px 12px',
  textDecoration: 'none',
  fontSize: 13,
};
