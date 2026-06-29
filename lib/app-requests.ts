import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { logExchange } from '@/lib/exchange-log';
import { recordHermesEvent, upsertTask } from '@/lib/hermes-gateway';

export type AppRequestStatus = 'queued' | 'in_progress' | 'done' | 'blocked';
export type AppRequestPriority = 'high' | 'medium' | 'low';

export type AppRequest = {
  id: string;
  targetApp: string;
  title: string;
  instructions: string;
  requestType: string;
  priority: AppRequestPriority;
  status: AppRequestStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  blockedReason?: string;
  relatedTaskId?: string;
  metadata?: Record<string, unknown>;
};

type AppRequestStore = {
  requests: AppRequest[];
};

export type AppAccessItem = {
  id: string;
  name: string;
  category: string;
  href?: string;
  allowed: boolean;
  reason?: string;
};

const stateKey = '__albertAppRequestsState';

const blockedApps: AppAccessItem[] = [
  {
    id: 'apoc-checklist',
    name: 'APoC Checklist',
    category: 'Protected Workspace',
    allowed: false,
    reason: 'Adam explicitly excluded APoC Checklist from Hermes app requests.',
  },
  {
    id: 'proficiencyai',
    name: 'ProficiencyAI',
    category: 'Protected Workspace',
    allowed: false,
    reason: 'Adam explicitly excluded ProficiencyAI from Hermes app requests.',
  },
  {
    id: 'baseproficiencyai',
    name: 'Baseproficiencyai',
    category: 'Protected Workspace',
    allowed: false,
    reason: 'Covered by the ProficiencyAI exclusion.',
  },
];

const allowedApps: AppAccessItem[] = [
  { id: 'albertos-dashboard', name: 'AlbertOS Dashboard', category: 'Command Center', href: '/', allowed: true },
  { id: 'chat', name: 'Chat', category: 'Command Center', href: '/chat', allowed: true },
  { id: 'tasks', name: 'Tasks', category: 'Operations', href: '/tasks', allowed: true },
  { id: 'credentials', name: 'Credentials', category: 'Operations', href: '/credentials', allowed: true },
  { id: 'progress', name: 'Progress', category: 'Operations', href: '/progress', allowed: true },
  { id: 'products', name: 'Products', category: 'Revenue', href: '/products', allowed: true },
  { id: 'revenue', name: 'Revenue', category: 'Revenue', href: '/revenue', allowed: true },
  { id: 'customers', name: 'Customers', category: 'Revenue', href: '/customers', allowed: true },
  { id: 'marketing', name: 'Marketing', category: 'Growth', href: '/marketing', allowed: true },
  { id: 'content', name: 'Content Command', category: 'Content', href: '/content', allowed: true },
  { id: 'creative-tools', name: 'Creative Tools', category: 'Content', href: '/content/tools', allowed: true },
  { id: 'distribution-hub', name: 'Distribution Hub', category: 'Content', href: '/content/distribute', allowed: true },
  { id: 'clipping', name: 'Clipping', category: 'Content', href: '/clipping', allowed: true },
  { id: 'newsletter', name: 'Newsletter', category: 'Content', href: '/newsletter', allowed: true },
  { id: 'workflows', name: 'Workflows', category: 'Automation', href: '/workflows', allowed: true },
  { id: 'agents', name: 'Agents', category: 'Automation', href: '/agents', allowed: true },
  { id: 'capabilities', name: 'Capabilities', category: 'Automation', href: '/capabilities', allowed: true },
  { id: 'apps', name: 'Connected Apps', category: 'Integrations', href: '/apps', allowed: true },
  { id: 'logs', name: 'Logs', category: 'Audit', href: '/logs', allowed: true },
  { id: 'github', name: 'GitHub', category: 'Connected App', allowed: true },
  { id: 'vercel', name: 'Vercel', category: 'Connected App', allowed: true },
  { id: 'stripe', name: 'Stripe', category: 'Connected App', allowed: true },
  { id: 'slack', name: 'Slack', category: 'Connected App', allowed: true },
  { id: 'beehiiv', name: 'Beehiiv', category: 'Connected App', allowed: true },
];

function getStorePath() {
  return process.env.ALBERT_APP_REQUESTS_STORE ||
    (process.env.VERCEL ? join('/tmp', 'albert-os-app-requests.json') : join(process.cwd(), '.albert-os', 'app-requests.json'));
}

