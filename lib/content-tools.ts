import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { logExchange } from '@/lib/exchange-log';
import { recordHermesEvent } from '@/lib/hermes-gateway';

export type ContentToolKind = 'image' | 'video' | 'optimizer';
export type VideoMode = 'similar_from_link' | 'viral_clip' | 'text_to_video';
export type ContentToolStatus = 'completed' | 'draft_ready' | 'needs_provider' | 'failed';

export type BrandProfile = {
  name: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontStyle?: string;
  voice?: string;
  audience?: string;
  designNotes?: string;
  updatedAt: string;
};

export type ContentToolJob = {
  id: string;
  kind: ContentToolKind;
  title: string;
  status: ContentToolStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  provider?: string;
  error?: string;
};

type ContentToolsStore = {
  brand: BrandProfile;
  jobs: ContentToolJob[];
};

const stateKey = '__albertContentToolsState';

const defaultBrand: BrandProfile = {
  name: 'Albert OS',
  primaryColor: '#6366f1',
  secondaryColor: '#0f172a',
  accentColor: '#10b981',
  fontStyle: 'Clean, premium, direct, modern SaaS.',
  voice: 'Clear, confident, useful, revenue-focused.',
  audience: 'EMS leaders, clinicians, entrepreneurs, and digital product customers.',
  designNotes: 'Use strong contrast, simple hierarchy, clean layouts, and practical calls to action.',
  updatedAt: new Date(0).toISOString(),
};

function getStorePath() {
  return process.env.ALBERT_CONTENT_TOOLS_STORE ||
    (process.env.VERCEL ? join('/tmp', 'albert-os-content-tools.json') : join(process.cwd(), '.albert-os', 'content-tools.json'));
}

function readStore(): ContentToolsStore {
  try {
    const path = getStorePath();
    if (!existsSync(path)) return { brand: defaultBrand, jobs: [] };
    const parsed = JSON.parse(readFileSync(path, 'utf-8'));
    return {
      brand: { ...defaultBrand, ...(parsed.brand || {}) },
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
    };
  } catch {
    return { brand: defaultBrand, jobs: [] };
  }
}

function writeStore(store: ContentToolsStore) {
  try {
    const path = getStorePath();
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(store, null, 2), 'utf-8');
  } catch {}
}

function contentToolsStore() {
  const globalStore = globalThis as typeof globalThis & { [stateKey]?: ContentToolsStore };
  globalStore[stateKey] ||= readStore();
  return globalStore[stateKey]!;
}

