'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Brush,
  CheckCircle2,
  Clapperboard,
  Copy,
  Download,
  Image as ImageIcon,
  Palette,
  RefreshCw,
  Sparkles,
  Wand2,
} from 'lucide-react';
import TopBar from '@/components/TopBar';
import useIsMobile from '@/components/useIsMobile';

type ToolTab = 'image' | 'video' | 'optimizer' | 'brand' | 'jobs';

type BrandProfile = {
  name: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontStyle?: string;
  voice?: string;
  audience?: string;
  designNotes?: string;
  updatedAt: string;
};

type ContentToolJob = {
  id: string;
  kind: 'image' | 'video' | 'optimizer';
  title: string;
  status: 'completed' | 'draft_ready' | 'needs_provider' | 'failed';
  createdAt: string;
  provider?: string;
  error?: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
};

type Snapshot = {
  brand: BrandProfile;
  recentJobs: ContentToolJob[];
  providers: {
    image: { connected: boolean; provider: string };
    video: { connected: boolean; provider: string };
    optimizer: { connected: boolean; provider: string };
  };
};

const emptySnapshot: Snapshot = {
  brand: {
    name: 'Albert OS',
    primaryColor: '#6366f1',
    secondaryColor: '#0f172a',
    accentColor: '#10b981',
    updatedAt: '',
  },
  recentJobs: [],
  providers: {
    image: { connected: false, provider: 'OpenAI Images API' },
    video: { connected: false, provider: 'Video provider' },
    optimizer: { connected: false, provider: 'Local brand optimizer' },
  },
};

