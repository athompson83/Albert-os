'use client';

import { useState, useEffect, useCallback } from 'react';
import TopBar from '@/components/TopBar';
import {
  Scissors, CheckCircle2, Clock, AlertCircle, ExternalLink,
  ChevronDown, ChevronUp, DollarSign, Zap, BarChart3, Plus,
  RefreshCw, Play, Send, Trash2, Film, TrendingUp, Eye,
  Instagram, Youtube, Music2, Globe
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────
type ActionStatus = 'pending' | 'done' | 'blocked';
type ActionItem = {
  id: string;
  title: string;
  description: string;
  why: string;
  link?: string;
  status: ActionStatus;
  response?: string;
  category: 'account' | 'apikey' | 'content' | 'setup';
};

type ReapProject = {
  id: string;
  title: string;
  status: string;
  source: string;
  clipCount?: number;
};

type ReapClip = {
  id: string;
  projectId: string;
  title: string;
  viralityScore: number;
  duration: number;
  clipUrl: string;
  caption: string;
};

// ── Updated action items — reflecting actual current state ───────────────────
const INITIAL_ACTIONS: ActionItem[] = [
  {
    id: 'tiktok-account',
    category: 'account',
    status: 'done',
    title: 'TikTok Account Created',
    description: 'TikTok creator account created and connected to Reap.',
    why: 'TikTok Creator Rewards pays $0.40–$1.00 per 1K views on 1min+ videos.',
    link: 'https://www.tiktok.com/@open_albert_0',
    response: '@open_albert_0',
  },
  {
    id: 'youtube-channel',
    category: 'account',
    status: 'done',
    title: 'YouTube Channel Created',
    description: 'Albert OS YouTube channel created and connected.',
    why: 'YouTube Shorts + long-form revenue funnel.',
    link: 'https://www.youtube.com/@AlbertOS-s5t',
    response: '@AlbertOS-s5t',
  },
  {
    id: 'instagram-account',
    category: 'account',
    status: 'done',
    title: 'Instagram Account Created',
    description: 'Instagram creator account connected to Reap.',
    why: 'Reels cross-posting is zero extra effort once pipeline is running.',
    link: 'https://www.instagram.com/openclaw.albert.command',
    response: '@openclaw.albert.command',
  },
  {
    id: 'reap-account',
    category: 'apikey',
    status: 'done',
    title: 'Reap.video Connected — API Key Active',
    description: 'Reap API key configured. Albert can submit videos for clipping and auto-publish to connected platforms.',
    why: 'Reap is the clipping backbone — submits YouTube URL → returns captioned vertical clips with virality scores.',
    link: 'https://app.reap.video',
    response: 'API key configured in clipping-config.json',
  },
  {
    id: 'reap-connect-tiktok',
    category: 'setup',
    status: 'done',
    title: 'TikTok Connected in Reap',
    description: 'TikTok @open_albert_0 connected and verified in Reap publishing settings.',
    why: 'Required for Albert to auto-publish clips directly to TikTok.',
    link: 'https://app.reap.video',
    response: '@open_albert_0 — integration ID: 69dce76cc48be5a88aa51803',
  },
  {
    id: 'reap-connect-instagram',
    category: 'setup',
    status: 'done',
    title: 'Instagram Connected in Reap',
    description: 'Instagram @openclaw.albert.command connected in Reap.',
    why: 'Required for Albert to auto-publish Reels.',
    link: 'https://app.reap.video',
    response: 'integration ID: 69dce5c6446c682bee61efa4',
  },
  {
    id: 'reap-connect-youtube',
    category: 'setup',
    status: 'pending',
    title: 'Reconnect YouTube in Reap',
    description: 'YouTube integration dropped from the Reap automation API scope. Go to app.reap.video → Integrations → YouTube → Disconnect → Reconnect. This will enable auto-posting to YouTube Shorts.',
    why: 'YouTube currently posting manually. Reconnecting enables full automation to all 3 platforms.',
    link: 'https://app.reap.video',
  },
  {
    id: 'auto-post',
    category: 'setup',
    status: 'done',
    title: 'Auto-Posting Enabled',
    description: 'Albert is now auto-posting clips to TikTok and Instagram. 13 clips posted so far. Dripping remaining clips via heartbeat.',
    why: 'Fully autonomous operation — no manual uploads required.',
    response: '13 clips posted as of 2026-04-13. Pipeline running.',
  },
  {
    id: 'content-source',
    category: 'content',
    status: 'done',
    title: 'Source Videos Queued',
    description: '8 videos submitted to Reap for clipping. Mix of YouTube automation, faceless channel, and income content. 35 clips generated from first 3 videos. 5 more processing now.',
    why: 'More source videos = more clips = more posting = faster growth.',
    response: '8 videos in pipeline. ~85 clips total incoming.',
  },
  {
    id: 'personal-socials',
    category: 'account',
    status: 'pending',
    title: 'Connect Personal Social Accounts (Future)',
    description: 'When ready, connect your personal high-follower accounts to the clipping pipeline. Albert will handle the same automation at 10x the reach.',
    why: 'Same clips, existing audience = immediate monetization potential vs. building from zero.',
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  account: '👤 Account',
  apikey: '🔑 API Key',
  content: '🎬 Content',
  setup: '⚙️ Setup',
};

const STATUS_STYLES: Record<ActionStatus, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
  pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Pending', icon: <Clock size={14} /> },
  done: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'Done', icon: <CheckCircle2 size={14} /> },
  blocked: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Blocked', icon: <AlertCircle size={14} /> },
};

