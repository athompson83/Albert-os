import { NextResponse } from 'next/server';
import { getHermesState } from '@/lib/hermes-gateway';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ chats: getHermesState().chats });
}
