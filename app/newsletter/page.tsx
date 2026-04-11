'use client';
import { useState, useEffect } from 'react';
import TopBar from '@/components/TopBar';

interface Post {
  id: string; title: string; subtitle?: string; status: string;
  audience: string; created_at: number; publish_date?: number;
  stats?: { total_recipients?: number; total_opens?: number; total_clicks?: number };
}

interface Draft {
  id: string; file: string; source: string; number: number;
  title: string; topic: string; status: string; date: string;
  preview: string; wordCount: number; content: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: '#f59e0b', confirmed: '#10b981', archived: '#888', exported: '#6366f1',
};

export default function NewsletterPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [tab, setTab] = useState<'drafts' | 'published' | 'new'>('drafts');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newStatus, setNewStatus] = useState<'draft' | 'confirmed'>('draft');
  const [publishing, setPublishing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [expandedDraft, setExpandedDraft] = useState<string | null>(null);
  const [copyMsg, setCopyMsg] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [draftsRes, postsRes] = await Promise.all([
        fetch('/api/newsletter/drafts'),
        fetch('/api/newsletter/posts'),
      ]);
      if (draftsRes.ok) { const d = await draftsRes.json(); setDrafts(d.drafts || []); }
      if (postsRes.ok) { const d = await postsRes.json(); setPosts(d.posts || []); }
    } catch (e) { setError(String(e)); }
    setLoading(false);
  }

  async function generateWithAI() {
    setGenerating(true);
    try {
      const r = await fetch('/api/newsletter/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, topic: newTitle }),
      });
      const d = await r.json();
      if (d.content) setNewContent(d.content);
    } catch {}
    setGenerating(false);
  }

  async function publishPost() {
    if (!newTitle || !newContent) return;
    setPublishing(true);
    try {
      const r = await fetch('/api/newsletter/posts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, body_content: newContent, status: newStatus }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setTab('published'); setNewTitle(''); setNewContent(''); load();
    } catch (e) { setError(String(e)); }
    setPublishing(false);
  }

  function copyToClipboard(text: string, label = 'Copied!') {
    navigator.clipboard.writeText(text).then(() => {
      setCopyMsg(label); setTimeout(() => setCopyMsg(''), 2000);
    });
  }

  const s = { surface: 'var(--surface)', border: '1px solid var(--border)', text: 'var(--text)', muted: 'var(--text-muted)', primary: 'var(--primary)' };

  const tabs: [typeof tab, string][] = [
    ['drafts', `📝 Drafts${drafts.length ? ` (${drafts.length})` : ''}`],
    ['published', `✅ Published${posts.length ? ` (${posts.length})` : ''}`],
    ['new', '✏️ Write New'],
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--background)' }}>
      <TopBar title="The Resuscitationist" />

      {copyMsg && (
        <div style={{ position: 'fixed', top: 70, right: 20, background: '#10b981', color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: 13, zIndex: 999 }}>
          {copyMsg}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

        {/* Stats bar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Drafts', value: drafts.length, color: '#f59e0b' },
            { label: 'Published', value: posts.length, color: '#10b981' },
            { label: 'Issues', value: drafts.length + posts.length, color: '#6366f1' },
          ].map(stat => (
            <div key={stat.label} style={{ background: s.surface, border: s.border, borderRadius: 10, padding: '12px 20px', minWidth: 100 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: s.muted }}>{stat.label}</div>
            </div>
          ))}
          <a href="https://app.beehiiv.com" target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', padding: '0 18px', background: '#f59e0b15', border: '1px solid #f59e0b44', borderRadius: 10, color: '#f59e0b', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
            Open Beehiiv ↗
          </a>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: s.border }}>
          {tabs.map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              background: 'transparent', border: 'none', padding: '10px 18px',
              color: tab === id ? s.primary : s.muted,
              fontWeight: tab === id ? 700 : 400, fontSize: 14, cursor: 'pointer',
              borderBottom: tab === id ? `2px solid ${s.primary}` : '2px solid transparent',
            }}>{label}</button>
          ))}
        </div>

        {error && (
          <div style={{ color: '#fca5a5', background: '#7f1d1d22', border: '1px solid #7f1d1d44', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>
            ⚠️ {error}
          </div>
        )}

        {/* DRAFTS TAB */}
        {tab === 'drafts' && (
          <div>
            {loading && <div style={{ color: s.muted, textAlign: 'center', padding: 40 }}>⏳ Loading drafts...</div>}
            {!loading && drafts.length === 0 && (
              <div style={{ color: s.muted, textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
                No drafts yet — write one or ask Albert to generate it.
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {drafts.map(draft => {
                const isExpanded = expandedDraft === draft.id;
                return (
                  <div key={draft.id} style={{ background: s.surface, border: s.border, borderRadius: 12, overflow: 'hidden' }}>
                    {/* Header row */}
                    <div onClick={() => setExpandedDraft(isExpanded ? null : draft.id)}
                      style={{ padding: '16px 18px', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#6366f122', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#6366f1', flexShrink: 0 }}>
                        {draft.number || '?'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: s.text, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {draft.title}
                        </div>
                        {draft.preview && (
                          <div style={{ fontSize: 13, color: s.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {draft.preview}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: (STATUS_COLORS[draft.status] || '#888') + '22', color: STATUS_COLORS[draft.status] || '#888', border: `1px solid ${STATUS_COLORS[draft.status] || '#888'}44` }}>
                            {draft.status}
                          </span>
                          {draft.date && <span style={{ fontSize: 11, color: s.muted }}>{draft.date}</span>}
                          <span style={{ fontSize: 11, color: s.muted }}>~{draft.wordCount} words</span>
                        </div>
                      </div>
                      <span style={{ color: s.muted, fontSize: 12, flexShrink: 0 }}>{isExpanded ? '▲' : '▼'}</span>
                    </div>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div style={{ borderTop: s.border }}>
                        {/* Action bar */}
                        <div style={{ padding: '10px 18px', background: 'rgba(99,102,241,0.05)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button onClick={() => copyToClipboard(draft.content, '✓ Full draft copied!')}
                            style={{ background: '#6366f122', border: '1px solid #6366f144', borderRadius: 6, padding: '6px 14px', color: '#a5b4fc', fontSize: 12, cursor: 'pointer' }}>
                            📋 Copy Full Draft
                          </button>
                          <button onClick={() => copyToClipboard(draft.title, '✓ Subject copied!')}
                            style={{ background: '#10b98115', border: '1px solid #10b98144', borderRadius: 6, padding: '6px 14px', color: '#10b981', fontSize: 12, cursor: 'pointer' }}>
                            ✉️ Copy Subject Line
                          </button>
                          <a href="https://app.beehiiv.com" target="_blank" rel="noreferrer"
                            style={{ background: '#f59e0b15', border: '1px solid #f59e0b44', borderRadius: 6, padding: '6px 14px', color: '#f59e0b', fontSize: 12, cursor: 'pointer', textDecoration: 'none' }}>
                            🚀 Open Beehiiv
                          </a>
                        </div>
                        {/* Content preview */}
                        <div style={{ padding: '16px 18px', maxHeight: 400, overflowY: 'auto' }}>
                          <pre style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: 13, color: s.text, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                            {draft.content}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PUBLISHED TAB */}
        {tab === 'published' && (
          <div>
            {loading && <div style={{ color: s.muted, textAlign: 'center', padding: 40 }}>⏳ Loading...</div>}
            {!loading && posts.length === 0 && (
              <div style={{ color: s.muted, textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
                Nothing published yet. Go to Drafts → copy → paste into Beehiiv.
              </div>
            )}
            {posts.map(p => (
              <div key={p.id} style={{ background: s.surface, border: s.border, borderRadius: 10, padding: '16px 18px', marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: s.text, marginBottom: 4 }}>{p.title}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, borderRadius: 5, padding: '2px 8px', background: (STATUS_COLORS[p.status] || '#888') + '22', color: STATUS_COLORS[p.status] || '#888' }}>{p.status}</span>
                  {p.stats?.total_recipients != null && <span style={{ fontSize: 11, color: s.muted }}>📬 {p.stats.total_recipients} sent</span>}
                  {p.stats?.total_opens != null && <span style={{ fontSize: 11, color: s.muted }}>👁 {p.stats.total_opens} opens</span>}
                  {p.publish_date && <span style={{ fontSize: 11, color: s.muted }}>{new Date(p.publish_date * 1000).toLocaleDateString()}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* WRITE NEW TAB */}
        {tab === 'new' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: s.muted, display: 'block', marginBottom: 6 }}>Topic / Subject Line</label>
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. The Truth About Epinephrine in Cardiac Arrest"
                style={{ width: '100%', background: s.surface, border: s.border, borderRadius: 8, padding: '10px 14px', color: s.text, fontSize: 15, boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={generateWithAI} disabled={!newTitle || generating}
                style={{ background: '#6366f122', border: '1px solid #6366f144', borderRadius: 8, padding: '8px 16px', color: '#a5b4fc', cursor: 'pointer', fontSize: 13, opacity: (!newTitle || generating) ? 0.5 : 1 }}>
                {generating ? '✨ Generating...' : '✨ Generate with AI'}
              </button>
              <span style={{ fontSize: 12, color: s.muted, display: 'flex', alignItems: 'center' }}>or write manually</span>
            </div>
            <div>
              <label style={{ fontSize: 12, color: s.muted, display: 'block', marginBottom: 6 }}>Content</label>
              <textarea value={newContent} onChange={e => setNewContent(e.target.value)}
                placeholder="Write or generate your issue here..." rows={20}
                style={{ width: '100%', background: s.surface, border: s.border, borderRadius: 8, padding: '12px 14px', color: s.text, fontSize: 13, fontFamily: 'Georgia, serif', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value as 'draft' | 'confirmed')}
                style={{ background: s.surface, border: s.border, borderRadius: 8, padding: '8px 12px', color: s.text, fontSize: 13 }}>
                <option value="draft">Save as Draft</option>
                <option value="confirmed">Publish Now</option>
              </select>
              <button onClick={publishPost} disabled={!newTitle || !newContent || publishing}
                style={{ flex: 1, background: s.primary, border: 'none', borderRadius: 8, padding: '10px 20px', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: (!newTitle || !newContent || publishing) ? 0.5 : 1 }}>
                {publishing ? 'Saving...' : 'Save to Beehiiv'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
