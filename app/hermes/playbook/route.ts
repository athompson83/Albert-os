import { NextResponse } from 'next/server';
import { HERMES_APP_PLAYBOOK } from '@/lib/hermes-playbook';

export const runtime = 'nodejs';

export async function GET() {
  return new NextResponse(HERMES_APP_PLAYBOOK, {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
    },
  });
}
