import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    agents: [
      {
        id: 'albert',
        name: 'Albert',
        emoji: '🎩',
        role: 'Orchestrator',
        description: 'Main agent. Routes to specialists.',
        color: '#6366f1',
        isDefault: true,
        sessionId: 'albert-os-web',
      },
      {
        id: 'assemble',
        name: 'Assemble',
        emoji: '📋',
        role: 'Event & Training Platform',
        description: 'Assemble SaaS — courses, certs, revenue.',
        color: '#10b981',
        sessionId: 'agent-assemble',
      },
      {
        id: 'sentinelqa',
        name: 'SentinelQA',
        emoji: '🛡️',
        role: 'Clinical Quality Platform',
        description: 'CQS/CQI scoring, QA workflows, EMS outcomes.',
        color: '#ef4444',
        sessionId: 'agent-sentinelqa',
      },
      {
        id: 'apex360',
        name: 'APEx360',
        emoji: '📊',
        role: 'Evaluation & Scheduling',
        description: 'Evals, FTO tracking, Aladtec integration.',
        color: '#f59e0b',
        sessionId: 'agent-apex360',
      },
      {
        id: 'ai-business',
        name: 'Operator',
        emoji: '🚀',
        role: 'AI Business & Automation',
        description: 'Content automation, affiliate, revenue ops.',
        color: '#8b5cf6',
        sessionId: 'agent-ai-business',
      },
    ],
  });
}
