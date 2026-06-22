import { NextResponse } from 'next/server';
import { getCapabilities, getCapabilitySummary } from '@/lib/capabilities';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'Albert Hermes Capability Catalog',
    summary: getCapabilitySummary(),
    capabilities: getCapabilities(),
  });
}
