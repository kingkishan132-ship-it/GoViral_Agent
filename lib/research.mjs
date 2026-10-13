const WIKI_ENDPOINT = 'https://en.wikipedia.org/w/api.php';
const DEFAULT_QUERIES = [
  'Indian archaeology recent discoveries',
  'Indian heritage monuments history',
  'ancient Indian science technology',
  'medieval Indian history architecture',
  'forgotten Indian inventions history',
  'Indian conservation archaeology museum',
];

export function cleanText(value = '') {
  return String(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, ' ').trim();
}

export function normaliseTopic(value = '') {
  return cleanText(value).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function scoreTopic(item) {
  const title = cleanText(item.title || '');
  const text = `${title} ${cleanText(item.summary || '')}`.toLowerCase();
  const sources = Array.isArray(item.sources) ? item.sources : [];
  const sourceDomains = new Set(sources.map(s => { try { return new URL(s.url).hostname.replace(/^www\./, ''); } catch { return ''; } }).filter(Boolean));
  const sourceScore = Math.min(26, sourceDomains.size * 9);
  const visualTerms = ['temple','fort','monument','cave','inscription','map','river','bridge','archaeology','sculpture','observatory','stepwell','shipwreck','invention','architecture','museum','rock art'];
  const visualScore = Math.min(22, visualTerms.filter(t => text.includes(t)).length * 5);
  const heritageTerms = ['india','indian','bharat','archaeology','heritage','history','ancient','medieval','dynasty','inscription','museum','fort','temple'];
  const relevanceScore = Math.min(20, heritageTerms.filter(t => text.includes(t)).length * 4);
  const published = item.publishedAt ? Date.parse(item.publishedAt) : NaN;
  const ageDays = Number.isFinite(published) ? Math.max(0, (Date.now() - published) / 86400000) : 365;
  const freshnessScore = Number.isFinite(published) ? Math.max(0, 16 - Math.min(16, ageDays / 7)) : 5;
  const noveltyScore = Math.min(16, (title.split(' ').length > 5 ? 8 : 4) + (text.match(/discovered|new|rare|forgotten|unknown|excavat|restor|digitis|archive|reveals/g) || []).length * 2);
  const riskTerms = ['shocking truth','secret they hide','proof that history is fake','unbelievable','aliens built','100% proven'];
  const riskPenalty = riskTerms.some(t => text.includes(t)) ? 18 : 0;
  const score = Math.max(0, Math.min(100, Math.round(sourceScore + visualScore + relevanceScore + freshnessScore + noveltyScore - riskPenalty)));
  const flags = [];
  if (sourceDomains.size < 2) flags.push('Needs independent corroboration');
  if (!Number.isFinite(published)) flags.push('Publication date unavailable');
  if (riskPenalty) flags.push('Sensational wording risk');
  return { ...item, score, sourceCount: sourceDomains.size, scoreBreakdown: { sourceDiversity: sourceScore, visualPotential: visualScore, channelRelevance: relevanceScore, freshness: Math.round(freshnessScore), noveltyHeuristic: noveltyScore, riskPenalty }, flags,
    evidenceStatus: sourceDomains.size >= 3 ? 'Cross-source lead' : sourceDomains.size === 2 ? 'Two-source lead' : 'Single-source lead',
    scoreIsHeuristic: true };
}

function extractTag(block, name) {
  const re = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i');
  const match = block.match(re);
  return match ? cleanText(match[1]) : '';
}
function extractLink(block) {
  const atom = block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*\/?\s*>/i);
  if (atom) return atom[1];
  const link = extractTag(block, 'link');
  return link || '';
}

