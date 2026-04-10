'use client';
import { useState, useEffect } from 'react';
import TopBar from '@/components/TopBar';
import Link from 'next/link';

interface Post {
  id: string;
  title: string;
  subtitle?: string;
  status: string;
  audience: string;
  created_at: number;
  publish_date?: number;
  stats?: { total_recipients?: number; total_opens?: number; total_clicks?: number };
}

interface Publication {
  id: string;
  name: string;
  subscriber_count?: number;
}

const STATUS_COLORS: Record<string, string> = {
  draft: '#888',
  confirmed: '#10b981',
  archived: '#f59e0b',
};

export default function NewsletterPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [pub, setPub] = useState<Publication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'posts' | 'new'>('posts');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newStatus, setNewStatus] = useState<'draft' | 'confirmed'>('draft');
  const [publishing, setPublishing] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [postsRes, pubRes] = await Promise.all([
        fetch('/api/newsletter/posts'),
        fetch('/api/newsletter/publication'),
      ]);
      if (postsRes.ok) {
        const d = await postsRes.json();
        setPosts(d.posts || []);
      }
      if (pubRes.ok) {
        const d = await pubRes.json();
        setPub(d.publication || null);
      }
    } catch (e) {
      setError(String(e));
    }
    setLoading(false);
  }

  async function generateWithAI() {
    setGenerating(true);
    try {
      const r = await fetch('/api/newsletter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, topic: newTitle }),
      });
      const d = await r.json();
      if (d.content) setNewContent(d.content);
    } catch (e) {
      console.error(e);
    }
    setGenerating(false);
  }

  async function publishPost() {
    if (!newTitle || !newContent) return;
    setPublishing(true);
    try {
      const r = await fetch('/api/newsletter/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, body_content: newContent, status: newStatus }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setTab('posts');
      setNewTitle('');
      setNewContent('');
      load();
    } catch (e) {
      setError(String(e));
    }
    setPublishing(false);
  }

  const s = {
    surface: 'var(--surface)',
    border: '1px solid var(--border)',
    text: 'var(--text)',
    muted: 'var(--text-muted)',
    primary: 'var(--primary)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--background)' }}>
      <TopBar title="The Resuscitationist" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

        {/* Publication stats */}
        {pub && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            <div style={{ background: s.surface, border: s.border, borderRadius: 10, padding: '14px 20px', minWidth: 140 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#10b981' }}>{pub.subscriber_count ?? '—'}</div>
              <div style={{ fontSize: 12, color: s.muted }}>Subscribers</div>
            </div>
            <div style={{ background: s.surface, border: s.border, borderRadius: 10, padding: '14px 20px', flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: s.text }}>{pub.name}</div>
              <div style={{ fontSize: 12, color: s.muted, marginTop: 2 }}>Publication · beehiiv</div>
            </div>
            <a href="https://app.beehiiv.com" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', padding: '0 20px', background: '#f59e0b22', border: '1px solid #f59e0b44', borderRadius: 10, color: '#f59e0b', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
              Open Beehiiv ↗
            </a>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: s.border, paddingBottom: 0 }}>
          {([['posts', '📋 Issues'], ['new', '✏️ Write New']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ background: 'transparent', border: 'none', padding: '10px 16px', color: tab === id ? s.primary : s.muted, fontWeight: tab === id ? 700 : 400, fontSize: 14, cursor: 'pointer', borderBottom: tab === id ? `2px solid ${s.primary}` : '2px solid transparent' }}>
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ color: '#fca5a5', background: '#7f1d1d22', border: '1px solid #7f1d1d', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>
            ⚠️ {error} {!pub && '— Add your Beehiiv API key in Settings'}
          </div>
        )}

        {/* Posts list */}
        {tab === 'posts' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: s.text }}>Issues</h3>
              <button onClick={() => setTab('new')} style={{ background: s.primary, border: 'none', borderRadius: 8, padding: '8px 16px', color: '#fff', cursor: 'pointer', fontSize: 13 }}>+ New Issue</button>
            </div>
            {loading && <div style={{ color: s.muted, padding: 20, textAlign: 'center' }}>⏳ Loading...</div>}
            {!loading && posts.length === 0 && !error && (
              <div style={{ color: s.muted, padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📝</div>
                <div>No issues yet — write your first one!</div>
                <div style={{ fontSize: 12, marginTop: 8 }}>Add your Beehiiv API key in Settings to connect</div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {posts.map(p => (
                <div key={p.id} style={{ background: s.surface, border: s.border, borderRadius: 10, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: s.text, marginBottom: 4 }}>{p.title}</div>
                      {p.subtitle && <div style={{ fontSize: 13, color: s.muted, marginBottom: 6 }}>{p.subtitle}</div>}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, borderRadius: 5, padding: '2px 8px', background: (STATUS_COLORS[p.status] || '#888') + '22', color: STATUS_COLORS[p.status] || '#888', border: '1px solid ' + (STATUS_COLORS[p.status] || '#888') + '44' }}>{p.status}</span>
                        {p.stats?.total_recipients && <span style={{ fontSize: 11, color: s.muted }}>📬 {p.stats.total_recipients} sent</span>}
                        {p.stats?.total_opens && <span style={{ fontSize: 11, color: s.muted }}>👁 {p.stats.total_opens} opens</span>}
                        {p.publish_date && <span style={{ fontSize: 11, color: s.muted }}>{new Date(p.publish_date * 1000).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New issue editor */}
        {tab === 'new' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: s.muted, display: 'block', marginBottom: 6 }}>Issue Title</label>
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. The Truth About Epinephrine" style={{ width: '100%', background: s.surface, border: s.border, borderRadius: 8, padding: '10px 14px', color: s.text, fontSize: 15, fontWeight: 600 }} />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={generateWithAI} disabled={!newTitle || generating} style={{ background: '#6366f122', border: '1px solid #6366f144', borderRadius: 8, padding: '8px 16px', color: '#a5b4fc', cursor: 'pointer', fontSize: 13, opacity: (!newTitle || generating) ? 0.5 : 1 }}>
                {generating ? '✨ Generating...' : '✨ Generate with AI'}
              </button>
              <div style={{ fontSize: 12, color: s.muted, display: 'flex', alignItems: 'center' }}>or write manually below</div>
            </div>

            <div>
              <label style={{ fontSize: 12, color: s.muted, display: 'block', marginBottom: 6 }}>Content (HTML or plain text)</label>
              <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Write your issue here... or click Generate with AI above" rows={20} style={{ width: '100%', background: s.surface, border: s.border, borderRadius: 8, padding: '12px 14px', color: s.text, fontSize: 13, fontFamily: 'monospace', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value as 'draft' | 'confirmed')} style={{ background: s.surface, border: s.border, borderRadius: 8, padding: '8px 12px', color: s.text, fontSize: 13 }}>
                <option value="draft">Save as Draft</option>
                <option value="confirmed">Publish Now</option>
              </select>
              <button onClick={publishPost} disabled={!newTitle || !newContent || publishing} style={{ flex: 1, background: s.primary, border: 'none', borderRadius: 8, padding: '10px 20px', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: (!newTitle || !newContent || publishing) ? 0.5 : 1 }}>
                {publishing ? 'Sending to Beehiiv...' : newStatus === 'draft' ? 'Save Draft to Beehiiv' : 'Publish to Beehiiv'}
              </button>
            </div>

            <div style={{ background: s.surface, border: s.border, borderRadius: 10, padding: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: s.text, marginBottom: 10 }}>🎨 Content Assets</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Link href={`/newsletter/assets?title=${encodeURIComponent(newTitle)}`} style={{ background: '#10b98115', border: '1px solid #10b98144', borderRadius: 8, padding: '8px 14px', color: '#10b981', fontSize: 13, textDecoration: 'none' }}>
                  🖼 Generate Header Image
                </Link>
                <Link href={`/newsletter/assets?title=${encodeURIComponent(newTitle)}&type=social`} style={{ background: '#3b82f615', border: '1px solid #3b82f644', borderRadius: 8, padding: '8px 14px', color: '#3b82f6', fontSize: 13, textDecoration: 'none' }}>
                  📱 Social Card
                </Link>
                <Link href={`/newsletter/assets?title=${encodeURIComponent(newTitle)}&type=linkedin`} style={{ background: '#8b5cf615', border: '1px solid #8b5cf644', borderRadius: 8, padding: '8px 14px', color: '#8b5cf6', fontSize: 13, textDecoration: 'none' }}>
                  💼 LinkedIn Post
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