const STORAGE_KEY = 'albert-clipping-actions-v2';

function loadActions(): ActionItem[] {
  if (typeof window === 'undefined') return INITIAL_ACTIONS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ActionItem[];
      return INITIAL_ACTIONS.map(initial => {
        const saved = parsed.find(p => p.id === initial.id);
        return saved ? { ...initial, status: saved.status, response: saved.response } : initial;
      });
    }
  } catch {}
  return INITIAL_ACTIONS;
}

// ── Platform Rate Cards ───────────────────────────────────────────────────────
const PLATFORMS = [
  { name: 'TikTok Creator Rewards', rpm: '$0.40–$1.00', peak: '$6.00', req: '15K followers, 150K views/28d', color: '#ff0050', icon: <Music2 size={14}/> },
  { name: 'YouTube Long-form', rpm: '$3.00–$15.00', peak: '$50+', req: '1K subs + 4K watch hours', color: '#ff0000', icon: <Youtube size={14}/> },
  { name: 'YouTube Shorts', rpm: '$0.03–$0.08', peak: '$0.35', req: '1K subs + 10M Shorts views/90d', color: '#ff0000', icon: <Youtube size={14}/> },
  { name: 'Instagram Reels', rpm: '$0.01–$0.05', peak: '$0.10', req: 'Invite-only monetization', color: '#e1306c', icon: <Instagram size={14}/> },
];

