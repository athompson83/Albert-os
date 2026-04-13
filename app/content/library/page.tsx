'use client';

import { useState } from 'react';
import TopBar from '@/components/TopBar';
import Link from 'next/link';
import { Search, Filter, Plus, BookOpen, Activity, FileQuestion, FileText, Brain, Video } from 'lucide-react';

const TYPES = ['All', 'Course', 'Module', 'Lesson', 'Quiz', 'ECG', 'Case Study', 'Study Guide'];
const TOPICS = ['Cardiac', 'Airway', 'Trauma', 'Pediatrics', 'Toxicology', 'OB', 'Neuro'];
const DIFFICULTIES = ['Basic', 'Intermediate', 'Advanced', 'Expert'];
const CERTIFICATIONS = ['NREMT', 'ACLS', 'PALS', 'CCEMTP', 'State CE'];

export default function LibraryPage() {
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('All');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopBar title="Content Library" />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Filter sidebar */}
        <div style={{ width: 200, background: 'var(--surface)', borderRight: '1px solid var(--border)', overflowY: 'auto', padding: '16px 14px', flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.05em' }}>TYPE</div>
          {TYPES.map(t => (
            <button key={t} onClick={() => setActiveType(t)} style={{ display: 'block', width: '100%', textAlign: 'left', background: activeType === t ? 'rgba(99,102,241,0.15)' : 'transparent', border: 'none', borderRadius: 6, padding: '6px 10px', color: activeType === t ? '#a5b4fc' : 'var(--text-muted)', cursor: 'pointer', fontSize: 13, marginBottom: 2, fontWeight: activeType === t ? 600 : 400 }}>
              {t}
            </button>
          ))}

          <div style={{ height: 1, background: 'var(--border)', margin: '14px 0' }} />
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.05em' }}>TOPIC</div>
          {TOPICS.map(t => (
            <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', marginBottom: 6 }}>
              <input type="checkbox" style={{ accentColor: '#6366f1' }} /> {t}
            </label>
          ))}

          <div style={{ height: 1, background: 'var(--border)', margin: '14px 0' }} />
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.05em' }}>DIFFICULTY</div>
          {DIFFICULTIES.map(d => (
            <label key={d} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', marginBottom: 6 }}>
              <input type="checkbox" style={{ accentColor: '#6366f1' }} /> {d}
            </label>
          ))}

          <div style={{ height: 1, background: 'var(--border)', margin: '14px 0' }} />
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.05em' }}>CERTIFICATION</div>
          {CERTIFICATIONS.map(c => (
            <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', marginBottom: 6 }}>
              <input type="checkbox" style={{ accentColor: '#6366f1' }} /> {c}
            </label>
          ))}
        </div>

        {/* Main content area */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {/* Search bar */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px' }}>
              <Search size={15} style={{ color: 'var(--text-muted)' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search lessons, ECGs, quizzes..."
                style={{ flex: 1, background: 'transparent', border: 'none', color: '#e5e5e5', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
            <Link href="/content/studio" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#6366f1', border: 'none', borderRadius: 8, padding: '8px 16px', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              <Plus size={14} /> New
            </Link>
          </div>

          {/* Empty state */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
            <div style={{ textAlign: 'center', maxWidth: 420 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📖</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Your Library is Empty</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
                Everything you create — lessons, ECGs, quizzes, case studies, generated study guides — lives here. Start by creating your first lesson in the Studio.
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/content/studio" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#6366f1', borderRadius: 8, padding: '10px 20px', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                  <Plus size={16} /> Create Lesson
                </Link>
                <Link href="/content/studio" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 18px', color: '#ccc', fontSize: 14, textDecoration: 'none' }}>
                  <Activity size={16} style={{ color: '#10b981' }} /> Upload ECG
                </Link>
              </div>

              {/* Quick content type cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 32 }}>
                {[
                  { icon: <BookOpen size={18} />, label: 'Lessons', color: '#a5b4fc' },
                  { icon: <Activity size={18} />, label: 'ECG Cases', color: '#10b981' },
                  { icon: <FileQuestion size={18} />, label: 'Quizzes', color: '#f59e0b' },
                  { icon: <FileText size={18} />, label: 'Study Guides', color: '#60a5fa' },
                  { icon: <Brain size={18} />, label: 'Case Studies', color: '#f87171' },
                  { icon: <Video size={18} />, label: 'Video Lessons', color: '#a78bfa' },
                ].map(item => (
                  <div key={item.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px', textAlign: 'center' }}>
                    <div style={{ color: item.color, marginBottom: 6 }}>{item.icon}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>0</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