function readStore(): AppRequestStore {
  try {
    const path = getStorePath();
    if (!existsSync(path)) return { requests: [] };
    const parsed = JSON.parse(readFileSync(path, 'utf-8'));
    return { requests: Array.isArray(parsed?.requests) ? parsed.requests : [] };
  } catch {
    return { requests: [] };
  }
}

function writeStore(store: AppRequestStore) {
  try {
    const path = getStorePath();
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify({ updatedAt: new Date().toISOString(), requests: store.requests }, null, 2), 'utf-8');
  } catch {}
}

function appRequestStore() {
  const globalStore = globalThis as typeof globalThis & { [stateKey]?: AppRequestStore };
  globalStore[stateKey] ||= readStore();
  return globalStore[stateKey]!;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function getAppAccessPolicy() {
  return {
    allowedApps,
    blockedApps,
    rules: [
      'Hermes may create app requests for AlbertOS and connected apps unless they match a blocked app.',
      'APoC Checklist is blocked.',
      'ProficiencyAI and Baseproficiencyai are blocked.',
      'Blocked app requests are logged and returned with status=blocked.',
      'Hermes should create a visible task or app request instead of silently changing app state when Adam input is needed.',
    ],
  };
}

export function isBlockedApp(targetApp: string) {
  const normalizedTarget = normalize(targetApp || '');
  if (!normalizedTarget) return null;

  return blockedApps.find(app => {
    const id = normalize(app.id);
    const name = normalize(app.name);
    return normalizedTarget.includes(id) || normalizedTarget.includes(name) || id.includes(normalizedTarget) || name.includes(normalizedTarget);
  }) || null;
}

export function getAppRequestsSnapshot() {
  const store = appRequestStore();
  const policy = getAppAccessPolicy();
  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    policy,
    requests: store.requests,
    recentRequests: store.requests.slice(0, 25),
    counts: {
      total: store.requests.length,
      queued: store.requests.filter(request => request.status === 'queued').length,
      blocked: store.requests.filter(request => request.status === 'blocked').length,
      done: store.requests.filter(request => request.status === 'done').length,
    },
    endpoints: {
      api: '/api/app-requests',
      hermes: '/hermes/app-requests',
      ui: '/apps',
    },
  };
}

export function createAppRequest(input: Record<string, unknown>, actor = 'Hermes') {
  const targetApp = String(input.targetApp || input.app || '').trim();
  if (!targetApp) {
    throw new Error('targetApp is required.');
  }

  const now = new Date().toISOString();
  const blocked = isBlockedApp(targetApp);
  const status: AppRequestStatus = blocked ? 'blocked' : 'queued';
  const title = String(input.title || `Hermes request for ${targetApp}`).trim();
  const instructions = String(input.instructions || input.message || input.description || '').trim();
  const requestType = String(input.requestType || input.type || 'general').trim();
  const priority = ['high', 'medium', 'low'].includes(String(input.priority)) ? String(input.priority) as AppRequestPriority : 'medium';
  const id = `appreq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

  const request: AppRequest = {
    id,
    targetApp,
    title,
    instructions,
    requestType,
    priority,
    status,
    createdBy: actor,
    createdAt: now,
    updatedAt: now,
    blockedReason: blocked?.reason,
    metadata: typeof input.metadata === 'object' && input.metadata ? input.metadata as Record<string, unknown> : undefined,
  };

  if (!blocked) {
    const task = upsertTask({
      id: `task_${id}`,
      title,
      description: instructions || `Hermes requested action in ${targetApp}.`,
      project: targetApp,
      priority,
      status: 'todo',
      assignedTo: 'adam',
    });
    request.relatedTaskId = task.id;
  }

  const store = appRequestStore();
  store.requests.unshift(request);
  store.requests = store.requests.slice(0, 200);
  writeStore(store);

  recordHermesEvent({
    type: blocked ? 'app_request_blocked' : 'app_request_created',
    title: blocked ? `Blocked app request: ${targetApp}` : `App request: ${targetApp}`,
    detail: blocked ? blocked.reason || 'Blocked by app policy.' : title,
    entityId: id,
  });

  logExchange({
    source: actor.toLowerCase().includes('hermes') ? 'hermes' : 'web',
    direction: 'inbound',
    channel: 'app-requests',
    kind: blocked ? 'app_request_blocked' : 'app_request_created',
    actor,
    targetAgentId: 'albert',
    summary: blocked ? `Blocked Hermes request for ${targetApp}.` : `Hermes request queued for ${targetApp}.`,
    relatedId: id,
    payload: request,
  });

  return request;
}
