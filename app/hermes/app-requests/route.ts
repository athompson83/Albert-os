import { NextRequest, NextResponse } from 'next/server';
import { createAppRequest, getAppRequestsSnapshot } from '@/lib/app-requests';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(getAppRequestsSnapshot());
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  try {
    const request = createAppRequest(body, String(body.actor || 'Hermes'));
    const status = request.status === 'blocked' ? 403 : 201;
    return NextResponse.json(
      {
        ok: request.status !== 'blocked',
        blocked: request.status === 'blocked',
        request,
        snapshot: getAppRequestsSnapshot(),
        error: request.blockedReason,
      },
      { status },
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 400 },
    );
  }
}
