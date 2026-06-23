'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import { CheckCircle2, KeyRound, LockKeyhole, Plus, RefreshCw, Send, ShieldCheck } from 'lucide-react';
import TopBar from '@/components/TopBar';
import useIsMobile from '@/components/useIsMobile';

type Status = 'todo' | 'inprogress' | 'review' | 'done';

type CredentialField = {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url' | 'textarea';
  required?: boolean;
};

type CredentialTask = {
  id: string;
  title: string;
  description?: string;
  project?: string;
  priority: 'high' | 'medium' | 'low';
  status: Status;
  requestKind?: string;
  requestedFields?: CredentialField[];
  response?: Record<string, string>;
  notes?: string;
  archivedAt?: string;
  updatedAt?: string;
};

type Credential = {
  id: string;
  key: string;
  label: string;
  status: 'requested' | 'provided';
  requestedBy: string;
  updatedAt: string;
  maskedValue?: string;
};

type FormValues = Record<string, string>;

const emptyManual = {
  key: '',
  label: '',
  value: '',
  notes: '',
};

export default function CredentialsPage() {
  const isMobile = useIsMobile();
  const [tasks, setTasks] = useState<CredentialTask[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [values, setValues] = useState<FormValues>({});
  const [manual, setManual] = useState(emptyManual);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const selectedTask = useMemo(
    () => tasks.find(task => task.id === selectedTaskId) || tasks[0],
    [selectedTaskId, tasks],
  );

  const openRequests = tasks.filter(task => task.status !== 'done');
  const providedCount = credentials.filter(item => item.status === 'provided').length;

  const load = useCallback(async () => {
    setLoading(true);
    const [taskRes, credentialRes] = await Promise.all([
      fetch('/api/tasks'),
      fetch('/api/credentials'),
    ]);
    const taskData = await taskRes.json();
    const credentialData = await credentialRes.json();
    const credentialTasks = (taskData.tasks || [])
      .filter((task: CredentialTask) => task.requestKind === 'credential' && !task.archivedAt)
      .sort((a: CredentialTask, b: CredentialTask) => {
        const rank: Record<Status, number> = { todo: 0, inprogress: 1, review: 2, done: 3 };
        return rank[a.status] - rank[b.status];
      });
    setTasks(credentialTasks);
    setCredentials(credentialData.credentials || []);
    setSelectedTaskId(prev => prev || credentialTasks[0]?.id || '');
    setLoading(false);
  }, []);

  useEffect(() => {
    load().catch(() => {
      setNotice('Unable to load credentials right now.');
      setLoading(false);
    });
  }, [load]);

  useEffect(() => {
    if (!selectedTask) return;
    setValues(selectedTask.response || {});
  }, [selectedTask]);

  const saveTaskCredentials = async () => {
    if (!selectedTask) return;
    const missing = (selectedTask.requestedFields || []).filter(field => field.required && !values[field.key]?.trim());
    if (missing.length) {
      setNotice(`Still needed: ${missing.map(field => field.label).join(', ')}`);
      return;
    }

    setSaving(true);
    setNotice('');
    try {
      for (const field of selectedTask.requestedFields || []) {
        const value = values[field.key]?.trim();
        if (!value) continue;
        await fetch('/api/credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: field.key,
            label: field.label,
            value,
            requestedBy: 'Hermes',
          }),
        });
      }

      const response = Object.fromEntries(
        Object.entries(values).map(([key, value]) => [
          key,
          key === '__notes' ? value : value ? `${value.slice(0, 4)}...${value.slice(-4)}` : '',
        ]),
      );

      await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTask.id,
          status: 'review',
          response,
          notes: values.__notes || selectedTask.notes,
        }),
      });

      setNotice('Credentials sent to Hermes. The request is now in review.');
      await load();
    } finally {
      setSaving(false);
    }
  };

  const saveManualCredential = async () => {
    if (!manual.key.trim() || !manual.value.trim()) {
      setNotice('Add a credential name and value first.');
      return;
    }
    setSaving(true);
    setNotice('');
    try {
      await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: manual.key.trim(),
          label: manual.label.trim() || manual.key.trim(),
          value: manual.value,
          requestedBy: 'Adam',
        }),
      });
      setManual(emptyManual);
      setNotice('Credential saved and Hermes was updated.');
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Credentials" />

      <main style={{ flex: 1, padding: isMobile ? '18px 14px 32px' : '28px 44px 48px', maxWidth: 1240, width: '100%', margin: '0 auto' }}>
        <section style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16, justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'flex-start', marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, color: '#fff', fontSize: isMobile ? 24 : 30, lineHeight: 1.1 }}>Credential Center</h1>
            <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: 14, maxWidth: 660 }}>
              Handle access requests from Hermes without digging through chat or task history.
            </p>
          </div>
          <button onClick={() => load()} style={secondaryButton}>
            <RefreshCw size={15} />
            Refresh
          </button>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 18 }}>
          <MetricCard icon={<KeyRound size={20} />} label="Open requests" value={String(openRequests.length)} tone="#f59e0b" />
          <MetricCard icon={<ShieldCheck size={20} />} label="Provided" value={String(providedCount)} tone="#10b981" />
          <MetricCard icon={<LockKeyhole size={20} />} label="Storage view" value="Masked" tone="#60a5fa" />
        </section>

        {notice && (
          <div style={{ border: '1px solid rgba(99,102,241,0.35)', background: 'rgba(99,102,241,0.12)', color: '#c7d2fe', borderRadius: 8, padding: '10px 12px', marginBottom: 16, fontSize: 13 }}>
            {notice}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '360px minmax(0, 1fr)', gap: 16, alignItems: 'start' }}>
          <section style={panelStyle}>
            <div style={panelHeaderStyle}>
              <div>
                <h2 style={sectionTitle}>Hermes Requests</h2>
                <p style={sectionSubtle}>{loading ? 'Loading...' : `${openRequests.length} need Adam input`}</p>
              </div>
              <Link href="/tasks" style={textLink}>Tasks</Link>
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              {tasks.map(task => {
                const active = selectedTask?.id === task.id;
                return (
                  <button key={task.id} onClick={() => setSelectedTaskId(task.id)} style={{
                    ...requestButton,
                    borderColor: active ? '#6366f1' : 'var(--border)',
                    background: active ? 'rgba(99,102,241,0.16)' : 'var(--surface-2)',
                  }}>
                    <span style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                      <strong style={{ color: '#fff', fontSize: 13 }}>{task.title}</strong>
                      <span style={{ ...statusPill, color: task.status === 'review' ? '#fbbf24' : task.status === 'done' ? '#34d399' : '#fca5a5' }}>
                        {task.status}
                      </span>
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.35 }}>{task.description}</span>
                  </button>
                );
              })}

              {!loading && tasks.length === 0 && (
                <div style={{ border: '1px dashed var(--border)', borderRadius: 8, padding: 18, color: 'var(--text-muted)', fontSize: 13 }}>
                  No credential requests are waiting right now.
                </div>
              )}
            </div>
          </section>

          <section style={panelStyle}>
            {selectedTask ? (
              <>
                <div style={panelHeaderStyle}>
                  <div>
                    <h2 style={sectionTitle}>{selectedTask.title}</h2>
                    <p style={sectionSubtle}>{selectedTask.project || 'Hermes Credentials'}</p>
                  </div>
                  <span style={{ ...statusPill, color: '#fbbf24' }}>{selectedTask.priority}</span>
                </div>

                <p style={{ color: 'var(--text)', margin: '0 0 16px', fontSize: 14, lineHeight: 1.5 }}>{selectedTask.description}</p>

                <div style={{ display: 'grid', gap: 12 }}>
                  {(selectedTask.requestedFields || []).map(field => (
                    <CredentialInput
                      key={field.key}
                      field={field}
                      value={values[field.key] || ''}
                      onChange={(value) => setValues(prev => ({ ...prev, [field.key]: value }))}
                    />
                  ))}
                  <label style={labelStyle}>
                    Notes for Hermes
                    <textarea
                      rows={4}
                      value={values.__notes || ''}
                      onChange={(e) => setValues(prev => ({ ...prev, __notes: e.target.value }))}
                      placeholder="Add context, limits, login instructions, or anything Hermes should know."
                      style={inputStyle}
                    />
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
                  <Link href={`/tasks?task=${selectedTask.id}`} style={secondaryButton}>Open task</Link>
                  <button onClick={saveTaskCredentials} disabled={saving} style={primaryButton}>
                    <Send size={15} />
                    {saving ? 'Sending...' : 'Send to Hermes'}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Select a request or add a manual credential below.</div>
            )}
          </section>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16, marginTop: 16 }}>
          <section style={panelStyle}>
            <div style={panelHeaderStyle}>
              <div>
                <h2 style={sectionTitle}>Add Credential</h2>
                <p style={sectionSubtle}>For access Hermes needs before it creates a task.</p>
              </div>
              <Plus size={18} color="#a5b4fc" />
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              <label style={labelStyle}>
                Credential key
                <input value={manual.key} onChange={(e) => setManual(prev => ({ ...prev, key: e.target.value }))} placeholder="stripe_api_key" style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Display name
                <input value={manual.label} onChange={(e) => setManual(prev => ({ ...prev, label: e.target.value }))} placeholder="Stripe API Key" style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Secret value
                <input type="password" value={manual.value} onChange={(e) => setManual(prev => ({ ...prev, value: e.target.value }))} placeholder="Paste the credential here" style={inputStyle} />
              </label>
              <button onClick={saveManualCredential} disabled={saving} style={{ ...primaryButton, justifyContent: 'center' }}>
                <CheckCircle2 size={15} />
                Save credential
              </button>
            </div>
          </section>

          <section style={panelStyle}>
            <div style={panelHeaderStyle}>
              <div>
                <h2 style={sectionTitle}>Saved Credentials</h2>
                <p style={sectionSubtle}>Only masked values are shown here.</p>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {credentials.map(item => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: '#fff', fontWeight: 650, fontSize: 13 }}>{item.label}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12, overflowWrap: 'anywhere' }}>{item.key}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: item.status === 'provided' ? '#34d399' : '#fbbf24', fontSize: 12, fontWeight: 700 }}>{item.status}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{item.maskedValue || 'requested'}</div>
                  </div>
                </div>
              ))}
              {credentials.length === 0 && (
                <div style={{ border: '1px dashed var(--border)', borderRadius: 8, padding: 18, color: 'var(--text-muted)', fontSize: 13 }}>
                  Credentials you add will appear here after Hermes receives them.
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function CredentialInput({ field, value, onChange }: { field: CredentialField; value: string; onChange: (value: string) => void }) {
  return (
    <label style={labelStyle}>
      {field.label}{field.required ? ' *' : ''}
      {field.type === 'textarea' ? (
        <textarea rows={4} value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle} />
      ) : (
        <input type={field.type} value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle} />
      )}
    </label>
  );
}

function MetricCard({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: string }) {
  return (
    <div style={{ ...panelStyle, display: 'flex', alignItems: 'center', gap: 12, padding: 16 }}>
      <div style={{ color: tone, width: 36, height: 36, borderRadius: 9, background: `${tone}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div>
        <div style={{ color: '#fff', fontSize: 24, fontWeight: 750, lineHeight: 1 }}>{value}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}

const panelStyle: CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: 18,
};

const panelHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'flex-start',
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

const labelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  color: '#e5e7eb',
  fontSize: 13,
  fontWeight: 600,
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
  resize: 'vertical',
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
  fontWeight: 700,
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
  fontWeight: 650,
  fontSize: 13,
};

const textLink: CSSProperties = {
  color: '#a5b4fc',
  textDecoration: 'none',
  fontSize: 12,
  fontWeight: 700,
};

const requestButton: CSSProperties = {
  width: '100%',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: 12,
  textAlign: 'left',
  cursor: 'pointer',
  display: 'grid',
  gap: 6,
};

const statusPill: CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  textTransform: 'capitalize',
};
