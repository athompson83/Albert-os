import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  // Stub — wire to OpenAI/Anthropic in production
  return NextResponse.json({ code: `// Generated for: "${prompt}"\n// Full AI generation coming soon\n\nexport default function Component() {\n  return <div>Your component here</div>;\n}` });
}
