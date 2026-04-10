'use client';
import { useState, useEffect, useCallback } from 'react';
import TopBar from '@/components/TopBar';

type TriggerType = 'manual' | 'webhook' | 'schedule' | 'app';
type StepType = 'agent' | 'http' | 'notify' | 'condition' | 'transform';

interface Step {
  id: string;
  name: string;
  type: StepType;
  config: Record<string, string | boolean>;
  outputKey: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: { type: TriggerType; config: Record<string, string> };
  steps: Step[];
  createdAt?: string;
  updatedAt?: string;
}

interface Agent { id: string; name: string; emoji: string; }

const TRIGGER_COLORS: Record<TriggerType, string> = {
  manual: '#555', webhook: '#3b82f6', schedule: '#10b981', app: '#8b5cf6',
};

const STEP_COLORS: Record<StepType, string> = {
  agent: '#6366f1', http: '#3b82f6', notify: '#10b981', condition: '#f59e0b', transform: '#8b5cf6',
};

const STEP_ICONS: Record<StepType, string> = {
  agent: '🤖', http: '🌐', notify: '✉️', condition: '🔀', transform: '⚙️',
};

function parseCron(cron: string): string {
  if (cron === '0 7 * * 1-5') return 'Weekdays at 7:00 AM';
  if (cron === '0 9 * * *') return 'Daily at 9:00 AM';
  if (cron === '0 * * * *') return 'Every hour';
  if (cron === '*/30 * * * *') return 'Every 30 minutes';
  if (cron === '*/15 * * * *') return 'Every 15 minutes';
  if (cron === '0 8 * * 1-5') return 'Weekdays at 8:00 AM';
  const match = cron.match(/^0 (\d+) \* \* \*$/);
  if (match) return `Daily at ${match[1]}:00`;
  return 'Custom schedule';
}

