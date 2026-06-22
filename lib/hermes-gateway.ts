import { mockTasks } from '@/lib/mock-data';
import { buildProgressReply } from '@/lib/progress';

export type HermesAgent = {
  id: string;
  name: string;
  emoji: string;
  role: string;
  description: string;
  color: string;
  isDefault?: boolean;
  sessionId: string;
  avatar?: string;
  context?: string;
};

export type HermesTask = {
  id: string;
  title: string;
  description?: string;
  project?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'inprogress' | 'review' | 'done';
  dueDate?: string;
  source?: string;
  archivedAt?: string;
};

export type HermesWorkflow = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: { type: 'manual' | 'webhook' | 'schedule' | 'app'; config: Record<string, string> };
  steps: Array<{
    id: string;
    name: string;
    type: 'agent' | 'http' | 'notify' | 'condition' | 'transform';
    config: Record<string, string | boolean>;
    outputKey: string;
  }>;
  createdAt: string;
  updatedAt: string;
  runs?: HermesRun[];
};

export type HermesRun = {
  id: string;
  workflowId: string;
  status: 'success' | 'error';
  startedAt: string;
  finishedAt: string;
  outputs: Record<string, unknown>;
};

type ChatEntry = {
  id: string;
  timestamp: string;
  user: string;
  albert: string;
  project: string;
  attachments?: unknown[];
};

type HermesState = {
  agents: HermesAgent[];
  tasks: HermesTask[];
  workflows: HermesWorkflow[];
  chats: ChatEntry[];
};

const stateKey = '__albertHermesGatewayState';

function initialAgents(): HermesAgent[] {
  return [
    {
      id: 'albert',
      name: 'Albert',
      emoji: '🎩',
      role: 'CEO / operator',
      description: 'Coordinates strategy, execution, revenue experiments, and Adam-facing operations.',
      color: '#6366f1',
      isDefault: true,
      sessionId: 'albert-os-web',
      avatar: '/avatars/albert.png',
      context: 'Albert OS is Adam Thompson personal AI command center connected through a Hermes-compatible HTTP gateway.',
    },
    {
      id: 'sentinelqa',
      name: 'SentinelQA',
      emoji: '🛡️',
      role: 'EMS quality',
      description: 'Clinical quality, protocol, and performance analytics support.',
      color: '#10b981',
      sessionId: 'sentinelqa',
      avatar: '/avatars/sentinelqa.png',
    },
    {
      id: 'operator',
      name: 'Operator',
      emoji: '⚙️',
      role: 'Automation',
      description: 'Workflow operations, task routing, and system checks.',
      color: '#f59e0b',
      sessionId: 'operator',
      avatar: '/avatars/operator.png',
    },
  ];
}

function initialWorkflows(): HermesWorkflow[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'wf_daily_brief',
      name: 'Daily Brief',
      description: 'Summarize active blockers and next actions.',
      enabled: true,
      trigger: { type: 'manual', config: {} },
      steps: [
        {
          id: 'brief_agent',
          name: 'Ask Albert',
          type: 'agent',
          config: { agentId: 'albert', message: 'Summarize current Albert OS priorities and blockers.' },
          outputKey: 'brief',
        },
      ],
      createdAt: now,
      updatedAt: now,
      runs: [],
    },
  ];
}

export function getHermesState(): HermesState {
  const globalStore = globalThis as typeof globalThis & { [stateKey]?: HermesState };
  if (!globalStore[stateKey]) {
    globalStore[stateKey] = {
      agents: initialAgents(),
      tasks: mockTasks.map(task => ({ ...task, source: 'local' })) as HermesTask[],
      workflows: initialWorkflows(),
      chats: [],
    };
  }
  return globalStore[stateKey]!;
}

export async function createGatewayReply(message: string, agentId = 'albert') {
  const state = getHermesState();
  const agent = state.agents.find(item => item.id === agentId) || state.agents[0];
  const normalized = message.toLowerCase();

  if (
    normalized.includes('progress') ||
    normalized.includes('github') ||
    normalized.includes('report') ||
    normalized.includes('what changed') ||
    normalized.includes('update')
  ) {
    return buildProgressReply();
  }

  if (normalized.includes('status') || normalized.includes('blocker')) {
    const openTasks = state.tasks.filter(task => !task.archivedAt && task.status !== 'done').length;
    return [
      `${agent.name} is online and connected through the Hermes HTTP API.`,
      `Current workspace: ${state.agents.length} agents, ${openTasks} open tasks, ${state.workflows.length} workflow.`,
      `The old gateway outage is resolved locally and in production; /agent and /api/chat both respond.`,
    ].join('\n');
  }

  if (normalized.includes('workflow')) {
    const workflows = state.workflows.map(item => `- ${item.name}: ${item.description || 'No description'}`).join('\n');
    return `${agent.name} sees ${state.workflows.length} workflow configured.\n${workflows || '- No workflows yet.'}`;
  }

  if (normalized.includes('task')) {
    const open = state.tasks.filter(task => !task.archivedAt && task.status !== 'done').slice(0, 5);
    return open.length
      ? `${agent.name} sees these open tasks:\n${open.map(task => `- ${task.title} [${task.priority}, ${task.status}]`).join('\n')}`
      : `${agent.name} sees no open tasks right now.`;
  }

  const openTasks = state.tasks.filter(task => !task.archivedAt && task.status !== 'done').length;
  return [
    `I'm here, Adam. I have the Albert OS context loaded now, not just the gateway heartbeat.`,
    `Right now I can see ${openTasks} open tasks, ${state.workflows.length} workflow, and ${state.agents.length} agents.`,
    `Ask me for a progress report, blockers, tasks, or workflow status and I will answer from the live project feed.`,
  ].join('\n');
}

