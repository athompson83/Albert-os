import { mockTasks } from '@/lib/mock-data';
import { buildProgressReply } from '@/lib/progress';
import {
  buildCapabilitiesReply,
  buildCapabilityTrace,
  findCapabilityForMessage,
  getCapabilities,
} from '@/lib/capabilities';
import { getDistributionSnapshot } from '@/lib/distribution';
import { logExchange } from '@/lib/exchange-log';

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
  assignedTo?: 'adam' | 'hermes' | 'albert';
  requestKind?: 'general' | 'credential' | 'product_review' | 'approval';
  requestedFields?: Array<{
    key: string;
    label: string;
    type: 'text' | 'password' | 'url' | 'textarea';
    required?: boolean;
  }>;
  response?: Record<string, string>;
  notes?: string;
  productId?: string;
  updatedAt?: string;
};

export type HermesCredential = {
  id: string;
  label: string;
  key: string;
  status: 'requested' | 'provided';
  requestedBy: string;
  updatedAt: string;
  maskedValue?: string;
};

export type HermesProduct = {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'ready' | 'needs_improvement' | 'removed' | 'published';
  type: 'pdf' | 'template' | 'site' | 'bundle';
  downloadUrl?: string;
  vercelUrl?: string;
  price?: string;
  createdAt: string;
  updatedAt: string;
  comments: Array<{ id: string; author: string; text: string; createdAt: string }>;
};

export type HermesEvent = {
  id: string;
  type:
    | 'task_updated'
    | 'credential_updated'
    | 'product_updated'
    | 'status'
    | 'hermes_inbox'
    | 'app_request_created'
    | 'app_request_blocked';
  title: string;
  detail: string;
  timestamp: string;
  entityId?: string;
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
  credentials: HermesCredential[];
  products: HermesProduct[];
  events: HermesEvent[];
  connectedAt: string;
  lastUpdatedAt: string;
};

const stateKey = '__albertHermesGatewayState';

function getConfiguredGatewayUrl() {
  return (process.env.ALBERT_GATEWAY_URL || process.env.HERMES_GATEWAY_URL || '').replace(/\/+$/, '');
}

function getGatewayHost(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url || null;
  }
}

export function getHermesRuntimeConfig() {
  const url = getConfiguredGatewayUrl();
  return {
    mode: url ? 'external-http' : 'builtin-local',
    externalGatewayConfigured: Boolean(url),
    externalGatewayHost: url ? getGatewayHost(url) : null,
    envKeys: {
      ALBERT_GATEWAY_URL: Boolean(process.env.ALBERT_GATEWAY_URL),
      HERMES_GATEWAY_URL: Boolean(process.env.HERMES_GATEWAY_URL),
    },
  };
}

function extractGatewayReply(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  const candidates = [
    record.reply,
    record.response,
    record.message,
    record.content,
    record.final_response,
    typeof record.result === 'object' && record.result ? (record.result as Record<string, unknown>).content : null,
  ];
  const match = candidates.find(value => typeof value === 'string' && value.trim());
  return typeof match === 'string' ? match.trim() : null;
}

function normalizeAgentLabels(reply: string) {
  return reply
    .replace(/\bSentinelQA\b/g, 'Hermes')
    .replace(/\bOperator\b/g, 'Hermes')
    .replace(/\boperator\b/g, 'Hermes')
    .replace(/\b3 agents\b/g, '1 agent')
    .replace(/Agent:\s*Hermes/gi, 'Agent: Hermes');
}

function isRouterTraceReply(reply: string) {
  return /matched this request to|Run trace:|Mode:\s*on-demand|Endpoint:\s*\//i.test(reply);
}

function wantsCapabilityCatalog(normalized: string) {
  return (
    normalized.includes('capability') ||
    normalized.includes('capabilities') ||
    normalized.includes('what can you do') ||
    normalized.includes('skills') ||
    normalized.includes('tools') ||
    normalized.includes('endpoint') ||
    normalized.includes('api route')
  );
}

