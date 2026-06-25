import { NextResponse } from 'next/server';
import { getMarketingSnapshot } from '@/lib/marketing';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(getMarketingSnapshot());
}
