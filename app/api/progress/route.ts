import { NextRequest, NextResponse } from 'next/server';
import { getProgressSnapshot } from '@/lib/progress';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const agent = req.nextUrl.searchParams.get('agent')?.trim().toLowerCase();
  const snapshot = await getProgressSnapshot();

  if (!agent || agent === 'all') {
    return NextResponse.json(snapshot);
  }

  const updates = snapshot.updates.filter(update => update.agentId === agent);
  const blockers = snapshot.blockers.filter(blocker => blocker.agentId === agent);
  const readiness = snapshot.capabilities.readiness.filter(capability => capability.agentId === agent);

  return NextResponse.json({
    ...snapshot,
    latest: updates[0],
    selectedAgent: snapshot.agents.find(item => item.id === agent) || { id: agent, name: agent },
    counts: {
      ...snapshot.counts,
      github: updates.filter(update => update.source === 'github').length,
      reports: updates.filter(update => update.source === 'report').length,
      status: updates.filter(update => update.source === 'status').length,
      blockers: blockers.length,
      capabilities: readiness.length,
      readyCapabilities: readiness.filter(capability => capability.status === 'ready').length,
    },
    blockers,
    updates,
    capabilities: {
      ...snapshot.capabilities,
      readiness,
    },
  });
}
