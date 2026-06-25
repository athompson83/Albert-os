export type CapabilityMode = 'on-demand' | 'scheduled' | 'continuous';
export type CapabilityStatus = 'ready' | 'needs_setup' | 'blocked';

export type AlbertCapability = {
  id: string;
  name: string;
  description: string;
  agentId: string;
  mode: CapabilityMode;
  status: CapabilityStatus;
  endpoint?: string;
  workflowId?: string;
  sources: string[];
  keywords: string[];
  nextAction?: string;
};

export type CapabilityTrace = {
  id: string;
  capabilityId: string;
  capabilityName: string;
  agentId: string;
  mode: CapabilityMode;
  status: CapabilityStatus;
  source: string;
  timestamp: string;
  result: string;
};

const capabilities: AlbertCapability[] = [
  {
    id: 'progress-report',
    name: 'Progress Report',
    description: 'Summarizes GitHub commits, local status reports, blockers, and recent Albert OS changes.',
    agentId: 'albert',
    mode: 'on-demand',
    status: 'ready',
    endpoint: '/api/progress',
    sources: ['GitHub commits', 'STATUS.md', 'reports'],
    keywords: ['progress', 'github', 'report', 'update', 'changed', 'status'],
  },
  {
    id: 'task-review',
    name: 'Task Review',
    description: 'Lists open tasks from the Hermes gateway task queue and highlights priority/status.',
    agentId: 'hermes',
    mode: 'on-demand',
    status: 'ready',
    endpoint: '/api/tasks',
    sources: ['Hermes tasks', 'local task queue'],
    keywords: ['task', 'tasks', 'todo', 'priority', 'queue'],
  },
  {
    id: 'workflow-runner',
    name: 'Workflow Runner',
    description: 'Creates, edits, and manually runs Hermes workflows with agent, HTTP, notify, condition, and transform steps.',
    agentId: 'hermes',
    mode: 'scheduled',
    status: 'ready',
    endpoint: '/api/workflows',
    workflowId: 'wf_daily_brief',
    sources: ['Hermes workflows', 'workflow run history'],
    keywords: ['workflow', 'automation', 'run', 'schedule', 'trigger'],
  },
  {
    id: 'agent-registry',
    name: 'Agent Registry',
    description: 'Manages Albert and custom Hermes agents with editable context.',
    agentId: 'albert',
    mode: 'on-demand',
    status: 'ready',
    endpoint: '/api/agents',
    sources: ['Hermes agents', 'agent context'],
    keywords: ['agent', 'agents', 'registry', 'persona', 'context'],
  },
  {
    id: 'content-ops',
    name: 'Content Operations',
    description: 'Supports content generation, library review, newsletter drafts, and distribution workflows.',
    agentId: 'albert',
    mode: 'on-demand',
    status: 'ready',
    endpoint: '/content',
    sources: ['content studio', 'newsletter drafts'],
    keywords: ['content', 'newsletter', 'draft', 'post', 'library'],
  },
  {
    id: 'product-review',
    name: 'Product Review',
    description: 'Lists, downloads, approves, removes, and comments on Hermes-created digital products.',
    agentId: 'hermes',
    mode: 'on-demand',
    status: 'ready',
    endpoint: '/api/products',
    sources: ['Hermes products', 'product comments', 'download API'],
    keywords: ['product', 'products', 'download', 'approve', 'review', 'sell'],
  },
  {
    id: 'revenue-ops',
    name: 'Revenue Operations',
    description: 'Tracks subscriber revenue, product inventory, launch readiness, lead magnets, and publishing pipeline metrics.',
    agentId: 'albert',
    mode: 'continuous',
    status: 'ready',
    endpoint: '/api/revenue',
    sources: ['revenue metrics', 'products', 'newsletter', 'lead magnets'],
    keywords: ['revenue', 'sales', 'money', 'mrr', 'arr', 'subscribers', 'pipeline'],
  },
  {
    id: 'credential-intake',
    name: 'Credential Intake',
    description: 'Lets Adam provide requested Hermes credentials through task forms while storing only masked values in the UI state.',
    agentId: 'hermes',
    mode: 'on-demand',
    status: 'ready',
    endpoint: '/api/credentials',
    sources: ['Hermes credential requests', 'task response forms'],
    keywords: ['credential', 'credentials', 'api key', 'token', 'secret', 'connect'],
  },
  {
    id: 'clipping-pipeline',
    name: 'Clipping Pipeline',
    description: 'Tracks clipping projects, clip queue, submissions, and posting actions.',
    agentId: 'hermes',
    mode: 'continuous',
    status: 'needs_setup',
    endpoint: '/clipping',
    sources: ['clipping queue', 'project clips'],
    keywords: ['clip', 'clipping', 'video', 'queue', 'post'],
    nextAction: 'Connect final posting credentials before fully autonomous posting.',
  },
  {
    id: 'screen-context',
    name: 'Screen Context',
    description: 'Provides the UI surface for screen-share driven context and Hermes support.',
    agentId: 'albert',
    mode: 'on-demand',
    status: 'needs_setup',
    endpoint: '/screen',
    sources: ['screen share page'],
    keywords: ['screen', 'share', 'context', 'observe'],
    nextAction: 'Wire live screen capture into the Hermes gateway when local permissions are ready.',
  },
];

export function getCapabilities() {
  return capabilities;
}

export function getCapabilitySummary() {
  const items = getCapabilities();
  return {
    total: items.length,
    ready: items.filter(item => item.status === 'ready').length,
    needsSetup: items.filter(item => item.status === 'needs_setup').length,
    blocked: items.filter(item => item.status === 'blocked').length,
    modes: {
      onDemand: items.filter(item => item.mode === 'on-demand').length,
      scheduled: items.filter(item => item.mode === 'scheduled').length,
      continuous: items.filter(item => item.mode === 'continuous').length,
    },
  };
}

export function findCapabilityForMessage(message: string) {
  const normalized = message.toLowerCase();
  return getCapabilities().find(capability =>
    capability.keywords.some(keyword => matchesKeyword(normalized, keyword)),
  );
}

function matchesKeyword(normalizedMessage: string, keyword: string) {
  const normalizedKeyword = keyword.toLowerCase();
  if (normalizedKeyword.includes(' ')) return normalizedMessage.includes(normalizedKeyword);
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedKeyword)}(?=[^a-z0-9]|$)`).test(normalizedMessage);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildCapabilityTrace(capability: AlbertCapability, source = 'chat', result?: string): CapabilityTrace {
  return {
    id: `trace_${capability.id}_${Date.now().toString(36)}`,
    capabilityId: capability.id,
    capabilityName: capability.name,
    agentId: capability.agentId,
    mode: capability.mode,
    status: capability.status,
    source,
    timestamp: new Date().toISOString(),
    result: result || `${capability.name} is ${capability.status.replace('_', ' ')} via ${capability.endpoint || 'Albert OS'}.`,
  };
}

export function buildCapabilitiesReply() {
  const summary = getCapabilitySummary();
  const ready = getCapabilities().filter(item => item.status === 'ready');
  const setup = getCapabilities().filter(item => item.status !== 'ready');

  return [
    `Albert has ${summary.total} discoverable capabilities loaded from the Hermes catalog.`,
    '',
    'Ready now:',
    ...ready.map(item => `- ${item.name}: ${item.description}`),
    '',
    'Needs setup:',
    ...(setup.length
      ? setup.map(item => `- ${item.name}: ${item.nextAction || item.description}`)
      : ['- No setup gaps listed.']),
    '',
    'Open the Capabilities page for the full catalog: /capabilities',
  ].join('\n');
}
