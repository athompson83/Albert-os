import { NextRequest, NextResponse } from 'next/server';
import { getDistributionSnapshot, saveDistributionConnection } from '@/lib/distribution';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(getDistributionSnapshot());
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  try {
    const connection = saveDistributionConnection({
      platformId: String(body.platformId || ''),
      credentials: body.credentials || {},
      notes: typeof body.notes === 'string' ? body.notes : undefined,
      connectedBy: 'Adam',
    });
    return NextResponse.json({ ok: true, connection, snapshot: getDistributionSnapshot() }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
