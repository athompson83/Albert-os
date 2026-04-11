import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import os from 'os';
import path from 'path';

export const maxDuration = 90;

// ── Gateway config ────────────────────────────────────────────────────────────
// Reads directly from openclaw.json so this path is always reliable,
// exactly the same way the proxy server does it. No ngrok dependency.
function getGatewayConfig(): { url: string; token: string } {
  try {
    const cfgPath = path.join(os.homedir(), '.openclaw', 'openclaw.json');
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    const port = cfg?.gateway?.port || 18789;
    const token = cfg?.gateway?.auth?.token || '';
    return { url: `http://127.0.0.1:${port}`, token };
  } catch {
    return { url: 'http://127.0.0.1:18789', token: '' };
  }
}

// Proxy URL is still needed for file uploads/serving (ngrok)
const PROXY_URL = (process.env.ALBERT_GATEWAY_URL || '').replace(/\/+$/, '');

export async function POST(req: NextRequest) {
  const { message, attachments = [], agentId = 'albert' } = await req.json();

  const { url: gatewayUrl, token } = getGatewayConfig();
  const sessionId = agentId === 'albert' ? 'albert-os-web' : `agent-${agentId}`;

  try {
    const res = await fetch(`${gatewayUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-openclaw-session-key': `agent:main:web:direct:${sessionId}`,
      },
      body: JSON.stringify({
        model: 'openclaw',
        messages: [{ role: 'user', content: message }],
        stream: false,
        user: sessionId,
      }),
      signal: AbortSignal.timeout(85000),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Gateway ${res.status}: ${txt.slice(0, 200)}`);
    }

    const data = await res.json();
    const reply: string =
      data?.choices?.[0]?.message?.content ||
      data?.reply ||
      data?.text ||
      'Got it.';

    // Simple categorization based on message content
    const project = categorize(message);

    return NextResponse.json({ reply, project, domain: 'General' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Chat error:', msg);
    if (
      msg.includes('abort') ||
      msg.includes('timeout') ||
      msg.includes('TimeoutError') ||
      msg.includes('ETIMEDOUT') ||
      msg.includes('UND_ERR_HEADERS_TIMEOUT')
    ) {
      return NextResponse.json({
        reply: "Still thinking — give it another second and try again. 🎩",
      });
    }
    return NextResponse.json({
      reply: "Gateway hiccup — try again. 🎩",
    });
  }
}

// ── Lightweight categorization (mirrors proxy logic) ──────────────────────────
const CATEGORIES = [
  { name: 'SentinelQA',      keywords: ['sentinel', 'sentinelqa', 'cardiac arrest', 'qa review', 'daam', 'imagetrend'] },
  { name: 'APEx360',         keywords: ['apex', 'apex360', 'field training', 'fto', 'evaluation', 'preceptor'] },
  { name: 'Assemble',        keywords: ['assemble', 'event management', 'training management', 'saas', 'booking'] },
  { name: 'EMS',             keywords: ['ems', 'protocol', 'clinical', 'paramedic', 'medic', 'dispatch', 'patient', 'ambulance'] },
  { name: 'Albert OS',       keywords: ['albert os', 'proxy', 'chat ui', 'dashboard', 'vercel', 'deploy', 'ngrok'] },
  { name: 'Wealth Building', keywords: ['income', 'revenue', 'monetize', 'affiliate', 'youtube', 'financial'] },
];

function categorize(text: string): string {
  const lower = text.toLowerCase();
  for (const cat of CATEGORIES) {
    if (cat.keywords.some((k) => lower.includes(k))) return cat.name;
  }
  return 'General';
}
