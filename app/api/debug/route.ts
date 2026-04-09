import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const gatewayUrl = process.env.ALBERT_GATEWAY_URL || 'NOT SET';
  
  let reachable = false;
  let error = '';
  let responseTime = 0;
  
  try {
    const start = Date.now();
    const res = await fetch(`${gatewayUrl}/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      body: JSON.stringify({ message: 'ping' }),
      signal: AbortSignal.timeout(10000),
    });
    responseTime = Date.now() - start;
    reachable = true;
    error = `Status: ${res.status}`;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json({
    gatewayUrl,
    reachable,
    error,
    responseTime,
    env: Object.keys(process.env).filter(k => k.startsWith('ALBERT')),
  });
}