function newStep(type: StepType): Step {
  const id = 'step_' + Date.now().toString(36);
  const defaults: Record<StepType, Record<string, string | boolean>> = {
    agent: { agentId: 'albert', message: '' },
    http: { method: 'GET', url: '' },
    notify: { to: '+12394646950', message: '' },
    condition: { left: '', operator: '==', right: '', stopOnFalse: false },
    transform: { value: '' },
  };
  return { id, name: type.charAt(0).toUpperCase() + type.slice(1), type, config: defaults[type], outputKey: id };
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Workflow | null>(null);
  const [saving, setSaving] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<Record<string, unknown> | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/workflows');
      const d = await r.json();
      setWorkflows(d.workflows || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchWorkflows(); }, [fetchWorkflows]);
  useEffect(() => {
    fetch('/api/agents').then(r => r.json()).then(d => setAgents(d.agents || [])).catch(() => {});
  }, []);

  async function createWorkflow() {
    const r = await fetch('/api/workflows', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'New Workflow', description: '', trigger: { type: 'manual', config: {} }, steps: [] }) });
    const d = await r.json();
    if (d.workflow) { setWorkflows(w => [...w, d.workflow]); setSelected(d.workflow); }
  }

  async function saveWorkflow() {
    if (!selected) return;
    setSaving(true);
    try {
      const r = await fetch('/api/workflows/' + selected.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(selected) });
      const d = await r.json();
      if (d.workflow) { setSelected(d.workflow); setWorkflows(w => w.map(x => x.id === d.workflow.id ? d.workflow : x)); }
    } finally { setSaving(false); }
  }

  async function deleteWorkflow(id: string) {
    if (!window.confirm('Archive this workflow?')) return;
    await fetch('/api/workflows/' + id, { method: 'DELETE' });
    setWorkflows(w => w.filter(x => x.id !== id));
  }

  async function runWorkflow(wf: Workflow) {
    setRunningId(wf.id);
    setRunResult(null);
    try {
      const r = await fetch('/api/workflows/' + wf.id + '/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const d = await r.json();
      setRunResult(d);
    } finally { setRunningId(null); }
  }

  async function toggleEnabled(wf: Workflow) {
    const r = await fetch('/api/workflows/' + wf.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...wf, enabled: !wf.enabled }) });
    const d = await r.json();
    if (d.workflow) setWorkflows(w => w.map(x => x.id === d.workflow.id ? d.workflow : x));
  }

  const s = { surface: 'var(--surface)', border: '1px solid var(--border)', text: 'var(--text)', muted: 'var(--text-muted)', primary: 'var(--primary)', bg: 'var(--background)' };

  // ── Builder View ──────────────────────────────────────────────────────────
  if (selected) {
    const setTrigger = (patch: Partial<typeof selected.trigger>) => setSelected(x => x ? { ...x, trigger: { ...x.trigger, ...patch } } : x);
    const setTriggerConfig = (patch: Record<string, string>) => setSelected(x => x ? { ...x, trigger: { ...x.trigger, config: { ...x.trigger.config, ...patch } } } : x);
    const updateStep = (id: string, patch: Partial<Step>) => setSelected(x => x ? { ...x, steps: x.steps.map(s => s.id === id ? { ...s, ...patch } : s) } : x);
    const updateStepConfig = (id: string, patch: Record<string, string | boolean>) => setSelected(x => x ? { ...x, steps: x.steps.map(s => s.id === id ? { ...s, config: { ...s.config, ...patch } } : s) } : x);
    const removeStep = (id: string) => setSelected(x => x ? { ...x, steps: x.steps.filter(s => s.id !== id) } : x);
    const addStep = (type: StepType) => setSelected(x => x ? { ...x, steps: [...x.steps, newStep(type)] } : x);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: s.bg }}>
        <TopBar title="Workflows" />
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            <button onClick={() => { saveWorkflow(); setSelected(null); setRunResult(null); }} style={{ background: 'transparent', border: s.border, borderRadius: 8, padding: '6px 14px', color: s.muted, cursor: 'pointer', fontSize: 13 }}>← Back</button>
            <input value={selected.name} onChange={e => setSelected(x => x ? { ...x, name: e.target.value } : x)} style={{ flex: 1, fontSize: 20, fontWeight: 700, background: 'transparent', border: 'none', color: s.text, outline: 'none', minWidth: 160 }} placeholder="Workflow name" />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: s.muted, cursor: 'pointer' }}>
              <input type="checkbox" checked={selected.enabled} onChange={e => setSelected(x => x ? { ...x, enabled: e.target.checked } : x)} /> Enabled
            </label>
            <button onClick={saveWorkflow} disabled={saving} style={{ background: s.primary, border: 'none', borderRadius: 8, padding: '8px 18px', color: '#fff', cursor: 'pointer', fontSize: 13, opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving...' : 'Save'}</button>
            <button onClick={() => runWorkflow(selected)} disabled={runningId === selected.id} style={{ background: '#10b981', border: 'none', borderRadius: 8, padding: '8px 18px', color: '#fff', cursor: 'pointer', fontSize: 13, opacity: runningId === selected.id ? 0.6 : 1 }}>{runningId === selected.id ? '⏳ Running...' : '▶ Run Now'}</button>
          </div>

          {/* Trigger */}
          <div style={{ background: s.surface, border: '1px solid var(--border)', borderLeft: '3px solid ' + TRIGGER_COLORS[selected.trigger.type], borderRadius: 10, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: s.muted, letterSpacing: 1, marginBottom: 12 }}>TRIGGER</div>
            <select value={selected.trigger.type} onChange={e => setTrigger({ type: e.target.value as TriggerType, config: {} })} style={{ background: 'var(--surface-2)', border: s.border, borderRadius: 7, padding: '8px 12px', color: s.text, fontSize: 14, marginBottom: 12, width: '100%' }}>
              <option value="manual">Manual</option>
              <option value="webhook">Webhook</option>
              <option value="schedule">Schedule</option>
              <option value="app">App Event</option>
            </select>
            {selected.trigger.type === 'manual' && <div style={{ fontSize: 13, color: s.muted, background: 'var(--surface-2)', borderRadius: 7, padding: '10px 14px' }}>Run from the Workflows page or call the API directly.</div>}
            {selected.trigger.type === 'webhook' && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input readOnly value={'[proxy-url]/webhooks/' + selected.id} style={{ flex: 1, background: 'var(--surface-2)', border: s.border, borderRadius: 7, padding: '8px 12px', color: s.muted, fontSize: 12 }} />
                <button onClick={() => navigator.clipboard?.writeText('[proxy-url]/webhooks/' + selected.id)} style={{ background: 'transparent', border: s.border, borderRadius: 7, padding: '8px 12px', color: s.muted, cursor: 'pointer', fontSize: 12 }}>Copy</button>
              </div>
            )}
            {selected.trigger.type === 'schedule' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input value={selected.trigger.config.cron || ''} onChange={e => setTriggerConfig({ cron: e.target.value })} placeholder="Cron expression (e.g. 0 7 * * 1-5)" style={{ background: 'var(--surface-2)', border: s.border, borderRadius: 7, padding: '8px 12px', color: s.text, fontSize: 13 }} />
                <div style={{ fontSize: 12, color: '#10b981' }}>📅 {parseCron(selected.trigger.config.cron || '')}</div>
                <select value={selected.trigger.config.tz || 'America/New_York'} onChange={e => setTriggerConfig({ tz: e.target.value })} style={{ background: 'var(--surface-2)', border: s.border, borderRadius: 7, padding: '7px 10px', color: s.text, fontSize: 13 }}>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            )}
            {selected.trigger.type === 'app' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={selected.trigger.config.app || ''} onChange={e => setTriggerConfig({ app: e.target.value })} style={{ flex: 1, background: 'var(--surface-2)', border: s.border, borderRadius: 7, padding: '8px 12px', color: s.text, fontSize: 13 }}>
                  <option value="">Select app...</option>
                  <option value="gmail">Gmail</option>
                  <option value="monday">Monday.com</option>
                </select>
                <select value={selected.trigger.config.event || ''} onChange={e => setTriggerConfig({ event: e.target.value })} style={{ flex: 1, background: 'var(--surface-2)', border: s.border, borderRadius: 7, padding: '8px 12px', color: s.text, fontSize: 13 }}>
                  <option value="">Select event...</option>
                  {selected.trigger.config.app === 'gmail' && <><option value="new_email">New Email</option><option value="new_unread">New Unread</option></>}
                  {selected.trigger.config.app === 'monday' && <><option value="new_item">New Item</option><option value="status_change">Status Change</option></>}
                </select>
              </div>
            )}
          </div>

          {/* Steps */}
          {selected.steps.map((step, idx) => (
            <div key={step.id} style={{ background: s.surface, border: '1px solid var(--border)', borderLeft: '3px solid ' + STEP_COLORS[step.type], borderRadius: 10, padding: 18, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: STEP_COLORS[step.type], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{idx + 1}</div>
                <input value={step.name} onChange={e => updateStep(step.id, { name: e.target.value })} style={{ flex: 1, background: 'transparent', border: 'none', color: s.text, fontSize: 14, fontWeight: 600, outline: 'none' }} />
                <span style={{ fontSize: 12, background: STEP_COLORS[step.type] + '22', color: STEP_COLORS[step.type], borderRadius: 5, padding: '2px 8px', border: '1px solid ' + STEP_COLORS[step.type] + '44' }}>{STEP_ICONS[step.type]} {step.type}</span>
                <button onClick={() => removeStep(step.id)} style={{ background: 'transparent', border: 'none', color: s.muted, cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>✕</button>
              </div>
              {/* Config panels */}
              {step.type === 'agent' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <select value={String(step.config.agentId || 'albert')} onChange={e => updateStepConfig(step.id, { agentId: e.target.value })} style={{ background: 'var(--surface-2)', border: s.border, borderRadius: 7, padding: '8px 12px', color: s.text, fontSize: 13 }}>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.emoji} {a.name}</option>)}
                    {agents.length === 0 && <option value="albert">🎩 Albert</option>}
                  </select>
                  <textarea value={String(step.config.message || '')} onChange={e => updateStepConfig(step.id, { message: e.target.value })} rows={3} placeholder="Message to send... use {{trigger.payload}} to reference data" style={{ background: 'var(--surface-2)', border: s.border, borderRadius: 7, padding: '8px 12px', color: s.text, fontSize: 13, resize: 'vertical' }} />
                  <div style={{ fontSize: 11, color: s.muted }}>Available: {'{{trigger.payload}}'}, {'{{trigger.timestamp}}'}, previous step output keys</div>
                </div>
              )}
              {step.type === 'http' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select value={String(step.config.method || 'GET')} onChange={e => updateStepConfig(step.id, { method: e.target.value })} style={{ background: 'var(--surface-2)', border: s.border, borderRadius: 7, padding: '8px 10px', color: s.text, fontSize: 13, width: 100 }}>
                      {['GET','POST','PUT','PATCH','DELETE'].map(m => <option key={m}>{m}</option>)}
                    </select>
                    <input value={String(step.config.url || '')} onChange={e => updateStepConfig(step.id, { url: e.target.value })} placeholder="https://api.example.com/endpoint" style={{ flex: 1, background: 'var(--surface-2)', border: s.border, borderRadius: 7, padding: '8px 12px', color: s.text, fontSize: 13 }} />
                  </div>
                  {['POST','PUT','PATCH'].includes(String(step.config.method || 'GET')) && (
                    <textarea value={String(step.config.body || '')} onChange={e => updateStepConfig(step.id, { body: e.target.value })} rows={3} placeholder='{"key": "value"}' style={{ background: 'var(--surface-2)', border: s.border, borderRadius: 7, padding: '8px 12px', color: s.text, fontSize: 12, fontFamily: 'monospace', resize: 'vertical' }} />
                  )}
                </div>
              )}
              {step.type === 'notify' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input value={String(step.config.to || '+12394646950')} onChange={e => updateStepConfig(step.id, { to: e.target.value })} placeholder="+1234567890" style={{ background: 'var(--surface-2)', border: s.border, borderRadius: 7, padding: '8px 12px', color: s.text, fontSize: 13 }} />
                  <textarea value={String(step.config.message || '')} onChange={e => updateStepConfig(step.id, { message: e.target.value })} rows={3} placeholder="Message... use {{step1.reply}} to include previous outputs" style={{ background: 'var(--surface-2)', border: s.border, borderRadius: 7, padding: '8px 12px', color: s.text, fontSize: 13, resize: 'vertical' }} />
                </div>
              )}
              {step.type === 'condition' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input value={String(step.config.left || '')} onChange={e => updateStepConfig(step.id, { left: e.target.value })} placeholder="{{step1.reply}}" style={{ flex: 1, background: 'var(--surface-2)', border: s.border, borderRadius: 7, padding: '8px 10px', color: s.text, fontSize: 13 }} />
                    <select value={String(step.config.operator || '==')} onChange={e => updateStepConfig(step.id, { operator: e.target.value })} style={{ background: 'var(--surface-2)', border: s.border, borderRadius: 7, padding: '8px 10px', color: s.text, fontSize: 13 }}>
                      {['==','!=','>','<','contains','not contains'].map(o => <option key={o}>{o}</option>)}
                    </select>
                    <input value={String(step.config.right || '')} onChange={e => updateStepConfig(step.id, { right: e.target.value })} placeholder="value" style={{ flex: 1, background: 'var(--surface-2)', border: s.border, borderRadius: 7, padding: '8px 10px', color: s.text, fontSize: 13 }} />
                  </div>
                  <label style={{ fontSize: 13, color: s.muted, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={Boolean(step.config.stopOnFalse)} onChange={e => updateStepConfig(step.id, { stopOnFalse: e.target.checked })} /> Stop workflow if condition is false
                  </label>
                </div>
              )}
              {step.type === 'transform' && (
                <textarea value={String(step.config.value || '')} onChange={e => updateStepConfig(step.id, { value: e.target.value })} rows={2} placeholder="Value or expression... {{step1.reply}}" style={{ width: '100%', background: 'var(--surface-2)', border: s.border, borderRadius: 7, padding: '8px 12px', color: s.text, fontSize: 13, resize: 'vertical' }} />
              )}
              <div style={{ marginTop: 8, fontSize: 11, color: s.muted }}>Output key: <code style={{ background: 'var(--surface-2)', padding: '1px 5px', borderRadius: 4 }}>{'{{' + step.outputKey + '}}'}</code></div>
            </div>
          ))}

          {/* Add Step */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {(['agent','http','notify','condition','transform'] as StepType[]).map(t => (
              <button key={t} onClick={() => addStep(t)} style={{ background: STEP_COLORS[t] + '15', border: '1px solid ' + STEP_COLORS[t] + '44', borderRadius: 8, padding: '8px 14px', color: STEP_COLORS[t], cursor: 'pointer', fontSize: 13 }}>
                {STEP_ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Run Result */}
          {runResult && (
            <div style={{ background: s.surface, border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontWeight: 600, color: s.text }}>Run Result</span>
                <span style={{ fontSize: 12, borderRadius: 5, padding: '2px 8px', background: (runResult as {success?: boolean}).success ? '#10b98122' : '#ef444422', color: (runResult as {success?: boolean}).success ? '#10b981' : '#ef4444' }}>
                  {(runResult as {success?: boolean}).success ? '✓ Success' : '✗ Failed'}
                </span>
              </div>
              <pre style={{ fontSize: 11, color: s.muted, overflow: 'auto', maxHeight: 300, background: 'var(--surface-2)', borderRadius: 7, padding: 12 }}>
                {JSON.stringify(runResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── List View ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: s.bg }}>
      <TopBar title="Workflows" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: s.text }}>Your Workflows</h2>
          <button onClick={createWorkflow} style={{ background: s.primary, border: 'none', borderRadius: 8, padding: '10px 18px', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>+ New Workflow</button>
        </div>
        {loading && <div style={{ color: s.muted, textAlign: 'center', padding: 40 }}>Loading...</div>}
        {!loading && workflows.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: s.muted }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚡</div>
            <div style={{ fontSize: 16, marginBottom: 8, color: s.text }}>No workflows yet</div>
            <div style={{ fontSize: 13 }}>Create your first automation</div>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {workflows.map(wf => (
            <div key={wf.id} style={{ background: s.surface, border: '1px solid var(--border)', borderRadius: 12, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ cursor: 'pointer', flex: 1 }} onClick={() => setSelected(wf)}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: s.text, marginBottom: 4 }}>{wf.name}</div>
                  {wf.description && <div style={{ fontSize: 12, color: s.muted }}>{wf.description}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, borderRadius: 5, padding: '2px 8px', background: TRIGGER_COLORS[wf.trigger.type] + '22', color: TRIGGER_COLORS[wf.trigger.type], border: '1px solid ' + TRIGGER_COLORS[wf.trigger.type] + '44' }}>{wf.trigger.type}</span>
                <span style={{ fontSize: 11, color: s.muted }}>{wf.steps.length} step{wf.steps.length !== 1 ? 's' : ''}</span>
                <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: s.muted, cursor: 'pointer' }} onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={wf.enabled} onChange={() => toggleEnabled(wf)} /> Enabled
                </label>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => runWorkflow(wf)} disabled={runningId === wf.id} style={{ flex: 1, background: '#10b98115', border: '1px solid #10b98144', borderRadius: 7, padding: '7px', color: '#10b981', cursor: 'pointer', fontSize: 12 }}>
                  {runningId === wf.id ? '⏳' : '▶'} Run
                </button>
                <button onClick={() => setSelected(wf)} style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', borderRadius: 7, padding: '7px', color: s.muted, cursor: 'pointer', fontSize: 12 }}>Edit</button>
                <button onClick={() => deleteWorkflow(wf.id)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 7, padding: '7px 10px', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
