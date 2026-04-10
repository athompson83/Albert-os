import { NextRequest, NextResponse } from 'next/server';

const GW = (process.env.ALBERT_GATEWAY_URL || 'https://legwork-brisket-anyplace.ngrok-free.dev').replace(/\/+$/, '');
const H = { 'ngrok-skip-browser-warning': 'true', 'Content-Type': 'application/json' };

export async function POST(req: NextRequest) {
  const { title, topic } = await req.json();

  const prompt = `You are writing for "The Resuscitationist" — a weekly newsletter for EMS professionals written by Adam Thompson, Division Chief at Lee County EMS and Chair of the SWFL Regional Protocol Committee.

Write a complete newsletter issue on the topic: "${topic || title}"

Format:
- Opening: 2-3 sentence hook that frames why this matters clinically
- Main section: 3-4 evidence-based points with specific study references where applicable
- Protocol Corner: one practical, actionable takeaway for field providers
- Stat of the Week: one compelling number with context
- Coming Next Week: tease the next issue topic

Tone: Authoritative but peer-to-peer. Not academic, not preachy. Direct. Evidence-first.
Length: ~700-900 words.
Write it ready to paste into a newsletter — no markdown headers, use plain readable text with section breaks.`;

  try {
    const r = await fetch(`${GW}/agent`, {
      method: 'POST',
      headers: H,
      body: JSON.stringify({ message: prompt, agentId: 'albert' }),
      signal: AbortSignal.timeout(55000),
    });
    const data = await r.json();
    const content = data?.reply || data?.payloads?.[0]?.text || '';
    return NextResponse.json({ content }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: String(e), content: '' }, { status: 200 });
  }
}