export default function ContentToolsPage() {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<ToolTab>('image');
  const [snapshot, setSnapshot] = useState<Snapshot>(emptySnapshot);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [brand, setBrand] = useState<BrandProfile>(emptySnapshot.brand);
  const [imageForm, setImageForm] = useState({
    title: 'Product hero image',
    prompt: '',
    style: 'premium commercial image, clean high-converting product visual',
    aspectRatio: '1024x1024',
    quality: 'high',
  });
  const [videoForm, setVideoForm] = useState({
    title: 'Short-form video',
    mode: 'text_to_video',
    prompt: '',
    sourceUrl: '',
    sourceFileName: '',
    transcript: '',
    format: '9:16 short-form',
  });
  const [optimizerForm, setOptimizerForm] = useState({
    title: 'Rebranded asset',
    channel: 'landing page',
    goal: 'make it beautiful, premium, clear, and conversion-focused',
    content: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/content-tools', { cache: 'no-store' });
      const data = await res.json();
      setSnapshot(data);
      setBrand(data.brand);
    } catch {
      setNotice('Unable to load creative tools right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const latestJob = snapshot.recentJobs[0];
  const imageJob = useMemo(
    () => snapshot.recentJobs.find(job => job.kind === 'image'),
    [snapshot.recentJobs],
  );
  const readyCount = [
    snapshot.providers.image.connected,
    snapshot.providers.video.connected,
    snapshot.providers.optimizer.connected,
  ].filter(Boolean).length;

  async function saveBrand() {
    setSaving(true);
    setNotice('');
    try {
      const res = await fetch('/api/content-tools/brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brand),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Brand save failed.');
      setNotice('Brand kit saved. Hermes can use it for image, video, and optimizer jobs.');
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  }

  async function createJob(kind: 'image' | 'video' | 'optimizer') {
    const body = kind === 'image'
      ? { kind, ...imageForm }
      : kind === 'video'
        ? { kind, ...videoForm }
        : { kind, ...optimizerForm };

    setSaving(true);
    setNotice('');
    try {
      const res = await fetch('/api/content-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Tool job failed.');
      setNotice(`${data.job.title} created with status: ${data.job.status}.`);
      await load();
      setTab('jobs');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  }

  function copyJob(job: ContentToolJob) {
    navigator.clipboard?.writeText(JSON.stringify(job.output, null, 2));
    setNotice('Output copied.');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Creative Tools" />
      <main style={{ flex: 1, padding: isMobile ? '18px 14px 36px' : '28px 40px 48px', maxWidth: 1240, width: '100%', margin: '0 auto' }}>
        <section style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexDirection: isMobile ? 'column' : 'row', marginBottom: 18 }}>
          <div>
            <h1 style={{ color: '#fff', margin: 0, fontSize: isMobile ? 24 : 30, lineHeight: 1.1 }}>Creative Tools</h1>
            <p style={{ color: 'var(--text-muted)', margin: '8px 0 0', fontSize: 14, maxWidth: 760 }}>
              Image generation, AI video planning/editing, viral clip intake, and brand-safe content optimization for Albert and Hermes.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={load} style={secondaryButton}>
              <RefreshCw size={15} /> Refresh
            </button>
            <Link href="/content" style={secondaryButton}>Content Command</Link>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 18 }}>
          <Metric label="Providers ready" value={`${readyCount}/3`} tone="#6366f1" />
          <Metric label="Brand kit" value={snapshot.brand.name || 'Unset'} tone="#10b981" />
          <Metric label="Jobs" value={String(snapshot.recentJobs.length)} tone="#f59e0b" />
          <Metric label="Latest" value={latestJob?.status || 'None'} tone="#60a5fa" />
        </section>

        {notice && (
          <div style={{ border: '1px solid rgba(99,102,241,0.35)', background: 'rgba(99,102,241,0.12)', color: '#c7d2fe', borderRadius: 8, padding: '10px 12px', marginBottom: 16, fontSize: 13 }}>
            {notice}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          <TabButton active={tab === 'image'} onClick={() => setTab('image')} icon={<ImageIcon size={15} />} label="Image Generator" />
          <TabButton active={tab === 'video'} onClick={() => setTab('video')} icon={<Clapperboard size={15} />} label="Video Editor" />
          <TabButton active={tab === 'optimizer'} onClick={() => setTab('optimizer')} icon={<Wand2 size={15} />} label="Content Optimizer" />
          <TabButton active={tab === 'brand'} onClick={() => setTab('brand')} icon={<Palette size={15} />} label="Brand Kit" />
          <TabButton active={tab === 'jobs'} onClick={() => setTab('jobs')} icon={<Sparkles size={15} />} label="Jobs" />
        </div>

        {tab === 'image' && (
          <ToolLayout
            isMobile={isMobile}
            title="Image Generator"
            status={snapshot.providers.image.connected ? 'Provider connected' : 'Needs OPENAI_API_KEY'}
            statusOk={snapshot.providers.image.connected}
            aside={<ImagePreview job={imageJob} />}
          >
            <label style={labelStyle}>
              Title
              <input value={imageForm.title} onChange={e => setImageForm(prev => ({ ...prev, title: e.target.value }))} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Prompt
              <textarea
                rows={7}
                value={imageForm.prompt}
                onChange={e => setImageForm(prev => ({ ...prev, prompt: e.target.value }))}
                placeholder="Describe the image you want. Include product, scene, audience, mood, platform, and any text that should appear."
                style={inputStyle}
              />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 10 }}>
              <label style={labelStyle}>
                Aspect
                <select value={imageForm.aspectRatio} onChange={e => setImageForm(prev => ({ ...prev, aspectRatio: e.target.value }))} style={inputStyle}>
                  <option value="1024x1024">Square</option>
                  <option value="1024x1536">Portrait</option>
                  <option value="1536x1024">Landscape</option>
                </select>
              </label>
              <label style={labelStyle}>
                Quality
                <select value={imageForm.quality} onChange={e => setImageForm(prev => ({ ...prev, quality: e.target.value }))} style={inputStyle}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </label>
              <label style={labelStyle}>
                Style
                <input value={imageForm.style} onChange={e => setImageForm(prev => ({ ...prev, style: e.target.value }))} style={inputStyle} />
              </label>
            </div>
            <button onClick={() => createJob('image')} disabled={saving || !imageForm.prompt.trim()} style={primaryButton}>
              <Sparkles size={15} /> {saving ? 'Generating...' : 'Generate Image'}
            </button>
          </ToolLayout>
        )}

        {tab === 'video' && (
          <ToolLayout
            isMobile={isMobile}
            title="Video Editor"
            status={snapshot.providers.video.connected ? `${snapshot.providers.video.provider} connected` : 'Needs video provider key'}
            statusOk={snapshot.providers.video.connected}
            aside={<VideoModeHelp />}
          >
            <label style={labelStyle}>
              Job title
              <input value={videoForm.title} onChange={e => setVideoForm(prev => ({ ...prev, title: e.target.value }))} style={inputStyle} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
              <label style={labelStyle}>
                Mode
                <select value={videoForm.mode} onChange={e => setVideoForm(prev => ({ ...prev, mode: e.target.value }))} style={inputStyle}>
                  <option value="text_to_video">Generate from text</option>
                  <option value="similar_from_link">Create similar original video</option>
                  <option value="viral_clip">Find viral clip</option>
                </select>
              </label>
              <label style={labelStyle}>
                Format
                <select value={videoForm.format} onChange={e => setVideoForm(prev => ({ ...prev, format: e.target.value }))} style={inputStyle}>
                  <option value="9:16 short-form">9:16 short-form</option>
                  <option value="16:9 YouTube">16:9 YouTube</option>
                  <option value="1:1 square ad">1:1 square ad</option>
                </select>
              </label>
            </div>
            <label style={labelStyle}>
              YouTube/social link
              <input value={videoForm.sourceUrl} onChange={e => setVideoForm(prev => ({ ...prev, sourceUrl: e.target.value }))} placeholder="https://..." style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Original video file
              <input
                type="file"
                accept="video/*"
                onChange={e => setVideoForm(prev => ({ ...prev, sourceFileName: e.target.files?.[0]?.name || '' }))}
                style={inputStyle}
              />
              {videoForm.sourceFileName && <span style={hintText}>Selected: {videoForm.sourceFileName}</span>}
            </label>
            <label style={labelStyle}>
              Prompt or edit instructions
              <textarea rows={5} value={videoForm.prompt} onChange={e => setVideoForm(prev => ({ ...prev, prompt: e.target.value }))} placeholder="Describe the video to generate, what to copy structurally, or what makes a clip viral." style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Transcript or notes
              <textarea rows={5} value={videoForm.transcript} onChange={e => setVideoForm(prev => ({ ...prev, transcript: e.target.value }))} placeholder="Paste transcript if available. This helps find high-retention clip candidates." style={inputStyle} />
            </label>
            <button onClick={() => createJob('video')} disabled={saving} style={primaryButton}>
              <Clapperboard size={15} /> {saving ? 'Creating...' : 'Create Video Job'}
            </button>
          </ToolLayout>
        )}

        {tab === 'optimizer' && (
          <ToolLayout
            isMobile={isMobile}
            title="Content Optimizer"
            status={snapshot.providers.optimizer.connected ? 'AI rewrite available' : 'Local brand optimizer'}
            statusOk
            aside={<BrandCard brand={snapshot.brand} />}
          >
            <label style={labelStyle}>
              Asset title
              <input value={optimizerForm.title} onChange={e => setOptimizerForm(prev => ({ ...prev, title: e.target.value }))} style={inputStyle} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
              <label style={labelStyle}>
                Channel
                <select value={optimizerForm.channel} onChange={e => setOptimizerForm(prev => ({ ...prev, channel: e.target.value }))} style={inputStyle}>
                  <option value="landing page">Landing page</option>
                  <option value="email">Email</option>
                  <option value="social post">Social post</option>
                  <option value="product page">Product page</option>
                  <option value="course lesson">Course lesson</option>
                  <option value="ad creative">Ad creative</option>
                </select>
              </label>
              <label style={labelStyle}>
                Goal
                <input value={optimizerForm.goal} onChange={e => setOptimizerForm(prev => ({ ...prev, goal: e.target.value }))} style={inputStyle} />
              </label>
            </div>
            <label style={labelStyle}>
              Existing content
              <textarea rows={12} value={optimizerForm.content} onChange={e => setOptimizerForm(prev => ({ ...prev, content: e.target.value }))} placeholder="Paste the existing copy, outline, product text, script, ad, or page section." style={inputStyle} />
            </label>
            <button onClick={() => createJob('optimizer')} disabled={saving || !optimizerForm.content.trim()} style={primaryButton}>
              <Brush size={15} /> {saving ? 'Optimizing...' : 'Rebrand and Optimize'}
            </button>
          </ToolLayout>
        )}

        {tab === 'brand' && (
          <section style={panelStyle}>
            <div style={panelHeader}>
              <div>
                <h2 style={sectionTitle}>Brand Kit</h2>
                <p style={sectionSubtle}>Saved here for Albert and Hermes to apply across generated images, videos, and rewritten content.</p>
              </div>
              <span style={statusPill}><CheckCircle2 size={13} /> Available to Hermes</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 280px', gap: 16 }}>
              <div style={{ display: 'grid', gap: 10 }}>
                <label style={labelStyle}>Brand name<input value={brand.name} onChange={e => setBrand(prev => ({ ...prev, name: e.target.value }))} style={inputStyle} /></label>
                <label style={labelStyle}>Logo URL<input value={brand.logoUrl || ''} onChange={e => setBrand(prev => ({ ...prev, logoUrl: e.target.value }))} style={inputStyle} /></label>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 10 }}>
                  <ColorField label="Primary" value={brand.primaryColor} onChange={value => setBrand(prev => ({ ...prev, primaryColor: value }))} />
                  <ColorField label="Secondary" value={brand.secondaryColor} onChange={value => setBrand(prev => ({ ...prev, secondaryColor: value }))} />
                  <ColorField label="Accent" value={brand.accentColor} onChange={value => setBrand(prev => ({ ...prev, accentColor: value }))} />
                </div>
                <label style={labelStyle}>Font style<input value={brand.fontStyle || ''} onChange={e => setBrand(prev => ({ ...prev, fontStyle: e.target.value }))} style={inputStyle} /></label>
                <label style={labelStyle}>Voice<textarea rows={3} value={brand.voice || ''} onChange={e => setBrand(prev => ({ ...prev, voice: e.target.value }))} style={inputStyle} /></label>
                <label style={labelStyle}>Audience<textarea rows={3} value={brand.audience || ''} onChange={e => setBrand(prev => ({ ...prev, audience: e.target.value }))} style={inputStyle} /></label>
                <label style={labelStyle}>Design notes<textarea rows={4} value={brand.designNotes || ''} onChange={e => setBrand(prev => ({ ...prev, designNotes: e.target.value }))} style={inputStyle} /></label>
                <button onClick={saveBrand} disabled={saving} style={primaryButton}>
                  <Palette size={15} /> {saving ? 'Saving...' : 'Save Brand Kit'}
                </button>
              </div>
              <BrandCard brand={brand} />
            </div>
          </section>
        )}

        {tab === 'jobs' && (
          <section style={panelStyle}>
            <div style={panelHeader}>
              <div>
                <h2 style={sectionTitle}>Creative Jobs</h2>
                <p style={sectionSubtle}>{loading ? 'Loading...' : `${snapshot.recentJobs.length} recent jobs`}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {snapshot.recentJobs.map(job => (
                <article key={job.id} style={jobCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ color: '#fff', fontWeight: 750, fontSize: 14 }}>{job.title}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{job.kind} - {job.provider || 'local'} - {new Date(job.createdAt).toLocaleString()}</div>
                    </div>
                    <span style={{ ...statusPill, color: statusColor(job.status), borderColor: `${statusColor(job.status)}66`, background: `${statusColor(job.status)}18` }}>
                      {job.status === 'failed' ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />}
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>
                  {job.error && <div style={{ color: '#fca5a5', fontSize: 12 }}>{job.error}</div>}
                  <pre style={preStyle}>{JSON.stringify(job.output, null, 2)}</pre>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {typeof job.output.imageDataUrl === 'string' && (
                      <a href={job.output.imageDataUrl} download={`${job.id}.png`} style={secondaryButton}>
                        <Download size={14} /> Download
                      </a>
                    )}
                    <button onClick={() => copyJob(job)} style={secondaryButton}>
                      <Copy size={14} /> Copy output
                    </button>
                  </div>
                </article>
              ))}
              {!snapshot.recentJobs.length && (
                <div style={{ border: '1px dashed var(--border)', borderRadius: 10, color: 'var(--text-muted)', padding: 24, textAlign: 'center', fontSize: 13 }}>
                  No creative jobs yet. Generate an image, create a video job, or optimize content.
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function ToolLayout({ isMobile, title, status, statusOk, aside, children }: {
  isMobile: boolean;
  title: string;
  status: string;
  statusOk: boolean;
  aside: ReactNode;
  children: ReactNode;
}) {
  return (
    <section style={panelStyle}>
      <div style={panelHeader}>
        <div>
          <h2 style={sectionTitle}>{title}</h2>
          <p style={sectionSubtle}>Hermes can create the same job through /hermes/content-tools.</p>
        </div>
        <span style={{ ...statusPill, color: statusOk ? '#34d399' : '#fbbf24', borderColor: statusOk ? 'rgba(52,211,153,0.4)' : 'rgba(251,191,36,0.4)', background: statusOk ? 'rgba(52,211,153,0.12)' : 'rgba(251,191,36,0.12)' }}>
          {statusOk ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
          {status}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 340px', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 10 }}>{children}</div>
        {aside}
      </div>
    </section>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div style={{ ...panelStyle, padding: 16 }}>
      <div style={{ color: tone, fontSize: 22, fontWeight: 800, lineHeight: 1, overflowWrap: 'anywhere' }}>{value}</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 6 }}>{label}</div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button onClick={onClick} style={{ ...secondaryButton, background: active ? 'rgba(99,102,241,0.18)' : 'transparent', color: active ? '#c7d2fe' : 'var(--text-muted)', borderColor: active ? 'rgba(99,102,241,0.5)' : 'var(--border)' }}>
      {icon} {label}
    </button>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label style={labelStyle}>
      {label}
      <span style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: 8 }}>
        <input type="color" value={value || '#6366f1'} onChange={e => onChange(e.target.value)} style={{ width: 44, height: 39, padding: 2, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8 }} />
        <input value={value} onChange={e => onChange(e.target.value)} style={inputStyle} />
      </span>
    </label>
  );
}

function ImagePreview({ job }: { job?: ContentToolJob }) {
  const imageDataUrl = typeof job?.output?.imageDataUrl === 'string' ? job.output.imageDataUrl : '';
  return (
    <aside style={asideStyle}>
      <div style={asideTitle}>Latest image</div>
      {imageDataUrl ? (
        <img src={imageDataUrl} alt="Generated image" style={{ width: '100%', borderRadius: 10, border: '1px solid var(--border)' }} />
      ) : (
        <div style={emptyPreview}>
          <ImageIcon size={34} />
          <span>{job?.status === 'needs_provider' ? 'Prompt package is ready. Add OPENAI_API_KEY to render images.' : 'Generated image will appear here.'}</span>
        </div>
      )}
    </aside>
  );
}

function VideoModeHelp() {
  return (
    <aside style={asideStyle}>
      <div style={asideTitle}>Video modes</div>
      <div style={helpList}>
        <strong>Generate from text</strong>
        <span>Turns a prompt into script, shot list, captions, and render plan.</span>
        <strong>Create similar original video</strong>
        <span>Uses a link as structural inspiration without copying protected assets.</span>
        <strong>Find viral clip</strong>
        <span>Uses transcript/source context to identify high-retention clip candidates.</span>
      </div>
    </aside>
  );
}

function BrandCard({ brand }: { brand: BrandProfile }) {
  return (
    <aside style={asideStyle}>
      <div style={asideTitle}>{brand.name || 'Brand preview'}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
        {[brand.primaryColor, brand.secondaryColor, brand.accentColor].map(color => (
          <div key={color} style={{ height: 54, borderRadius: 8, background: color || '#6366f1', border: '1px solid var(--border)' }} />
        ))}
      </div>
      {brand.logoUrl && <img src={brand.logoUrl} alt={`${brand.name} logo`} style={{ maxWidth: '100%', maxHeight: 80, objectFit: 'contain', marginBottom: 12 }} />}
      <div style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5 }}>
        <strong style={{ color: '#fff' }}>Voice:</strong> {brand.voice || 'Not set'}<br />
        <strong style={{ color: '#fff' }}>Audience:</strong> {brand.audience || 'Not set'}<br />
        <strong style={{ color: '#fff' }}>Design:</strong> {brand.designNotes || 'Not set'}
      </div>
    </aside>
  );
}

