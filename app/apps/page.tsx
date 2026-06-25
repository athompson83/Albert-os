'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ComponentType, CSSProperties } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  GitBranch,
  KeyRound,
  Mail,
  Megaphone,
  MessagesSquare,
  RefreshCw,
  Zap,
} from 'lucide-react';
import TopBar from '@/components/TopBar';
import useIsMobile from '@/components/useIsMobile';

type Credential = {
  key: string;
  label: string;
  status: 'requested' | 'provided';
  maskedValue?: string;
};

type DistributionPlatform = {
  id: string;
  name: string;
  description: string;
  color: string;
  apiAvailable: boolean;
  connection: null | {
    status: 'connected' | 'needs_credentials';
    updatedAt: string;
  };
};

type AppCredentialField = {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url';
  required?: boolean;
};

type AppCard = {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: ComponentType<{ size?: number; style?: CSSProperties }>;
  tone: string;
  status: 'connected' | 'saved' | 'needs_setup';
  statusText: string;
  detail: string;
  href: string;
  fields: AppCredentialField[];
  envNote?: string;
};

type Snapshot = {
  stripe?: {
    connected?: boolean;
    summary?: { customerCount?: number; grossRevenue?: number };
    required?: string[];
    error?: string;
  };
  beehiiv?: {
    publication?: { id?: string; name?: string };
    error?: string;
  };
  credentials: Credential[];
  distribution?: {
    connected: number;
    total: number;
    platforms: DistributionPlatform[];
  };
};

const CORE_APP_DEFS = [
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Customers, payments, revenue, and CRM reporting.',
    category: 'Revenue',
    icon: DollarSign,
    tone: '#38bdf8',
    href: '/customers',
    fields: [{ key: 'STRIPE_SECRET_KEY', label: 'Stripe secret key', type: 'password' as const, required: true }],
    envNote: 'For the built-in CRM to sync on Vercel, also keep STRIPE_SECRET_KEY set in the Production environment.',
  },
  {
    id: 'beehiiv',
    name: 'Beehiiv',
    description: 'Newsletter publication checks and post publishing.',
    category: 'Marketing',
    icon: Mail,
    tone: '#f59e0b',
    href: '/newsletter',
    fields: [
      { key: 'BEEHIIV_API_KEY', label: 'Beehiiv API key', type: 'password' as const, required: true },
      { key: 'BEEHIIV_PUBLICATION_ID', label: 'Publication ID', type: 'text' as const, required: true },
    ],
    envNote: 'AlbertOS can save these for Hermes here. The newsletter API also reads BEEHIIV_API_KEY and BEEHIIV_PUBLICATION_ID from the running environment.',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Live team messages, alerts, and command replies.',
    category: 'Communication',
    icon: MessagesSquare,
    tone: '#a78bfa',
    href: '/chat',
    fields: [
      { key: 'SLACK_BOT_TOKEN', label: 'Bot token', type: 'password' as const, required: true },
      { key: 'SLACK_SIGNING_SECRET', label: 'Signing secret', type: 'password' as const, required: true },
      { key: 'SLACK_DEFAULT_CHANNEL_ID', label: 'Default channel ID', type: 'text' as const },
    ],
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Repos, commits, product work, and progress reporting.',
    category: 'Build',
    icon: GitBranch,
    tone: '#94a3b8',
    href: '/progress',
    fields: [{ key: 'GITHUB_TOKEN', label: 'GitHub token', type: 'password' as const, required: true }],
  },
  {
    id: 'vercel',
    name: 'Vercel',
    description: 'Deployments, product sites, and public links.',
    category: 'Distribution',
    icon: Zap,
    tone: '#f8fafc',
    href: '/products',
    fields: [{ key: 'VERCEL_TOKEN', label: 'Vercel token', type: 'password' as const, required: true }],
  },
  {
    id: 'marketing',
    name: 'Marketing Workspace',
    description: 'Campaign assets, outreach lists, and launch notes.',
    category: 'Marketing',
    icon: Megaphone,
    tone: '#34d399',
    href: '/marketing',
    fields: [
      { key: 'MARKETING_NOTES', label: 'Workspace notes or access instructions', type: 'text' as const },
    ],
  },
];

