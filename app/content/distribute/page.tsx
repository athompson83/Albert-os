'use client';

import { useState } from 'react';
import TopBar from '@/components/TopBar';
import { AlertCircle, CheckCircle2, Clock, Globe, Zap, Send, ChevronDown, ChevronUp } from 'lucide-react';

const PLATFORMS = [
  {
    name: 'Teachable',
    color: '#3b82f6',
    description: 'Full REST API — courses, lectures, quizzes, enrollment',
    features: ['Courses', 'Quizzes', 'Memberships', 'Certificates'],
    apiAvailable: true,
    monthlyFee: '5% transaction fee',
  },
  {
    name: 'Thinkific',
    color: '#8b5cf6',
    description: 'REST API — chapters, lessons, student management',
    features: ['Courses', 'Bundles', 'Communities', 'Certificates'],
    apiAvailable: true,
    monthlyFee: 'From $0/mo',
  },
  {
    name: 'Kajabi',
    color: '#f59e0b',
    description: 'Products, pipelines, email automation',
    features: ['Courses', 'Memberships', 'Pipelines', 'Email'],
    apiAvailable: true,
    monthlyFee: 'From $149/mo',
  },
  {
    name: 'LearnWorlds',
    color: '#10b981',
    description: 'SCORM export — ideal for CE submissions',
    features: ['SCORM', 'Certificates', 'CE Tracking', 'eCommerce'],
    apiAvailable: true,
    monthlyFee: 'From $29/mo',
  },
  {
    name: 'Udemy',
    color: '#ef4444',
    description: '60M+ students — no API, package + upload workflow',
    features: ['Marketplace', 'Global Reach', 'Revenue Share', 'Reviews'],
    apiAvailable: false,
    monthlyFee: '37-63% revenue share',
  },
  {
    name: 'Skillshare',
    color: '#22c55e',
    description: 'Royalties per minute watched — short-form format',
    features: ['Royalties', 'Short Lessons', 'Projects', 'Community'],
    apiAvailable: false,
    monthlyFee: 'Per-minute royalties',
  },
];

const WORKFLOW_STEPS = [
  { step: '1', label: 'Connect Platforms', desc: 'Add API keys in Settings for each platform' },
  { step: '2', label: 'Create Content', desc: 'Build lessons in the Studio' },
  { step: '3', label: 'Select & Publish', desc: 'Choose content + platforms → one click' },
  { step: '4', label: 'Track Performance', desc: 'Analytics pull automatically' },
];

export default function DistributePage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopBar title="Distribution Hub" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', maxWidth: 1000, width: '100%', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Globe size={20} style={{ color: '#a5b4fc' }} />
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Distribution Hub</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
            Connect your platforms. Publish content once to all of them simultaneously.
          </p>
        </div>

        {/* Workflow steps */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#a5b4fc', marginBottom: 12 }}>How Publishing Works</div>
          <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap' }}>
            {WORKFLOW_STEPS.map((w, i) => (
              <div key={w.step} style={{ display: 'flex', alignItems: 'center', gap: 0, flex: '1 1 200px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px' }}>
                  <div style={{ width: 24, height: 24, background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#a5b4fc', flexShrink: 0 }}>{w.step}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{w.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{w.desc}</div>
                  </div>
                </div>
                {i < WORKFLOW_STEPS.length - 1 && <div style={{ color: 'var(--text-muted)', fontSize: 18, paddingRight: 4 }}>→</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Platform cards */}
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={15} style={{ color: '#a5b4fc' }} /> Platform Connections
          <span style={{ fontSize: 12, color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 20, padding: '2px 10px' }}>0 of 6 connected</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {PLATFORMS.map(p => {
            const isExpanded = expanded === p.name;
            return (
              <div key={p.name} style={{ background: 'var(--surface)', border: `1px solid ${isExpanded ? p.color + '44' : 'var(--border)'}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                {/* Card header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: 'pointer' }} onClick={() => setExpanded(isExpanded ? null : p.name)}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 600 }}>{p.name}</span>
                      {p.apiAvailable ? (
                        <span style={{ fontSize: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', borderRadius: 20, padding: '1px 8px' }}>API Available</span>
                      ) : (
                        <span style={{ fontSize: 10, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', borderRadius: 20, padding: '1px 8px' }}>Package + Upload</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{p.description}</div>
                  </div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#ef4444' }}>
                    <AlertCircle size={12} /> Not Connected
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); setConnecting(p.name); }}
                    style={{ background: `${p.color}22`, border: `1px solid ${p.color}44`, borderRadius: 6, padding: '6px 14px', color: p.color, cursor: 'pointer', fontSize: 12, fontWeight: 600, flexShrink: 0 }}
                  >
                    {connecting === p.name ? 'Opening...' : 'Connect'}
                  </button>
                  {isExpanded ? <ChevronUp size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div style={{ padding: '0 18px 16px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ paddingTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>FEATURES</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {p.features.map(f => (
                            <span key={f} style={{ fontSize: 11, background: `${p.color}15`, border: `1px solid ${p.color}33`, color: p.color, borderRadius: 20, padding: '2px 10px' }}>{f}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>PRICING</div>
                        <div style={{ fontSize: 13, color: '#ccc' }}>{p.monthlyFee}</div>
                        {p.apiAvailable ? (
                          <div style={{ marginTop: 10 }}>
                            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>API KEY</label>
                            <input placeholder={`Paste ${p.name} API key...`} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', color: '#e5e5e5', fontSize: 12, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                            <button style={{ marginTop: 8, background: p.color, border: 'none', borderRadius: 6, padding: '6px 14px', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                              Save & Test Connection
                            </button>
                          </div>
                        ) : (
                          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                            No API available. Albert will generate a formatted package (ZIP + checklist) for manual upload.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Publish Queue */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Send size={15} style={{ color: '#a5b4fc' }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Publish Queue</span>
            <span style={{ fontSize: 11, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', borderRadius: 20, padding: '1px 8px' }}>0 pending</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>
            Content approved in the Studio will appear here for publishing. Connect a platform first.
          </div>
        </div>

        {/* Publish History */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Clock size={15} style={{ color: '#a5b4fc' }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Publish History</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>
            No publishes yet. All successful publishes will be logged here with platform, content, timestamp, and status.
          </div>
        </div>

      </div>
    </div>
  );
}
