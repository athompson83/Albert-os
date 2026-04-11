import { NextRequest, NextResponse } from 'next/server';
import { readdirSync, readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';

const WORKSPACE = join(process.env.HOME || '', '.openclaw', 'workspace');

function readDraftsFromDir(dir: string, source: string) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(f => f.endsWith('.md') && f.startsWith('issue-') && !f.includes('launch') && !f.includes('brief'))
    .map(f => {
      const content = readFileSync(join(dir, f), 'utf8');
      const lines = content.split('\n');
      // Extract metadata
      const titleMatch = content.match(/^#\s+(.+)/m);
      const topicMatch = content.match(/\*\*Topic:\*\*\s*(.+)/);
      const statusMatch = content.match(/\*\*Status:\*\*\s*(.+)/);
      const dateMatch = content.match(/\*\*Generated:\*\*\s*(.+)/);
      const numMatch = f.match(/issue-(\d+)/);
      const subjectMatch = content.match(/Subject line[:\*\s]+(.+)/i);

      // Get first real paragraph as preview
      const bodyStart = content.indexOf('---\n') + 4;
      const bodyText = content.slice(bodyStart).replace(/^#+.+$/gm, '').replace(/\*\*/g, '').trim();
      const preview = bodyText.split('\n').filter(l => l.trim().length > 40)[0]?.slice(0, 160) || '';

      return {
        id: f.replace('.md', ''),
        file: f,
        source,
        path: join(dir, f),
        number: numMatch ? parseInt(numMatch[1]) : 0,
        title: subjectMatch?.[1]?.trim() || topicMatch?.[1]?.trim() || titleMatch?.[1]?.replace(/^The Resuscitationist — /, '').trim() || f,
        topic: topicMatch?.[1]?.trim() || '',
        status: statusMatch?.[1]?.trim() || 'draft',
        date: dateMatch?.[1]?.trim() || f.match(/\d{4}-\d{2}-\d{2}/)?.[0] || '',
        preview,
        wordCount: content.split(/\s+/).length,
        content,
      };
    })
    .sort((a, b) => b.number - a.number);
}

export async function GET() {
  const drafts = [
    ...readDraftsFromDir(join(WORKSPACE, 'content', 'newsletter'), 'content'),
    ...readDraftsFromDir(join(WORKSPACE, 'projects', 'wealth', 'resuscitationist'), 'legacy'),
  ].sort((a, b) => b.number - a.number);

  return NextResponse.json({ drafts });
}

export async function GET_SINGLE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'No id' }, { status: 400 });
  // Search both dirs
  for (const dir of [
    join(WORKSPACE, 'content', 'newsletter'),
    join(WORKSPACE, 'projects', 'wealth', 'resuscitationist'),
  ]) {
    const file = join(dir, `${id}.md`);
    if (existsSync(file)) {
      return NextResponse.json({ content: readFileSync(file, 'utf8') });
    }
  }
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
