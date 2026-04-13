import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const WORKSPACE = path.join(process.env.HOME || '/home/adam', '.openclaw/workspace');

// Map of config keys to their file + JSON path
const CONFIG_MAP: Record<string, { file: string; path: string[] }> = {
  reap_api_key:           { file: 'config/clipping-config.json', path: ['reap_api_key'] },
  dropbox_access_token:   { file: 'config/integrations.json',    path: ['dropbox', 'access_token'] },
  tiktok_integration_id:  { file: 'config/clipping-config.json', path: ['tiktok_integration_id'] },
  instagram_integration_id: { file: 'config/clipping-config.json', path: ['instagram_integration_id'] },
  youtube_channel_id:     { file: 'config/clipping-config.json', path: ['youtube_channel_id'] },
  monday_api_token:       { file: 'config/integrations.json',    path: ['monday', 'api_token'] },
  github_token:           { file: 'config/integrations.json',    path: ['github', 'token'] },
};

function setNested(obj: Record<string, unknown>, keyPath: string[], value: string): void {
  let current = obj;
  for (let i = 0; i < keyPath.length - 1; i++) {
    if (!current[keyPath[i]] || typeof current[keyPath[i]] !== 'object') {
      current[keyPath[i]] = {};
    }
    current = current[keyPath[i]] as Record<string, unknown>;
  }
  current[keyPath[keyPath.length - 1]] = value;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { key, value } = body;

    if (!key || !value) {
      return NextResponse.json({ error: 'key and value required' }, { status: 400 });
    }

    const mapping = CONFIG_MAP[key];
    if (!mapping) {
      return NextResponse.json({ error: `Unknown config key: ${key}. Valid keys: ${Object.keys(CONFIG_MAP).join(', ')}` }, { status: 400 });
    }

    const filePath = path.join(WORKSPACE, mapping.file);

    // Read existing config or start fresh
    let config: Record<string, unknown> = {};
    if (fs.existsSync(filePath)) {
      try {
        config = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch {}
    }

    // Set the value at the nested path
    setNested(config, mapping.path, value);

    // Ensure directory exists
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    // Write back
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2));

    return NextResponse.json({
      success: true,
      key,
      file: mapping.file,
      message: `Saved ${key} to ${mapping.file}`,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// GET — read a config value (masked for security)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');

  if (!key) {
    return NextResponse.json({ keys: Object.keys(CONFIG_MAP) });
  }

  const mapping = CONFIG_MAP[key];
  if (!mapping) {
    return NextResponse.json({ error: 'Unknown key' }, { status: 400 });
  }

  try {
    const filePath = path.join(WORKSPACE, mapping.file);
    if (!fs.existsSync(filePath)) return NextResponse.json({ exists: false });

    const config = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let val = config as unknown;
    for (const k of mapping.path) {
      val = (val as Record<string, unknown>)?.[k];
    }

    if (!val) return NextResponse.json({ exists: false });

    // Mask the value — show first 8 chars + ***
    const masked = String(val).slice(0, 8) + '***';
    return NextResponse.json({ exists: true, masked });
  } catch {
    return NextResponse.json({ exists: false });
  }
}
