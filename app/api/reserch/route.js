import { buildResearchFeed } from '../../../lib/research.mjs';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST() {
  try {
    const result = await buildResearchFeed();
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ error: 'Public-source research failed', detail: error?.message || 'Unknown error' }, { status: 502 });
  }
}

export async function GET() {
  return Response.json({ error: 'Use POST to run a fresh research request.' }, { status: 405, headers: { Allow: 'POST' } });
}