export default function AppsPage() {
  const isMobile = useIsMobile();
  const [snapshot, setSnapshot] = useState<Snapshot>({ credentials: [] });
  const [loading, setLoading] = useState(true);
  const [activeAppId, setActiveAppId] = useState('stripe');
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setNotice('');
    try {
      const [stripeRes, beehiivRes, credentialsRes, distributionRes] = await Promise.all([
        fetch('/api/stripe/summary', { cache: 'no-store' }).then(res => res.json()).catch(() => null),
        fetch('/api/newsletter/publication', { cache: 'no-store' }).then(res => res.json()).catch(() => null),
        fetch('/api/credentials', { cache: 'no-store' }).then(res => res.json()).catch(() => ({ credentials: [] })),
        fetch('/api/distribution', { cache: 'no-store' }).then(res => res.json()).catch(() => null),
      ]);
      setSnapshot({
        stripe: stripeRes || undefined,
        beehiiv: beehiivRes || undefined,
        credentials: credentialsRes?.credentials || [],
        distribution: distributionRes || undefined,
      });
    } catch {
      setNotice('Unable to load connected app status right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const credentialKeys = useMemo(() => {
    const provided = snapshot.credentials.filter(item => item.status === 'provided');
    return new Set(provided.flatMap(item => [item.key, item.key.toUpperCase(), item.key.toLowerCase()]));
  }, [snapshot.credentials]);

  const apps = useMemo<AppCard[]>(() => CORE_APP_DEFS.map(def => {
    const saved = def.fields.some(field => credentialKeys.has(field.key) || credentialKeys.has(field.key.toLowerCase()));
    let connected = false;
    let detail = saved ? 'Credential saved for Hermes.' : 'Needs credentials before Albert or Hermes can use it.';

    if (def.id === 'stripe') {
      connected = Boolean(snapshot.stripe?.connected);
      if (connected) {
        detail = `${snapshot.stripe?.summary?.customerCount || 0} customers synced.`;
      } else if (snapshot.stripe?.error) {
        detail = snapshot.stripe.error;
      }
    }

    if (def.id === 'beehiiv') {
      connected = Boolean(snapshot.beehiiv?.publication);
      if (connected) {
        detail = `Publication ready${snapshot.beehiiv?.publication?.name ? `: ${snapshot.beehiiv.publication.name}` : ''}.`;
      } else if (snapshot.beehiiv?.error) {
        detail = 'Beehiiv needs API key and publication ID.';
      }
    }

    const status = connected ? 'connected' : saved ? 'saved' : 'needs_setup';
    return {
      ...def,
      status,
      statusText: connected ? 'Connected' : saved ? 'Saved for Hermes' : 'Needs setup',
      detail,
    };
  }), [credentialKeys, snapshot.beehiiv, snapshot.stripe]);

  const activeApp = apps.find(app => app.id === activeAppId) || apps[0];
  const ActiveIcon = activeApp.icon;
  const connectedCore = apps.filter(app => app.status === 'connected' || app.status === 'saved').length;
  const distributionPlatforms = snapshot.distribution?.platforms || [];
  const connectedDistribution = snapshot.distribution?.connected || 0;

  async function saveAppCredentials(app: AppCard) {
    const missing = app.fields.filter(field => field.required && !values[field.key]?.trim());
    if (missing.length) {
      setNotice(`${app.name} still needs: ${missing.map(field => field.label).join(', ')}`);
      return;
    }

    setSaving(true);
    setNotice('');
    try {
      for (const field of app.fields) {
        const value = values[field.key]?.trim();
        if (!value) continue;
        await fetch('/api/credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: field.key,
            label: `${app.name} ${field.label}`,
            value,
            requestedBy: 'Connected Apps',
          }),
        });
      }
      if (notes[app.id]?.trim()) {
        await fetch('/api/credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: `${app.id.toUpperCase()}_NOTES`,
            label: `${app.name} notes`,
            value: notes[app.id].trim(),
            requestedBy: 'Connected Apps',
          }),
        });
      }
      setValues(prev => {
        const next = { ...prev };
        for (const field of app.fields) delete next[field.key];
        return next;
      });
      setNotice(`${app.name} access saved. Albert and Hermes were updated.`);
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Connected Apps" />
      <main style={{ flex: 1, padding: isMobile ? '18px 14px 36px' : '28px 40px 48px', maxWidth: 1240, width: '100%', margin: '0 auto' }}>
        <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'flex-start', flexDirection: isMobile ? 'column' : 'row', gap: 14, marginBottom: 18 }}>
          <div>
            <h1 style={{ margin: 0, color: '#fff', fontSize: isMobile ? 24 : 30, lineHeight: 1.1 }}>Connected Apps</h1>
            <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: 14, maxWidth: 680 }}>
              Connect accounts once, then let Albert and Hermes use them for revenue, publishing, marketing, and progress work.
            </p>
          </div>
          <button onClick={load} style={secondaryButton}>
            <RefreshCw size={15} />
            Refresh
          </button>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 18 }}>
          <MetricCard label="Core apps ready" value={`${connectedCore}/${apps.length}`} tone="#6366f1" />
          <MetricCard label="Publishing platforms" value={`${connectedDistribution}/${snapshot.distribution?.total || 6}`} tone="#10b981" />
          <MetricCard label="Saved credentials" value={String(snapshot.credentials.filter(item => item.status === 'provided').length)} tone="#f59e0b" />
        </section>

        {notice && (
          <div style={{ border: '1px solid rgba(99,102,241,0.35)', background: 'rgba(99,102,241,0.12)', color: '#c7d2fe', borderRadius: 8, padding: '10px 12px', marginBottom: 16, fontSize: 13 }}>
            {notice}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.15fr) minmax(320px, 0.85fr)', gap: 16, alignItems: 'start' }}>
          <section style={panelStyle}>
            <div style={panelHeader}>
              <div>
                <h2 style={sectionTitle}>Account Connections</h2>
                <p style={sectionSubtle}>{loading ? 'Checking live status...' : 'Click an app to manage access.'}</p>
              </div>
              <Link href="/credentials" style={textLink}>Credential Center</Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
              {apps.map(app => (
                <AppTile key={app.id} app={app} active={activeApp.id === app.id} onSelect={() => setActiveAppId(app.id)} />
              ))}
            </div>
          </section>

          <section style={panelStyle}>
            <div style={panelHeader}>
              <div>
                <h2 style={sectionTitle}>{activeApp.name}</h2>
                <p style={sectionSubtle}>{activeApp.statusText}</p>
              </div>
              <ActiveIcon size={22} style={{ color: activeApp.tone }} />
            </div>

            <p style={{ color: 'var(--text)', fontSize: 14, lineHeight: 1.5, margin: '0 0 8px' }}>{activeApp.description}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.45, margin: '0 0 16px' }}>{activeApp.detail}</p>

            <div style={{ display: 'grid', gap: 10 }}>
              {activeApp.fields.map(field => (
                <label key={field.key} style={labelStyle}>
                  {field.label}{field.required ? ' *' : ''}
                  <input
                    type={field.type}
                    value={values[field.key] || ''}
                    onChange={(event) => setValues(prev => ({ ...prev, [field.key]: event.target.value }))}
                    placeholder={activeApp.status === 'needs_setup' ? `Enter ${field.label.toLowerCase()}` : 'Paste a new value to update'}
                    style={inputStyle}
                  />
                </label>
              ))}
              <label style={labelStyle}>
                Notes for Albert
                <textarea
                  rows={3}
                  value={notes[activeApp.id] || ''}
                  onChange={(event) => setNotes(prev => ({ ...prev, [activeApp.id]: event.target.value }))}
                  placeholder="Add login notes, limits, account owner, or anything Hermes needs to know."
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </label>
              {activeApp.envNote && <div style={helperText}>{activeApp.envNote}</div>}
              <button onClick={() => saveAppCredentials(activeApp)} disabled={saving} style={{ ...primaryButton, justifyContent: 'center' }}>
                <KeyRound size={15} />
                {saving ? 'Saving...' : activeApp.status === 'needs_setup' ? 'Save Access' : 'Update Access'}
              </button>
              <Link href={activeApp.href} style={{ ...secondaryButton, justifyContent: 'center' }}>
                <ExternalLink size={15} />
                Open {activeApp.name}
              </Link>
            </div>
          </section>
        </div>

        <section style={{ ...panelStyle, marginTop: 16 }}>
          <div style={panelHeader}>
            <div>
              <h2 style={sectionTitle}>Distribution Platforms</h2>
              <p style={sectionSubtle}>Course and product publishing accounts are managed in Distribution Hub.</p>
            </div>
            <Link href="/content/distribute" style={textLink}>Open Distribution Hub</Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
            {distributionPlatforms.map(platform => {
              const connected = platform.connection?.status === 'connected';
              return (
                <Link key={platform.id} href={`/content/distribute?platform=${platform.id}`} style={{ ...platformTile, borderColor: connected ? 'rgba(16,185,129,0.45)' : 'var(--border)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: platform.color }} />
                    <strong style={{ color: '#fff', fontSize: 13 }}>{platform.name}</strong>
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.35 }}>{platform.description}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: connected ? '#34d399' : '#fca5a5', fontSize: 12, fontWeight: 800 }}>
                    {connected ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                    {connected ? 'Connected' : 'Connect'}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

function AppTile({ app, active, onSelect }: { app: AppCard; active: boolean; onSelect: () => void }) {
  const Icon = app.icon;
  const connected = app.status === 'connected';
  const saved = app.status === 'saved';
  const statusTone = connected ? '#34d399' : saved ? '#fbbf24' : '#fca5a5';
  return (
    <button onClick={onSelect} style={{
      background: active ? 'rgba(99,102,241,0.16)' : 'var(--surface-2)',
      border: `1px solid ${active ? '#6366f1' : 'var(--border)'}`,
      borderRadius: 10,
      padding: 14,
      color: 'inherit',
      cursor: 'pointer',
      textAlign: 'left',
      display: 'grid',
      gap: 10,
    }}>
      <span style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <span style={{ display: 'flex', gap: 10, minWidth: 0 }}>
          <span style={{ width: 34, height: 34, borderRadius: 9, background: `${app.tone}18`, color: app.tone, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={18} />
          </span>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: 'block', color: '#fff', fontSize: 14, fontWeight: 750 }}>{app.name}</span>
            <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: 12 }}>{app.category}</span>
          </span>
        </span>
        <span style={{ color: statusTone }}>{connected ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}</span>
      </span>
      <span style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.35 }}>{app.description}</span>
      <span style={{ color: statusTone, fontSize: 12, fontWeight: 800 }}>{app.statusText}</span>
    </button>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div style={{ ...panelStyle, padding: 16 }}>
      <div style={{ color: tone, fontSize: 24, fontWeight: 800, lineHeight: 1 }}>{value}</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 6 }}>{label}</div>
    </div>
  );
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
};

const sectionTitle: CSSProperties = {
  margin: 0,
  color: '#fff',
  fontSize: 16,
  fontWeight: 750,
};

const sectionSubtle: CSSProperties = {
  margin: '4px 0 0',
  color: 'var(--text-muted)',
  fontSize: 12,
};

const textLink: CSSProperties = {
  color: '#a5b4fc',
  textDecoration: 'none',
  fontSize: 12,
  fontWeight: 800,
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
};

const helperText: CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: 11,
  lineHeight: 1.45,
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '9px 10px',
  background: 'rgba(255,255,255,0.03)',
};

const primaryButton: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  background: 'var(--primary)',
  color: '#fff',
  border: '1px solid var(--primary)',
  borderRadius: 8,
  padding: '10px 13px',
  textDecoration: 'none',
  cursor: 'pointer',
  fontWeight: 750,
  fontSize: 13,
};

const secondaryButton: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  background: 'transparent',
  color: '#c7d2fe',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '10px 13px',
  textDecoration: 'none',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 13,
};

const platformTile: CSSProperties = {
  display: 'grid',
  gap: 8,
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: 13,
  textDecoration: 'none',
};
