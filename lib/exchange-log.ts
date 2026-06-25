import { existsSync, mkdirSync, readFileSync, readdirSync, appendFileSync } from 'fs';
import { join } from 'path';

export type ExchangeLogEntry = {
  id: string;
  timestamp: string;
  source: 'web' | 'hermes' | 'slack' | 'system' | 'stripe';
  direction: 'inbound' | 'outbound' | 'internal';
  channel: string;
  kind: string;
  actor: string;
  targetAgentId?: string;
  summary: string;
  relatedId?: string;
  payload?: unknown;
  persisted: boolean;
};

const logStateKey = '__albertExchangeLogs';
const SENSITIVE_KEYS = /(secret|token|password|credential|api[_-]?key|authorization|value)/i;

function getLogDir() {
  return process.env.ALBERT_LOG_DIR || (process.env.VERCEL ? join('/tmp', 'albert-os-logs') : join(process.cwd(), '.albert-os', 'logs'));
}

function todayFile(date = new Date()) {
  return `exchanges-${date.toISOString().slice(0, 10)}.jsonl`;
}

function memoryLogs() {
  const globalStore = globalThis as typeof globalThis & { [logStateKey]?: ExchangeLogEntry[] };
  globalStore[logStateKey] ||= [];
  return globalStore[logStateKey]!;
}

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      SENSITIVE_KEYS.test(key) ? '[redacted]' : redact(item),
    ]),
  );
}

export function logExchange(input: Omit<ExchangeLogEntry, 'id' | 'timestamp' | 'persisted'> & { timestamp?: string }) {
  const entry: ExchangeLogEntry = {
    id: `log_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: input.timestamp || new Date().toISOString(),
    source: input.source,
    direction: input.direction,
    channel: input.channel,
    kind: input.kind,
    actor: input.actor,
    targetAgentId: input.targetAgentId,
    summary: input.summary,
    relatedId: input.relatedId,
    payload: redact(input.payload),
    persisted: false,
  };

  try {
    const dir = getLogDir();
    mkdirSync(dir, { recursive: true });
    appendFileSync(join(dir, todayFile(new Date(entry.timestamp))), `${JSON.stringify({ ...entry, persisted: true })}\n`, 'utf-8');
    entry.persisted = true;
  } catch {
    entry.persisted = false;
  }

  const logs = memoryLogs();
  logs.unshift(entry);
  logs.splice(500);
  return entry;
}

export function listExchangeLogs(options: { date?: string; limit?: number; source?: string; kind?: string; search?: string } = {}) {
  const limit = options.limit || 200;
  const logs: ExchangeLogEntry[] = [];
  const dir = getLogDir();

  try {
    if (existsSync(dir)) {
      const files = options.date
        ? [todayFile(new Date(`${options.date}T00:00:00.000Z`))]
        : readdirSync(dir).filter(file => file.startsWith('exchanges-') && file.endsWith('.jsonl')).sort().reverse().slice(0, 7);

      for (const file of files) {
        const path = join(dir, file);
        if (!existsSync(path)) continue;
        const lines = readFileSync(path, 'utf-8').split('\n').filter(Boolean).reverse();
        for (const line of lines) {
          try {
            logs.push(JSON.parse(line) as ExchangeLogEntry);
          } catch {}
          if (logs.length >= limit * 2) break;
        }
      }
    }
  } catch {}

  const merged = [...logs, ...memoryLogs()];
  const seen = new Set<string>();
  const search = options.search?.toLowerCase();

  return merged
    .filter(entry => {
      if (seen.has(entry.id)) return false;
      seen.add(entry.id);
      if (options.source && options.source !== 'all' && entry.source !== options.source) return false;
      if (options.kind && options.kind !== 'all' && entry.kind !== options.kind) return false;
      if (search) {
        const haystack = `${entry.summary} ${entry.actor} ${entry.channel} ${entry.kind} ${entry.relatedId || ''}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}
