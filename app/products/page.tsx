'use client';

import { useEffect, useMemo, useState } from 'react';
import TopBar from '@/components/TopBar';

type ProductStatus = 'draft' | 'ready' | 'needs_improvement' | 'removed' | 'published';

type Product = {
  id: string;
  title: string;
  description: string;
  status: ProductStatus;
  type: 'pdf' | 'template' | 'site' | 'bundle';
  downloadUrl?: string;
  vercelUrl?: string;
  price?: string;
  createdAt: string;
  updatedAt: string;
  comments: Array<{ id: string; author: string; text: string; createdAt: string }>;
};

const statusColor: Record<ProductStatus, string> = {
  draft: '#94a3b8',
  ready: '#10b981',
  needs_improvement: '#f59e0b',
  removed: '#ef4444',
  published: '#38bdf8',
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Product | null>(null);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'active' | ProductStatus>('active');

  async function load() {
    setLoading(true);
    const res = await fetch('/api/products', { cache: 'no-store' });
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    if (filter === 'active') return products.filter(product => product.status !== 'removed');
    return products.filter(product => product.status === filter);
  }, [products, filter]);

  async function updateProduct(product: Product, patch: Partial<Product> & { comment?: string }) {
    setSaving(true);
    try {
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, ...patch }),
      });
      const data = await res.json();
      if (data.product) {
        setProducts(prev => prev.map(item => item.id === data.product.id ? data.product : item));
        setSelected(data.product);
        setComment('');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--background)' }}>
      <TopBar title="Products" />
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, color: '#fff' }}>Hermes Product Workbench</h2>
            <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
              Review, download, comment on, remove, or open sites Hermes creates for digital product sales.
            </p>
          </div>
          <button onClick={load} disabled={loading} style={{ background: 'var(--primary)', border: 'none', borderRadius: 8, padding: '9px 16px', color: '#fff', cursor: 'pointer', opacity: loading ? 0.65 : 1 }}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {(['active', 'ready', 'published', 'needs_improvement', 'removed'] as const).map(item => (
            <button key={item} onClick={() => setFilter(item)} style={{ background: filter === item ? 'rgba(99,102,241,0.18)' : 'transparent', border: `1px solid ${filter === item ? '#6366f1' : 'var(--border)'}`, borderRadius: 20, color: filter === item ? '#c4b5fd' : 'var(--text-muted)', padding: '6px 12px', cursor: 'pointer', fontSize: 12, textTransform: 'capitalize' }}>
              {item.replace('_', ' ')}
            </button>
          ))}
        </div>

        {loading && <div style={{ color: 'var(--text-muted)', padding: 32, textAlign: 'center' }}>Loading products...</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {!loading && visible.map(product => (
            <article key={product.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <div style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{product.title}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 3 }}>{product.type}{product.price ? ` / ${product.price}` : ''}</div>
                </div>
                <span style={{ border: `1px solid ${statusColor[product.status]}66`, background: `${statusColor[product.status]}18`, color: statusColor[product.status], borderRadius: 999, padding: '4px 8px', fontSize: 11, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                  {product.status.replace('_', ' ')}
                </span>
              </div>
              <p style={{ margin: 0, color: 'var(--text)', fontSize: 13, lineHeight: 1.45 }}>{product.description}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 'auto' }}>
                {product.downloadUrl && <a href={product.downloadUrl} download style={linkButton('#10b981')}>Download</a>}
                {product.vercelUrl && <a href={product.vercelUrl} target="_blank" rel="noreferrer" style={linkButton('#38bdf8')}>Open site</a>}
                <button onClick={() => { setSelected(product); setComment(''); }} style={buttonStyle('#6366f1')}>Review</button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 760, maxHeight: '88vh', overflowY: 'auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, marginBottom: 14 }}>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>{selected.title}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>{selected.status.replace('_', ' ')} / {selected.type}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text-muted)', padding: '6px 10px', cursor: 'pointer', alignSelf: 'flex-start' }}>Close</button>
            </div>

            <p style={{ color: 'var(--text)', fontSize: 14, lineHeight: 1.5 }}>{selected.description}</p>

            <textarea rows={5} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Tell Hermes what to improve, approve, or remove." style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 7, padding: 10, color: 'var(--text)', resize: 'vertical', marginBottom: 12 }} />

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              <button disabled={saving} onClick={() => updateProduct(selected, { status: 'published', comment: comment || 'Approved for publication.' })} style={buttonStyle('#10b981')}>Approve</button>
              <button disabled={saving} onClick={() => updateProduct(selected, { status: 'needs_improvement', comment: comment || 'Needs improvement.' })} style={buttonStyle('#f59e0b')}>Needs improvement</button>
              <button disabled={saving} onClick={() => updateProduct(selected, { status: 'removed', comment: comment || 'Remove this product.' })} style={buttonStyle('#ef4444')}>Remove</button>
              <button disabled={saving || !comment.trim()} onClick={() => updateProduct(selected, { comment })} style={buttonStyle('#6366f1')}>Send comment</button>
            </div>

            <div>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 650, marginBottom: 8 }}>Comments</div>
              {selected.comments.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No comments yet.</div>}
              {selected.comments.map(item => (
                <div key={item.id} style={{ borderTop: '1px solid var(--border)', padding: '10px 0' }}>
                  <div style={{ color: 'var(--text)', fontSize: 13 }}>{item.text}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>{item.author} / {new Date(item.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function buttonStyle(color: string): React.CSSProperties {
  return { background: `${color}22`, border: `1px solid ${color}66`, borderRadius: 7, color, padding: '8px 12px', cursor: 'pointer', fontSize: 13 };
}

function linkButton(color: string): React.CSSProperties {
  return { ...buttonStyle(color), textDecoration: 'none', display: 'inline-block' };
}
