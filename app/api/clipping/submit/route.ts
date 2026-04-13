import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.env.HOME || '/home/adam', '.openclaw/workspace/config/clipping-config.json');

export async function POST(req: Request) {
  try {
    const { url, title } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

    const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    const token = cfg.reap_api_key;
    if (!token) return NextResponse.json({ error: 'No API key' }, { status: 500 });

    const r = await fetch('https://public.reap.video/api/v1/automation/create-clips', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceUrl: url,
        genre: 'talking',
        exportResolution: 1080,
        exportOrientation: 'portrait',
        reframeClips: true,
        captionsPreset: 'system_beasty',
        enableHighlights: true,
        language: 'en',
      }),
    });

    const data = await r.json();
    return NextResponse.json({ project: data, status: r.status });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
