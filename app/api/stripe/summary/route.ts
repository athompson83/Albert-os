import { NextResponse } from 'next/server';
import { getStripeCrmSnapshot } from '@/lib/stripe-crm';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(await getStripeCrmSnapshot());
}
