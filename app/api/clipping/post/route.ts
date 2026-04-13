import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.env.HOME || '/home/adam', '.openclaw/workspace/config/clipping-config.json');

export async function POST(req: Request) {
  try {
    const { clipId, projectId, caption } = await req.json();
    const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    const token = cfg.reap_api_key;
    const TIKTOK = cfg.tiktok_integration_id || '69dce76cc48be5a88aa51803';
    const IG = cfg.instagram_integration_id || '69dce5c6446c682bee61efa4';

    const r = await fetch('https://public.reap.video/api/v1/automation/publish-clip', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        clipId,
        integrations: [TIKTOK, IG],
        caption: caption || '',
      }),
    });

    const data = await r.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
