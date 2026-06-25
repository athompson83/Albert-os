import { NextRequest, NextResponse } from 'next/server';
import { buildHermesBootstrap } from '@/lib/hermes-context';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  return NextResponse.json(buildHermesBootstrap(req.nextUrl.origin));
}
