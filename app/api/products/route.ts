import { NextRequest, NextResponse } from 'next/server';
import { getHermesState, upsertProduct } from '@/lib/hermes-gateway';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ products: getHermesState().products });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const product = upsertProduct(body);
  return NextResponse.json({ product, products: getHermesState().products }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const product = upsertProduct(body);
  return NextResponse.json({ product, products: getHermesState().products });
}
