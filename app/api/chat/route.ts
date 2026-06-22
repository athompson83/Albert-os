import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  try {
    const { stdout } = await execAsync(
      `echo ${JSON.stringify(message)} | hermes chat --model "openrouter/owl-alpha" --no-tui 2>/dev/null`,
      {
        timeout: 120000,
        maxBuffer: 10 * 1024 * 1024,
      }
    );

    const reply = stdout.trim() || 'Message received.';

    return NextResponse.json({ reply });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ reply: `Error: ${msg.slice(0, 200)}`, error: true });
  }
}
