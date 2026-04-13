'use client';

import { useState } from 'react';
import TopBar from '@/components/TopBar';
import Link from 'next/link';
import {
  BookOpen, Plus, Mic, Upload, BarChart3, Users, Globe, Zap,
  CheckCircle2, AlertCircle, ChevronRight, Layers, FileText,
  Brain, Tv
} from 'lucide-react';

const PLATFORMS = [
  { name: 'Teachable', color: '#3b82f6', description: 'Courses + memberships' },
  { name: 'Thinkific', color: '#8b5cf6', description: 'Flexible course builder' },
  { name: 'Kajabi', color: '#f59e0b', description: 'All-in-one platform' },
  { name: 'LearnWorlds', color: '#10b981', description: 'SCORM + CE support' },
  { name: 'Udemy', color: '#ef4444', description: 'Marketplace, 60M students' },
  { name: 'Skillshare', color: '#22c55e', description: 'Short-form, royalties' },
];

const WORKFLOWS = [
  { icon: <FileText size={14} />, label: 'Create Lesson', sub: 'Text, video, ECG blocks', href: '/content/studio' },
  { icon: <Brain size={14} />, label: 'AI Generate', sub: 'Quiz, study guide, case study', href: '/content/studio' },
  { icon: <Globe size={14} />, label: 'Publish Everywhere', sub: 'One click → 6 platforms', href: '/content/distribute' },
  { icon: <BarChart3 size={14} />, label: 'Track Revenue', sub: 'Unified analytics', href: '/content' },
];

export default function ContentPage() {
  const [connecting, setConnecting] = useState<string | null>(null);

  const stats = [
    { label: 'Courses', value: '0', icon: <Layers size={16} />, color: '#a5b4fc' },
    { label: 'AI Assets', value: '0', icon: <Brain size={16} />, color: '#10b981' },
    { label: 'Platforms', value: '0/6', icon: <Globe size={16} />, color: '#f59e0b' },
    { label: 'Students', value: '0', icon: <Users size={16} />, color: '#60a5fa' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopBar title="Content Command" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', maxWidth: 1100, width: '100%', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <BookOpen size={22} style={{ color: '#a5b4fc' }} />
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Content Command System</h1>
            <span style={{ fontSize: 11, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc', borderRadius: 20, padding: '2px 10px', fontWeight: 600 }}>EMS + ECG Education</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
            Create once. Publish everywhere. Track everything.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: s.color, marginBottom: 8 }}>
                {s.icon}
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          <Link href="/content/studio" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#6366f1', border: 'none', borderRadius: 8, padding: '10px 18px', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none', cursor: 'pointer' }}>
            <Plus size={16} /> New Course
          </Link>
          <Link href="/content/studio" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 18px', color: '#e5e5e5', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
            <Mic size={16} style={{ color: '#10b981' }} /> Record Lesson
          </Link>
          <Link href="/content/library" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 18px', color: '#e5e5e5', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
            <Upload size={16} style={{ color: '#a5b4fc' }} /> Upload ECG
          </Link>
          <Link href="/content/distribute" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 18px', color: '#e5e5e5', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
            <Zap size={16} style={{ color: '#f59e0b' }} /> Publish All Pending
          </Link>
        </div>

        {/* How it works */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#a5b4fc', marginBottom: 12 }}>The Workflow</div>
          <div style={{ display: 'flex', gap: 0, alignItems: 'center', flexWrap: 'wrap' }}>
            {WORKFLOWS.map((w, i) => (
              <div key={w.label} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                <Link href={w.href} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 8, padding: '10px 14px', textDecoration: 'none', minWidth: 160 }}>
                  <div style={{ color: '#a5b4fc' }}>{w.icon}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#e5e5e5' }}>{w.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{w.sub}</div>
                  </div>
                </Link>
                {i < WORKFLOWS.length - 1 && <ChevronRight size={16} style={{ color: 'var(--text-muted)', margin: '0 4px', flexShrink: 0 }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Two column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Recent Content */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={15} style={{ color: '#a5b4fc' }} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Recent Content</span>
              </div>
              <Link href="/content/library" style={{ fontSize: 12, color: '#a5b4fc', textDecoration: 'none' }}>View all →</Link>
            </div>
            {/* Empty state */}
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📚</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No content yet</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                Create your first EMS lesson or upload an ECG to get started.
              </div>
              <Link href="/content/studio" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#6366f1', borderRadius: 8, padding: '8px 16px', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                <Plus size={14} /> Create First Lesson
              </Link>
            </div>
          </div>

          {/* Platform Status */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Globe size={15} style={{ color: '#a5b4fc' }} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Platform Connections</span>
              </div>
              <Link href="/content/distribute" style={{ fontSize: 12, color: '#a5b4fc', textDecoration: 'none' }}>Manage →</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PLATFORMS.map(p => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.description}</div>
                  </div>
                  <span style={{ fontSize: 11, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <AlertCircle size={11} /> Not Connected
                  </span>
                  <button
                    onClick={() => setConnecting(p.name)}
                    style={{ fontSize: 11, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)', borderRadius: 5, padding: '3px 10px', color: '#a5b4fc', cursor: 'pointer' }}
                  >
                    {connecting === p.name ? 'Opening...' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Queue placeholder */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Brain size={15} style={{ color: '#10b981' }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>AI Generation Queue</span>
            <span style={{ fontSize: 11, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', borderRadius: 20, padding: '1px 8px' }}>Ready</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>
            When you create lessons, Albert will auto-generate quizzes, study guides, and case studies here.
          </div>
        </div>

        {/* Revenue placeholder */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', marginTop: 20, marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Tv size={15} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Revenue Dashboard</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>
            Connect platforms to see unified revenue, enrollments, and completion rates across Teachable, Thinkific, Kajabi, and more.
          </div>
        </div>

      </div>
    </div>
  );
}
