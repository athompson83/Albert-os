import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const runtime = 'nodejs';

export async function GET() {
  const statusPath = join(process.cwd(), 'STATUS.md');
  const summaryPath = join(process.cwd(), 'SUMMARY.md');

  let status = '';
  let summary = '';

  if (existsSync(statusPath)) {
    status = readFileSync(statusPath, 'utf-8');
  }
  if (existsSync(summaryPath)) {
    summary = readFileSync(summaryPath, 'utf-8');
  }

  return NextResponse.json({
    status,
    summary,
    timestamp: new Date().toISOString(),
  });
}