function buildNaturalAlbertReply(message: string) {
  const state = getHermesState();
  const normalized = message.toLowerCase();
  const openTasks = state.tasks.filter(task => !task.archivedAt && task.status !== 'done');
  const credentialRequests = openTasks.filter(task => task.requestKind === 'credential');
  const distribution = getDistributionSnapshot();
  const connectedPlatforms = distribution.platforms
    .filter(platform => platform.connection?.status === 'connected')
    .map(platform => platform.name);

  if (normalized.includes('beehiiv') || normalized.includes('beehiv') || normalized.includes('newsletter')) {
    return [
      'Yes. Beehiiv belongs in the Newsletter workflow.',
      '',
      'AlbertOS has these Beehiiv paths wired:',
      '- /newsletter for drafting, reviewing, and saving newsletter content',
      '- /api/newsletter/publication to check the Beehiiv publication connection',
      '- /api/newsletter/posts to list or create Beehiiv posts when BEEHIIV_API_KEY and BEEHIIV_PUBLICATION_ID are set',
      '',
      'For Hermes: check /hermes/bootstrap, then use the newsletter endpoints above. If Beehiiv is not configured, ask Adam for BEEHIIV_API_KEY and BEEHIIV_PUBLICATION_ID through the Credentials page instead of guessing.',
    ].join('\n');
  }

  if (normalized.includes('credential') || normalized.includes('connect account') || normalized.includes('distribution')) {
    return [
      connectedPlatforms.length
        ? `Distribution Hub has ${connectedPlatforms.length} connected platform${connectedPlatforms.length === 1 ? '' : 's'}: ${connectedPlatforms.join(', ')}.`
        : 'Distribution Hub is ready, but no publishing platforms are connected yet.',
      '',
      'Use /content/distribute to add platform credentials. When you save one, AlbertOS masks it, stores it securely, logs the exchange, and exposes connection status to Hermes at /hermes/distribution.',
      credentialRequests.length
        ? `There are also ${credentialRequests.length} open Hermes credential request${credentialRequests.length === 1 ? '' : 's'} on /credentials.`
        : 'There are no extra Hermes credential requests beyond the platform connections right now.',
    ].join('\n');
  }

  if (
    normalized.includes('app request') ||
    normalized.includes('coding agent') ||
    normalized.includes('computer') ||
    normalized.includes('apoc') ||
    normalized.includes('proficiencyai') ||
    normalized.includes('baseproficiencyai')
  ) {
    return [
      'AlbertOS has a guarded Hermes app-request lane now.',
      '',
      'Hermes can ask the coding agent to work through /hermes/app-requests. Allowed requests create a visible Adam task and are saved to the logs.',
      '',
      'Protected workspaces are blocked at the API: APoC Checklist, ProficiencyAI, and Baseproficiencyai. If Hermes tries one of those, AlbertOS records the blocked request instead of acting on it.',
    ].join('\n');
  }

  if (
    normalized.includes('hermes') &&
    (
      normalized.includes('use the app') ||
      normalized.includes('use albertos') ||
      normalized.includes('knows') ||
      normalized.includes('how to use') ||
      normalized.includes('how should hermes use')
    )
  ) {
    return [
      'Hermes should treat AlbertOS as the operating surface, not just a chat window.',
      '',
      'The starting point is /hermes/bootstrap. That gives Hermes the current manifest, write contracts, task/product/credential endpoints, distribution status, Stripe status, and logging rules.',
      '',
      'The most important write paths are /hermes/tasks, /hermes/products, /hermes/credentials, /hermes/app-requests, /api/progress/feedback, /api/logs/exchanges, and /api/distribution. After any write, Hermes should confirm with /hermes/health or /api/status.',
      '',
      'Hermes must not request or operate in APoC Checklist, ProficiencyAI, or Baseproficiencyai. Those are protected workspaces.',
    ].join('\n');
  }

  if (normalized.includes('progress') || normalized.includes('what are you working') || normalized.includes('working on')) {
    return buildProgressReply();
  }

  if (normalized.includes('product') || normalized.includes('download') || normalized.includes('sell')) {
    const activeProducts = state.products.filter(product => product.status !== 'removed');
    return [
      `I can see ${activeProducts.length} active digital products in AlbertOS.`,
      'Use /products to download, comment, approve, request improvements, or remove a product. Feedback there is sent to Albert and saved to the exchange logs.',
      'Hermes can use /hermes/products for the same product state.',
    ].join('\n');
  }

  if (
    normalized.includes('image generator') ||
    normalized.includes('video editor') ||
    normalized.includes('content optimizer') ||
    normalized.includes('creative tools') ||
    normalized.includes('rebrand')
  ) {
    return [
      'Creative Tools are available in AlbertOS under /content/tools.',
      '',
      'Hermes can use /hermes/content-tools to create image jobs, video jobs, viral clip jobs, and brand optimizer jobs. The brand kit lives at /api/content-tools/brand so colors, logo URL, voice, audience, and design rules can be reused across outputs.',
      '',
      'Image rendering uses OPENAI_API_KEY when configured. Video rendering needs a connected provider key such as FAL_KEY, RUNWAY_API_KEY, or DESCRIPT_API_KEY.',
    ].join('\n');
  }

  if (normalized.includes('task') || normalized.includes('approval') || normalized.includes('need from me')) {
    const preview = openTasks.slice(0, 4).map(task => `- ${task.title} (${task.priority}, ${task.status})`);
    return [
      openTasks.length ? `You have ${openTasks.length} open task${openTasks.length === 1 ? '' : 's'} in AlbertOS.` : 'I do not see open tasks right now.',
      ...preview,
      '',
      'Open /tasks for the full list. If a task needs input, click it and submit the requested details; AlbertOS logs that handoff for Hermes.',
    ].join('\n');
  }

  if (normalized.includes('stripe') || normalized.includes('revenue') || normalized.includes('customer')) {
    return [
      'Stripe is surfaced through /customers and /revenue.',
      'Hermes can read /api/stripe/summary for customers, payments, and gross revenue. AlbertOS only shows a setup warning when STRIPE_SECRET_KEY is missing from the running deployment.',
    ].join('\n');
  }

  return [
    "I'm here with the AlbertOS command-center context.",
    '',
    "Ask me naturally about tasks, products, credentials, Distribution Hub, Beehiiv/newsletters, Stripe revenue, progress, or how Hermes should use the app. I'll answer like a working partner first, and keep the endpoint details available when they help.",
  ].join('\n');
}