function statusColor(status: ContentToolJob['status']) {
  if (status === 'completed' || status === 'draft_ready') return '#34d399';
  if (status === 'failed') return '#f87171';
  return '#fbbf24';
}

const panelStyle: CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: 18,
};

const panelHeader: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 14,
  flexWrap: 'wrap',
};

const sectionTitle: CSSProperties = {
  margin: 0,
  color: '#fff',
  fontSize: 17,
  fontWeight: 800,
};

const sectionSubtle: CSSProperties = {
  margin: '4px 0 0',
  color: 'var(--text-muted)',
  fontSize: 12,
};

const labelStyle: CSSProperties = {
  display: 'grid',
  gap: 6,
  color: '#e5e7eb',
  fontSize: 13,
  fontWeight: 700,
};

const inputStyle: CSSProperties = {
  width: '100%',
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text)',
  padding: '10px 11px',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  resize: 'vertical',
};

const primaryButton: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  background: 'var(--primary)',
  color: '#fff',
  border: '1px solid var(--primary)',
  borderRadius: 8,
  padding: '10px 13px',
  textDecoration: 'none',
  cursor: 'pointer',
  fontWeight: 800,
  fontSize: 13,
};

const secondaryButton: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  background: 'transparent',
  color: '#c7d2fe',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '9px 12px',
  textDecoration: 'none',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 13,
};

