'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import TopBar from '@/components/TopBar';
import AgentPanel, { type Agent } from '@/components/AgentPanel';
import AgentSwitcher from '@/components/AgentSwitcher';
import { Send, RotateCcw, Paperclip, X, History, ChevronDown } from 'lucide-react';

const PROXY = process.env.NEXT_PUBLIC_PROXY_URL || 'https://legwork-brisket-anyplace.ngrok-free.dev';
const ERROR_PHRASES = ['having a moment', 'having trouble', 'try again', 'had a moment'];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const DEFAULT_AGENTS: Agent[] = [
  {
    id: 'albert',
    name: 'Albert',
    emoji: '🎩',
    role: 'Orchestrator',
    description: 'Main agent. Routes to specialists.',
    color: '#6366f1',
    isDefault: true,
    sessionId: 'albert-os-web',
  },
  {
    id: 'assemble',
    name: 'Assemble',
    emoji: '📋',
    role: 'Event & Training Platform',
    description: 'Assemble SaaS — courses, certs, revenue.',
    color: '#10b981',
    sessionId: 'agent-assemble',
  },
  {
    id: 'sentinelqa',
    name: 'SentinelQA',
    emoji: '🛡️',
    role: 'Clinical Quality Platform',
    description: 'CQS/CQI scoring, QA workflows, EMS outcomes.',
    color: '#ef4444',
    sessionId: 'agent-sentinelqa',
  },
  {
    id: 'apex360',
    name: 'APEx360',
    emoji: '📊',
    role: 'Evaluation & Scheduling',
    description: 'Evals, FTO tracking, Aladtec integration.',
    color: '#f59e0b',
    sessionId: 'agent-apex360',
  },
  {
    id: 'ai-business',
    name: 'Operator',
    emoji: '🚀',
    role: 'AI Business & Automation',
    description: 'Content automation, affiliate, revenue ops.',
    color: '#8b5cf6',
    sessionId: 'agent-ai-business',
  },
];

type Attachment = { name: string; url: string; type: string; size: number };
type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  time: string;
  isError?: boolean;
  retryText?: string;
  attachments?: Attachment[];
  project?: string;
  agentId?: string;
  agentName?: string;
  agentEmoji?: string;
};
type HistoryEntry = {
  id: string;
  timestamp: string;
  user: string;
  albert: string;
  project: string;
  attachments?: Attachment[];
};

type MentionState = {
  open: boolean;
  query: string;
  start: number;
  end: number;
};

const initial: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: "Hey Adam 🎩 I'm Albert — your personal AI. What do you need?",
    time: '2:30 PM',
    agentId: 'albert',
    agentName: 'Albert',
    agentEmoji: '🎩',
  },
];

async function callChat(
  text: string,
  attachments: Attachment[],
  agentId: string,
  attempt = 1,
): Promise<{ reply: string; project: string }> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: text, attachments, agentId }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const reply: string = data.reply || 'Got it.';
  const isErr = ERROR_PHRASES.some((p) => reply.toLowerCase().includes(p));
  if (isErr && attempt < 3) {
    await sleep(2000 * attempt);
    return callChat(text, attachments, agentId, attempt + 1);
  }
  return { reply, project: data.project || 'General' };
}