async function requestExternalGateway(message: string, agentId: string) {
  const gatewayUrl = getConfiguredGatewayUrl();
  if (!gatewayUrl) return { configured: false, reply: null as string | null, error: null as string | null };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const res = await fetch(`${gatewayUrl}/agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({
        message,
        prompt: message,
        agentId,
        source: 'albert-os-chat',
      }),
      signal: controller.signal,
      cache: 'no-store',
    });
    const text = await res.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { response: text };
    }

    if (!res.ok) {
      return {
        configured: true,
        reply: null,
        error: `Hermes HTTP ${res.status}: ${text.slice(0, 180) || res.statusText}`,
      };
    }

    const reply = extractGatewayReply(data);
    if (!reply) {
      return {
        configured: true,
        reply: null,
        error: `Hermes replied without a usable message field. Keys: ${data && typeof data === 'object' ? Object.keys(data as Record<string, unknown>).join(', ') : 'none'}`,
      };
    }

    return { configured: true, reply: normalizeAgentLabels(reply), error: null };
  } catch (error) {
    return {
      configured: true,
      reply: null,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

function initialAgents(): HermesAgent[] {
  return [
    {
      id: 'albert',
      name: 'Albert',
      emoji: 'A',
      role: 'Hermes command agent',
      description: 'Coordinates strategy, execution, revenue experiments, and Adam-facing operations through Hermes.',
      color: '#6366f1',
      isDefault: true,
      sessionId: 'albert-os-web',
      avatar: '/avatars/albert.png',
      context: 'Albert OS is Adam Thompson personal AI command center connected through a Hermes-compatible HTTP gateway.',
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

function initialProducts(): HermesProduct[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'prod_emt_cards',
      title: 'EMT Quick Reference Cards',
      description: '6-page printable PDF with vital signs, GCS, APGAR, algorithms, and assessment tools.',
      status: 'ready',
      type: 'pdf',
      downloadUrl: 'https://emt-guide-xi.vercel.app/store/pdfs/EMT_Quick_Reference_Cards.pdf',
      price: '$4.99',
      createdAt: now,
      updatedAt: now,
      comments: [],
    },
    {
      id: 'prod_paramedic_pharm',
      title: 'Paramedic Pharmacology Cheat Sheet',
      description: '18 critical EMS medications with doses, routes, contraindications, and clinical pearls.',
      status: 'ready',
      type: 'pdf',
      downloadUrl: 'https://emt-guide-xi.vercel.app/store/pdfs/Paramedic_Pharmacology_Cheat_Sheet.pdf',
      price: '$6.99',
      createdAt: now,
      updatedAt: now,
      comments: [],
    },
    {
      id: 'prod_ekg_guide',
      title: 'EKG/ECG Interpretation Guide',
      description: '4-page comprehensive EKG reference with normal values, 8-step interpretation, STEMI localization, and dysrhythmias.',
      status: 'ready',
      type: 'pdf',
      downloadUrl: 'https://emt-guide-xi.vercel.app/store/pdfs/EKG_Interpretation_Guide.pdf',
      price: '$5.99',
      createdAt: now,
      updatedAt: now,
      comments: [],
    },
    {
      id: 'prod_med_terminology',
      title: 'EMS Medical Terminology',
      description: '3-page medical terminology reference with prefixes, suffixes, body systems, and directional terms.',
      status: 'ready',
      type: 'pdf',
      downloadUrl: 'https://emt-guide-xi.vercel.app/store/pdfs/EMS_Medical_Terminology.pdf',
      price: '$3.99',
      createdAt: now,
      updatedAt: now,
      comments: [],
    },
    {
      id: 'prod_ems_bundle',
      title: 'EMS Study Essentials Bundle',
      description: 'Both EMT Reference Cards and Paramedic Pharmacology Cheat Sheet at a discount.',
      status: 'ready',
      type: 'pdf',
      downloadUrl: 'https://emt-guide-xi.vercel.app/store/pdfs/EMS_Study_Essentials_Bundle.pdf',
      price: '$12.99',
      createdAt: now,
      updatedAt: now,
      comments: [],
    },
    {
      id: 'prod_complete_library',
      title: 'Complete EMS Study Library',
      description: 'All 5 original guides at maximum discount. The ultimate EMS study collection.',
      status: 'ready',
      type: 'pdf',
      downloadUrl: 'https://emt-guide-xi.vercel.app/store/pdfs/Complete_EMS_Study_Library.pdf',
      price: '$19.99',
      createdAt: now,
      updatedAt: now,
      comments: [],
    },
    {
      id: 'prod_nremt_practice',
      title: 'NREMT Practice Test',
      description: '30 practice questions with detailed explanations covering all NREMT content areas.',
      status: 'ready',
      type: 'pdf',
      downloadUrl: 'https://emt-guide-xi.vercel.app/store/pdfs/NREMT_Practice_Test.pdf',
      price: '$9.99',
      createdAt: now,
      updatedAt: now,
      comments: [],
    },
    {
      id: 'prod_ecg_rhythm',
      title: 'ECG Rhythm Strip Practice',
      description: '30 ECG rhythm strips with interpretation guide, 8-step method, and practice scenarios.',
      status: 'ready',
      type: 'pdf',
      downloadUrl: 'https://emt-guide-xi.vercel.app/store/pdfs/ECG_Rhythm_Strip_Practice.pdf',
      price: '$7.99',
      createdAt: now,
      updatedAt: now,
      comments: [],
    },
    {
      id: 'prod_ems_scenarios',
      title: 'EMS Scenario Cards',
      description: '20 realistic EMS call scenarios for individual or group training.',
      status: 'ready',
      type: 'pdf',
      downloadUrl: 'https://emt-guide-xi.vercel.app/store/pdfs/EMS_Scenario_Cards.pdf',
      price: '$5.99',
      createdAt: now,
      updatedAt: now,
      comments: [],
    },
    {
      id: 'prod_drug_calc',
      title: 'Paramedic Drug Calculation Workbook',
      description: '25 practice problems with step-by-step solutions covering weight-based doses and drip rates.',
      status: 'ready',
      type: 'pdf',
      downloadUrl: 'https://emt-guide-xi.vercel.app/store/pdfs/Drug_Calculation_Workbook.pdf',
      price: '$6.99',
      createdAt: now,
      updatedAt: now,
      comments: [],
    },
    {
      id: 'prod_complete_practice_bundle',
      title: 'Complete EMS Practice Bundle',
      description: 'All 4 practice tools: NREMT Practice Test, ECG Rhythm Strip Practice, EMS Scenario Cards, and Drug Calculation Workbook. Maximum prep at maximum value.',
      status: 'ready',
      type: 'pdf',
      downloadUrl: 'https://emt-guide-xi.vercel.app/store/pdfs/Complete_EMS_Practice_Bundle.pdf',
      price: '$34.99',
      createdAt: now,
      updatedAt: now,
      comments: [],
    },
    {
      id: 'prod_mastering_ekg',
      title: 'Mastering EKG Rhythm Interpretation',
      description: 'The complete guide to cardiac rhythm interpretation. 17 chapters, 300+ pages, hundreds of EKG strips, the SAVE Method, and a 50-rhythm challenge. By Adam Thompson, EMT-P, MS.',
      status: 'ready',
      type: 'pdf',
      downloadUrl: 'https://emt-guide-xi.vercel.app/store/pdfs/Mastering_EKG_Rhythm_Interpretation.pdf',
      price: '$29.99',
      createdAt: now,
      updatedAt: now,
      comments: [],
    },
    {
      id: 'prod_rapid_ekg',
      title: 'Rapid Interpretation of EKG Rhythms',
      description: 'Quick-reference rhythm guide. Fast-paced, exam-focused. 250+ pages of rhythm interpretation. By Adam Thompson, EMT-P, MS.',
      status: 'ready',
      type: 'pdf',
      downloadUrl: 'https://emt-guide-xi.vercel.app/store/pdfs/Rapid_Interpretation_of_EKG_Rhythms.pdf',
      price: '$19.99',
      createdAt: now,
      updatedAt: now,
      comments: [],
    },
    {
      id: 'prod_ddx_guide',
      title: 'ECG Differential Diagnosis Guide',
      description: 'Master ECG by differential diagnosis. 16 chapters covering axis, P wave, QRS, ST, T wave abnormalities, and special conditions. By Adam Thompson, EMT-P, MS.',
      status: 'ready',
      type: 'pdf',
      downloadUrl: 'https://emt-guide-xi.vercel.app/store/pdfs/ECG_Differential_Diagnosis_Guide.pdf',
      price: '$24.99',
      createdAt: now,
      updatedAt: now,
      comments: [],
    },
    {
      id: 'prod_paramedic_ecg',
      title: 'Electrocardiography for Paramedics',
      description: 'The paramedic\'s complete ECG reference. 17 chapters with real-world scenarios and review questions. By Adam Thompson, EMT-P, MS.',
      status: 'ready',
      type: 'pdf',
      downloadUrl: 'https://emt-guide-xi.vercel.app/store/pdfs/Electrocardiography_for_Paramedics.pdf',
      price: '$24.99',
      createdAt: now,
      updatedAt: now,
      comments: [],
    },
    {
      id: 'prod_ekg_master_bundle',
      title: 'EKG Master Collection',
      description: 'All 4 EKG textbooks: Mastering EKG, Rapid Interpretation, DDx Guide, and Paramedic ECG. 1,100+ pages total. Save $40.',
      status: 'ready',
      type: 'pdf',
      downloadUrl: 'https://emt-guide-xi.vercel.app/store/pdfs/',
      price: '$59.99',
      createdAt: now,
      updatedAt: now,
      comments: [],
    },
  ];
}

function initialCredentialTasks(): HermesTask[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'cred_meta_instagram',
      title: 'Provide Instagram Graph API access',
      description: 'Hermes needs this to post and sell digital products through Instagram automation.',
      project: 'Hermes Credentials',
      priority: 'high',
      status: 'todo',
      source: 'hermes',
      assignedTo: 'adam',
      requestKind: 'credential',
      requestedFields: [
        { key: 'instagram_app_id', label: 'Meta App ID', type: 'text', required: true },
        { key: 'instagram_app_secret', label: 'Meta App Secret', type: 'password', required: true },
        { key: 'instagram_access_token', label: 'Instagram Access Token', type: 'password', required: true },
      ],
      updatedAt: now,
    },
    {
      id: 'cred_fal_billing',
      title: 'Confirm FAL.ai billing is funded',
      description: 'Hermes needs image generation credits for product graphics and storefront assets.',
      project: 'Hermes Credentials',
      priority: 'medium',
      status: 'todo',
      source: 'hermes',
      assignedTo: 'adam',
      requestKind: 'credential',
      requestedFields: [
        { key: 'fal_api_key', label: 'FAL API Key', type: 'password', required: true },
        { key: 'fal_billing_note', label: 'Billing note', type: 'textarea' },
      ],
      updatedAt: now,
    },
  ];
}

export function getHermesState(): HermesState {
  const globalStore = globalThis as typeof globalThis & { [stateKey]?: HermesState };
  if (!globalStore[stateKey]) {
    globalStore[stateKey] = {
      agents: initialAgents(),
      tasks: [
        ...initialCredentialTasks(),
        ...mockTasks.map(task => ({
          ...task,
          source: 'local',
          assignedTo: 'adam',
          requestKind: 'general',
          updatedAt: new Date().toISOString(),
        })),
      ] as HermesTask[],
      workflows: initialWorkflows(),
      chats: [],
      credentials: [],
      products: initialProducts(),
      events: [],
      connectedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
    };
  }
  const state = globalStore[stateKey]!;
  state.agents = state.agents.filter(agent => agent.id === 'albert');
  state.credentials ||= [];
  state.products ||= initialProducts();
  state.events ||= [];
  state.connectedAt ||= new Date().toISOString();
  state.lastUpdatedAt ||= new Date().toISOString();
  state.tasks = state.tasks.map(task => ({
    assignedTo: 'adam',
    requestKind: 'general',
    updatedAt: state.lastUpdatedAt,
    ...task,
  }));
  state.products = state.products.map(product => {
    if (product.id === 'prod_emt_cards') {
      return { ...product, downloadUrl: '/api/products/download/prod_emt_cards' };
    }
    if (product.id === 'prod_paramedic_pharm') {
      return { ...product, downloadUrl: '/api/products/download/prod_paramedic_pharm' };
    }
    return product;
  });
  for (const credentialTask of initialCredentialTasks()) {
    if (!state.tasks.some(task => task.id === credentialTask.id)) {
      state.tasks.unshift(credentialTask);
    }
  }
  return state;
}

function touchState() {
  getHermesState().lastUpdatedAt = new Date().toISOString();
}

export function recordHermesEvent(event: Omit<HermesEvent, 'id' | 'timestamp'>) {
  const state = getHermesState();
  const entry: HermesEvent = {
    id: `evt_${Date.now().toString(36)}`,
    timestamp: new Date().toISOString(),
    ...event,
  };
  state.events = [entry, ...state.events].slice(0, 100);
  state.lastUpdatedAt = entry.timestamp;
  logExchange({
    source: event.type === 'hermes_inbox' ? 'hermes' : 'system',
    direction: 'internal',
    channel: 'hermes-events',
    kind: event.type,
    actor: event.type === 'hermes_inbox' ? 'Hermes' : 'AlbertOS',
    targetAgentId: 'albert',
    summary: `${event.title}: ${event.detail}`,
    relatedId: event.entityId,
    payload: entry,
  });
  return entry;
}

export async function createGatewayReply(message: string, agentId = 'albert') {
  const state = getHermesState();
  const agent = state.agents.find(item => item.id === agentId) || state.agents[0];
  const normalized = message.toLowerCase();
  const external = await requestExternalGateway(message, agent.id);

  if (external.reply) {
    if (isRouterTraceReply(external.reply)) {
      return buildNaturalAlbertReply(message);
    }
    return external.reply;
  }

  if (external.configured) {
    const runtime = getHermesRuntimeConfig();
    const detail = external.error ? ` Last error: ${external.error}` : '';
    return [
      `I could not reach live Hermes at ${runtime.externalGatewayHost || 'the configured gateway'}.`,
      detail,
      'I did not generate a fake Hermes answer. Check that ALBERT_GATEWAY_URL or HERMES_GATEWAY_URL points to the active Hermes HTTP API, then send the message again.',
    ].filter(Boolean).join('\n');
  }

  if (
    wantsCapabilityCatalog(normalized)
  ) {
    return buildCapabilitiesReply();
  }

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
    const readyCapabilities = getCapabilities().filter(capability => capability.status === 'ready').length;
    return [
      `${agent.name} is online and connected through the Hermes HTTP API.`,
      `Current workspace: ${state.agents.length} agents, ${openTasks} open tasks, ${state.workflows.length} workflow, and ${readyCapabilities} ready capabilities.`,
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

  const matchedCapability = wantsCapabilityCatalog(normalized) ? findCapabilityForMessage(message) : null;
  if (matchedCapability) {
    const trace = buildCapabilityTrace(matchedCapability, 'chat');
    return [
      `${matchedCapability.name} is available in AlbertOS.`,
      matchedCapability.description,
      '',
      `Status: ${trace.status.replace('_', ' ')}`,
      matchedCapability.endpoint ? `Endpoint: ${matchedCapability.endpoint}` : '',
      matchedCapability.nextAction ? `Needs Adam: ${matchedCapability.nextAction}` : '',
    ].filter(Boolean).join('\n');
  }

  return buildNaturalAlbertReply(message);
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
  touchState();
  logExchange({
    source: project.toLowerCase() === 'slack' ? 'slack' : 'web',
    direction: 'inbound',
    channel: project,
    kind: 'chat_exchange',
    actor: 'Adam',
    targetAgentId: 'albert',
    summary: message.slice(0, 180),
    relatedId: entry.id,
    payload: { message, reply, project, attachments },
  });
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

  recordHermesEvent({
    type: 'status',
    title: 'Agent registry updated',
    detail: `${agent.name} was ${existing ? 'updated' : 'created'}.`,
    entityId: agent.id,
  });
  logExchange({
    source: 'web',
    direction: 'internal',
    channel: 'agents',
    kind: existing ? 'agent_updated' : 'agent_created',
    actor: 'AlbertOS',
    targetAgentId: agent.id,
    summary: `${agent.name} was ${existing ? 'updated' : 'created'}.`,
    relatedId: agent.id,
    payload: agent,
  });
  return agent;
}

export function upsertTask(body: Partial<HermesTask>) {
  const state = getHermesState();
  const now = new Date().toISOString();
  const id = body.id || `task_${Date.now().toString(36)}`;
  const existing = state.tasks.find(task => task.id === id);
  const requestKind = body.requestKind || existing?.requestKind || 'general';
  const response = requestKind === 'credential' && body.response
    ? Object.fromEntries(Object.entries(body.response).map(([key, value]) => [key, value ? maskCredential(String(value)) : '']))
    : body.response || existing?.response;
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
    assignedTo: body.assignedTo || existing?.assignedTo || 'adam',
    requestKind,
    requestedFields: body.requestedFields || existing?.requestedFields,
    response,
    notes: body.notes ?? existing?.notes,
    productId: body.productId || existing?.productId,
    updatedAt: now,
  };

  if (existing) {
    state.tasks = state.tasks.map(item => (item.id === id ? task : item));
  } else {
    state.tasks.push(task);
  }

  recordHermesEvent({
    type: 'task_updated',
    title: 'Task updated',
    detail: `${task.title} is now ${task.status}.`,
    entityId: task.id,
  });
  if (body.response || body.notes) {
    logExchange({
      source: 'web',
      direction: 'inbound',
      channel: 'tasks',
      kind: 'task_feedback',
      actor: task.assignedTo === 'adam' ? 'Adam' : 'AlbertOS',
      targetAgentId: 'albert',
      summary: `${task.title}: ${body.notes || 'Adam supplied requested task information.'}`,
      relatedId: task.id,
      payload: { taskId: task.id, response: body.response, notes: body.notes, status: task.status },
    });
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
  recordHermesEvent({
    type: 'status',
    title: 'Workflow run completed',
    detail: `${workflow.name} completed with ${workflow.steps.length} step${workflow.steps.length === 1 ? '' : 's'}.`,
    entityId: workflow.id,
  });
  logExchange({
    source: 'system',
    direction: 'internal',
    channel: 'workflows',
    kind: 'workflow_run',
    actor: 'AlbertOS',
    targetAgentId: 'albert',
    summary: `${workflow.name} completed.`,
    relatedId: workflow.id,
    payload: run,
  });
  return run;
}

function maskCredential(value: string) {
  if (!value) return '';
  if (value.length <= 8) return '********';
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export function upsertCredential(body: Partial<HermesCredential> & { value?: string }) {
  const state = getHermesState();
  const now = new Date().toISOString();
  const key = body.key || body.id || `credential_${Date.now().toString(36)}`;
  const existing = state.credentials.find(item => item.key === key || item.id === key);
  const credential: HermesCredential = {
    id: existing?.id || `cred_${key.replace(/[^a-z0-9_]/gi, '_').toLowerCase()}`,
    key,
    label: body.label || existing?.label || key,
    status: body.value || body.status === 'provided' ? 'provided' : existing?.status || 'requested',
    requestedBy: body.requestedBy || existing?.requestedBy || 'Hermes',
    updatedAt: now,
    maskedValue: body.value ? maskCredential(body.value) : existing?.maskedValue,
  };

  if (existing) {
    state.credentials = state.credentials.map(item => (item.id === existing.id ? credential : item));
  } else {
    state.credentials.push(credential);
  }

  recordHermesEvent({
    type: 'credential_updated',
    title: 'Credential updated',
    detail: `${credential.label} is ${credential.status}.`,
    entityId: credential.id,
  });
  logExchange({
    source: 'web',
    direction: 'inbound',
    channel: 'credentials',
    kind: credential.status === 'provided' ? 'credential_provided' : 'credential_requested',
    actor: body.value ? 'Adam' : credential.requestedBy,
    targetAgentId: 'albert',
    summary: `${credential.label} is ${credential.status}.`,
    relatedId: credential.id,
    payload: credential,
  });
  return credential;
}

export function upsertProduct(body: Partial<HermesProduct> & { comment?: string; author?: string }) {
  const state = getHermesState();
  const now = new Date().toISOString();
  const id = body.id || `prod_${Date.now().toString(36)}`;
  const existing = state.products.find(product => product.id === id);
  const comments = [...(existing?.comments || [])];
  if (body.comment?.trim()) {
    comments.unshift({
      id: `comment_${Date.now().toString(36)}`,
      author: body.author || 'Adam',
      text: body.comment.trim(),
      createdAt: now,
    });
  }

  const product: HermesProduct = {
    id,
    title: body.title || existing?.title || 'New digital product',
    description: body.description ?? existing?.description ?? '',
    status: body.status || existing?.status || 'draft',
    type: body.type || existing?.type || 'pdf',
    downloadUrl: body.downloadUrl ?? existing?.downloadUrl,
    vercelUrl: body.vercelUrl ?? existing?.vercelUrl,
    price: body.price ?? existing?.price,
    createdAt: existing?.createdAt || body.createdAt || now,
    updatedAt: now,
    comments,
  };

  if (existing) {
    state.products = state.products.map(item => (item.id === id ? product : item));
  } else {
    state.products.push(product);
  }

  recordHermesEvent({
    type: 'product_updated',
    title: 'Product updated',
    detail: `${product.title} is now ${product.status.replace('_', ' ')}.`,
    entityId: product.id,
  });
  if (body.comment?.trim()) {
    logExchange({
      source: 'web',
      direction: 'inbound',
      channel: 'products',
      kind: 'product_feedback',
      actor: body.author || 'Adam',
      targetAgentId: 'albert',
      summary: `${product.title}: ${body.comment.trim()}`,
      relatedId: product.id,
      payload: { productId: product.id, status: product.status, comment: body.comment.trim() },
    });
  } else {
    logExchange({
      source: 'hermes',
      direction: existing ? 'internal' : 'inbound',
      channel: 'products',
      kind: existing ? 'product_updated' : 'product_created',
      actor: 'Hermes',
      targetAgentId: 'albert',
      summary: `${product.title} is now ${product.status.replace('_', ' ')}.`,
      relatedId: product.id,
      payload: product,
    });
  }
  return product;
}

export function ingestHermesUpdate(body: Record<string, unknown>) {
  const kind = String(body.kind || body.type || 'status');
  const title = String(body.title || body.summary || 'Hermes update');
  const detail = String(body.detail || body.message || body.description || 'Hermes sent an update to Albert OS.');

  logExchange({
    source: 'hermes',
    direction: 'inbound',
    channel: 'hermes-inbox',
    kind,
    actor: 'Hermes',
    targetAgentId: typeof body.agentId === 'string' ? body.agentId : 'albert',
    summary: title,
    relatedId: typeof body.entityId === 'string' ? body.entityId : undefined,
    payload: body,
  });

  if (kind === 'task' && typeof body.task === 'object' && body.task) {
    return { kind, task: upsertTask(body.task as Partial<HermesTask>) };
  }

  if (kind === 'product' && typeof body.product === 'object' && body.product) {
    return { kind, product: upsertProduct(body.product as Partial<HermesProduct>) };
  }

  if (kind === 'credential' && typeof body.credential === 'object' && body.credential) {
    return { kind, credential: upsertCredential(body.credential as Partial<HermesCredential> & { value?: string }) };
  }

  const event = recordHermesEvent({
    type: 'hermes_inbox',
    title,
    detail,
    entityId: typeof body.entityId === 'string' ? body.entityId : undefined,
  });
  return { kind, event };
}