export function parseFeed(xml, feedUrl) {
  const blocks = [...String(xml).matchAll(/<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map(m => m[2]);
  const sourceName = (() => { try { return new URL(feedUrl).hostname.replace(/^www\./, ''); } catch { return feedUrl; } })();
  return blocks.map(block => {
    const title = extractTag(block, 'title');
    const link = extractLink(block);
    const summary = extractTag(block, 'description') || extractTag(block, 'summary') || extractTag(block, 'content:encoded');
    const published = extractTag(block, 'pubDate') || extractTag(block, 'published') || extractTag(block, 'updated');
    return { title, url: link, summary: summary.slice(0, 1100), publishedAt: published && Number.isFinite(Date.parse(published)) ? new Date(published).toISOString() : null,
      source: sourceName, sources: [{ title: sourceName, url: feedUrl, kind: 'feed' }], kind: 'rss' };
  }).filter(x => x.title && x.url && /^https?:\/\//i.test(x.url));
}

async function fetchJson(url) {
  let lastError;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "GoViral_Agent/1.0 (public-source research)",
          "Accept": "application/json",
        },
        signal: AbortSignal.timeout(12000),
        cache: "no-store",
      });

      if (
        (response.status === 429 || response.status >= 500) &&
        attempt < 2
      ) {
        const retryAfter =
          Number(response.headers.get("retry-after")) ||
          (attempt + 1) * 2;

        await new Promise(resolve =>
          setTimeout(resolve, Math.min(retryAfter * 1000, 5000))
        );
        continue;
      }

      if (!response.ok) {
        throw new Error(`Source returned HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;

      if (attempt < 2) {
        await new Promise(resolve =>
          setTimeout(resolve, (attempt + 1) * 1200)
        );
        continue;
      }

      throw error;
    }
  }

  throw lastError || new Error("Source request failed after retries");
}



async function wikipediaSearch(query) {
  const url = new URL(WIKI_ENDPOINT);
  Object.entries({ action: 'query', list: 'search', srsearch: query, srlimit: '8', format: 'json', origin: '*' }).forEach(([k,v]) => url.searchParams.set(k, v));
  const data = await fetchJson(url.toString());
  return (data?.query?.search || []).map(row => ({
    id: `wiki-${row.pageid}`,
    title: cleanText(row.title),
    url: `https://en.wikipedia.org/?curid=${row.pageid}`,
    summary: cleanText(row.snippet || '').slice(0, 900),
    publishedAt: null,
    source: 'Wikipedia / MediaWiki search',
    sources: [{ title: 'Wikipedia / MediaWiki', url: `https://en.wikipedia.org/?curid=${row.pageid}`, kind: 'reference' }],
    kind: 'encyclopedia',  }));
}

export async function buildResearchFeed(options = {}) {
  const startedAt = new Date().toISOString();
  const queries = options.queries || DEFAULT_QUERIES;
  const errors = [];
  const queryResults = await Promise.all(queries.map(async query => {
    try { return await wikipediaSearch(query); }
    catch (error) { errors.push({ source: 'Wikipedia / MediaWiki', query, message: error?.message || 'Fetch failed' }); return []; }
  }));
  const feedUrls = String(options.rssFeeds ?? process.env.RSS_FEEDS ?? '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 20);
  const rssResults = await Promise.all(feedUrls.map(async feedUrl => {
    try {
      const r = await fetch(feedUrl, { headers: { 'User-Agent': 'GoViral_Agent/1.0 (RSS reader)', 'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml' }, signal: AbortSignal.timeout(12000) });
      if (!r.ok) throw new Error(`Feed returned HTTP ${r.status}`);
      return parseFeed(await r.text(), feedUrl).slice(0, 30);
    } catch (error) { errors.push({ source: feedUrl, message: error?.message || 'Feed fetch failed' }); return []; }
  }));
  const raw = [...queryResults.flat(), ...rssResults.flat()];
  const deduped = new Map();
  for (const item of raw) {
    const key = normaliseTopic(item.title);
    if (!key) continue;
    if (deduped.has(key)) {
      const old = deduped.get(key);
      old.sources = [...old.sources, ...(item.sources || [])].filter((s, i, arr) => arr.findIndex(x => x.url === s.url) === i);
      if ((item.summary || '').length > (old.summary || '').length) old.summary = item.summary;
      if (item.publishedAt && (!old.publishedAt || item.publishedAt > old.publishedAt)) old.publishedAt = item.publishedAt;
    } else deduped.set(key, { ...item, sources: item.sources || [{ title: item.source || 'Source', url: item.url }] });
  }
  const topics = [...deduped.values()].map(item => scoreTopic(item)).sort((a,b) => b.score - a.score).slice(0, 60).map((item, i) => ({ ...item, id: item.id || `topic-${i}-${normaliseTopic(item.title).replace(/ /g, '-').slice(0, 48)}` }));
  const allDomains = new Set(topics.flatMap(t => t.sources.map(s => { try { return new URL(s.url).hostname.replace(/^www\./, ''); } catch { return ''; } })).filter(Boolean));
  return { generatedAt: new Date().toISOString(), startedAt, topics, totalFetched: raw.length, totalAfterDeduplication: deduped.size, sourcesUsed: [...allDomains], errors, notes: [
    'Research is limited to the configured RSS/Atom feeds and public MediaWiki search queries; this is not a scan of the entire internet.',
    'Wikipedia results and headlines are research leads, not independently verified historical claims.',
    'Opportunity scores are heuristics, not predictions of virality.',
  ] };
}
