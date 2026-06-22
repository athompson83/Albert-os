import { NextRequest, NextResponse } from 'next/server';
import { getHermesState } from '@/lib/hermes-gateway';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workflow = getHermesState().workflows.find(item => item.id === id);
  return NextResponse.json({ runs: workflow?.runs || [] });
}
