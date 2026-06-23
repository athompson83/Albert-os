import { NextResponse } from 'next/server';
import { buildHermesManifest } from '@/lib/hermes-manifest';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(buildHermesManifest());
}
