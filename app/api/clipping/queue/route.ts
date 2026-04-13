import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const QUEUE_PATH = path.join(process.env.HOME || '/home/adam', '.openclaw/workspace/content/video-queue.json');

export async function GET() {
  try {
    if (!fs.existsSync(QUEUE_PATH)) return NextResponse.json({ queue: [] });
    const queue = JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf8'));
    return NextResponse.json({ queue });
  } catch {
    return NextResponse.json({ queue: [] });
  }
}