function saveJob(job: ContentToolJob) {
  const store = contentToolsStore();
  const existing = store.jobs.findIndex(item => item.id === job.id);
  if (existing >= 0) {
    store.jobs[existing] = job;
  } else {
    store.jobs.unshift(job);
  }
  store.jobs = store.jobs.slice(0, 100);
  writeStore(store);

  recordHermesEvent({
    type: 'status',
    title: `Content tool job: ${job.title}`,
    detail: `${job.kind} job is ${job.status}.`,
    entityId: job.id,
  });

  logExchange({
    source: job.createdBy.toLowerCase().includes('hermes') ? 'hermes' : 'web',
    direction: 'inbound',
    channel: 'content-tools',
    kind: `content_tool_${job.kind}`,
    actor: job.createdBy,
    targetAgentId: 'albert',
    summary: `${job.title} ${job.status}.`,
    relatedId: job.id,
    payload: {
      kind: job.kind,
      status: job.status,
      input: job.input,
      output: job.output,
      provider: job.provider,
      error: job.error,
    },
  });

  return job;
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function slugId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function providerSetupMessage(kind: ContentToolKind) {
  if (kind === 'image') {
    return 'Set OPENAI_API_KEY to generate images directly. Optional: set OPENAI_IMAGE_MODEL to override the default image model.';
  }
  if (kind === 'video') {
    return 'Connect a video generation/editing provider such as FAL_KEY, RUNWAY_API_KEY, or DESCRIPT_API_KEY to render videos automatically.';
  }
  return 'Set OPENAI_API_KEY to let Albert rewrite and optimize content with an LLM. Local brand formatting is available without it.';
}

function buildImagePrompt(input: Record<string, unknown>, brand: BrandProfile) {
  const prompt = asString(input.prompt, 'Create a high-converting digital product image.');
  const style = asString(input.style, 'premium commercial visual');
  const ratio = asString(input.aspectRatio, '1024x1024');
  return [
    prompt,
    '',
    `Brand: ${brand.name}.`,
    `Palette: primary ${brand.primaryColor}, secondary ${brand.secondaryColor}, accent ${brand.accentColor}.`,
    `Style: ${style}.`,
    `Audience: ${brand.audience || 'target customers'}.`,
    `Design notes: ${brand.designNotes || 'clean, polished, useful'}.`,
    `Composition: generate a finished ${ratio} image with strong focal point, clear hierarchy, and no clutter.`,
  ].join('\n');
}

async function tryGenerateOpenAiImage(prompt: string, input: Record<string, unknown>) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';
  const size = asString(input.aspectRatio, '1024x1024');
  const quality = asString(input.quality, 'high');
  const outputFormat = asString(input.outputFormat, 'png');

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt,
      size,
      quality,
      output_format: outputFormat,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || `OpenAI image generation failed with ${res.status}`);
  }

  const first = data?.data?.[0] || {};
  const b64 = first.b64_json;
  return {
    model,
    revisedPrompt: first.revised_prompt || prompt,
    imageDataUrl: b64 ? `data:image/${outputFormat};base64,${b64}` : undefined,
    url: first.url,
    usage: data.usage,
  };
}

function buildVideoPlan(input: Record<string, unknown>, brand: BrandProfile) {
  const mode = asString(input.mode, 'text_to_video') as VideoMode;
  const prompt = asString(input.prompt, 'Create a short, high-retention product video.');
  const source = asString(input.sourceUrl) || asString(input.sourceFileName);
  const transcript = asString(input.transcript);
  const format = asString(input.format, '9:16 short-form');

  const hook = transcript
    ? transcript.split(/[.!?]/).map(item => item.trim()).find(item => item.length > 35) || prompt
    : prompt;

  const common = {
    format,
    brand: brand.name,
    palette: [brand.primaryColor, brand.secondaryColor, brand.accentColor],
    captionStyle: 'large readable captions, short clauses, high contrast',
    musicDirection: 'clean momentum bed, no overpowering vocals',
    exportTargets: ['TikTok/Reels/Shorts 9:16', 'YouTube 16:9 cutdown', 'square ad 1:1'],
  };

  if (mode === 'viral_clip') {
    return {
      ...common,
      mode,
      source,
      recommendation: 'Find the first segment with a clear claim, emotional tension, practical payoff, or surprising contrast.',
      clipCandidates: [
        { label: 'Primary clip', start: '00:00', end: '00:35', reason: 'Strong hook and fastest path to value.' },
        { label: 'Alternate clip', start: '00:35', end: '01:05', reason: 'Useful detail for a follow-up post.' },
      ],
      editPlan: ['Open with the strongest claim.', 'Cut pauses and setup.', 'Add captions every 1-2 seconds.', 'End with a direct CTA.'],
    };
  }

  if (mode === 'similar_from_link') {
    return {
      ...common,
      mode,
      source,
      creativeDirection: 'Create a new original video with similar structure, pacing, and conversion intent. Do not copy protected footage, logos, music, or exact language.',
      shotList: [
        '0-3s: pattern-interrupt hook',
        '3-12s: show the problem in concrete terms',
        '12-28s: demonstrate the mechanism or product',
        '28-40s: proof, outcome, or transformation',
        '40-45s: CTA',
      ],
      script: [hook, 'Show the practical outcome.', 'Make the next step obvious.'].join(' '),
    };
  }

  return {
    ...common,
    mode,
    source,
    script: [
      hook,
      'Here is the problem your audience already feels.',
      'Here is the simple mechanism that solves it.',
      'Here is the result they can get.',
      'Take the next step now.',
    ],
    shotList: [
      'Hook text over strong visual.',
      'Problem scene or before-state.',
      'Product/process demonstration.',
      'Outcome visual.',
      'CTA end card using saved brand colors.',
    ],
  };
}

