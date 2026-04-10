import { NextRequest, NextResponse } from 'next/server';

const GW = process.env.ALBERT_GATEWAY_URL || 'https://legwork-brisket-anyplace.ngrok-free.dev';
const H = { 'ngrok-skip-browser-warning': 'true' };

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || '';
  const limit = searchParams.get('limit') || '200';
  const source = searchParams.get('source') || '';

  const params = new URLSearchParams();
  if (date) params.set('date', date);
  if (limit) params.set('limit', limit);
  if (source) params.set('source', source);

  try {
    const r = await fetch(`${GW}/history?${params}`, { headers: H, signal: AbortSignal.timeout(10000) });
    if (!r.ok) {
      console.error('History upstream error:', r.status);
      return NextResponse.json({ conversations: [], total: 0, byProject: {}, error: `Upstream ${r.status}` }, { status: 200 });
    }
    return NextResponse.json(await r.json(), { status: 200 });
  } catch (e) {
    console.error('History fetch error:', String(e));
    return NextResponse.json({ conversations: [], total: 0, byProject: {}, error: String(e) }, { status: 200 });
  }
}
