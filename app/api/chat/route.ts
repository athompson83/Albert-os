import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  // Stub — wire to OpenClaw gateway in production
  return NextResponse.json({ reply: `I received your message: "${message}". Full Albert integration coming soon — this UI is connected to the OpenClaw gateway at runtime.` });
}
