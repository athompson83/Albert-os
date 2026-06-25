'use client';

import { useEffect, useMemo, useState } from 'react';
import TopBar from '@/components/TopBar';
import { AlertCircle, CheckCircle2, Clock, Globe, KeyRound, RefreshCw, Send, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import useIsMobile from '@/components/useIsMobile';

type Platform = {
  id: string;
  name: string;
  color: string;
  description: string;
  features: string[];
  apiAvailable: boolean;
  monthlyFee: string;
  credentialFields: Array<{ key: string; label: string; type: 'text' | 'password' | 'url'; required?: boolean }>;
  connection: null | {
    status: 'connected' | 'needs_credentials';
    updatedAt: string;
    maskedCredentials: Record<string, string>;
    notes?: string;
    accessAvailable: boolean;
  };
};

type Snapshot = {
  connected: number;
  total: number;
  platforms: Platform[];
  publishQueue: unknown[];
  publishHistory: unknown[];
};

const WORKFLOW_STEPS = [
  { step: '1', label: 'Connect Platforms', desc: 'Add access once for each platform' },
  { step: '2', label: 'Create Content', desc: 'Build lessons in the Studio' },
  { step: '3', label: 'Select & Publish', desc: 'Choose content and platforms' },
  { step: '4', label: 'Track Performance', desc: 'Analytics pull automatically' },
];

export default function DistributePage() {
  const isMobile = useIsMobile();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, Record<string, string>>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  async function load() {
    const res = await fetch('/api/distribution', { cache: 'no-store' });
    const data = await res.json();
    setSnapshot(data);
    setExpanded(prev => prev || data.platforms?.[0]?.id || null);
  }

  useEffect(() => {
    load().catch(() => setNotice('Unable to load platform connections right now.'));
  }, []);

  const platforms = useMemo(() => snapshot?.platforms || [], [snapshot?.platforms]);
  const connected = snapshot?.connected || 0;
  const total = snapshot?.total || platforms.length || 6;
  const connectedTone = connected > 0 ? '#10b981' : '#ef4444';

  const firstDisconnected = useMemo(
    () => platforms.find(platform => !platform.connection)?.id,
    [platforms],
  );

  async function savePlatform(platform: Platform) {
    const credentials = forms[platform.id] || {};
    const missing = platform.credentialFields.filter(field => field.required && !credentials[field.key]?.trim());
    if (missing.length) {
      setNotice(`${platform.name} still needs: ${missing.map(field => field.label).join(', ')}`);
      setExpanded(platform.id);
      return;
    }

    setSaving(platform.id);
    setNotice('');
    try {
      const res = await fetch('/api/distribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformId: platform.id,
          credentials,
          notes: notes[platform.id],
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Connection failed.');
      setSnapshot(data.snapshot);
      setForms(prev => ({ ...prev, [platform.id]: {} }));
      setNotice(`${platform.name} connected. Albert has been updated and the exchange was logged.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar title="Distribution Hub" />
      <main style={{ flex: 1, overflowY: 'auto', padding: isMobile ? 14 : 24, maxWidth: 1000, width: '100%', margin: '0 auto' }}>
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: isMobile ? 'stretch' : 'flex-start', flexDirection: isMobile ? 'column' : 'row' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Globe size={20} style={{ color: '#a5b4fc' }} />
              <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Distribution Hub</h1>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
              Connect your platforms. Albert can use connected accounts for publishing workflows.
            </p>
          </div>
          <button onClick={load} style={ghostButton}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#a5b4fc', marginBottom: 12 }}>How Publishing Works</div>
          <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap' }}>
            {WORKFLOW_STEPS.map((w, i) => (
              <div key={w.step} style={{ display: 'flex', alignItems: 'center', gap: 0, flex: '1 1 200px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px' }}>
                  <div style={stepBubble}>{w.step}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{w.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{w.desc}</div>
                  </div>
                </div>
                {i < WORKFLOW_STEPS.length - 1 && !isMobile && <div style={{ color: 'var(--text-muted)', fontSize: 18, paddingRight: 4 }}>→</div>}
              </div>
            ))}
          </div>
        </section>

        {notice && (
          <div style={{ border: '1px solid rgba(99,102,241,0.35)', background: 'rgba(99,102,241,0.12)', color: '#c7d2fe', borderRadius: 8, padding: '10px 12px', marginBottom: 16, fontSize: 13 }}>
            {notice}
          </div>
        )}

        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Zap size={15} style={{ color: '#a5b4fc' }} /> Platform Connections
          <span style={{ fontSize: 12, color: connectedTone, background: `${connectedTone}18`, border: `1px solid ${connectedTone}55`, borderRadius: 20, padding: '2px 10px' }}>
            {connected} of {total} connected
          </span>
          {firstDisconnected && (
            <button onClick={() => setExpanded(firstDisconnected)} style={{ ...ghostButton, padding: '5px 9px', marginLeft: 'auto' }}>
              <KeyRound size={13} /> Add next credential
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {platforms.map(platform => {
            const isExpanded = expanded === platform.id;
            const isConnected = platform.connection?.status === 'connected';
            const platformForm = forms[platform.id] || {};
            return (
              <section key={platform.id} style={{ background: 'var(--surface)', border: `1px solid ${isExpanded ? platform.color + '66' : 'var(--border)'}`, borderRadius: 12, overflow: 'hidden' }}>
                <button type="button" onClick={() => setExpanded(isExpanded ? null : platform.id)} style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: isMobile ? 'flex-start' : 'center',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: isMobile ? 8 : 14,
                  padding: isMobile ? '14px' : '14px 18px',
                  cursor: 'pointer',
                  background: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  textAlign: 'left',
                }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: platform.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, width: '100%' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{platform.name}</span>
                      <span style={{ fontSize: 10, background: platform.apiAvailable ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${platform.apiAvailable ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`, color: platform.apiAvailable ? '#10b981' : '#f59e0b', borderRadius: 20, padding: '1px 8px' }}>
                        {platform.apiAvailable ? 'API Available' : 'Package + Upload'}
                      </span>
                    </span>
                    <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{platform.description}</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: isConnected ? '#10b981' : '#ef4444' }}>
                    {isConnected ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                    {isConnected ? 'Connected' : 'Not Connected'}
                  </span>
                  <span style={{ ...connectButton, color: platform.color, borderColor: `${platform.color}66`, background: `${platform.color}22`, width: isMobile ? '100%' : 'auto' }}>
                    {isConnected ? 'Manage' : 'Connect'}
                  </span>
                  {isExpanded ? <ChevronUp size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                </button>

                {isExpanded && (
                  <div style={{ padding: '0 18px 16px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ paddingTop: 14, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                      <div>
                        <div style={smallLabel}>Features</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                          {platform.features.map(feature => (
                            <span key={feature} style={{ fontSize: 11, background: `${platform.color}15`, border: `1px solid ${platform.color}33`, color: platform.color, borderRadius: 20, padding: '2px 10px' }}>{feature}</span>
                          ))}
                        </div>
                        <div style={smallLabel}>Pricing</div>
                        <div style={{ fontSize: 13, color: '#ccc' }}>{platform.monthlyFee}</div>
                        {isConnected && (
                          <div style={{ marginTop: 14, display: 'grid', gap: 6 }}>
                            <div style={smallLabel}>Saved access</div>
                            {Object.entries(platform.connection?.maskedCredentials || {}).map(([key, value]) => (
                              <div key={key} style={{ color: 'var(--text-muted)', fontSize: 12 }}>{key.replace(/_/g, ' ')}: {value}</div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <div style={smallLabel}>{platform.apiAvailable ? 'Credentials' : 'Manual publishing access'}</div>
                        <div style={{ display: 'grid', gap: 9 }}>
                          {platform.credentialFields.map(field => (
                            <label key={field.key} style={{ display: 'grid', gap: 5, color: '#e5e7eb', fontSize: 12, fontWeight: 700 }}>
                              {field.label}{field.required ? ' *' : ''}
                              <input
                                type={field.type}
                                value={platformForm[field.key] || ''}
                                onChange={(event) => setForms(prev => ({ ...prev, [platform.id]: { ...(prev[platform.id] || {}), [field.key]: event.target.value } }))}
                                placeholder={isConnected ? 'Paste a new value to replace' : `Enter ${field.label.toLowerCase()}`}
                                style={inputStyle}
                              />
                            </label>
                          ))}
                          <label style={{ display: 'grid', gap: 5, color: '#e5e7eb', fontSize: 12, fontWeight: 700 }}>
                            Notes for Albert
                            <textarea
                              rows={3}
                              value={notes[platform.id] ?? platform.connection?.notes ?? ''}
                              onChange={(event) => setNotes(prev => ({ ...prev, [platform.id]: event.target.value }))}
                              placeholder="Add login notes, publishing limits, audience rules, or upload instructions."
                              style={{ ...inputStyle, resize: 'vertical' }}
                            />
                          </label>
                          <button onClick={() => savePlatform(platform)} disabled={saving === platform.id} style={{ ...solidButton, background: platform.color, borderColor: platform.color }}>
                            <CheckCircle2 size={14} />
                            {saving === platform.id ? 'Testing...' : isConnected ? 'Update & Test Connection' : 'Save & Test Connection'}
                          </button>
                          <div style={{ color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.45 }}>
                            Values are masked in AlbertOS and every credential exchange is logged for Albert/Hermes.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>

        <section style={panel}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Send size={15} style={{ color: '#a5b4fc' }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Publish Queue</span>
            <span style={{ fontSize: 11, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', borderRadius: 20, padding: '1px 8px' }}>0 pending</span>
          </div>
          <div style={emptyState}>
            {connected ? 'Content approved in the Studio will appear here for publishing.' : 'Connect a platform first, then approved Studio content will appear here.'}
          </div>
        </section>

        <section style={{ ...panel, marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Clock size={15} style={{ color: '#a5b4fc' }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Publish History</span>
          </div>
          <div style={emptyState}>
            No publishes yet. Successful publishes will be logged with platform, content, timestamp, and status.
          </div>
        </section>
      </main>
    </div>
  );
}

const stepBubble: React.CSSProperties = {
  width: 24,
  height: 24,
  background: 'rgba(99,102,241,0.2)',
  border: '1px solid rgba(99,102,241,0.4)',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 11,
  fontWeight: 700,
  color: '#a5b4fc',
  flexShrink: 0,
};

const ghostButton: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '8px 12px',
  color: '#c7d2fe',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 700,
};

const connectButton: React.CSSProperties = {
  display: 'inline-flex',
  justifyContent: 'center',
  border: '1px solid',
  borderRadius: 6,
  padding: '6px 14px',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 700,
  flexShrink: 0,
};

const solidButton: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  border: '1px solid',
  borderRadius: 7,
  padding: '8px 12px',
  color: '#fff',
  fontSize: 12,
  fontWeight: 800,
  cursor: 'pointer',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid var(--border)',
  borderRadius: 7,
  padding: '8px 10px',
  color: '#e5e5e5',
  fontSize: 13,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  outline: 'none',
};

const smallLabel: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--text-muted)',
  marginBottom: 8,
  fontWeight: 800,
  textTransform: 'uppercase',
};

const panel: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '16px 20px',
  marginBottom: 20,
};

const emptyState: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--text-muted)',
  padding: '20px 0',
  textAlign: 'center',
};