function optimizeContentLocally(input: Record<string, unknown>, brand: BrandProfile) {
  const original = asString(input.content, 'Paste content to rebrand and optimize.');
  const goal = asString(input.goal, 'make it clearer, more premium, and more conversion-focused');
  const channel = asString(input.channel, 'general');
  const title = asString(input.title, 'Rebranded Content');

  return {
    title: `${brand.name}: ${title}`,
    channel,
    goal,
    optimizedCopy: [
      `${title}`,
      '',
      original,
      '',
      `Brand treatment: use ${brand.name}'s ${brand.voice || 'clear, confident'} voice. Tighten the opening, remove filler, and make the next action obvious.`,
    ].join('\n'),
    designSystem: {
      logoUrl: brand.logoUrl || '',
      colors: {
        primary: brand.primaryColor,
        secondary: brand.secondaryColor,
        accent: brand.accentColor,
      },
      fontStyle: brand.fontStyle,
      visualDirection: brand.designNotes,
    },
    recommendations: [
      'Use one clear headline and one primary CTA.',
      'Keep the strongest proof or benefit in the first third.',
      'Apply brand colors to headings, buttons, captions, and cover art accents.',
      'Remove off-brand colors, noisy backgrounds, and generic stock-style imagery.',
    ],
  };
}

export function getContentToolsSnapshot() {
  const store = contentToolsStore();
  const providers = {
    image: {
      connected: Boolean(process.env.OPENAI_API_KEY),
      provider: 'OpenAI Images API',
      required: ['OPENAI_API_KEY'],
      optional: ['OPENAI_IMAGE_MODEL'],
    },
    video: {
      connected: Boolean(process.env.FAL_KEY || process.env.RUNWAY_API_KEY || process.env.DESCRIPT_API_KEY),
      provider: process.env.DESCRIPT_API_KEY ? 'Descript' : process.env.RUNWAY_API_KEY ? 'Runway' : process.env.FAL_KEY ? 'Fal' : 'Video provider',
      requiredOneOf: ['FAL_KEY', 'RUNWAY_API_KEY', 'DESCRIPT_API_KEY'],
    },
    optimizer: {
      connected: Boolean(process.env.OPENAI_API_KEY),
      provider: 'OpenAI text model or local optimizer',
      requiredForAiRewrite: ['OPENAI_API_KEY'],
    },
  };

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    brand: store.brand,
    jobs: store.jobs,
    recentJobs: store.jobs.slice(0, 20),
    providers,
    endpoints: {
      app: '/content/tools',
      api: '/api/content-tools',
      brand: '/api/content-tools/brand',
      hermes: '/hermes/content-tools',
    },
    writeContracts: {
      saveBrand: { method: 'POST', endpoint: '/api/content-tools/brand', required: ['name', 'primaryColor', 'secondaryColor', 'accentColor'] },
      generateImage: { method: 'POST', endpoint: '/api/content-tools', required: ['kind=image', 'prompt'] },
      createVideo: { method: 'POST', endpoint: '/api/content-tools', required: ['kind=video', 'mode'], optional: ['prompt', 'sourceUrl', 'sourceFileName', 'transcript'] },
      optimizeContent: { method: 'POST', endpoint: '/api/content-tools', required: ['kind=optimizer', 'content'] },
    },
  };
}

