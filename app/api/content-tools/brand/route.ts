import { NextRequest, NextResponse } from 'next/server';
import { getContentToolsSnapshot, saveBrandProfile } from '@/lib/content-tools';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ brand: getContentToolsSnapshot().brand });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const brand = saveBrandProfile(body);
  return NextResponse.json({ ok: true, brand, snapshot: getContentToolsSnapshot() }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const brand = saveBrandProfile(body);
  return NextResponse.json({ ok: true, brand, snapshot: getContentToolsSnapshot() });
}
