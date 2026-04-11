import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

const WORKSPACE = process.env.WORKSPACE_PATH || join(process.env.HOME || '', '.openclaw', 'workspace');

function readJSON(path: string, fallback: unknown = null) {
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return fallback; }
}

export async function GET() {
  const metrics = readJSON(join(WORKSPACE, 'revenue', 'metrics.json'), {
    beehiiv: { free_subscribers: 0, paid_subscribers: 0, paid_rate: 9 },
    history: [], targets: {}, sponsorships: [], total_earned: 0, started: null,
  });

  const calendar = readJSON(join(WORKSPACE, 'projects', 'wealth', 'content-calendar.json'), { issues: [], next_topic: null });

  // Read lead magnets
  const { readdirSync, existsSync } = await import('fs');
  const lmDir = join(WORKSPACE, 'content', 'leadmagnets');
  const leadmagnets = existsSync(lmDir)
    ? readdirSync(lmDir).filter(f => f.endsWith('.md')).map(f => ({
        name: f.replace(/-\d{4}-\d{2}-\d{2}\.md$/, '').replace(/-/g, ' '),
        file: f,
        date: f.match(/(\d{4}-\d{2}-\d{2})/)?.[1] || '',
      }))
    : [];

  // Read sponsor leads count
  const sponsorLeads = readJSON(join(WORKSPACE, 'revenue', 'sponsor-leads.md'), null);

  const b = metrics.beehiiv;
  const mrr = b.paid_subscribers * b.paid_rate;
  const arr = mrr * 12;

  // Growth from history
  const history = metrics.history || [];
  const prev = history[history.length - 2];
  const curr = history[history.length - 1];
  const growth = curr && prev ? {
    free: curr.free - prev.free,
    paid: curr.paid - prev.paid,
    mrr: curr.mrr - prev.mrr,
  } : null;

  return NextResponse.json({
    subscribers: { free: b.free_subscribers, paid: b.paid_subscribers },
    revenue: { mrr, arr, total_earned: metrics.total_earned || 0 },
    growth,
    targets: metrics.targets,
    history: history.slice(-12),
    issues: {
      total: calendar.issues?.length || 0,
      published: calendar.issues?.filter((i: {published: boolean}) => i.published).length || 0,
      drafts: calendar.issues?.filter((i: {status: string}) => i.status === 'draft').length || 0,
      next_topic: calendar.next_topic,
    },
    leadmagnets,
    started: metrics.started,
  });
}
