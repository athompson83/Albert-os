import { logExchange } from '@/lib/exchange-log';
import { recordHermesEvent, upsertCredential } from '@/lib/hermes-gateway';

export type DistributionPlatform = {
  id: string;
  name: string;
  color: string;
  description: string;
  features: string[];
  apiAvailable: boolean;
  monthlyFee: string;
  credentialFields: Array<{
    key: string;
    label: string;
    type: 'text' | 'password' | 'url';
    required?: boolean;
  }>;
};

export type DistributionConnection = {
  platformId: string;
  status: 'connected' | 'needs_credentials';
  updatedAt: string;
  connectedBy: string;
  maskedCredentials: Record<string, string>;
  notes?: string;
  accessAvailable: boolean;
};

const distributionStateKey = '__albertDistributionConnections';

export const distributionPlatforms: DistributionPlatform[] = [
  {
    id: 'teachable',
    name: 'Teachable',
    color: '#3b82f6',
    description: 'Full REST API - courses, lectures, quizzes, enrollment',
    features: ['Courses', 'Quizzes', 'Memberships', 'Certificates'],
    apiAvailable: true,
    monthlyFee: '5% transaction fee',
    credentialFields: [
      { key: 'api_key', label: 'API key', type: 'password', required: true },
      { key: 'school_url', label: 'School URL', type: 'url', required: true },
    ],
  },
  {
    id: 'thinkific',
    name: 'Thinkific',
    color: '#8b5cf6',
    description: 'REST API - chapters, lessons, student management',
    features: ['Courses', 'Bundles', 'Communities', 'Certificates'],
    apiAvailable: true,
    monthlyFee: 'From $0/mo',
    credentialFields: [
      { key: 'api_key', label: 'API key', type: 'password', required: true },
      { key: 'subdomain', label: 'Subdomain', type: 'text', required: true },
    ],
  },
  {
    id: 'kajabi',
    name: 'Kajabi',
    color: '#f59e0b',
    description: 'Products, pipelines, email automation',
    features: ['Courses', 'Memberships', 'Pipelines', 'Email'],
    apiAvailable: true,
    monthlyFee: 'From $149/mo',
    credentialFields: [
      { key: 'api_key', label: 'API key', type: 'password', required: true },
      { key: 'site_url', label: 'Site URL', type: 'url', required: true },
    ],
  },
  {
    id: 'learnworlds',
    name: 'LearnWorlds',
    color: '#10b981',
    description: 'SCORM export - ideal for CE submissions',
    features: ['SCORM', 'Certificates', 'CE Tracking', 'eCommerce'],
    apiAvailable: true,
    monthlyFee: 'From $29/mo',
    credentialFields: [
      { key: 'api_key', label: 'API key', type: 'password', required: true },
      { key: 'school_url', label: 'School URL', type: 'url', required: true },
    ],
  },
  {
    id: 'udemy',
    name: 'Udemy',
    color: '#ef4444',
    description: '60M+ students - no API, package + upload workflow',
    features: ['Marketplace', 'Global Reach', 'Revenue Share', 'Reviews'],
    apiAvailable: false,
    monthlyFee: '37-63% revenue share',
    credentialFields: [
      { key: 'instructor_email', label: 'Instructor email', type: 'text' },
      { key: 'login_url', label: 'Login URL', type: 'url' },
    ],
  },
  {
    id: 'skillshare',
    name: 'Skillshare',
    color: '#22c55e',
    description: 'Royalties per minute watched - short-form format',
    features: ['Royalties', 'Short Lessons', 'Projects', 'Community'],
    apiAvailable: false,
    monthlyFee: 'Per-minute royalties',
    credentialFields: [
      { key: 'teacher_email', label: 'Teacher email', type: 'text' },
      { key: 'login_url', label: 'Login URL', type: 'url' },
    ],
  },
];

function distributionConnections() {
  const globalStore = globalThis as typeof globalThis & { [distributionStateKey]?: DistributionConnection[] };
  globalStore[distributionStateKey] ||= [];
  return globalStore[distributionStateKey]!;
}

function maskCredential(value: string) {
  if (!value) return '';
  if (value.length <= 8) return '********';
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export function getDistributionSnapshot() {
  const connections = distributionConnections();
  const platforms = distributionPlatforms.map(platform => {
    const connection = connections.find(item => item.platformId === platform.id);
    return {
      ...platform,
      connection: connection || null,
    };
  });
  const connected = platforms.filter(platform => platform.connection?.status === 'connected').length;

  return {
    generatedAt: new Date().toISOString(),
    connected,
    total: distributionPlatforms.length,
    platforms,
    connections,
    publishQueue: [],
    publishHistory: [],
  };
}

export function saveDistributionConnection(input: {
  platformId: string;
  credentials?: Record<string, string>;
  notes?: string;
  connectedBy?: string;
}) {
  const platform = distributionPlatforms.find(item => item.id === input.platformId);
  if (!platform) throw new Error(`Unknown platform: ${input.platformId}`);

  const credentials = input.credentials || {};
  const missing = platform.credentialFields.filter(field => field.required && !credentials[field.key]?.trim());
  if (missing.length) {
    throw new Error(`Still needed: ${missing.map(field => field.label).join(', ')}`);
  }

  const now = new Date().toISOString();
  const maskedCredentials = Object.fromEntries(
    Object.entries(credentials)
      .filter(([, value]) => Boolean(value?.trim()))
      .map(([key, value]) => [key, maskCredential(value.trim())]),
  );
  const connection: DistributionConnection = {
    platformId: platform.id,
    status: 'connected',
    updatedAt: now,
    connectedBy: input.connectedBy || 'Adam',
    maskedCredentials,
    notes: input.notes?.trim() || undefined,
    accessAvailable: true,
  };

  const connections = distributionConnections();
  const existing = connections.findIndex(item => item.platformId === platform.id);
  if (existing >= 0) {
    connections[existing] = connection;
  } else {
    connections.unshift(connection);
  }

  for (const [key, value] of Object.entries(credentials)) {
    if (!value?.trim()) continue;
    upsertCredential({
      key: `distribution_${platform.id}_${key}`,
      label: `${platform.name} ${key.replace(/_/g, ' ')}`,
      value,
      requestedBy: 'Distribution Hub',
    });
  }

  recordHermesEvent({
    type: 'credential_updated',
    title: `${platform.name} connected`,
    detail: `Distribution Hub credentials were saved for ${platform.name}. Albert can now see this platform as connected.`,
    entityId: `distribution_${platform.id}`,
  });

  logExchange({
    source: 'web',
    direction: 'inbound',
    channel: 'distribution-hub',
    kind: 'distribution_credentials_saved',
    actor: input.connectedBy || 'Adam',
    targetAgentId: 'albert',
    summary: `${platform.name} distribution credentials saved.`,
    relatedId: `distribution_${platform.id}`,
    payload: {
      platformId: platform.id,
      platformName: platform.name,
      maskedCredentials,
      notes: input.notes,
      accessAvailable: true,
    },
  });

  return connection;
}
