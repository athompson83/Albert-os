'use client';
import { useState, useRef, useEffect } from 'react';
import TopBar from '@/components/TopBar';
import { Send } from 'lucide-react';

type Message = { id: string; role: 'user' | 'assistant'; content: string; time: string };

const initial: Message[] = [
  { id: '1', role: 'assistant', content: "Hey Adam 🎩 I'm Albert — your personal AI. What do you need?", time: '2:30 PM' },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initial);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: input }) });
      const data = await res.json();
      setMessages(m => [...m, { id: Date.now().toString() + 'a', role: 'assistant', content: data.reply || "Got it. Working on it.", time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }]);
    } catch {
      setMessages(m => [...m, { id: Date.now().toString() + 'e', role: 'assistant', content: "I'm having trouble connecting right now. Try again in a moment.", time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopBar title="Chat with Albert" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.map(m => (
          <div key={m.id} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '70%' }}>
              {m.role === 'assistant' && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>🎩 Albert · {m.time}</div>}
              <div style={{ padding: '10px 14px', borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: m.role === 'user' ? 'var(--primary)' : 'var(--surface)', border: m.role === 'assistant' ? '1px solid var(--border)' : 'none', color: '#e5e5e5', fontSize: 14, lineHeight: 1.5 }}>
                {m.content}
              </div>
              {m.role === 'user' && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>{m.time}</div>}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex' }}>
            <div style={{ padding: '10px 14px', borderRadius: '12px 12px 12px 2px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 14 }}>
              Albert is thinking...
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', gap: 10 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Message Albert..."
          style={{ flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 14, outline: 'none' }}
        />
        <button onClick={send} disabled={loading || !input.trim()} style={{ background: 'var(--primary)', border: 'none', borderRadius: 8, padding: '10px 16px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, opacity: (!input.trim() || loading) ? 0.5 : 1 }}>
          <Send size={16} /> Send
        </button>
      </div>
    </div>
  );
}
