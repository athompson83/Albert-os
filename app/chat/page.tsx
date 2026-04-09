'use client';
import { useState, useRef, useEffect } from 'react';
import TopBar from '@/components/TopBar';
import { Send, RotateCcw } from 'lucide-react';

const ERROR_PHRASES = ["I'm having a moment", "having trouble connecting", "try again", "I had a moment"];

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
  isError?: boolean;
  retryText?: string; // the user message to retry
};

const initial: Message[] = [
  { id: '1', role: 'assistant', content: "Hey Adam 🎩 I'm Albert — your personal AI. What do you need?", time: '2:30 PM' },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initial);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const callChat = async (text: string): Promise<string> => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    });
    const data = await res.json();
    return data.reply || 'Got it.';
  };

  const isErrorReply = (text: string) =>
    ERROR_PHRASES.some(p => text.toLowerCase().includes(p.toLowerCase()));

  const send = async (overrideText?: string) => {
    const text = overrideText ?? input;
    if (!text.trim() || loading) return;

    if (!overrideText) {
      // Normal send — add user bubble
      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: text,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(m => [...m, userMsg]);
      setInput('');
    } else {
      // Retry — remove the old error bubble first
      setMessages(m => m.filter(msg => !(msg.isError && msg.retryText === text)));
    }

    setLoading(true);
    try {
      const reply = await callChat(text);
      const isError = isErrorReply(reply);
      setMessages(m => [...m, {
        id: Date.now().toString() + 'a',
        role: 'assistant',
        content: reply,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        isError,
        retryText: isError ? text : undefined,
      }]);
    } catch {
      setMessages(m => [...m, {
        id: Date.now().toString() + 'e',
        role: 'assistant',
        content: "I'm having trouble connecting. Tap retry to resend.",
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        isError: true,
        retryText: text,
      }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopBar title="Chat with Albert" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.map(m => (
          <div key={m.id} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '78%' }}>
              {m.role === 'assistant' && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>🎩 Albert · {m.time}</div>
              )}
              <div style={{
                padding: '10px 14px',
                borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: m.role === 'user' ? 'var(--primary)' : m.isError ? 'rgba(239,68,68,0.08)' : 'var(--surface)',
                border: m.role === 'assistant' ? `1px solid ${m.isError ? 'rgba(239,68,68,0.3)' : 'var(--border)'}` : 'none',
                color: m.isError ? '#fca5a5' : '#e5e5e5',
                fontSize: 14,
                lineHeight: 1.55,
              }}>
                {m.content}
              </div>
              {/* Retry button on error messages */}
              {m.isError && m.retryText && (
                <button
                  onClick={() => send(m.retryText)}
                  disabled={loading}
                  style={{
                    marginTop: 6,
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: 'transparent',
                    border: '1px solid rgba(239,68,68,0.4)',
                    borderRadius: 20,
                    padding: '4px 10px',
                    color: '#fca5a5',
                    fontSize: 12,
                    cursor: 'pointer',
                    opacity: loading ? 0.5 : 1,
                  }}
                >
                  <RotateCcw size={12} /> Retry
                </button>
              )}
              {m.role === 'user' && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>{m.time}</div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex' }}>
            <div style={{ padding: '10px 16px', borderRadius: '16px 16px 16px 4px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ letterSpacing: 2 }}>●●●</span> Albert is thinking...
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Message Albert..."
          style={{ flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 24, padding: '12px 18px', color: 'var(--text)', fontSize: 16, outline: 'none' }}
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          style={{ background: 'var(--primary)', border: 'none', borderRadius: '50%', width: 48, height: 48, minWidth: 48, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (!input.trim() || loading) ? 0.5 : 1 }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
