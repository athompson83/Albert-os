import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.env.HOME || '/home/adam', '.openclaw/workspace/config/clipping-config.json');

export async function GET() {
  try {
    const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    const token = cfg.reap_api_key;
    if (!token) return NextResponse.json({ clips: [] });

    // Get all projects first
    const pr = await fetch('https://public.reap.video/api/v1/automation/get-all-projects?page=1&pageSize=20', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const pd = await pr.json();
    const projects = (pd.projects || pd.items || []).filter((p: Record<string, unknown>) => p.status === 'completed');

    // Get clips from each completed project
    const allClips: unknown[] = [];
    for (const proj of projects.slice(0, 5)) {
      try {
        const cr = await fetch(`https://public.reap.video/api/v1/automation/get-project-clips?projectId=${proj._id || proj.id}&page=1&pageSize=20`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const cd = await cr.json();
        const clips = (cd.clips || []).map((c: Record<string, unknown>) => ({
          id: c.id || c._id,
          projectId: proj._id || proj.id,
          title: c.title || 'Untitled',
          viralityScore: c.viralityScore || 0,
          duration: c.duration || 0,
          clipUrl: c.clipUrl || c.url || '',
          caption: c.caption || '',
        }));
        allClips.push(...clips);
      } catch {}
    }

    return NextResponse.json({ clips: allClips });
  } catch (e) {
    return NextResponse.json({ clips: [], error: String(e) });
  }
}
