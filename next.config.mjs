import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { buildResearchFeed } from '../lib/research.mjs';

const root = resolve(process.cwd(), 'public/data');
await mkdir(root, { recursive: true });
console.log('[GoViral_Agent] Starting daily public-source research…');
const feed = await buildResearchFeed();
await writeFile(resolve(root, 'research-feed.json'), JSON.stringify(feed, null, 2) + '\n', 'utf8');
await writeFile(resolve(root, 'last-run.json'), JSON.stringify({ generatedAt: feed.generatedAt, totalFetched: feed.totalFetched, totalAfterDeduplication: feed.totalAfterDeduplication, sourceCount: feed.sourcesUsed.length, errorCount: feed.errors.length, notes: feed.notes }, null, 2) + '\n', 'utf8');
console.log(`[GoViral_Agent] fetched=${feed.totalFetched}; unique=${feed.totalAfterDeduplication}; sources=${feed.sourcesUsed.length}; errors=${feed.errors.length}`);
if (!feed.topics.length) console.warn('[GoViral_Agent] No topics returned. Review network access and optional RSS_FEEDS configuration.');