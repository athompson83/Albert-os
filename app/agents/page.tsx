'use client';

import { useEffect, useMemo, useState } from 'react';
import TopBar from '@/components/TopBar';

type Agent = {
  id: string;
  name: string;
  emoji: string;
  role: string;
  description: string;
  color: string;
  sessionId?: string;
  avatar?: string;
  contextFile?: string;
};

type AgentForm = {
  name: string;
  emoji: string;
  role: string;
  description: string;
  color: string;
  sessionId: string;
};

const initialForm: AgentForm = {
  name: '',
  emoji: '🤖',
  role: '',
  description: '',
  color: '#6366f1',
  sessionId: '',
};

function Avatar({ agent }: { agent: Agent }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      style={{
        width: 96,
        height: 96,
        borderRadius: '50%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 40,
        background: agent.color || 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      {agent.avatar && !imgError ? (
        <img
          src={agent.avatar}
          alt={agent.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setImgError(true)}
        />
      ) : (
        <span>{agent.emoji || '🤖'}</span>
      )}
    </div>
  );
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Agent | null>(null);
  const [form, setForm] = useState<AgentForm>(initialForm);
  const [context, setContext] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');

  const modalTitle = useMemo(() => (editing ? `Edit ${editing.name}` : 'New Agent'), [editing]);

  async function loadAgents() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/agents', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      console.log('Agents response:', data);
      if (Array.isArray(data?.agents) && data.agents.length > 0) {
        setAgents(data.agents);
      } else if (data?.error) {
        throw new Error(data.error);
      } else {
        // Fallback: proxy might be offline, show helpful message
        setError('Could not load agents — proxy may be offline. Make sure the Albert proxy is running.');
        setAgents([]);
      }
    } catch (e) {
      console.error('loadAgents error:', e);
      setError(`Failed to load agents: ${String(e)}`);
      setAgents([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadAgents();
  }, []);

  async function openCreate() {
    setEditing(null);
    setForm(initialForm);
    setContext('');
    setAvatarFile(null);
    setError('');
    setOpen(true);
  }

  async function openEdit(agent: Agent) {
    setEditing(agent);
    setForm({
      name: agent.name || '',
      emoji: agent.emoji || '🤖',
      role: agent.role || '',
      description: agent.description || '',
      color: agent.color || '#6366f1',
      sessionId: agent.sessionId || '',
    });
    setAvatarFile(null);
    setError('');
    try {
      const res = await fetch(`/api/agents/${agent.id}/context`, { cache: 'no-store' });
      const data = await res.json();
      setContext(data?.content || '');
    } catch {
      setContext('');
    }
    setOpen(true);
  }

  async function uploadAvatar(agentId: string) {
    if (!avatarFile) return;
    const fd = new FormData();
    fd.append('file', avatarFile);
    const res = await fetch(`/api/agents/${agentId}/avatar`, {
      method: 'POST',
      body: fd,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Avatar upload failed: ${text}`);
    }
  }

  async function saveAgent() {
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      let agentId = editing?.id || '';

      if (editing) {
        const res = await fetch(`/api/agents/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Failed to update agent');
        }
      } else {
        const res = await fetch('/api/agents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to create agent');
        agentId = data?.agent?.id;
      }

      if (!agentId) throw new Error('Missing agent id after save');

      await fetch(`/api/agents/${agentId}/context`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: context }),
      });

      if (avatarFile) {
        await uploadAvatar(agentId);
      }

      setOpen(false);
      await loadAgents();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setSaving(false);
  }

  async function deleteAgent(agent: Agent) {
    if (!confirm(`Delete ${agent.name}?`)) return;
    try {
      const res = await fetch(`/api/agents/${agent.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to delete agent');
      }
      await loadAgents();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', color: 'var(--text)' }}>
      <TopBar title="Agents" />

      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Manage all registered agents dynamically.</div>
          <button
            onClick={openCreate}
            style={{
              background: 'var(--primary)',
              color: '#fff',
              border: '1px solid var(--primary)',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            + New Agent
          </button>
        </div>

        {error && (
          <div style={{ marginBottom: 16, color: '#fca5a5', fontSize: 13, border: '1px solid #7f1d1d', padding: 14, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span>⚠️ {error}</span>
            <button onClick={loadAgents} style={{ background: '#7f1d1d', border: 'none', borderRadius: 6, padding: '6px 12px', color: '#fca5a5', cursor: 'pointer', fontSize: 12, flexShrink: 0 }}>Retry</button>
          </div>
        )}

        {loading ? (
          <div style={{ color: 'var(--text-muted)', padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>⏳</div>
            Loading agents...
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 16,
            }}
          >
            {agents.map((agent) => (
              <div
                key={agent.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <Avatar agent={agent} />
                <div style={{ fontWeight: 700, fontSize: 17, textAlign: 'center' }}>{agent.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>{agent.role}</div>
                <div style={{ color: 'var(--text)', fontSize: 14, textAlign: 'center', minHeight: 42 }}>{agent.description}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  <button
                    onClick={() => openEdit(agent)}
                    style={{
                      background: 'transparent',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: '7px 12px',
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteAgent(agent)}
                    style={{
                      background: 'transparent',
                      color: '#fca5a5',
                      border: '1px solid #7f1d1d',
                      borderRadius: 8,
                      padding: '7px 12px',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 120,
          }}
          onClick={() => {
            if (!saving) setOpen(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 700,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: 16,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{modalTitle}</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 10 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                Name
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', color: 'var(--text)' }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                Emoji
                <input
                  value={form.emoji}
                  onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', color: 'var(--text)' }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                Role
                <input
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', color: 'var(--text)' }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                Session ID
                <input
                  value={form.sessionId}
                  onChange={(e) => setForm((f) => ({ ...f, sessionId: e.target.value }))}
                  placeholder="agent-your-id"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', color: 'var(--text)' }}
                />
              </label>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, marginBottom: 10 }}>
              Description
              <input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', color: 'var(--text)' }}
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 10 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                Color
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 4, height: 40 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                Avatar Upload
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, color: 'var(--text)' }}
                />
              </label>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, marginBottom: 12 }}>
              Context
              <textarea
                rows={6}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 10, color: 'var(--text)', resize: 'vertical' }}
              />
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setOpen(false)}
                disabled={saving}
                style={{
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveAgent}
                disabled={saving}
                style={{
                  background: 'var(--primary)',
                  color: '#fff',
                  border: '1px solid var(--primary)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Saving...' : 'Save Agent'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
