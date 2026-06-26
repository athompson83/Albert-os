import { NextRequest, NextResponse } from 'next/server';
import { createContentToolJob, getContentToolsSnapshot } from '@/lib/content-tools';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(getContentToolsSnapshot());
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  try {
    const job = await createContentToolJob(body, body.actor || 'Adam');
    return NextResponse.json({ ok: true, job, snapshot: getContentToolsSnapshot() }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
