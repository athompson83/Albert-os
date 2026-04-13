import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.env.HOME || '/home/adam', '.openclaw/workspace/config/clipping-config.json');

export async function GET() {
  try {
    const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    const token = cfg.reap_api_key;
    if (!token) return NextResponse.json({ projects: [] });

    const r = await fetch('https://public.reap.video/api/v1/automation/get-all-projects?page=1&pageSize=20', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!r.ok) return NextResponse.json({ projects: [] });
    const data = await r.json();
    const projects = (data.projects || data.items || []).map((p: Record<string, unknown>) => ({
      id: p._id || p.id,
      title: p.title || 'Untitled',
      status: p.status,
      source: p.source,
    }));

    // Get clip counts for completed projects
    const withCounts = await Promise.all(
      projects.map(async (p: { id: string; title: string; status: string; source: string }) => {
        if (p.status !== 'completed') return p;
        try {
          const cr = await fetch(`https://public.reap.video/api/v1/automation/get-project-clips?projectId=${p.id}&page=1&pageSize=1`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const cd = await cr.json();
          return { ...p, clipCount: cd.totalClips || 0 };
        } catch { return p; }
      })
    );

    return NextResponse.json({ projects: withCounts });
  } catch (e) {
    return NextResponse.json({ projects: [], error: String(e) });
  }
}
