import { NextResponse } from 'next/server';

const BEEHIIV_KEY = process.env.BEEHIIV_API_KEY || '';
const BEEHIIV_PUB = process.env.BEEHIIV_PUBLICATION_ID || '';
const BASE = 'https://api.beehiiv.com/v2';

export async function GET() {
  if (!BEEHIIV_KEY || !BEEHIIV_PUB) {
    return NextResponse.json({ error: 'Beehiiv API key and publication ID not configured. Add BEEHIIV_API_KEY and BEEHIIV_PUBLICATION_ID to Vercel environment variables.', publication: null }, { status: 200 });
  }
  try {
    const r = await fetch(`${BASE}/publications/${BEEHIIV_PUB}?expand[]=stats`, {
      headers: { Authorization: `Bearer ${BEEHIIV_KEY}` },
      signal: AbortSignal.timeout(8000),
    });
    const data = await r.json();
    return NextResponse.json({ publication: data.data || null }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: String(e), publication: null }, { status: 200 });
  }
}
