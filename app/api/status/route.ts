import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getHermesState } from '@/lib/hermes-gateway';

export const runtime = 'nodejs';

export async function GET() {
  const hermes = getHermesState();
  const statusPath = join(process.cwd(), 'STATUS.md');
  const summaryPath = join(process.cwd(), 'SUMMARY.md');

  let status = '';
  let summary = '';

  if (existsSync(statusPath)) {
    status = readFileSync(statusPath, 'utf-8');
  }
  if (existsSync(summaryPath)) {
    summary = readFileSync(summaryPath, 'utf-8');
  }

  const summaryItems = extractBulletItems(status, 'What Was Built Today');
  const pendingItems = extractPendingItems(status);

  return NextResponse.json({
    proxy: 'online',
    hermes: {
      connected: true,
      connectedAt: hermes.connectedAt,
      lastUpdatedAt: hermes.lastUpdatedAt,
      events: hermes.events.slice(0, 5),
      bootstrap: '/hermes/bootstrap',
      inbox: '/hermes/inbox',
      endpoints: ['/agent', '/hermes/bootstrap', '/hermes/agents', '/hermes/tasks', '/hermes/credentials', '/hermes/products', '/hermes/events', '/hermes/inbox'],
    },
    agents: hermes.agents.length || countMatches(status, /Agent:/g) || 1,
    workflows: hermes.workflows.length || countMatches(summary, /^\d+\.\s+\*\*/gm) || 0,
    activeWorkflows: hermes.workflows.filter(workflow => workflow.enabled).length || countMatches(status, /Next Steps|Autonomous/gi) || 0,
    products: hermes.products.filter(product => product.status !== 'removed').length,
    credentialsRequested: hermes.tasks.filter(task => task.requestKind === 'credential' && task.status !== 'done' && !task.archivedAt).length,
    session: {
      date: new Date().toISOString(),
      summary: summaryItems.length ? summaryItems : ['Albert OS is connected and reporting status.'],
      pending: [
        ...hermes.tasks
          .filter(task => task.assignedTo === 'adam' && task.status !== 'done' && !task.archivedAt)
          .slice(0, 6)
          .map(task => ({
            id: task.id,
            text: task.title,
            type: 'task' as const,
            href: `/tasks?task=${task.id}`,
            priority: task.priority,
            tag: task.requestKind === 'credential' ? 'Credentials' : task.project || 'Hermes',
          })),
        ...pendingItems,
      ],
    },
    raw: {
      status,
      summary,
    },
    timestamp: new Date().toISOString(),
  });
}

function countMatches(value: string, pattern: RegExp) {
  return Array.from(value.matchAll(pattern)).length;
}

function extractBulletItems(markdown: string, heading: string) {
  const sectionStart = markdown.indexOf(`## ${heading}`);
  if (sectionStart === -1) return [];

  const section = markdown.slice(sectionStart).split('\n## ')[0];
  return section
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('- **') || line.startsWith('- '))
    .map(line => line.replace(/^- /, '').replace(/\*\*/g, ''))
    .slice(0, 5);
}

function extractPendingItems(markdown: string) {
  const rows = markdown
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('|') && !line.includes('---') && !line.includes('Issue |'));

  return rows.map((row, index) => {
    const cells = row
      .split('|')
      .map(cell => cell.trim())
      .filter(Boolean);

    const issue = cells[0] || 'Needs attention';
    const action = cells[1] || '';
    const priority = (cells[2] || 'medium').toLowerCase();

    return {
      id: `pending-${index + 1}`,
      text: action ? `${issue}: ${action}` : issue,
      type: 'task' as const,
      href: '/tasks',
      priority: priority.includes('high') ? 'high' : priority.includes('low') ? 'low' : 'medium',
      tag: 'System',
    };
  });
}
