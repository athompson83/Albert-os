'use client';

import { useState } from 'react';
import TopBar from '@/components/TopBar';
import {
  Type, Video, Mic, FileQuestion, FilePlus, FileText,
  ChevronDown, ChevronRight, Plus, Save, Eye, Brain,
  Layers, Stethoscope, Loader2, CheckCircle2, Settings,
  MicOff, Activity
} from 'lucide-react';

type BlockType = 'text' | 'video' | 'ecg' | 'quiz' | 'pdf' | 'case_study';
type AITool = 'quiz' | 'study_guide' | 'flashcards' | 'case_study' | 'instructor_notes';

interface Block {
  id: string;
  type: BlockType;
  content: string;
}

const BLOCK_TYPES: { type: BlockType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'text', label: 'Text', icon: <Type size={14} />, color: '#a5b4fc' },
  { type: 'video', label: 'Video', icon: <Video size={14} />, color: '#60a5fa' },
  { type: 'ecg', label: 'ECG Image', icon: <Activity size={14} />, color: '#10b981' },
  { type: 'quiz', label: 'Quiz Block', icon: <FileQuestion size={14} />, color: '#f59e0b' },
  { type: 'pdf', label: 'PDF / Doc', icon: <FilePlus size={14} />, color: '#a78bfa' },
  { type: 'case_study', label: 'Case Study', icon: <Stethoscope size={14} />, color: '#f87171' },
];

const AI_TOOLS: { type: AITool; label: string; sub: string; color: string }[] = [
  { type: 'quiz', label: 'Generate Quiz', sub: '10 NREMT-style questions', color: '#f59e0b' },
  { type: 'study_guide', label: 'Study Guide', sub: 'Key terms, pearls, summary', color: '#10b981' },
  { type: 'flashcards', label: 'Flashcard Deck', sub: 'Anki-compatible export', color: '#a5b4fc' },
  { type: 'case_study', label: 'Case Study', sub: 'Prehospital scenario + debrief', color: '#f87171' },
  { type: 'instructor_notes', label: 'Instructor Notes', sub: 'Facilitator guide', color: '#60a5fa' },
];

const MOCK_TREE = [
  {
    id: 'course-1', label: 'New Course', expanded: true,
    children: [
      { id: 'mod-1', label: 'Module 1: Introduction', expanded: true,
        children: [
          { id: 'les-1', label: 'Lesson 1 (active)', active: true },
          { id: 'les-2', label: 'Lesson 2' },
        ]
      },
    ]
  }
];