// ── Revenue Calculator ────────────────────────────────────────────────────────
function RevenueCalc() {
  const [views, setViews] = useState(500000);
  const [rpm, setRpm] = useState(0.70);
  const [platforms, setPlatforms] = useState(3);
  const monthly = ((views / 1000) * rpm * platforms).toFixed(0);
  const annual = (Number(monthly) * 12).toFixed(0);
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <BarChart3 size={16} style={{ color: '#a5b4fc' }} />
        <span style={{ fontWeight: 600, fontSize: 15 }}>Revenue Estimator</span>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Views/month per platform</label>
          <input type="range" min={10000} max={5000000} step={10000} value={views} onChange={e => setViews(Number(e.target.value))} style={{ width: '100%', accentColor: '#6366f1' }} />
          <div style={{ fontSize: 13, marginTop: 4 }}>{(views / 1000).toFixed(0)}K views</div>
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>RPM ($/1K views)</label>
          <input type="range" min={0.10} max={6.00} step={0.10} value={rpm} onChange={e => setRpm(Number(e.target.value))} style={{ width: '100%', accentColor: '#6366f1' }} />
          <div style={{ fontSize: 13, marginTop: 4 }}>${rpm.toFixed(2)}</div>
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Active platforms</label>
          <input type="range" min={1} max={4} step={1} value={platforms} onChange={e => setPlatforms(Number(e.target.value))} style={{ width: '100%', accentColor: '#6366f1' }} />
          <div style={{ fontSize: 13, marginTop: 4 }}>{platforms} platform{platforms > 1 ? 's' : ''}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, padding: '12px 16px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Monthly</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#a5b4fc' }}>${Number(monthly).toLocaleString()}</div>
        </div>
        <div style={{ flex: 1, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '12px 16px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Annual</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>${Number(annual).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

// ── Live Pipeline Monitor ─────────────────────────────────────────────────────
function PipelineMonitor() {
  const [projects, setProjects] = useState<ReapProject[]>([]);
  const [clips, setClips] = useState<ReapClip[]>([]);
  const [loading, setLoading] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [posting, setPosting] = useState(false);
  const [activeTab, setActiveTab] = useState<'projects' | 'clips' | 'queue'>('projects');
  const [queueVideos, setQueueVideos] = useState<{url:string;title:string;niche:string}[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/clipping/projects');
      if (r.ok) {
        const d = await r.json();
        setProjects(d.projects || []);
      }
      const r2 = await fetch('/api/clipping/clips');
      if (r2.ok) {
        const d = await r2.json();
        setClips(d.clips || []);
      }
      const r3 = await fetch('/api/clipping/queue');
      if (r3.ok) {
        const d = await r3.json();
        setQueueVideos(d.queue || []);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const submitVideo = async () => {
    if (!newUrl.trim()) return;
    setPosting(true);
    try {
      await fetch('/api/clipping/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl }),
      });
      setNewUrl('');
      setTimeout(refresh, 2000);
    } catch {}
    setPosting(false);
  };

  const postClip = async (clipId: string, projectId: string) => {
    await fetch('/api/clipping/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clipId, projectId }),
    });
  };

  const statusColor = (s: string) => s === 'completed' ? '#10b981' : s === 'processing' ? '#f59e0b' : '#ef4444';
  const statusIcon = (s: string) => s === 'completed' ? <CheckCircle2 size={12}/> : s === 'processing' ? <RefreshCw size={12}/> : <AlertCircle size={12}/>;

  const totalClips = clips.length;
  const topClips = [...clips].sort((a,b) => b.viralityScore - a.viralityScore).slice(0,10);
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const processingProjects = projects.filter(p => p.status === 'processing').length;

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 20 }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Film size={16} style={{ color: '#a5b4fc' }} />
        <span style={{ fontWeight: 600, fontSize: 15, flex: 1 }}>Live Pipeline</span>
        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
          <span style={{ color: '#10b981' }}>✅ {completedProjects} complete</span>
          <span style={{ color: '#f59e0b' }}>⏳ {processingProjects} processing</span>
          <span>🎬 {totalClips} clips</span>
        </div>
        <button onClick={refresh} disabled={loading} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 10px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
          <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
        </button>
      </div>

      {/* Submit new video */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10 }}>
        <input
          value={newUrl}
          onChange={e => setNewUrl(e.target.value)}
          placeholder="Paste YouTube URL to clip..."
          style={{ flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: '#e5e5e5', fontSize: 13, fontFamily: 'inherit' }}
          onKeyDown={e => e.key === 'Enter' && submitVideo()}
        />
        <button onClick={submitVideo} disabled={posting || !newUrl.trim()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#6366f1', border: 'none', borderRadius: 8, padding: '8px 16px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: posting ? 0.6 : 1 }}>
          <Play size={13} /> {posting ? 'Submitting...' : 'Clip It'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        {(['projects','clips','queue'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', borderBottom: activeTab === tab ? '2px solid #6366f1' : '2px solid transparent', color: activeTab === tab ? '#a5b4fc' : 'var(--text-muted)', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === tab ? 600 : 400, textTransform: 'capitalize' }}>
            {tab === 'projects' ? `Projects (${projects.length})` : tab === 'clips' ? `Top Clips (${totalClips})` : `Video Queue (${queueVideos.length})`}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: '0 0 4px' }}>
        {activeTab === 'projects' && (
          projects.length === 0 ? (
            <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
              {loading ? 'Loading...' : 'No projects yet. Submit a YouTube URL above to start.'}
            </div>
          ) : (
            projects.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: statusColor(p.status), display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                  {statusIcon(p.status)} {p.status}
                </span>
                <span style={{ flex: 1, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title || p.id}</span>
                {p.clipCount !== undefined && (
                  <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>{p.clipCount} clips</span>
                )}
              </div>
            ))
          )
        )}

        {activeTab === 'clips' && (
          topClips.length === 0 ? (
            <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
              {loading ? 'Loading...' : 'No clips yet. Complete projects will show clips here.'}
            </div>
          ) : (
            topClips.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `hsl(${c.viralityScore * 25},70%,30%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {c.viralityScore.toFixed(1)}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.caption}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {c.clipUrl && (
                    <a href={c.clipUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#a5b4fc', border: '1px solid rgba(165,180,252,0.3)', borderRadius: 5, padding: '4px 8px', textDecoration: 'none' }}>
                      <Eye size={11}/> View
                    </a>
                  )}
                  <button onClick={() => postClip(c.id, c.projectId)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 5, padding: '4px 8px', color: '#10b981', cursor: 'pointer' }}>
                    <Send size={11}/> Post
                  </button>
                </div>
              </div>
            ))
          )
        )}

        {activeTab === 'queue' && (
          queueVideos.length === 0 ? (
            <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>No videos in queue.</div>
          ) : (
            queueVideos.map((v, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface-2)', borderRadius: 4, padding: '2px 6px' }}>{v.niche}</span>
                <span style={{ flex: 1, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</span>
                <a href={v.url} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', display: 'flex' }}>
                  <ExternalLink size={13}/>
                </a>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}

// ── Stats Bar ─────────────────────────────────────────────────────────────────
function StatsBar() {
  const stats = [
    { label: 'Clips Generated', value: '35+', color: '#a5b4fc', icon: <Scissors size={14}/> },
    { label: 'Posts Published', value: '13', color: '#10b981', icon: <Send size={14}/> },
    { label: 'Platforms', value: '2 live', color: '#f59e0b', icon: <Globe size={14}/> },
    { label: 'Source Videos', value: '8', color: '#60a5fa', icon: <Film size={14}/> },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
      {stats.map(s => (
        <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: s.color, marginBottom: 8 }}>
            {s.icon}
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ClippingPage() {
  const [actions, setActions] = useState<ActionItem[]>(INITIAL_ACTIONS);
  const [hydrated, setHydrated] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingResponse, setEditingResponse] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [showPlatforms, setShowPlatforms] = useState(false);
  const [showPipeline, setShowPipeline] = useState(false);

  useEffect(() => {
    setActions(loadActions());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(actions));
  }, [actions, hydrated]);

  const updateStatus = (id: string, status: ActionStatus) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const saveResponse = (id: string) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, response: responseText, status: 'done' } : a));
    setEditingResponse(null);
    setResponseText('');
  };

  const done = actions.filter(a => a.status === 'done').length;
  const total = actions.length;
  const pct = Math.round((done / total) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopBar title="Clipping Engine" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', maxWidth: 960, width: '100%', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Scissors size={22} style={{ color: '#a5b4fc' }} />
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>AI Clipping Revenue Engine</h1>
            <span style={{ fontSize: 12, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', borderRadius: 20, padding: '2px 10px', fontWeight: 600 }}>LIVE</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
            Pipeline active. Albert is auto-clipping and posting to TikTok + Instagram.
          </p>
        </div>

        {/* Stats */}
        <StatsBar />

        {/* Progress */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Setup Progress</span>
            <span style={{ fontSize: 13, color: '#10b981' }}>{done}/{total} complete</span>
          </div>
          <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#10b981' : '#6366f1', borderRadius: 4, transition: 'width 0.3s' }} />
          </div>
          {pct < 100 && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#f59e0b' }}>
              ⚠️ 1 item remaining: Reconnect YouTube in Reap dashboard to enable YouTube Shorts auto-posting.
            </div>
          )}
        </div>

        {/* Live Pipeline Monitor */}
        <PipelineMonitor />

        {/* Revenue Calculator */}
        <RevenueCalc />

        {/* Action Items */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Zap size={16} style={{ color: '#a5b4fc' }} />
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Setup Checklist</h2>
          </div>
          {actions.map(action => {
            const s = STATUS_STYLES[action.status];
            const isExpanded = expanded === action.id;
            const isEditing = editingResponse === action.id;
            return (
              <div key={action.id} style={{ background: 'var(--surface)', border: `1px solid ${action.status === 'done' ? 'rgba(16,185,129,0.2)' : 'var(--border)'}`, borderRadius: 10, marginBottom: 8, overflow: 'hidden' }}>
                <div onClick={() => setExpanded(isExpanded ? null : action.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 72 }}>{CATEGORY_LABELS[action.category]}</span>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: action.status === 'done' ? 400 : 600, color: action.status === 'done' ? 'var(--text-muted)' : '#e5e5e5', textDecoration: action.status === 'done' ? 'line-through' : 'none' }}>{action.title}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: s.color, background: s.bg, padding: '3px 8px', borderRadius: 20 }}>
                    {s.icon}{s.label}
                  </span>
                  {isExpanded ? <ChevronUp size={14} style={{ color: 'var(--text-muted)' }}/> : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }}/>}
                </div>
                {isExpanded && (
                  <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ paddingTop: 12, fontSize: 14, lineHeight: 1.6, color: '#ccc', marginBottom: 10 }}>{action.description}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', background: 'rgba(99,102,241,0.07)', borderRadius: 6, padding: '8px 12px', marginBottom: 12 }}>
                      <strong style={{ color: '#a5b4fc' }}>Why: </strong>{action.why}
                    </div>
                    {action.link && (
                      <a href={action.link} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#a5b4fc', marginBottom: 12, textDecoration: 'none', border: '1px solid rgba(165,180,252,0.3)', borderRadius: 6, padding: '5px 10px' }}>
                        <ExternalLink size={12}/> Open
                      </a>
                    )}
                    {action.response && !isEditing && (
                      <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: '#10b981', marginBottom: 4, fontWeight: 600 }}>✅ Response</div>
                        <div style={{ fontSize: 13, color: '#ccc', whiteSpace: 'pre-wrap' }}>{action.response}</div>
                      </div>
                    )}
                    {isEditing ? (
                      <div style={{ marginBottom: 10 }}>
                        <textarea value={responseText} onChange={e => setResponseText(e.target.value)} placeholder="Paste info here..." rows={3} style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: '#e5e5e5', fontSize: 13, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          <button onClick={() => saveResponse(action.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, background: '#10b981', border: 'none', borderRadius: 6, padding: '6px 14px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Save & Done</button>
                          <button onClick={() => setEditingResponse(null)} style={{ fontSize: 12, background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {action.status !== 'done' && <button onClick={() => { setEditingResponse(action.id); setResponseText(action.response || ''); }} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 6, padding: '6px 12px', color: '#a5b4fc', cursor: 'pointer' }}><Plus size={12}/> Add Response</button>}
                        {action.status !== 'done' && <button onClick={() => updateStatus(action.id, 'done')} style={{ fontSize: 12, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 6, padding: '6px 12px', color: '#10b981', cursor: 'pointer' }}>Mark Done</button>}
                        {action.status !== 'pending' && <button onClick={() => updateStatus(action.id, 'pending')} style={{ fontSize: 12, background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', color: 'var(--text-muted)', cursor: 'pointer' }}>Reset</button>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Platform rates */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 16 }}>
          <button onClick={() => setShowPlatforms(p => !p)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#e5e5e5', textAlign: 'left' }}>
            <DollarSign size={16} style={{ color: '#a5b4fc' }} />
            <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>Platform Payout Rates</span>
            {showPlatforms ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
          </button>
          {showPlatforms && (
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
              {PLATFORMS.map(p => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ color: p.color }}>{p.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.req}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>{p.rpm}/1K</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>up to {p.peak}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How it works */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 32 }}>
          <button onClick={() => setShowPipeline(p => !p)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#e5e5e5', textAlign: 'left' }}>
            <TrendingUp size={16} style={{ color: '#a5b4fc' }} />
            <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>How the Pipeline Works</span>
            {showPipeline ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
          </button>
          {showPipeline && (
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
              {[
                ['1','Albert finds source videos','Searches for high-performing videos in target niches (AI automation, personal finance, motivation, psychology)'],
                ['2','Submits to Reap API','Sends YouTube URL → Reap AI generates 10–15 captioned vertical clips scored by virality'],
                ['3','Selects top clips','Top clips by virality score queued for posting. Albert picks captions and hashtags.'],
                ['4','Auto-publishes','Reap API posts to TikTok + Instagram. YouTube coming once reconnected in Reap.'],
                ['5','Drips content','3–5 clips/week pace to avoid spam flags and build audience organically.'],
                ['6','Scales to your accounts','When personal high-follower accounts connect — same pipeline, 10x reach, immediate revenue.'],
              ].map(([num, title, desc]) => (
                <div key={num} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 24, height: 24, background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#a5b4fc', flexShrink: 0, marginTop: 2 }}>{num}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{title}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
