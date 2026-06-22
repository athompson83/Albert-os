import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const runtime = 'nodejs';

export async function GET() {
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
    proxy: status.includes('Active') ? 'online' : 'offline',
    agents: countMatches(status, /Agent:/g) || 1,
    workflows: countMatches(summary, /^\d+\.\s+\*\*/gm) || 0,
    activeWorkflows: countMatches(status, /Next Steps|Autonomous/gi) || 0,
    session: {
      date: new Date().toISOString(),
      summary: summaryItems.length ? summaryItems : ['Albert OS is connected and reporting status.'],
      pending: pendingItems,
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
