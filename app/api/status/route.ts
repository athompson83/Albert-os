import { NextResponse } from 'next/server';

const GW = process.env.ALBERT_GATEWAY_URL || 'https://legwork-brisket-anyplace.ngrok-free.dev';
const H = { 'ngrok-skip-browser-warning': 'true' };

export async function GET() {
  const checks = await Promise.allSettled([
    fetch(GW + '/status', { headers: H, signal: AbortSignal.timeout(4000) }).then(r => r.json()),
    fetch(GW + '/agents', { headers: H, signal: AbortSignal.timeout(4000) }).then(r => r.json()),
    fetch(GW + '/workflows', { headers: H, signal: AbortSignal.timeout(4000) }).then(r => r.json()),
  ]);

  const proxyStatus = checks[0].status === 'fulfilled' ? checks[0].value : null;
  const agentsData = checks[1].status === 'fulfilled' ? checks[1].value : null;
  const workflowsData = checks[2].status === 'fulfilled' ? checks[2].value : null;

  return NextResponse.json({
    proxy: proxyStatus ? 'online' : 'offline',
    agents: agentsData?.agents?.length ?? 0,
    workflows: workflowsData?.workflows?.length ?? 0,
    activeWorkflows: workflowsData?.workflows?.filter((w: {enabled: boolean}) => w.enabled)?.length ?? 0,
    session: {
      date: new Date().toISOString().split('T')[0],
      summary: [
        'Multi-provider AI setup: Claude → GPT → Gemini → DeepSeek fallback chain',
        'Agent switcher with real avatars — 5 specialist agents',
        'Dynamic agent CRUD with editor, context files, tool permissions',
        'Workflow builder — triggers, steps, run history, webhook support',
        'Soft-delete archive for agents, tasks, and workflows',
        'Income plan: EMS Intelligence Newsletter (Beehiiv) — $0 startup, Albert writes it',
      ],
      pending: [
        'Re-pair gateway device (open http://127.0.0.1:18789 on PC)',
        'Create Beehiiv account for EMS newsletter (10 min)',
        'Review income-plan-v1.md and give go/no-go',
      ],
    },
  });
}
