import { NextResponse } from 'next/server';

const MESSAGES: Record<string, string> = {
  quiz: 'Generating 10 NREMT-style questions...',
  study_guide: 'Building key terms, clinical pearls, and summary...',
  flashcards: 'Creating Anki-compatible flashcard deck...',
  case_study: 'Generating prehospital case scenario...',
  instructor_notes: 'Building facilitator guide with discussion prompts...',
};

export async function POST(req: Request) {
  try {
    const { type, contentId, prompt } = await req.json();

    // In production: call OpenAI here with lesson content
    // For now: return stub that acknowledges the request
    const message = MESSAGES[type] || 'Generating content...';

    return NextResponse.json({
      status: 'generating',
      assetId: `asset-${Date.now()}`,
      type,
      contentId,
      message,
      estimatedSeconds: 15,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