async function uploadFile(file: File): Promise<Attachment | null> {
  const form = new FormData();
  form.append('file', file);
  try {
    const res = await fetch(`${PROXY}/upload`, {
      method: 'POST',
      body: form,
      headers: { 'ngrok-skip-browser-warning': 'true' },
    });
    const data = await res.json();
    return data.files?.[0] || null;
  } catch {
    return null;
  }
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initial);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [agents, setAgents] = useState<Agent[]>(DEFAULT_AGENTS);
  const [activeAgentId, setActiveAgentId] = useState('albert');
  const [mention, setMention] = useState<MentionState>({ open: false, query: '', start: -1, end: -1 });

  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let cancelled = false;

    async function loadAgents() {
      try {
        const res = await fetch('/api/agents');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled && Array.isArray(data?.agents) && data.agents.length) {
          setAgents(data.agents);
        }
      } catch {
        if (!cancelled) {
          setAgents(DEFAULT_AGENTS);
        }
      }
    }

    loadAgents();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeAgent = useMemo(
    () => agents.find((agent) => agent.id === activeAgentId) || agents[0] || DEFAULT_AGENTS[0],
    [agents, activeAgentId],
  );

  const appendSwitchMessage = useCallback((agent: Agent) => {
    setMessages((m) => [
      ...m,
      {
        id: `${Date.now()}s`,
        role: 'system',
        content: `— switched to ${agent.emoji} ${agent.name} —`,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        agentId: agent.id,
      },
    ]);
  }, []);

  const switchAgent = useCallback(
    (agentId: string) => {
      if (agentId === activeAgentId) return;
      const next = agents.find((a) => a.id === agentId);
      if (!next) return;
      setActiveAgentId(next.id);
      appendSwitchMessage(next);
      setMention({ open: false, query: '', start: -1, end: -1 });
    },
    [activeAgentId, agents, appendSwitchMessage],
  );

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${PROXY}/chats`, { headers: { 'ngrok-skip-browser-warning': 'true' } });
      const data = await res.json();
      setHistory((data.chats || []).reverse());
    } catch {
      setHistory([]);
    }
    setHistoryLoading(false);
  }, []);

  const toggleHistory = () => {
    setShowHistory((s) => {
      if (!s) loadHistory();
      return !s;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    const uploaded: Attachment[] = [];
    for (const f of files) {
      const att = await uploadFile(f);
      if (att) uploaded.push(att);
    }
    setAttachments((a) => [...a, ...uploaded]);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeAttachment = (url: string) => setAttachments((a) => a.filter((f) => f.url !== url));

  const send = useCallback(
    async (overrideText?: string, overrideAttachments?: Attachment[]) => {
      const text = (overrideText ?? input).trim();
      const atts = overrideAttachments ?? attachments;
      if (!text || loading) return;
      const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const selectedAgent = agents.find((a) => a.id === activeAgentId) || activeAgent;

      if (!overrideText) {
        setMessages((m) => [...m, { id: Date.now().toString(), role: 'user', content: text, time: timeStr, attachments: atts }]);
        setInput('');
        setAttachments([]);
      } else {
        setMessages((m) => m.filter((msg) => !(msg.isError && msg.retryText === text)));
      }

      setLoading(true);
      try {
        const { reply, project } = await callChat(text, atts, selectedAgent.id);
        const isError = ERROR_PHRASES.some((p) => reply.toLowerCase().includes(p));
        setMessages((m) => [
          ...m,
          {
            id: `${Date.now()}r`,
            role: 'assistant',
            content: reply,
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            isError,
            retryText: isError ? text : undefined,
            project,
            agentId: selectedAgent.id,
            agentName: selectedAgent.name,
            agentEmoji: selectedAgent.emoji,
          },
        ]);
      } catch {
        setMessages((m) => [
          ...m,
          {
            id: `${Date.now()}e`,
            role: 'assistant',
            content: "Couldn't reach me — tap Retry.",
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            isError: true,
            retryText: text,
            agentId: selectedAgent.id,
            agentName: selectedAgent.name,
            agentEmoji: selectedAgent.emoji,
          },
        ]);
      }
      setLoading(false);
    },
    [input, loading, attachments, agents, activeAgentId, activeAgent],
  );

  const isImage = (type: string) => type.startsWith('image/');

  const updateMention = useCallback((value: string, caret: number | null) => {
    if (caret === null) {
      setMention({ open: false, query: '', start: -1, end: -1 });
      return;
    }

    const before = value.slice(0, caret);
    const atIndex = before.lastIndexOf('@');
    if (atIndex === -1) {
      setMention({ open: false, query: '', start: -1, end: -1 });
      return;
    }

    const charBefore = atIndex > 0 ? before[atIndex - 1] : ' ';
    if (!/\s/.test(charBefore)) {
      setMention({ open: false, query: '', start: -1, end: -1 });
      return;
    }

    const query = before.slice(atIndex + 1);
    if (/\s/.test(query)) {
      setMention({ open: false, query: '', start: -1, end: -1 });
      return;
    }

    setMention({ open: true, query, start: atIndex, end: caret });
  }, []);

  const mentionAgents = useMemo(() => {
    if (!mention.open) return [];
    const q = mention.query.toLowerCase();
    return agents.filter((a) => !q || a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q));
  }, [mention, agents]);

  const handleMentionSelect = useCallback(
    (agent: Agent) => {
      if (!mention.open || mention.start < 0 || mention.end < 0) return;
      const prefix = input.slice(0, mention.start);
      const suffix = input.slice(mention.end);
      const inserted = `@${agent.name} `;
      const nextValue = `${prefix}${inserted}${suffix}`;
      setInput(nextValue);
      setMention({ open: false, query: '', start: -1, end: -1 });

      setTimeout(() => {
        if (!inputRef.current) return;
        const cursor = prefix.length + inserted.length;
        inputRef.current.focus();
        inputRef.current.setSelectionRange(cursor, cursor);
      }, 0);

      switchAgent(agent.id);
    },
    [mention, input, switchAgent],
  );

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <AgentPanel agents={agents} activeAgentId={activeAgentId} onSelect={switchAgent} onAddAgent={() => {}} />

      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', flex: 1, minWidth: 0 }}>
        <TopBar title="Chat with Albert" />
        <AgentSwitcher agents={agents} activeAgentId={activeAgentId} onSelect={switchAgent} />

        {/* History Panel */}
        <div style={{ borderBottom: showHistory ? '1px solid var(--border)' : 'none', background: 'var(--surface)' }}>
          <button
            onClick={toggleHistory}
            style={{
              width: '100%',
              padding: '8px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--border)',
              color: 'var(--text-muted)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <History size={14} /> Chat History{' '}
            <ChevronDown
              size={14}
              style={{ marginLeft: 'auto', transform: showHistory ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            />
          </button>
          {showHistory && (
            <div style={{ maxHeight: 220, overflowY: 'auto', padding: '8px 12px' }}>
              {historyLoading && <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 8 }}>Loading...</div>}
              {!historyLoading && history.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 8 }}>No history yet today.</div>
              )}
              {history.map((h) => (
                <div
                  key={h.id}
                  onClick={() => {
                    setShowHistory(false);
                    setMessages((m) => [
                      ...m,
                      {
                        id: `${h.id}u`,
                        role: 'user',
                        content: h.user,
                        time: new Date(h.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                      },
                      {
                        id: `${h.id}a`,
                        role: 'assistant',
                        content: h.albert,
                        time: new Date(h.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                        project: h.project,
                        agentId: 'albert',
                        agentName: 'Albert',
                        agentEmoji: '🎩',
                      },
                    ]);
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 7,
                    marginBottom: 4,
                    cursor: 'pointer',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>
                    {new Date(h.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} · {h.project}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: '#e5e5e5',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h.user}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h.albert}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: m.role === 'user' ? 'flex-end' : m.role === 'system' ? 'center' : 'flex-start',
              }}
            >
              {m.role === 'assistant' && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                  {m.agentEmoji || '🎩'} {m.agentName || 'Albert'} · {m.time}
                  {m.project && m.project !== 'General' ? ` · ${m.project}` : ''}
                </div>
              )}

              {m.role === 'system' ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: 0.2 }}>{m.content}</div>
              ) : (
                <>
                  {/* Attachments */}
                  {m.attachments && m.attachments.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 6,
                        marginBottom: 6,
                        justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                      }}
                    >
                      {m.attachments.map((att) => (
                        <div key={att.url}>
                          {isImage(att.type) ? (
                            <img
                              src={`${PROXY}${att.url}`}
                              alt={att.name}
                              style={{ maxWidth: 200, maxHeight: 200, borderRadius: 10, objectFit: 'cover' }}
                            />
                          ) : (
                            <a
                              href={`${PROXY}${att.url}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 10px',
                                background: 'var(--surface)',
                                border: '1px solid var(--border)',
                                borderRadius: 8,
                                color: '#a5b4fc',
                                fontSize: 12,
                                textDecoration: 'none',
                              }}
                            >
                              📎 {att.name}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div
                    style={{
                      maxWidth: '78%',
                      padding: '11px 15px',
                      borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: m.role === 'user' ? 'var(--primary)' : m.isError ? 'rgba(239,68,68,0.08)' : 'var(--surface)',
                      border: m.role === 'assistant' ? `1px solid ${m.isError ? 'rgba(239,68,68,0.35)' : 'var(--border)'}` : 'none',
                      color: m.isError ? '#fca5a5' : '#e5e5e5',
                      fontSize: 14,
                      lineHeight: 1.55,
                    }}
                  >
                    {m.content}
                  </div>

                  {m.isError && m.retryText && (
                    <button
                      onClick={() => send(m.retryText, [])}
                      disabled={loading}
                      style={{
                        marginTop: 6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        background: 'transparent',
                        border: '1px solid rgba(239,68,68,0.4)',
                        borderRadius: 20,
                        padding: '5px 12px',
                        color: '#fca5a5',
                        fontSize: 12,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.5 : 1,
                      }}
                    >
                      <RotateCcw size={12} /> Retry
                    </button>
                  )}
                  {m.role === 'user' && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{m.time}</div>}
                </>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                {activeAgent?.emoji || '🎩'} {activeAgent?.name || 'Albert'}
              </div>
              <div
                style={{
                  padding: '11px 16px',
                  borderRadius: '16px 16px 16px 4px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ letterSpacing: 3 }}>●●●</span> thinking...
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div
            style={{
              padding: '8px 16px',
              borderTop: '1px solid var(--border)',
              background: 'var(--surface)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            {attachments.map((att) => (
              <div
                key={att.url}
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 8px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 20,
                  fontSize: 12,
                  color: 'var(--text-muted)',
                }}
              >
                {isImage(att.type) ? '🖼️' : '📎'} {att.name.slice(0, 20)}
                {att.name.length > 20 ? '…' : ''}
                <button
                  onClick={() => removeAttachment(att.url)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: 0,
                    display: 'flex',
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div
          style={{
            position: 'relative',
            padding: '10px 16px',
            borderTop: '1px solid var(--border)',
            background: 'var(--surface)',
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          {mention.open && mentionAgents.length > 0 && (
            <div
              style={{
                position: 'absolute',
                left: 56,
                right: 68,
                bottom: 62,
                zIndex: 50,
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                boxShadow: '0 8px 22px rgba(0,0,0,0.35)',
                maxHeight: 220,
                overflowY: 'auto',
              }}
            >
              {mentionAgents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => handleMentionSelect(agent)}
                  style={{
                    width: '100%',
                    border: 'none',
                    borderBottom: '1px solid var(--border)',
                    background: 'transparent',
                    color: '#e5e5e5',
                    textAlign: 'left',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: agent.color,
                      fontSize: 14,
                    }}
                  >
                    {agent.emoji}
                  </div>
                  <div>
                    <div style={{ fontSize: 13 }}>{agent.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{agent.role}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <input
            type="file"
            ref={fileRef}
            onChange={handleFileChange}
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt,.csv,.mp4,.mov"
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '50%',
              width: 40,
              height: 40,
              minWidth: 40,
              color: uploading ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Paperclip size={16} />
          </button>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => {
              const value = e.target.value;
              setInput(value);
              updateMention(value, e.target.selectionStart);
            }}
            onKeyDown={(e) => {
              if (mention.open && e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (mentionAgents[0]) {
                  handleMentionSelect(mentionAgents[0]);
                }
                return;
              }
              if (mention.open && e.key === 'Escape') {
                setMention({ open: false, query: '', start: -1, end: -1 });
                return;
              }
              if (e.key === 'Enter' && !e.shiftKey) send();
            }}
            placeholder={`Message ${activeAgent?.name || 'Albert'}...`}
            style={{
              flex: 1,
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 24,
              padding: '11px 18px',
              color: 'var(--text)',
              fontSize: 16,
              outline: 'none',
            }}
          />
          <button
            onClick={() => send()}
            disabled={loading || (!input.trim() && attachments.length === 0)}
            style={{
              background: 'var(--primary)',
              border: 'none',
              borderRadius: '50%',
              width: 44,
              height: 44,
              minWidth: 44,
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: !input.trim() || loading ? 0.5 : 1,
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
