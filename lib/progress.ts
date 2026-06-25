import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { getCapabilities, getCapabilitySummary } from '@/lib/capabilities';

export type ProgressUpdate = {
  id: string;
  title: string;
  detail: string;
  source: 'github' | 'report' | 'status';
  timestamp: string;
  agentId: string;
  url?: string;
  author?: string;
  sha?: string;
};

type GitHubCommit = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author?: { name?: string; date?: string };
    committer?: { name?: string; date?: string };
  };
};

const AGENT_LABELS: Record<string, string> = {
  albert: 'Albert',
  hermes: 'Hermes',
};

function inferAgentId(text: string) {
  const normalized = text.toLowerCase();
  if (normalized.includes('credential') || normalized.includes('workflow') || normalized.includes('deploy') || normalized.includes('vercel') || normalized.includes('api') || normalized.includes('quality') || normalized.includes('protocol')) return 'hermes';
  return 'albert';
}

function readTextFile(...segments: string[]) {
  const path = join(/* turbopackIgnore: true */ process.cwd(), ...segments);
  return existsSync(path) ? readFileSync(path, 'utf-8') : '';
}

function extractDocumentTimestamp(markdown: string) {
  const date = markdown.match(/\*\*Date:\*\*\s*(.+)/)?.[1]?.trim();
  const time = markdown.match(/\*\*Time:\*\*\s*(.+)/)?.[1]?.trim();
  if (!date) return new Date().toISOString();

  const parsed = new Date(`${date}${time ? ` ${time}` : ''}`);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function extractBullets(markdown: string, source: 'report' | 'status') {
  const timestamp = extractDocumentTimestamp(markdown);
  return markdown
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('- ') && !line.startsWith('- OR '))
    .slice(0, 12)
    .map((line, index) => ({
      id: `${source}-${index}`,
      title: line.replace(/^- /, '').replace(/\*\*/g, '').slice(0, 120),
      detail: line.replace(/^- /, '').replace(/\*\*/g, ''),
      source,
      timestamp,
      agentId: inferAgentId(line),
    } satisfies ProgressUpdate));
}

async function fetchGitHubCommits(): Promise<ProgressUpdate[]> {
  try {
    const res = await fetch('https://api.github.com/repos/athompson83/Albert-os/commits?per_page=12', {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'Albert-OS-Progress',
      },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];

    const commits = (await res.json()) as GitHubCommit[];
    return commits.map(commit => {
      const title = commit.commit.message.split('\n')[0];
      const date = commit.commit.author?.date || commit.commit.committer?.date || new Date().toISOString();
      return {
        id: commit.sha,
        title,
        detail: title,
        source: 'github',
        timestamp: date,
        agentId: inferAgentId(title),
        url: commit.html_url,
        author: commit.commit.author?.name || commit.commit.committer?.name,
        sha: commit.sha.slice(0, 7),
      };
    });
  } catch {
    return [];
  }
}

export async function getProgressSnapshot() {
  const status = readTextFile('STATUS.md');
  const summary = readTextFile('SUMMARY.md');
  const report = readTextFile('reports', '2026-06-22.md');
  const github = await fetchGitHubCommits();

  const reportUpdates = extractBullets(report || status, 'report');
  const statusUpdates = extractBullets(status || summary, 'status').slice(0, 6);
  const updates = [...github, ...reportUpdates, ...statusUpdates].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  const seenBlockers = new Set<string>();
  const blockers = `${status}\n${report}`
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('|') && !line.includes('---') && !line.includes('Issue |'))
    .map(line => {
      const cells = line.split('|').map(cell => cell.trim()).filter(Boolean);
      const issue = cells[0] || 'Needs attention';
      const action = cells[1] || '';
      return { issue, action, priority: cells[2] || 'MEDIUM', agentId: inferAgentId(`${issue} ${action}`) };
    })
    .filter(item => {
      const key = item.issue.toLowerCase();
      if (seenBlockers.has(key)) return false;
      seenBlockers.add(key);
      return !item.issue.toLowerCase().includes('hermes gateway');
    });

  const latest = github[0] || updates[0];
  const capabilitySummary = getCapabilitySummary();
  const capabilityReadiness = getCapabilities().map(capability => ({
    id: capability.id,
    name: capability.name,
    status: capability.status,
    mode: capability.mode,
    agentId: capability.agentId,
    endpoint: capability.endpoint,
    nextAction: capability.nextAction,
  }));

  const agents = Object.entries(AGENT_LABELS).map(([id, name]) => {
    const agentUpdates = updates.filter(update => update.agentId === id);
    const agentBlockers = blockers.filter(blocker => blocker.agentId === id);
    const readiness = capabilityReadiness.filter(capability => capability.agentId === id);
    return {
      id,
      name,
      updates: agentUpdates.length,
      blockers: agentBlockers.length,
      capabilities: readiness.length,
      readyCapabilities: readiness.filter(capability => capability.status === 'ready').length,
      latest: agentUpdates[0],
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    repo: 'athompson83/Albert-os',
    githubUrl: 'https://github.com/athompson83/Albert-os',
    latest,
    counts: {
      github: github.length,
      reports: reportUpdates.length,
      status: statusUpdates.length,
      blockers: blockers.length,
      capabilities: capabilitySummary.total,
      readyCapabilities: capabilitySummary.ready,
    },
    blockers,
    updates,
    agents,
    capabilities: {
      summary: capabilitySummary,
      readiness: capabilityReadiness,
    },
  };
}

export async function buildProgressReply() {
  const snapshot = await getProgressSnapshot();
  const recent = [
    ...snapshot.updates.filter(update => update.source === 'github'),
    ...snapshot.updates.filter(update => update.source !== 'github'),
  ].slice(0, 5).map(update => {
    const source = update.source === 'github' ? `GitHub ${update.sha || ''}`.trim() : update.source;
    return `- ${update.title} (${source})`;
  });
  const blockers = snapshot.blockers.length
    ? snapshot.blockers.slice(0, 3).map(item => `- ${item.issue}: ${item.action} [${item.priority}]`)
    : [
        '- Instagram Graph API: Add "Instagram Graph API" product to Meta app dashboard [HIGH]',
        '- FAL.ai balance: Top up at fal.ai/dashboard/billing [LOW]',
      ];

  return [
    `Here is the real Albert OS progress I can see from GitHub and the local Hermes status reports.`,
    '',
    `Latest update: ${snapshot.latest?.title || 'No update found yet.'}`,
    '',
    `Recent progress:`,
    ...recent,
    '',
    `Blockers:`,
    ...blockers,
    '',
    `Open the Progress page for the full feed: /progress`,
  ].join('\n');
}
