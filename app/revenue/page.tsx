'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import useIsMobile from '@/components/useIsMobile';

type RevenueData = {
  subscribers: { free: number; paid: number };
  revenue: { mrr: number; arr: number; total_earned: number };
  growth: null | { free: number; paid: number; mrr: number };
  issues: { total: number; published: number; drafts: number; next_topic: string | null };
  leadmagnets: Array<{ name: string; file: string; date: string }>;
};

type Product = {
  id: string;
  title: string;
  status: 'draft' | 'ready' | 'needs_improvement' | 'removed' | 'published';
  price?: string;
  type: string;
  vercelUrl?: string;
};

type StatusData = {
  hermes?: { connected: boolean; lastUpdatedAt: string };
  credentialsRequested?: number;
};

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default function RevenuePage() {
  const isMobile = useIsMobile();
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [revenueRes, productsRes, statusRes] = await Promise.all([
      fetch('/api/revenue', { cache: 'no-store' }).catch(() => null),
      fetch('/api/products', { cache: 'no-store' }).catch(() => null),
      fetch('/api/status', { cache: 'no-store' }).catch(() => null),
    ]);

    if (revenueRes?.ok) setRevenue(await revenueRes.json());
    if (productsRes?.ok) {
      const data = await productsRes.json();
      setProducts(data.products || []);
    }
    if (statusRes?.ok) setStatus(await statusRes.json());
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const activeProducts = products.filter(product => product.status !== 'removed');
  const publishedProducts = activeProducts.filter(product => product.status === 'published');
  const reviewProducts = activeProducts.filter(product => product.status === 'ready' || product.status === 'needs_improvement');
  const catalogValue = activeProducts.reduce((sum, product) => {
    const price = Number(String(product.price || '').replace(/[^0-9.]/g, ''));
    return sum + (Number.isFinite(price) ? price : 0);
  }, 0);

  const metrics = [
    { label: 'MRR', value: money.format(revenue?.revenue.mrr || 0), tone: '#10b981' },
    { label: 'ARR', value: money.format(revenue?.revenue.arr || 0), tone: '#38bdf8' },
    { label: 'Catalog', value: `${activeProducts.length} products`, tone: '#a5b4fc' },
    { label: 'Pipeline value', value: money.format(catalogValue), tone: '#f59e0b' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--background)' }}>
      <TopBar title="Revenue" />
      <main style={{ flex: 1, padding: isMobile ? 14 : 24, maxWidth: 1180, width: '100%', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, color: '#fff', fontSize: 22 }}>Revenue Command</h2>
            <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: 13, maxWidth: 720 }}>
              Digital products, subscribers, launch blockers, and Hermes handoffs in one place.
            </p>
          </div>
          <button onClick={load} disabled={loading} style={{ background: 'var(--primary)', border: 'none', borderRadius: 8, color: '#fff', padding: '9px 16px', cursor: 'pointer', opacity: loading ? 0.65 : 1 }}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))', gap: isMobile ? 8 : 12, marginBottom: 18 }}>
          {metrics.map(metric => (
            <div key={metric.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: isMobile ? 12 : 16 }}>
              <div style={{ color: metric.tone, fontSize: isMobile ? 20 : 26, fontWeight: 750 }}>{metric.value}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 3 }}>{metric.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.3fr) minmax(300px, 0.7fr)', gap: 16 }}>
          <section style={{ display: 'grid', gap: 16 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#fff', fontSize: 15 }}>Product Launch Queue</h3>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 3 }}>{reviewProducts.length} need Adam review, {publishedProducts.length} published.</div>
                </div>
                <Link href="/products" style={smallLink}>Open products</Link>
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {reviewProducts.slice(0, 6).map(product => (
                  <Link key={product.id} href="/products" style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
                      <div>
                        <div style={{ color: '#fff', fontSize: 13, fontWeight: 650 }}>{product.title}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>{product.type} {product.price ? `/ ${product.price}` : ''}</div>
                      </div>
                      <span style={{ color: product.status === 'needs_improvement' ? '#f59e0b' : '#10b981', fontSize: 11, whiteSpace: 'nowrap' }}>{product.status.replace('_', ' ')}</span>
                    </div>
                  </Link>
                ))}
                {reviewProducts.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No products waiting on Adam.</div>}
              </div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#fff', fontSize: 15 }}>Audience Engine</h3>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 3 }}>
                    {revenue?.subscribers.free || 0} free subscribers, {revenue?.subscribers.paid || 0} paid.
                  </div>
                </div>
                <Link href="/newsletter" style={smallLink}>Open newsletter</Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 10 }}>
                <MiniCard label="Draft issues" value={String(revenue?.issues.drafts || 0)} />
                <MiniCard label="Published" value={String(revenue?.issues.published || 0)} />
                <MiniCard label="Lead magnets" value={String(revenue?.leadmagnets.length || 0)} />
              </div>
            </div>
          </section>

          <aside style={{ display: 'grid', gap: 16, alignSelf: 'start' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 18 }}>
              <h3 style={{ margin: '0 0 12px', color: '#fff', fontSize: 15 }}>Hermes Readiness</h3>
              <div style={{ display: 'grid', gap: 9 }}>
                <ReadinessRow label="Hermes API" ok={Boolean(status?.hermes?.connected)} detail={status?.hermes?.connected ? 'Connected' : 'Not connected'} />
                <ReadinessRow label="Credential requests" ok={!status?.credentialsRequested} detail={`${status?.credentialsRequested || 0} open`} />
                <ReadinessRow label="Product catalog" ok={activeProducts.length > 0} detail={`${activeProducts.length} active`} />
                <ReadinessRow label="Revenue metrics" ok={Boolean(revenue)} detail={revenue ? 'Loaded' : 'No data'} />
              </div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 18 }}>
              <h3 style={{ margin: '0 0 12px', color: '#fff', fontSize: 15 }}>Next Revenue Actions</h3>
              <div style={{ display: 'grid', gap: 8 }}>
                <Link href="/credentials" style={actionLink}>Provide credentials</Link>
                <Link href="/products" style={actionLink}>Approve or improve products</Link>
                <Link href="/content" style={actionLink}>Create content asset</Link>
                <Link href="/clipping" style={actionLink}>Package short-form clips</Link>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
      <div style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>{value}</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function ReadinessRow({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
      <span style={{ color: 'var(--text)', fontSize: 13 }}>{label}</span>
      <span style={{ color: ok ? '#10b981' : '#f59e0b', fontSize: 12 }}>{ok ? 'Ready' : detail}</span>
    </div>
  );
}

const smallLink: React.CSSProperties = { color: '#a5b4fc', fontSize: 12, textDecoration: 'none', alignSelf: 'center' };
const actionLink: React.CSSProperties = { color: 'var(--text)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', textDecoration: 'none', fontSize: 13 };
