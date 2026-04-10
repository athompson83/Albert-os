import { NextRequest, NextResponse } from 'next/server';

const BEEHIIV_KEY = process.env.BEEHIIV_API_KEY || '';
const BEEHIIV_PUB = process.env.BEEHIIV_PUBLICATION_ID || '';
const BASE = 'https://api.beehiiv.com/v2';

export async function GET() {
  if (!BEEHIIV_KEY || !BEEHIIV_PUB) {
    return NextResponse.json({ posts: [], error: 'Beehiiv not configured' }, { status: 200 });
  }
  try {
    const r = await fetch(`${BASE}/publications/${BEEHIIV_PUB}/posts?expand[]=stats&limit=20`, {
      headers: { Authorization: `Bearer ${BEEHIIV_KEY}` },
      signal: AbortSignal.timeout(8000),
    });
    const data = await r.json();
    return NextResponse.json({ posts: data.data || [] }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ posts: [], error: String(e) }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  if (!BEEHIIV_KEY || !BEEHIIV_PUB) {
    return NextResponse.json({ error: 'Beehiiv not configured' }, { status: 200 });
  }
  try {
    const body = await req.json();
    const r = await fetch(`${BASE}/publications/${BEEHIIV_PUB}/posts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${BEEHIIV_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: body.title,
        body_content: body.body_content,
        status: body.status || 'draft',
        subtitle: body.subtitle,
        thumbnail_image_url: body.thumbnail_image_url,
      }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await r.json();
    if (!r.ok) return NextResponse.json({ error: data?.message || `Beehiiv error ${r.status}` }, { status: 200 });
    return NextResponse.json({ post: data.data }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 200 });
  }
}