export function saveBrandProfile(input: Partial<BrandProfile>) {
  const store = contentToolsStore();
  const now = new Date().toISOString();
  store.brand = {
    ...store.brand,
    name: asString(input.name, store.brand.name),
    logoUrl: asString(input.logoUrl, store.brand.logoUrl || '') || undefined,
    primaryColor: asString(input.primaryColor, store.brand.primaryColor),
    secondaryColor: asString(input.secondaryColor, store.brand.secondaryColor),
    accentColor: asString(input.accentColor, store.brand.accentColor),
    fontStyle: asString(input.fontStyle, store.brand.fontStyle || '') || undefined,
    voice: asString(input.voice, store.brand.voice || '') || undefined,
    audience: asString(input.audience, store.brand.audience || '') || undefined,
    designNotes: asString(input.designNotes, store.brand.designNotes || '') || undefined,
    updatedAt: now,
  };
  writeStore(store);

  logExchange({
    source: 'web',
    direction: 'inbound',
    channel: 'content-tools',
    kind: 'brand_profile_saved',
    actor: 'Adam',
    targetAgentId: 'albert',
    summary: `${store.brand.name} brand profile saved for content tools.`,
    payload: store.brand,
  });

  recordHermesEvent({
    type: 'status',
    title: 'Brand profile saved',
    detail: `${store.brand.name} brand settings are available for image, video, and optimizer jobs.`,
    entityId: 'content_tools_brand',
  });

  return store.brand;
}

export async function createImageJob(input: Record<string, unknown>, actor = 'Adam') {
  const brand = contentToolsStore().brand;
  const now = new Date().toISOString();
  const title = asString(input.title, 'Image generation');
  const prompt = buildImagePrompt(input, brand);

  let status: ContentToolStatus = 'needs_provider';
  let output: Record<string, unknown> = {
    prompt,
    setup: providerSetupMessage('image'),
  };
  const provider = 'OpenAI Images API';
  let error: string | undefined;

  try {
    const generated = await tryGenerateOpenAiImage(prompt, input);
    if (generated) {
      status = 'completed';
      output = generated;
    }
  } catch (err) {
    status = 'failed';
    error = err instanceof Error ? err.message : String(err);
    output = { prompt, setup: providerSetupMessage('image') };
  }

  return saveJob({
    id: slugId('img'),
    kind: 'image',
    title,
    status,
    createdAt: now,
    updatedAt: now,
    createdBy: actor,
    input,
    output,
    provider,
    error,
  });
}

export function createVideoJob(input: Record<string, unknown>, actor = 'Adam') {
  const brand = contentToolsStore().brand;
  const now = new Date().toISOString();
  const title = asString(input.title, 'Video edit');
  const providerConnected = Boolean(process.env.FAL_KEY || process.env.RUNWAY_API_KEY || process.env.DESCRIPT_API_KEY);
  const provider = process.env.DESCRIPT_API_KEY ? 'Descript' : process.env.RUNWAY_API_KEY ? 'Runway' : process.env.FAL_KEY ? 'Fal' : 'Video provider';
  const plan = buildVideoPlan(input, brand);

  return saveJob({
    id: slugId('vid'),
    kind: 'video',
    title,
    status: providerConnected ? 'draft_ready' : 'needs_provider',
    createdAt: now,
    updatedAt: now,
    createdBy: actor,
    input,
    output: {
      ...plan,
      setup: providerConnected ? 'Provider key is present. Hermes can hand this render plan to the connected video provider.' : providerSetupMessage('video'),
    },
    provider,
  });
}

export function createOptimizerJob(input: Record<string, unknown>, actor = 'Adam') {
  const brand = contentToolsStore().brand;
  const now = new Date().toISOString();
  const title = asString(input.title, 'Content optimization');
  const optimized = optimizeContentLocally(input, brand);

  return saveJob({
    id: slugId('opt'),
    kind: 'optimizer',
    title,
    status: 'draft_ready',
    createdAt: now,
    updatedAt: now,
    createdBy: actor,
    input,
    output: optimized,
    provider: process.env.OPENAI_API_KEY ? 'OpenAI/local brand optimizer' : 'Local brand optimizer',
  });
}

export async function createContentToolJob(input: Record<string, unknown>, actor = 'Adam') {
  const kind = asString(input.kind) as ContentToolKind;
  if (kind === 'image') return createImageJob(input, actor);
  if (kind === 'video') return createVideoJob(input, actor);
  if (kind === 'optimizer') return createOptimizerJob(input, actor);
  throw new Error('Unknown content tool kind. Use image, video, or optimizer.');
}
