import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanText, normaliseTopic, parseFeed, scoreTopic } from '../lib/research.mjs';

test('cleanText removes markup and decodes common entities', () => {
  assert.equal(cleanText('<b>Ancient&nbsp;India</b> &amp; heritage'), 'Ancient&nbsp;India & heritage');
});
test('normaliseTopic deduplicates case and punctuation', () => {
  assert.equal(normaliseTopic('Kallanai: The Dam!'), normaliseTopic('kallanai the dam'));
});
test('parseFeed reads RSS item titles and links', () => {
  const xml = '<rss><channel><item><title>Indian fort history</title><link>https://example.org/fort</link><description>Evidence</description><pubDate>Mon, 05 Oct 2026 10:00:00 GMT</pubDate></item></channel></rss>';
  const parsed = parseFeed(xml, 'https://example.org/rss.xml');
  assert.equal(parsed.length, 1); assert.equal(parsed[0].title, 'Indian fort history'); assert.equal(parsed[0].url, 'https://example.org/fort');
});
test('scoreTopic emits bounded heuristic scores and corroboration warnings', () => {
  const result = scoreTopic({ title: 'Indian heritage fort architecture', summary: 'history monument', sources: [{ url: 'https://example.org' }] });
  assert.ok(result.score >= 0 && result.score <= 100);
  assert.equal(result.scoreIsHeuristic, true);
  assert.ok(result.flags.includes('Needs independent corroboration'));
});