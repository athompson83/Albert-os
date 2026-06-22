import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { getHermesState } from '@/lib/hermes-gateway';

export const runtime = 'nodejs';

const productFiles: Record<string, string> = {
  prod_emt_cards: 'EMT_Quick_Reference_Cards.pdf',
  prod_paramedic_pharm: 'Paramedic_Pharmacology_Cheat_Sheet.pdf',
  prod_ekg_guide: 'EKG_Interpretation_Guide.pdf',
  prod_med_terms: 'EMS_Medical_Terminology.pdf',
};

function safeFilename(value: string) {
  return value.replace(/[^a-z0-9_.-]/gi, '_');
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const product = getHermesState().products.find(item => item.id === id);
  const filename = productFiles[id];

  if (!product || !filename) {
    return NextResponse.json({ error: 'Product download not found' }, { status: 404 });
  }

  const filePath = join(process.cwd(), 'store', 'pdfs', filename);
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: 'Product file missing' }, { status: 404 });
  }

  const file = readFileSync(filePath);
  return new NextResponse(file, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${safeFilename(filename)}"`,
      'Cache-Control': 'public, max-age=300',
    },
  });
}
