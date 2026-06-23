import { NextResponse } from 'next/server';
import { buildHermesManifest } from '@/lib/hermes-manifest';

export const runtime = 'nodejs';

export async function GET() {
  const manifest = buildHermesManifest();
  return NextResponse.json({
    ok: manifest.ok,
    service: manifest.service,
    connected: manifest.connected,
    connectedAt: manifest.connectedAt,
    lastUpdatedAt: manifest.lastUpdatedAt,
    health: manifest.health,
  });
}
