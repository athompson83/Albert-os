'use client';

import { useState, useEffect } from 'react';
import TopBar from '@/components/TopBar';
import {
  Scissors, CheckCircle2, Clock, AlertCircle, ExternalLink,
  ChevronDown, ChevronUp, DollarSign, Zap, BarChart3, Plus, Save, Trash2
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

const INITIAL_ACTIONS: ActionItem[] = [
  // ── Step 1: Accounts ─────────────────────────────────────────────────────
  {
    id: 'tiktok-account',
    category: 'account',
    status: 'pending',
    title: 'Create TikTok Creator Account',
    description: 'Create a personal TikTok account (not business). Must be US-based, 18+. Username suggestion: @adamt.ems or similar authority-branded handle.',
    why: 'TikTok Creator Rewards pays $0.40–$1.00 per 1K views on 1min+ videos — highest RPM of any short-form platform. EMS education niche can hit $2–6/1K with expert bonus.',
    link: 'https://www.tiktok.com/signup',
  },
  {
    id: 'youtube-channel',
    category: 'account',
    status: 'pending',
    title: 'Create Dedicated YouTube Channel',
    description: 'Create a new YouTube channel for EMS clips/shorts. Suggested name: "EMS Intel" or "Paramedicine 101" or your name. Post the channel URL here when done.',
    why: 'YouTube Shorts earns $0.03–$0.08/1K views + long-form earns $3–6/1K. Clips drive traffic to long-form. Builds subs for Creator Rewards eligibility.',
    link: 'https://www.youtube.com/create_channel',
  },
  {
    id: 'instagram-account',
    category: 'account',
    status: 'pending',
    title: 'Create Instagram Creator Account',
    description: 'Create or convert an Instagram account to Creator type. Connect it to a Facebook Page (required for Reels monetization). Post the Instagram profile URL here.',
    why: 'Reels cross-posting is zero extra effort once pipeline is running — same clips, bonus views and follower growth.',
    link: 'https://www.instagram.com/accounts/emailsignup/',
  },
  // ── Step 2: Clipping tool ────────────────────────────────────────────────
  {
    id: 'reap-account',
    category: 'apikey',
    status: 'pending',
    title: 'Sign Up for Reap.video — Post API Key Here',
    description: '1. Sign up at reap.video ($9.99/mo — API included on all plans).\n2. Go to Studio → Settings → API → Generate Key.\n3. Paste the API key in the response box below.\n\nAlbert will store it in config/clipping-config.json and the automation starts immediately.',
    why: 'Reap is the clipping backbone. Albert sends a YouTube URL → Reap returns 10–15 captioned vertical clips with virality scores. Full API, no enterprise wall.',
    link: 'https://app.reap.video',
  },
  // ── Step 3: Connect accounts in Reap ────────────────────────────────────
  {
    id: 'reap-connect-tiktok',
    category: 'setup',
    status: 'pending',
    title: 'Connect TikTok inside Reap.video',
    description: 'In Reap dashboard → Publishing → Connect TikTok. Log in with your TikTok creator account. Mark done when connected.',
    why: 'Required for Albert to auto-publish clips directly to TikTok without any manual upload.',
    link: 'https://app.reap.video',
  },
  {
    id: 'reap-connect-youtube',
    category: 'setup',
    status: 'pending',
    title: 'Connect YouTube inside Reap.video',
    description: 'In Reap dashboard → Publishing → Connect YouTube. Authorize the dedicated clips channel. Mark done when connected.',
    why: 'Required for Albert to auto-publish to YouTube Shorts.',
    link: 'https://app.reap.video',
  },
  {
    id: 'reap-connect-instagram',
    category: 'setup',
    status: 'pending',
    title: 'Connect Instagram inside Reap.video',
    description: 'In Reap dashboard → Publishing → Connect Instagram. Authorize your Creator account. Mark done when connected.',
    why: 'Required for Albert to auto-publish Reels.',
    link: 'https://app.reap.video',
  },
  // ── Step 4: Content ──────────────────────────────────────────────────────
  {
    id: 'content-source',
    category: 'content',
    status: 'pending',
    title: 'Paste First Long-Form Video URL to Clip',
    description: 'Give Albert a YouTube URL of a long-form EMS/professional video to clip first. Can be:\n• Your own content\n• A training video you own rights to\n• A conference/webinar talk you presented\n\nPaste the URL in the response box below.',
    why: 'Albert needs source material to generate the first batch of clips and test the full pipeline end-to-end. One 30-min video = 10–15 clips = weeks of content.',
  },
  // ── Step 5: Confirm settings ─────────────────────────────────────────────
  {
    id: 'channel-urls',
    category: 'setup',
    status: 'pending',
    title: 'Paste All Created Account URLs Here',
    description: 'Once accounts are created, paste all profile URLs here (one per line):\n• TikTok: https://tiktok.com/@yourhandle\n• YouTube: https://youtube.com/c/yourchannel\n• Instagram: https://instagram.com/yourhandle',
    why: 'Needed for Albert to monitor growth, track monetization eligibility milestones, and report analytics weekly.',
  },
  {
    id: 'enable-auto-post',
    category: 'setup',
    status: 'pending',
    title: 'Approve Auto-Posting (Final Step)',
    description: 'Once all accounts are connected and the first test clips look good, mark this done to flip auto_post=true in the clipping config. Albert will then post 3–5 clips/week automatically without asking.',
    why: 'This is the last gate before fully autonomous operation. You stay in control until you say go.',
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

const STORAGE_KEY = 'albert-clipping-actions';

function loadActions(): ActionItem[] {
  if (typeof window === 'undefined') return INITIAL_ACTIONS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ActionItem[];
      // Merge: keep stored status/response but use latest definitions
      return INITIAL_ACTIONS.map(initial => {
        const saved = parsed.find(p => p.id === initial.id);
        return saved ? { ...initial, status: saved.status, response: saved.response } : initial;
      });
    }
  } catch {}
  return INITIAL_ACTIONS;
}

// ── Platform Rate Cards ────────────────────────────────────────────────────────
const PLATFORMS = [
  { name: 'TikTok Creator Rewards', rpm: '$0.40–$1.00', peak: '$6.00', req: '15K followers, 150K views/28d, 1min+ videos, US/UK/DE/FR only', color: '#ff0050' },
  { name: 'YouTube Long-form', rpm: '$3.00–$6.00', peak: '$20+', req: '1K subs + 4K watch hours/yr', color: '#ff0000' },
  { name: 'YouTube Shorts', rpm: '$0.03–$0.08', peak: '$0.35', req: '1K subs + 10M Shorts views/90d', color: '#ff0000' },
  { name: 'Facebook Reels', rpm: '$0.10–$0.30', peak: '$0.60', req: 'Varies by region', color: '#1877f2' },
  { name: 'Snapchat Spotlight', rpm: '$0.05–$0.25', peak: '$0.50', req: '50K followers, invite-only', color: '#fffc00' },
  { name: 'Instagram Reels', rpm: '$0.01–$0.05', peak: '$0.10', req: 'Inconsistent, invite-only', color: '#e1306c' },
];

// ── Revenue Calculator ────────────────────────────────────────────────────────
function RevenueCalc() {
  const [views, setViews] = useState(500000);
  const [platforms, setPlatforms] = useState(3);
  const low = ((views / 1000) * 0.40 * platforms).toFixed(0);
  const high = ((views / 1000) * 1.00 * platforms).toFixed(0);
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <BarChart3 size={16} style={{ color: '#a5b4fc' }} />
        <span style={{ fontWeight: 600, fontSize: 15 }}>Revenue Estimator</span>
      </div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Views per month (per platform)</label>
          <input
            type="range" min={10000} max={5000000} step={10000} value={views}
            onChange={e => setViews(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#6366f1' }}
          />
          <div style={{ fontSize: 13, marginTop: 4, color: '#e5e5e5' }}>{(views / 1000).toFixed(0)}K views</div>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Active platforms</label>
          <input
            type="range" min={1} max={5} step={1} value={platforms}
            onChange={e => setPlatforms(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#6366f1' }}
          />
          <div style={{ fontSize: 13, marginTop: 4, color: '#e5e5e5' }}>{platforms} platform{platforms > 1 ? 's' : ''}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, padding: '12px 16px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Conservative/mo</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#a5b4fc' }}>${parseInt(low).toLocaleString()}</div>
        </div>
        <div style={{ flex: 1, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '12px 16px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Optimistic/mo</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#10b981' }}>${parseInt(high).toLocaleString()}</div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
        Based on TikTok Creator Rewards RPM. Add YouTube long-form funnel and you multiply this.
      </div>
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
  const [showStrategy, setShowStrategy] = useState(false);

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

  const clearResponse = (id: string) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, response: undefined, status: 'pending' } : a));
  };

  const done = actions.filter(a => a.status === 'done').length;
  const total = actions.length;
  const pct = Math.round((done / total) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopBar title="Clipping Engine" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px', maxWidth: 900, width: '100%', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Scissors size={22} style={{ color: '#a5b4fc' }} />
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>AI Clipping Revenue Engine</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
            Albert researched and built this pipeline. Long-form video → AI clips → auto-posted to TikTok, YouTube Shorts, Instagram → platform revenue. 
            Complete the action items below and Albert will run the rest automatically.
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Setup Progress</span>
            <span style={{ fontSize: 13, color: done === total ? '#10b981' : 'var(--text-muted)' }}>{done}/{total} completed</span>
          </div>
          <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: done === total ? '#10b981' : '#6366f1', borderRadius: 4, transition: 'width 0.3s' }} />
          </div>
          {done === total && (
            <div style={{ marginTop: 10, fontSize: 13, color: '#10b981', fontWeight: 600 }}>
              ✅ All set — Albert can now run the clipping pipeline automatically.
            </div>
          )}
        </div>

        {/* Revenue Calculator */}
        <RevenueCalc />

        {/* Action Items */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Zap size={16} style={{ color: '#a5b4fc' }} />
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Action Items — What Albert Needs From You</h2>
          </div>

          {actions.map(action => {
            const s = STATUS_STYLES[action.status];
            const isExpanded = expanded === action.id;
            const isEditing = editingResponse === action.id;

            return (
              <div key={action.id} style={{
                background: 'var(--surface)',
                border: `1px solid ${action.status === 'done' ? 'rgba(16,185,129,0.25)' : 'var(--border)'}`,
                borderRadius: 10,
                marginBottom: 10,
                overflow: 'hidden',
                transition: 'border-color 0.2s',
              }}>
                {/* Header row */}
                <div
                  onClick={() => setExpanded(isExpanded ? null : action.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }}
                >
                  {/* Category badge */}
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', minWidth: 80 }}>
                    {CATEGORY_LABELS[action.category]}
                  </span>

                  {/* Title */}
                  <span style={{ flex: 1, fontSize: 14, fontWeight: action.status === 'done' ? 400 : 600, color: action.status === 'done' ? 'var(--text-muted)' : '#e5e5e5', textDecoration: action.status === 'done' ? 'line-through' : 'none' }}>
                    {action.title}
                  </span>

                  {/* Status badge */}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: s.color, background: s.bg, padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                    {s.icon}{s.label}
                  </span>

                  {isExpanded ? <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />}
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ paddingTop: 14, fontSize: 14, lineHeight: 1.6, color: '#ccc', marginBottom: 10 }}>
                      {action.description}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', background: 'rgba(99,102,241,0.07)', borderRadius: 6, padding: '8px 12px', marginBottom: 14, lineHeight: 1.5 }}>
                      <strong style={{ color: '#a5b4fc' }}>Why: </strong>{action.why}
                    </div>

                    {action.link && (
                      <a href={action.link} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#a5b4fc', marginBottom: 14, textDecoration: 'none', border: '1px solid rgba(165,180,252,0.3)', borderRadius: 6, padding: '5px 10px' }}>
                        <ExternalLink size={12} /> Open Link
                      </a>
                    )}

                    {/* Response area */}
                    {action.response && !isEditing && (
                      <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
                        <div style={{ fontSize: 11, color: '#10b981', marginBottom: 4, fontWeight: 600 }}>✅ Your Response</div>
                        <div style={{ fontSize: 13, color: '#ccc', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{action.response}</div>
                        <button onClick={() => clearResponse(action.id)} style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Trash2 size={10} /> Clear
                        </button>
                      </div>
                    )}

                    {isEditing ? (
                      <div style={{ marginBottom: 12 }}>
                        <textarea
                          value={responseText}
                          onChange={e => setResponseText(e.target.value)}
                          placeholder="Paste API keys, account URLs, credentials, or any relevant info here..."
                          rows={4}
                          style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: '#e5e5e5', fontSize: 13, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                        />
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          <button onClick={() => saveResponse(action.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, background: '#10b981', border: 'none', borderRadius: 6, padding: '7px 14px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                            <Save size={12} /> Save & Mark Done
                          </button>
                          <button onClick={() => setEditingResponse(null)} style={{ fontSize: 12, background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 14px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {action.status !== 'done' && (
                          <button onClick={() => { setEditingResponse(action.id); setResponseText(action.response || ''); }} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 6, padding: '7px 14px', color: '#a5b4fc', cursor: 'pointer' }}>
                            <Plus size={12} /> Post Result / Credentials
                          </button>
                        )}
                        {action.status !== 'done' && (
                          <button onClick={() => updateStatus(action.id, 'done')} style={{ fontSize: 12, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 6, padding: '7px 14px', color: '#10b981', cursor: 'pointer' }}>
                            Mark Done
                          </button>
                        )}
                        {action.status !== 'blocked' && action.status !== 'done' && (
                          <button onClick={() => updateStatus(action.id, 'blocked')} style={{ fontSize: 12, background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 14px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            Mark Blocked
                          </button>
                        )}
                        {action.status !== 'pending' && (
                          <button onClick={() => updateStatus(action.id, 'pending')} style={{ fontSize: 12, background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 14px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            Reset
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Platform rates collapsible */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 20 }}>
          <button
            onClick={() => setShowPlatforms(p => !p)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#e5e5e5', textAlign: 'left' }}
          >
            <DollarSign size={16} style={{ color: '#a5b4fc' }} />
            <span style={{ fontWeight: 600, fontSize: 15, flex: 1 }}>Platform Payout Rates</span>
            {showPlatforms ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showPlatforms && (
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
              {PLATFORMS.map(p => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, marginTop: 5, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.req}</div>
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

        {/* Strategy collapsible */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 20 }}>
          <button
            onClick={() => setShowStrategy(s => !s)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#e5e5e5', textAlign: 'left' }}
          >
            <Zap size={16} style={{ color: '#a5b4fc' }} />
            <span style={{ fontWeight: 600, fontSize: 15, flex: 1 }}>The Automated Pipeline</span>
            {showStrategy ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showStrategy && (
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
              <div style={{ padding: '14px 0', fontSize: 14, lineHeight: 1.7, color: '#ccc' }}>
                {[
                  ['1', 'Source video detected', 'Albert watches for new long-form EMS/professional video (YouTube URL or upload)'],
                  ['2', 'AI clipping via Reap.video API', 'Albert sends URL → Reap generates 10-15 viral clips with captions, vertical reframe, virality scores'],
                  ['3', 'Albert reviews top clips', 'Top 5-10 clips by virality score are queued. Albert can auto-approve or flag for your review.'],
                  ['4', 'Auto-publish', 'Reap publishing API posts to TikTok, YouTube Shorts, Instagram Reels on a 3-5x/week schedule'],
                  ['5', 'Analytics report', 'Weekly: Albert reports views, revenue, follower growth, top performers'],
                  ['6', 'Compound growth', 'More views → closer to monetization thresholds → revenue unlocks → scales'],
                ].map(([num, title, desc]) => (
                  <div key={num} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 24, height: 24, background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#a5b4fc', flexShrink: 0, marginTop: 2 }}>{num}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{title}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* EMS Niche note */}
        <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: 16, marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#a5b4fc', marginBottom: 6 }}>💡 Your Unfair Advantage</div>
          <div style={{ fontSize: 13, color: '#ccc', lineHeight: 1.6 }}>
            EMS/medical education is a <strong>high-RPM niche</strong> with almost zero competition in short-form.
            Your authority as Division Chief + Protocol Chair = TikTok's "additional reward" bonuses (education + expert content = up to $6/1K views).
            One clinical pearl clip per week compounds into a serious income stream and drives awareness for your SaaS products (SentinelQA, APEx360, Assemble).
          </div>
        </div>

      </div>
    </div>
  );
}
