import { NextResponse } from 'next/server';
import { getHermesState } from '@/lib/hermes-gateway';

export const runtime = 'nodejs';

export async function GET() {
  const state = getHermesState();
  return NextResponse.json({
    connected: true,
    connectedAt: state.connectedAt,
    lastUpdatedAt: state.lastUpdatedAt,
    events: state.events,
  });
}
