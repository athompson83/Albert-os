import { NextResponse } from 'next/server';
import { getProgressSnapshot } from '@/lib/progress';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(await getProgressSnapshot());
}
