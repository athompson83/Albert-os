import { NextResponse } from 'next/server';

const GW = (process.env.ALBERT_GATEWAY_URL || 'https://legwork-brisket-anyplace.ngrok-free.dev').replace(/\/+$/, '');
const H = { 'ngrok-skip-browser-warning': 'true' };

export type PendingItem = {
  id: string;
  text: string;
  type: 'navigate' | 'chat' | 'external' | 'task';
  href?: string;
  chatPrompt?: string;
  externalUrl?: string;
  priority?: 'high' | 'medium' | 'low';
  tag?: string;
};

export async function GET() {
  const checks = await Promise.allSettled([
    fetch(GW + '/status', { headers: H, signal: AbortSignal.timeout(4000) }).then(r => r.json()),
    fetch(GW + '/agents', { headers: H, signal: AbortSignal.timeout(4000) }).then(r => r.json()),
    fetch(GW + '/workflows', { headers: H, signal: AbortSignal.timeout(4000) }).then(r => r.json()),
  ]);

  const proxyStatus = checks[0].status === 'fulfilled' ? checks[0].value : null;
  const agentsData  = checks[1].status === 'fulfilled' ? checks[1].value : null;
  const workflowsData = checks[2].status === 'fulfilled' ? checks[2].value : null;

  const pending: PendingItem[] = [
    {
      id: 'gateway-pair',
      text: 'Re-pair gateway device to restore full agent tools',
      type: 'external',
      externalUrl: 'http://127.0.0.1:18789',
      priority: 'high',
      tag: 'System',
    },
    {
      id: 'beehiiv-account',
      text: 'Create Beehiiv account for EMS Intelligence Newsletter',
      type: 'external',
      externalUrl: 'https://www.beehiiv.com/signup',
      priority: 'high',
      tag: 'Revenue',
    },
    {
      id: 'income-plan-review',
      text: 'Review income-plan-v1.md — go/no-go on EMS newsletter',
      type: 'chat',
      chatPrompt: 'Walk me through the income plan for the EMS Intelligence Newsletter. Give me a summary and tell me what you need from me to move forward.',
      priority: 'medium',
      tag: 'Revenue',
    },
    {
      id: 'sentinelqa-build',
      text: 'SentinelQA — define CQS scoring criteria to start build',
      type: 'chat',
      chatPrompt: 'Let\'s define the Clinical Quality Score (CQS) criteria for SentinelQA. Walk me through what we need to decide to start the build.',
      priority: 'medium',
      tag: 'EMS',
    },
    {
      id: 'beehiiv-api',
      text: 'Add valid Beehiiv API key once account is created',
      type: 'navigate',
      href: '/apps',
      priority: 'low',
      tag: 'System',
    },
  ];

  return NextResponse.json({
    proxy: proxyStatus ? 'online' : 'offline',
    agents: agentsData?.agents?.length ?? 0,
    workflows: workflowsData?.workflows?.length ?? 0,
    activeWorkflows: workflowsData?.workflows?.filter((w: { enabled: boolean }) => w.enabled)?.length ?? 0,
    session: {
      date: new Date().toISOString().split('T')[0],
      summary: [
        'Multi-provider AI: Claude → GPT → Gemini → DeepSeek fallback chain',
        '5 specialist agents with avatars, editor, context files, permissions',
        'Workflow builder — triggers, steps, run history, webhooks',
        'Voice input (mic) + per-agent TTS with unique OpenAI voices',
        'Rich media rendering — images, video, links inline in chat',
        'EMS Intelligence Newsletter plan ready on Beehiiv',
      ],
      pending,
    },
  });
}