export default function StudioPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [activeTab, setActiveTab] = useState<'properties' | 'ai' | 'preview'>('properties');
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [aiLoading, setAiLoading] = useState<AITool | null>(null);
  const [aiResult, setAiResult] = useState<{ type: AITool; message: string } | null>(null);
  const [difficulty, setDifficulty] = useState('intermediate');
  const [previewPlatform, setPreviewPlatform] = useState('teachable');
  const [lessonTitle, setLessonTitle] = useState('');

  const addBlock = (type: BlockType) => {
    setBlocks(prev => [...prev, {
      id: `block-${Date.now()}`,
      type,
      content: type === 'text' ? 'Start typing your content here...' :
               type === 'ecg' ? 'ECG image + interpretation panel' :
               type === 'video' ? 'Video URL or upload' :
               type === 'case_study' ? 'Case study content...' :
               type === 'quiz' ? 'Quiz questions will appear here' : 'PDF content',
    }]);
  };

  const startDictation = () => {
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      setTranscribing(true);
      setTimeout(() => {
        setTranscribing(false);
        setBlocks(prev => [...prev, {
          id: `block-${Date.now()}`,
          type: 'text',
          content: 'This is a sample transcription of your dictated content. Albert is listening for EMS terminology and clinical language. The full lesson would appear here after processing...',
        }]);
      }, 2000);
    }, 3000);
  };

  const runAI = async (type: AITool) => {
    setAiLoading(type);
    setAiResult(null);
    try {
      const r = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, contentId: 'les-1', prompt: '' }),
      });
      const d = await r.json();
      setAiResult({ type, message: d.message || 'Generated successfully' });
    } catch {
      setAiResult({ type, message: 'Error — check connection' });
    }
    setAiLoading(null);
  };

  const blockColor = (type: BlockType) => BLOCK_TYPES.find(b => b.type === type)?.color || '#a5b4fc';
  const blockIcon = (type: BlockType) => BLOCK_TYPES.find(b => b.type === type)?.icon;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopBar title="Content Studio" />

      {/* Top toolbar */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 4 }}>Add block:</span>
        {BLOCK_TYPES.map(b => (
          <button key={b.type} onClick={() => addBlock(b.type)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,0.2)', border: `1px solid ${b.color}33`, borderRadius: 6, padding: '5px 10px', color: b.color, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
            {b.icon} {b.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {/* Dictate button */}
        <button
          onClick={startDictation}
          disabled={recording || transcribing}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: recording ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.15)', border: `1px solid ${recording ? '#ef4444' : '#10b981'}55`, borderRadius: 6, padding: '5px 14px', color: recording ? '#ef4444' : '#10b981', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
        >
          {recording ? <MicOff size={14} /> : transcribing ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Mic size={14} />}
          {recording ? 'Recording... (click to stop)' : transcribing ? 'Transcribing...' : 'Dictate'}
        </button>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#6366f1', border: 'none', borderRadius: 6, padding: '5px 14px', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
          <Save size={14} /> Save
        </button>
      </div>

      {/* Three panel layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left: Course tree */}
        <div style={{ width: 220, background: 'var(--surface)', borderRight: '1px solid var(--border)', overflowY: 'auto', flexShrink: 0 }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>COURSE STRUCTURE</span>
            <button style={{ background: 'transparent', border: 'none', color: '#a5b4fc', cursor: 'pointer' }}><Plus size={14} /></button>
          </div>
          {MOCK_TREE.map(course => (
            <div key={course.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}>
                <Layers size={13} style={{ color: '#a5b4fc' }} />
                <span style={{ fontSize: 13, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course.label}</span>
                <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
              </div>
              {course.children?.map(mod => (
                <div key={mod.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px 8px 24px', cursor: 'pointer' }}>
                    <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: 12, fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#ccc' }}>{mod.label}</span>
                  </div>
                  {mod.children?.map(les => (
                    <div key={les.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px 7px 36px', background: (les as {active?: boolean}).active ? 'rgba(99,102,241,0.15)' : 'transparent', cursor: 'pointer', borderLeft: (les as {active?: boolean}).active ? '2px solid #6366f1' : '2px solid transparent' }}>
                      <FileText size={11} style={{ color: (les as {active?: boolean}).active ? '#a5b4fc' : 'var(--text-muted)', flexShrink: 0 }} />
                      <span style={{ fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: (les as {active?: boolean}).active ? '#e5e5e5' : 'var(--text-muted)' }}>{les.label}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
          <div style={{ padding: '10px 14px' }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: '1px dashed var(--border)', borderRadius: 6, padding: '6px 10px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, width: '100%' }}>
              <Plus size={12} /> Add Lesson
            </button>
          </div>
        </div>

        {/* Center: Editor */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#0d0d0d' }}>
          <input
            value={lessonTitle}
            onChange={e => setLessonTitle(e.target.value)}
            placeholder="Lesson title..."
            style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', padding: '8px 0', fontSize: 22, fontWeight: 700, color: '#e5e5e5', marginBottom: 24, outline: 'none', fontFamily: 'inherit' }}
          />

          {blocks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>✏️</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: '#ccc' }}>Add your first block</div>
              <div style={{ fontSize: 13, marginBottom: 20 }}>Use the toolbar above to add text, video, ECG images, or click Dictate to speak your lesson.</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {BLOCK_TYPES.slice(0, 3).map(b => (
                  <button key={b.type} onClick={() => addBlock(b.type)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface)', border: `1px solid ${b.color}44`, borderRadius: 8, padding: '8px 14px', color: b.color, cursor: 'pointer', fontSize: 13 }}>
                    {b.icon} {b.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {blocks.map((block, i) => (
                <div key={block.id} style={{ background: 'var(--surface)', border: `1px solid ${blockColor(block.type)}33`, borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: `${blockColor(block.type)}11`, borderBottom: `1px solid ${blockColor(block.type)}22` }}>
                    <span style={{ color: blockColor(block.type) }}>{blockIcon(block.type)}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: blockColor(block.type), textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {BLOCK_TYPES.find(b => b.type === block.type)?.label}
                    </span>
                    <div style={{ flex: 1 }} />
                    <button onClick={() => setBlocks(prev => prev.filter((_, j) => j !== i))} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11 }}>✕</button>
                  </div>
                  <div style={{ padding: '14px 16px' }}>
                    {block.type === 'ecg' ? (
                      <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ flex: 1, background: 'rgba(16,185,129,0.05)', border: '1px dashed rgba(16,185,129,0.3)', borderRadius: 8, padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                          Drop ECG image here or click to upload<br />
                          <span style={{ fontSize: 11, color: 'rgba(16,185,129,0.6)' }}>Supported: PDF, JPG, PNG</span>
                        </div>
                        <div style={{ width: 180, background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '12px 14px', fontSize: 11 }}>
                          <div style={{ fontWeight: 600, color: '#10b981', marginBottom: 8 }}>ECG Metadata</div>
                          <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Classification:</div>
                          <select style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '3px 6px', color: '#ccc', fontSize: 11, marginBottom: 8 }}>
                            <option>Select type...</option>
                            <option>STEMI Inferior</option>
                            <option>STEMI Anterior</option>
                            <option>Wellens Syndrome</option>
                            <option>LBBB</option>
                            <option>Hyperkalemia</option>
                          </select>
                          <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Difficulty:</div>
                          <select style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '3px 6px', color: '#ccc', fontSize: 11 }}>
                            <option>Basic</option>
                            <option>Intermediate</option>
                            <option>Advanced</option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      <textarea
                        defaultValue={block.content}
                        rows={4}
                        style={{ width: '100%', background: 'transparent', border: 'none', color: '#ccc', fontSize: 14, resize: 'vertical', fontFamily: 'inherit', outline: 'none', lineHeight: 1.6 }}
                      />
                    )}
                  </div>
                </div>
              ))}
              <button onClick={() => setBlocks(prev => [...prev, { id: `block-${Date.now()}`, type: 'text', content: '' }])} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: '1px dashed var(--border)', borderRadius: 8, padding: '12px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, justifyContent: 'center' }}>
                <Plus size={14} /> Add block
              </button>
            </div>
          )}
        </div>

        {/* Right: Properties / AI / Preview */}
        <div style={{ width: 280, background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            {(['properties', 'ai', 'preview'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: '10px 4px', background: 'transparent', border: 'none', borderBottom: activeTab === tab ? '2px solid #6366f1' : '2px solid transparent', color: activeTab === tab ? '#a5b4fc' : 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontWeight: activeTab === tab ? 600 : 400 }}>
                {tab === 'properties' ? '⚙️ Props' : tab === 'ai' ? '🧠 AI Tools' : '👁️ Preview'}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {activeTab === 'properties' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>LESSON TITLE</label>
                  <input value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} placeholder="e.g. Inferior STEMI Recognition" style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 10px', color: '#e5e5e5', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>DIFFICULTY</label>
                  <select value={difficulty} onChange={e => setDifficulty(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 10px', color: '#e5e5e5', fontSize: 13 }}>
                    <option value="basic">Basic — Medic Student</option>
                    <option value="intermediate">Intermediate — Field Medic</option>
                    <option value="advanced">Advanced — Critical Care</option>
                    <option value="expert">Expert — Medical Director</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>TOPIC TAGS</label>
                  <input placeholder="cardiac, STEMI, 12-lead..." style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 10px', color: '#e5e5e5', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>CERTIFICATION TYPE</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {['NREMT', 'ACLS', 'PALS', 'CCEMTP', 'State CE'].map(cert => (
                      <label key={cert} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#ccc', cursor: 'pointer' }}>
                        <input type="checkbox" /> {cert}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>LEARNING OBJECTIVES</label>
                  <textarea placeholder="Students will be able to..." rows={4} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 10px', color: '#e5e5e5', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, lineHeight: 1.5 }}>
                  Albert generates materials from your lesson content automatically.
                </div>
                {AI_TOOLS.map(tool => (
                  <div key={tool.type}>
                    <button
                      onClick={() => runAI(tool.type)}
                      disabled={!!aiLoading}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, background: `${tool.color}11`, border: `1px solid ${tool.color}33`, borderRadius: 8, padding: '10px 12px', color: tool.color, cursor: 'pointer', textAlign: 'left', opacity: aiLoading && aiLoading !== tool.type ? 0.5 : 1 }}
                    >
                      {aiLoading === tool.type ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} /> : <Brain size={14} style={{ flexShrink: 0 }} />}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{tool.label}</div>
                        <div style={{ fontSize: 11, opacity: 0.8 }}>{tool.sub}</div>
                      </div>
                    </button>
                    {aiResult?.type === tool.type && (
                      <div style={{ fontSize: 11, color: '#10b981', padding: '6px 10px', background: 'rgba(16,185,129,0.08)', borderRadius: '0 0 6px 6px', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={11} /> {aiResult.message}
                      </div>
                    )}
                  </div>
                ))}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>CUSTOM PROMPT</label>
                  <textarea placeholder='e.g. "Make quiz harder", "Convert to pediatric case"...' rows={3} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 10px', color: '#e5e5e5', fontSize: 12, fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box' }} />
                  <button style={{ marginTop: 8, width: '100%', background: '#6366f1', border: 'none', borderRadius: 6, padding: '7px', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Run Custom Prompt
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'preview' && (
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>PREVIEW AS</label>
                <select value={previewPlatform} onChange={e => setPreviewPlatform(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 10px', color: '#e5e5e5', fontSize: 13, marginBottom: 16 }}>
                  <option value="teachable">Teachable</option>
                  <option value="thinkific">Thinkific</option>
                  <option value="kajabi">Kajabi</option>
                  <option value="learnworlds">LearnWorlds</option>
                  <option value="udemy">Udemy</option>
                  <option value="skillshare">Skillshare</option>
                </select>
                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 16, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                  <Eye size={20} style={{ marginBottom: 8, opacity: 0.4 }} />
                  <div>Platform preview will show formatted content for {previewPlatform}.</div>
                  <div style={{ marginTop: 8, fontSize: 11 }}>Save your lesson to generate preview.</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