const statusPill: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  border: '1px solid rgba(52,211,153,0.4)',
  background: 'rgba(52,211,153,0.12)',
  borderRadius: 20,
  padding: '4px 9px',
  color: '#34d399',
  fontSize: 12,
  fontWeight: 800,
  textTransform: 'capitalize',
};

const asideStyle: CSSProperties = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: 14,
  minWidth: 0,
};

const asideTitle: CSSProperties = {
  color: '#fff',
  fontSize: 13,
  fontWeight: 800,
  marginBottom: 10,
};

const emptyPreview: CSSProperties = {
  minHeight: 220,
  border: '1px dashed var(--border)',
  borderRadius: 10,
  display: 'grid',
  placeItems: 'center',
  gap: 8,
  color: 'var(--text-muted)',
  textAlign: 'center',
  padding: 20,
  fontSize: 13,
};

const helpList: CSSProperties = {
  display: 'grid',
  gap: 7,
  color: 'var(--text-muted)',
  fontSize: 12,
  lineHeight: 1.45,
};

const hintText: CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: 11,
};

const jobCard: CSSProperties = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: 14,
  display: 'grid',
  gap: 10,
};

const preStyle: CSSProperties = {
  background: 'rgba(0,0,0,0.28)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: '#d1d5db',
  fontSize: 12,
  lineHeight: 1.45,
  padding: 12,
  overflow: 'auto',
  maxHeight: 340,
  whiteSpace: 'pre-wrap',
};
