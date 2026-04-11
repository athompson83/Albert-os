import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

const WORKSPACE = path.join(os.homedir(), '.openclaw', 'workspace');
const NOTIF_FILE = path.join(WORKSPACE, 'data', 'notifications.json');

export type Notification = {
  id: string;
  title: string;
  body: string;
  type: 'alert' | 'task' | 'info' | 'success';
  priority: 'high' | 'medium' | 'low';
  tag?: string;
  link?: string;           // internal route e.g. /clipping
  externalUrl?: string;
  actionLabel?: string;    // CTA label if link/externalUrl provided
  createdAt: string;
  clearedAt?: string;
  cleared: boolean;
};

function ensureDir() {
  const dir = path.dirname(NOTIF_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadAll(): Notification[] {
  ensureDir();
  if (!fs.existsSync(NOTIF_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(NOTIF_FILE, 'utf8')); } catch { return []; }
}

function saveAll(notifications: Notification[]) {
  ensureDir();
  // Keep last 500 to prevent bloat
  fs.writeFileSync(NOTIF_FILE, JSON.stringify(notifications.slice(-500), null, 2));
}

// GET /api/notifications — return uncleared (or all with ?all=true)
export async function GET(req: NextRequest) {
  const all = req.nextUrl.searchParams.get('all') === 'true';
  const notifs = loadAll();
  const result = all ? notifs : notifs.filter(n => !n.cleared);
  // Sort: high priority first, then by date desc
  result.sort((a, b) => {
    const pa = a.priority === 'high' ? 0 : a.priority === 'medium' ? 1 : 2;
    const pb = b.priority === 'high' ? 0 : b.priority === 'medium' ? 1 : 2;
    if (pa !== pb) return pa - pb;
    return b.createdAt.localeCompare(a.createdAt);
  });
  return NextResponse.json({ notifications: result, uncleared: notifs.filter(n => !n.cleared).length });
}

// POST /api/notifications — create a notification (called by Albert/scripts)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const notifs = loadAll();

  // Dedup: if same id already exists uncleared, update it instead of adding
  const existing = notifs.findIndex(n => n.id === body.id && !n.cleared);
  const notif: Notification = {
    id: body.id || `notif_${Date.now()}`,
    title: body.title || 'Albert',
    body: body.body || '',
    type: body.type || 'info',
    priority: body.priority || 'medium',
    tag: body.tag,
    link: body.link,
    externalUrl: body.externalUrl,
    actionLabel: body.actionLabel,
    createdAt: body.createdAt || new Date().toISOString(),
    cleared: false,
  };

  if (existing >= 0) {
    notifs[existing] = notif;
  } else {
    notifs.push(notif);
  }

  saveAll(notifs);
  return NextResponse.json({ ok: true, notification: notif });
}

// PATCH /api/notifications — clear one or all
export async function PATCH(req: NextRequest) {
  const { id, clearAll } = await req.json();
  const notifs = loadAll();
  const now = new Date().toISOString();

  if (clearAll) {
    notifs.forEach(n => { n.cleared = true; n.clearedAt = now; });
  } else if (id) {
    const idx = notifs.findIndex(n => n.id === id);
    if (idx >= 0) { notifs[idx].cleared = true; notifs[idx].clearedAt = now; }
  }

  saveAll(notifs);
  return NextResponse.json({ ok: true });
}