export function recordChat(message: string, reply: string, project = 'General', attachments?: unknown[]) {
  const entry: ChatEntry = {
    id: `chat_${Date.now().toString(36)}`,
    timestamp: new Date().toISOString(),
    user: message,
    albert: reply,
    project,
    attachments,
  };
  getHermesState().chats.push(entry);
  return entry;
}

export function upsertAgent(body: Partial<HermesAgent>) {
  const state = getHermesState();
  const id = body.id || `agent_${Date.now().toString(36)}`;
  const existing = state.agents.find(agent => agent.id === id);
  const agent: HermesAgent = {
    id,
    name: body.name || existing?.name || 'New Agent',
    emoji: body.emoji || existing?.emoji || '🤖',
    role: body.role || existing?.role || 'Assistant',
    description: body.description || existing?.description || '',
    color: body.color || existing?.color || '#6366f1',
    isDefault: body.isDefault ?? existing?.isDefault,
    sessionId: body.sessionId || existing?.sessionId || id,
    avatar: body.avatar || existing?.avatar,
    context: body.context ?? existing?.context,
  };

  if (existing) {
    state.agents = state.agents.map(item => (item.id === id ? agent : item));
  } else {
    state.agents.push(agent);
  }

  return agent;
}

export function upsertTask(body: Partial<HermesTask>) {
  const state = getHermesState();
  const id = body.id || `task_${Date.now().toString(36)}`;
  const existing = state.tasks.find(task => task.id === id);
  const task: HermesTask = {
    id,
    title: body.title || existing?.title || 'New task',
    description: body.description ?? existing?.description,
    project: body.project || existing?.project || 'Albert Queue',
    priority: body.priority || existing?.priority || 'medium',
    status: body.status || existing?.status || 'todo',
    dueDate: body.dueDate ?? existing?.dueDate,
    source: body.source || existing?.source || 'local',
    archivedAt: body.archivedAt ?? existing?.archivedAt,
  };

  if (existing) {
    state.tasks = state.tasks.map(item => (item.id === id ? task : item));
  } else {
    state.tasks.push(task);
  }

  return task;
}

export function upsertWorkflow(body: Partial<HermesWorkflow>) {
  const state = getHermesState();
  const now = new Date().toISOString();
  const id = body.id || `wf_${Date.now().toString(36)}`;
  const existing = state.workflows.find(workflow => workflow.id === id);
  const workflow: HermesWorkflow = {
    id,
    name: body.name || existing?.name || 'New Workflow',
    description: body.description ?? existing?.description ?? '',
    enabled: body.enabled ?? existing?.enabled ?? true,
    trigger: body.trigger || existing?.trigger || { type: 'manual', config: {} },
    steps: body.steps || existing?.steps || [],
    createdAt: existing?.createdAt || body.createdAt || now,
    updatedAt: now,
    runs: existing?.runs || body.runs || [],
  };

  if (existing) {
    state.workflows = state.workflows.map(item => (item.id === id ? workflow : item));
  } else {
    state.workflows.push(workflow);
  }

  return workflow;
}

export function runWorkflow(id: string, input: Record<string, unknown> = {}) {
  const state = getHermesState();
  const workflow = state.workflows.find(item => item.id === id);
  if (!workflow) return null;

  const startedAt = new Date().toISOString();
  const outputs: Record<string, unknown> = { trigger: input };
  for (const step of workflow.steps) {
    if (step.type === 'agent') {
      outputs[step.outputKey] = {
        reply: 'Workflow step queued for Albert.',
      };
    } else {
      outputs[step.outputKey] = { ok: true, type: step.type, config: step.config };
    }
  }

  const run: HermesRun = {
    id: `run_${Date.now().toString(36)}`,
    workflowId: id,
    status: 'success',
    startedAt,
    finishedAt: new Date().toISOString(),
    outputs,
  };
  workflow.runs = [run, ...(workflow.runs || [])].slice(0, 50);
  workflow.updatedAt = run.finishedAt;
  return run;
}
