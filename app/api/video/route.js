"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';

const NAV = [
  { id: 'overview', label: 'Overview', icon: '◫' },
  { id: 'research', label: 'Research desk', icon: '⌕' },
  { id: 'studio', label: 'Video studio', icon: '▷' },
  { id: 'planner', label: 'Weekly plan', icon: '▦' },
  { id: 'analytics', label: 'Performance', icon: '↗' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];
const demoTopics = [
  { id: 'demo-kallanai', title: 'Kallanai: the engineering behind an ancient water system', score: 86, summary: 'A research lead for a documentary on historic water engineering. Verify dating, construction history and modern modifications from reliable sources.', source: 'Demo topic · not live research', sources: [], flags: ['Demo example — run live research to replace'], evidenceStatus: 'Demo', scoreIsHeuristic: true },
  { id: 'demo-rock-art', title: 'What rock art can—and cannot—tell us about early life', score: 79, summary: 'An evidence-first visual story about archaeological interpretation and the limits of inference.', source: 'Demo topic · not live research', sources: [], flags: ['Demo example — run live research to replace'], evidenceStatus: 'Demo', scoreIsHeuristic: true },
  { id: 'demo-observatory', title: 'Historic observatories as instruments, not just monuments', score: 73, summary: 'Explore how documented instruments and architectural alignments can be explained without unsupported claims.', source: 'Demo topic · not live research', sources: [], flags: ['Demo example — run live research to replace'], evidenceStatus: 'Demo', scoreIsHeuristic: true },
];

function Icon({ children, className = '' }) { return <span aria-hidden="true" className={`icon ${className}`}>{children}</span>; }
function Score({ value }) { return <div className="score"><span className="score-ring" style={{ '--score': `${Math.max(0, Math.min(100, value || 0))}%` }}><b>{value ?? '—'}</b></span><span className="score-label">opportunity<br/>score</span></div>; }
function formatDate(date) { if (!date) return 'No run yet'; try { return new Date(date).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch { return String(date); } }

export default function Home() {
  const [active, setActive] = useState('overview');
  const [topics, setTopics] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [researchMeta, setResearchMeta] = useState(null);
  const [researching, setResearching] = useState(false);
  const [researchError, setResearchError] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('score');
  const [script, setScript] = useState(null);
  const [language, setLanguage] = useState('Hinglish');
  const [drafts, setDrafts] = useState([]);
  const [appPassword, setAppPassword] = useState('');
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoJob, setVideoJob] = useState(null);
  const [videoBusy, setVideoBusy] = useState(false);
  const [videoError, setVideoError] = useState('');
  const [posts, setPosts] = useState([]);
  const [analyticsMessage, setAnalyticsMessage] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('goviral-topics') || 'null');
      if (Array.isArray(saved) && saved.length) setTopics(saved);
      else setTopics(demoTopics);
      setDrafts(JSON.parse(localStorage.getItem('goviral-drafts') || '[]'));
      setPosts(JSON.parse(localStorage.getItem('goviral-posts') || '[]'));
      const storedScript = localStorage.getItem('goviral-script');
      if (storedScript) setScript(JSON.parse(storedScript));
      const meta = JSON.parse(localStorage.getItem('goviral-research-meta') || 'null');
      if (meta) setResearchMeta(meta);
    } catch { setTopics(demoTopics); }
    try { setAppPassword(sessionStorage.getItem('goviral-app-password') || ''); } catch {}
    fetch('/data/research-feed.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(data => {
      if (data?.topics?.length) {
        setTopics(current => {
          const list = [...data.topics].sort((a,b) => (b.score || 0) - (a.score || 0));
          try { localStorage.setItem('goviral-topics', JSON.stringify(list)); } catch {}
          return list;
        });
        setResearchMeta({ generatedAt: data.generatedAt, totalFetched: data.totalFetched, totalAfterDeduplication: data.totalAfterDeduplication, errors: data.errors || [] });
      }
    }).catch(() => {});
  }, []);

  const selectedTopic = useMemo(() => topics.find(t => t.id === selectedId) || topics[0] || null, [topics, selectedId]);
  const visibleTopics = useMemo(() => {
    const q = query.toLowerCase().trim();
    const rows = topics.filter(t => !q || `${t.title} ${t.summary || ''} ${(t.sources || []).map(s => s.title).join(' ')}`.toLowerCase().includes(q));
    return rows.sort((a,b) => sort === 'score' ? (b.score || 0) - (a.score || 0) : new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
  }, [topics, query, sort]);

  const runResearch = useCallback(async () => {
    setResearching(true); setResearchError('');
    try {
      const response = await fetch('/api/research', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Research request failed');
      const sorted = (data.topics || []).sort((a,b) => (b.score || 0) - (a.score || 0));
      if (!sorted.length) throw new Error('No sources returned. Check your network or add RSS feeds in the repository environment.');
      setTopics(sorted); setSelectedId(sorted[0]?.id || null);
      const meta = { generatedAt: data.generatedAt, totalFetched: data.totalFetched, totalAfterDeduplication: data.totalAfterDeduplication, sourcesUsed: data.sourcesUsed, errors: data.errors || [], notes: data.notes || [] };
      setResearchMeta(meta);
      try { localStorage.setItem('goviral-topics', JSON.stringify(sorted)); localStorage.setItem('goviral-research-meta', JSON.stringify(meta)); } catch {}
      setActive('research');
    } catch (error) { setResearchError(error?.message || 'Research failed. Try again.'); }
    finally { setResearching(false); }
  }, []);

  const createPlan = (topic = selectedTopic) => {
    if (!topic) return;const plan = createLocalPlan(topic, language);
    setScript(plan); setVideoPrompt(plan.videoPrompt);
    try { localStorage.setItem('goviral-script', JSON.stringify(plan)); } catch {}
    setActive('studio');
  };

  const saveDraft = () => {
    if (!script) return;
    const item = { ...script, savedAt: new Date().toISOString() };
    const next = [item, ...drafts.filter(d => d.title !== item.title)].slice(0, 30);
    setDrafts(next); try { localStorage.setItem('goviral-drafts', JSON.stringify(next)); } catch {}
    setAnalyticsMessage('Draft saved on this device.'); setTimeout(() => setAnalyticsMessage(''), 2800);
  };
  const exportFile = (name, value, type = 'application/json') => {
    const blob = new Blob([typeof value === 'string' ? value : JSON.stringify(value, null, 2)], { type });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
  };

  const authHeaders = () => ({ 'Content-Type': 'application/json', 'X-App-Password': appPassword });
  const generateVideo = async () => {
    setVideoBusy(true); setVideoError(''); setVideoJob(null);
    try {
      if (!appPassword) throw new Error('First add your app password in Settings.');
      if (!videoPrompt.trim()) throw new Error('Write or generate a video prompt first.');
      try { sessionStorage.setItem('goviral-app-password', appPassword); } catch {}
      const res = await fetch('/api/video', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ prompt: videoPrompt.trim() }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not start video generation.');
      setVideoJob(data);
    } catch (error) { setVideoError(error?.message || 'Video generation failed.'); }
    finally { setVideoBusy(false); }
  };
  const refreshVideo = async () => {
    if (!videoJob?.id) return;
    setVideoBusy(true); setVideoError('');
    try {
      const res = await fetch(`/api/video?id=${encodeURIComponent(videoJob.id)}`, { headers: { 'X-App-Password': appPassword } });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Could not check video status.'); setVideoJob(data);
    } catch (error) { setVideoError(error?.message || 'Status lookup failed.'); }
    finally { setVideoBusy(false); }
  };

  const importCsv = async (file) => {
    if (!file) return;
    const text = await file.text();
    const rows = parseCsv(text);
    if (!rows.length) { setAnalyticsMessage('No usable rows found. Expected columns include views, reach, shares, saves, follows.'); return; }
    setPosts(rows); try { localStorage.setItem('goviral-posts', JSON.stringify(rows)); } catch {}
    setAnalyticsMessage(`Imported ${rows.length} post(s). Metrics remain on this device.`);
  };

  const stats = useMemo(() => {
    const valid = posts;
    const sum = key => valid.reduce((n,p) => n + (Number(p[key]) || 0), 0);
    return { count: valid.length, views: sum('views'), reach: sum('reach'), saves: sum('saves'), shares: sum('shares'), follows: sum('follows'), averageViews: valid.length ? Math.round(sum('views') / valid.length) : 0 };
  }, [posts]);

  return <main className="app-shell">
    <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
      <div className="brand-lockup"><div className="brand-mark">GV<span>·</span></div><div><strong>GoViral<span className="brand-underscore">_</span>Agent</strong><small>RESEARCH TO REEL</small></div><button className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="Close navigation">×</button></div>
      <div className="workspace-label">WORKSPACE <span>01</span></div>
      <nav className="nav-list" aria-label="Main navigation">{NAV.map(n => <button key={n.id} onClick={() => { setActive(n.id); setMenuOpen(false); }} className={`nav-item ${active === n.id ? 'nav-active' : ''}`}><Icon>{n.icon}</Icon><span>{n.label}</span>{n.id === 'research' && topics.filter(t => !String(t.id).startsWith('demo-')).length > 0 && <b className="nav-count">{topics.filter(t => !String(t.id).startsWith('demo-')).length}</b>}</button>)}</nav>
      <div className="sidebar-spacer" />
      <div className="channel-card"><div className="channel-avatar">404</div><div className="channel-copy"><strong>Real_bharat_404</strong><span>Indian history & heritage</span></div><span className="live-dot" /></div>
      <div className="sidebar-status"><span className="status-dot" /> Rules + public sources <span className="status-tail">●</span></div>
      <p className="sidebar-foot">Built for evidence-first storytelling.<br/>No virality guarantees. No fake facts.</p>
    </aside>

    <section className="main-column">
      <header className="topbar"><button className="mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open navigation">☰</button><div className="breadcrumb"><span>CREATOR WORKSPACE</span><b>/</b><strong>{NAV.find(n => n.id === active)?.label || 'Overview'}</strong></div><div className="topbar-actions"><span className="date-pill"><span>●</span> {new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short' })}</span><button className="avatar-small" title="Real_bharat_404" onClick={() => setActive('settings')}>404</button></div></header>
      {active === 'overview' && <>
        <section className="hero-section"><div className="hero-eyebrow"><span className="eyebrow-line"/> YOUR DAILY EDITORIAL INTELLIGENCE</div><div className="hero-grid"><div><h1>Find the story.<br/><em>Prove the story.</em></h1><p className="hero-subtitle">A research-first content command center for Real_bharat_404. Discover leads, check evidence, shape a reel, then produce.</p><div className="hero-actions"><button className="button button-primary" onClick={runResearch} disabled={researching}><Icon>{researching ? '◌' : '⌕'}</Icon>{researching ? 'Researching sources…' : 'Run live research'}<span>↗</span></button><button className="button button-quiet" onClick={() => setActive('studio')}>Open video studio <span>→</span></button></div>{researchError && <p className="error-inline">{researchError}</p>}</div><div className="hero-stamp"><div className="stamp-top">EDITORIAL SYSTEM <span>• 01</span></div><div className="stamp-main">HISTORY<br/><i>IS EVIDENCE.</i></div><div className="stamp-bottom"><span>INDEPENDENT SOURCES</span><span>REAL CONTEXT</span></div><div className="stamp-circle">GV</div></div></div></section>
        <section className="metrics-grid"><Metric label="RESEARCH LEADS" value={topics.filter(t => !String(t.id).startsWith('demo-')).length || '—'} detail={researchMeta?.generatedAt ? `Updated ${formatDate(researchMeta.generatedAt)}` : 'Run research to populate'} icon="⌕"/><Metric label="TOP OPPORTUNITY" value={topics.length ? `${Math.max(...topics.map(t => t.score || 0))}/100` : '—'} detail="Heuristic, not a viral prediction" icon="↗"/><Metric label="SAVED DRAFTS" value={drafts.length} detail="Saved in this browser" icon="▤"/><Metric label="POSTS ANALYSED" value={stats.count || '—'} detail={stats.count ? `${stats.averageViews.toLocaleString()} avg views` : 'Import your metrics CSV'} icon="◫"/></section>
        <section className="section-block"><div className="section-heading"><div><div className="overline">01 / OPPORTUNITY RADAR</div><h2>Stories worth a closer look</h2><p>Top-ranked research leads from the latest available topic set.</p></div><button className="text-link" onClick={() => setActive('research')}>All research <span>→</span></button></div><div className="topic-grid">{topics.slice(0,3).map((t,i)=><TopicCard key={t.id || t.title} topic={t} index={i} onSelect={() => { setSelectedId(t.id); setActive('research'); }} onPlan={() => { setSelectedId(t.id); const p=createLocalPlan(t,language); setScript(p); setVideoPrompt(p.videoPrompt); localStorage.setItem('goviral-script',JSON.stringify(p)); setActive('studio'); }}/>)}</div>{topics.every(t => String(t.id).startsWith('demo-')) && <div className="demo-note"><span>i</span><div><strong>These are illustrative cards, not live research.</strong><p>Tap “Run live research” to replace examples with source results from public MediaWiki search and any configured RSS feeds.</p></div></div>}</section>
        <section className="bottom-grid"><div className="panel workflow-panel"><div className="panel-heading"><div><div className="overline">02 / WORKFLOW</div><h3>From lead to finished reel</h3></div><span className="panel-chip">5 steps</span></div><div className="workflow-list">{[{n:'01',title:'Collect sources',sub:'RSS feeds + public reference search',done:!!researchMeta},{n:'02',title:'Review the evidence',sub:'Open each link; verify important claims',done:false},{n:'03',title:'Build the storyboard',sub:'Hook, narration and scene-by-scene plan',done:!!script},{n:'04',title:'Generate AI video',sub:'Requires provider token and may cost money',done:videoJob?.status==='succeeded'||videoJob?.status==='successful'},{n:'05',title:'Review & export',sub:'Check accuracy, visuals, captions and licences',done:false}].map(x=><div className="workflow-row" key={x.n}><span className={`workflow-number ${x.done?'workflow-done':''}`}>{x.done?'✓':x.n}</span><div><strong>{x.title}</strong><span>{x.sub}</span></div><span className={`workflow-state ${x.done?'state-done':''}`}>{x.done?'Done':'Next'}</span></div>)}</div></div><div className="panel run-panel"><div className="overline">03 / SYSTEM STATUS</div><h3>Built for a careful creator.</h3><p>GoViral_Agent uses public sources and scoring rules for the research layer. AI video is optional and requires a configured model provider.</p><div className="status-row"><span className="status-mini good"/> Public research <b>Available</b></div><div className="status-row"><span className={`status-mini ${process.env.NODE_ENV==='production'?'good':'neutral'}`}/> Hosted video provider <b>Configure in Settings / README</b></div><button className="button button-outline button-full" onClick={() => setActive('settings')}>Configure access <span>→</span></button></div></section>
      </>}

      {active === 'research' && <section className="page-section"><PageTitle overline="01 / RESEARCH DESK" title="Research before the hook." subtitle="A lead is not a fact. Track where a topic came from, what remains unverified and why it might translate visually." action={<button className="button button-primary" onClick={runResearch} disabled={researching}>{researching ? 'Searching…' : '↻ Run live research'}</button>}/>{researchError && <div className="alert alert-error">{researchError}</div>}<div className="research-toolbar"><label className="search-field"><Icon>⌕</Icon><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search topics, keywords or sources…"/></label><select value={sort} onChange={e=>setSort(e.target.value)} aria-label="Sort topics"><option value="score">Highest opportunity</option><option value="date">Most recent</option></select></div>{researchMeta && <div className="feed-summary"><span><b>{researchMeta.totalFetched ?? '—'}</b> raw results fetched</span><span><b>{researchMeta.totalAfterDeduplication ?? topics.length}</b> after deduplication</span><span>Last run: <b>{formatDate(researchMeta.generatedAt)}</b></span><span className="heuristic-pill">Heuristic scores</span></div>}<div className="research-layout"><div className="research-list">{visibleTopics.map((t,i)=><button key={t.id || t.title} onClick={()=>setSelectedId(t.id)} className={`research-row ${selectedTopic?.id===t.id?'research-row-active':''}`}><div className="research-row-index">{String(i+1).padStart(2,'0')}</div><div className="research-row-copy"><strong>{t.title}</strong><p>{t.summary || 'No summary supplied by the source. Open the source and review the underlying material.'}</p><div className="source-meta"><span>{t.source || t.sources?.[0]?.title || 'Public source'}</span><span>•</span><span>{t.sourceCount ?? t.sources?.length ?? 0} source domains</span></div>{t.flags?.slice(0,1).map(f=><span key={f} className="flag-pill">⚑ {f}</span>)}</div><Score value={t.score || 0}/></button>)}{!visibleTopics.length && <EmptyState title="No matching research leads" copy="Try another phrase or run a fresh public-source search."/>}</div><aside className="panel evidence-panel">{selectedTopic ? <><div className="evidence-top"><span className="panel-chip">RESEARCH LEAD</span><Score value={selectedTopic.score || 0}/></div><h3>{selectedTopic.title}</h3><p className="evidence-summary">{selectedTopic.summary || 'The source does not provide a useful summary. Open the material before writing factual narration.'}</p><div className="evidence-label">EVIDENCE STATUS</div><div className="evidence-status">{selectedTopic.evidenceStatus || 'Unreviewed lead'}</div><div className="evidence-label">SOURCE LINKS</div>{(selectedTopic.sources || []).length ? <div className="source-list">{selectedTopic.sources.map((s,i)=><a key={`${s.url}-${i}`} href={s.url} target="_blank" rel="noreferrer"><span className="source-index">{String(i+1).padStart(2,'0')}</span><span><b>{s.title || s.url}</b><small>{safeHost(s.url)}</small></span><span>↗</span></a>)}</div> : <div className="empty-source">No source links are attached to this demo item. Run live research to collect source URLs.</div>}<div className="evidence-label">VERIFY BEFORE PUBLISHING</div><ul className="verify-list"><li>Find a primary or institutional source for each factual claim.</li><li>Check chronology, terminology and competing accounts.</li><li>Do not use this opportunity score as evidence of virality.</li></ul><button className="button button-primary button-full" onClick={()=>createPlan(selectedTopic)}>Build reel storyboard <span>→</span></button><button className="button button-outline button-full" onClick={()=>exportFile(`${slug(selectedTopic.title)}-research.json`,selectedTopic)}>Export topic JSON</button></> : <EmptyState title="Select a topic" copy="Choose a research lead to inspect its sources and create a storyboard."/>}</aside></div><div className="note-box"><b>Coverage note:</b> the free research mode queries public MediaWiki search and any RSS/Atom feeds configured by you. It does not scan the entire internet, private Instagram data or real-time Instagram trends.</div></section>}

      {active === 'studio' && <section className="page-section"><PageTitle overline="02 / VIDEO STUDIO" title="Turn evidence into a reel." subtitle="Create a storyboard first, then optionally send a prompt to a real video-generation provider. Model access and credits are separate from hosting." action={<button className="button button-outline" onClick={()=>exportFile(`${slug(script?.title || 'reel-plan')}.json`,script || {message:'No storyboard generated yet'})}>Export plan ↓</button>}/><div className="studio-grid"><div className="panel studio-editor"><div className="panel-heading"><div><div className="overline">STORYBOARD BUILDER</div><h3>{script?.title || selectedTopic?.title || 'Choose a research topic'}</h3></div><span className="panel-chip">9:16 / VERTICAL</span></div><div className="form-row"><label>Topic<select value={selectedTopic?.id || ''} onChange={e=>{ const t=topics.find(x=>x.id===e.target.value); if(t){setSelectedId(t.id);} }}><option value="">Select a topic…</option>{topics.map(t=><option value={t.id} key={t.id}>{t.title}</option>)}</select></label><label>Language<select value={language} onChange={e=>setLanguage(e.target.value)}><option>Hinglish</option><option>Hindi</option><option>English</option></select></label></div><div className="form-row form-actions"><button className="button button-primary" onClick={()=>createPlan(selectedTopic)} disabled={!selectedTopic}>Generate storyboard <span>→</span></button><button className="button button-outline" onClick={saveDraft} disabled={!script}>Save draft</button></div>{script ? <><div className="script-field"><label>Opening hook</label><textarea rows={2} value={script.hook} onChange={e=>setScript({...script,hook:e.target.value})}/></div><div className="script-field"><label>Narration draft</label><textarea rows={8} value={script.narration} onChange={e=>setScript({...script,narration:e.target.value})}/></div><div className="scene-list">{script.scenes?.map((s,i)=><div className="scene-row" key={s.time}><div className="scene-time">{s.time}</div><div><div className="overline">SCENE {String(i+1).padStart(2,'0')} · {s.label}</div><p>{s.visual}</p><small>On-screen: {s.text}</small></div></div>)}</div><div className="script-field"><label>Caption draft</label><textarea rows={5} value={script.caption} onChange={e=>setScript({...script,caption:e.target.value})}/></div><div className="alert alert-warn">This is a structured draft—not fact-checked AI scholarship. Verify each claim and each visual before publishing.</div><div className="button-row"><button className="button button-outline" onClick={()=>exportFile(`${slug(script.title)}-script.md`,`# ${script.title}\n\n## Hook\n${script.hook}\n\n## Narration\n${script.narration}\n\n## Caption\n${script.caption}\n\n## Scenes\n${script.scenes.map(s=>`### ${s.time} — ${s.label}\n${s.visual}\nText: ${s.text}`).join('\n\n')}`, 'text/markdown')}>Export Markdown</button><button className="button button-outline" onClick={saveDraft}>Save draft</button></div></> : <EmptyState title="No storyboard yet" copy="Select a research lead and build a storyboard. The output includes a source-aware structure and a draft video prompt."/>}</div><div className="panel ai-video-panel"><div className="ai-video-top"><div className="video-orbit"><span>▶</span><i/><b/></div><span className="provider-label"><span className="status-dot"/> MODEL-BASED GENERATION</span></div><div className="overline">TEXT-TO-VIDEO</div><h3>Generate the visual sequence.</h3><p>Send a prompt to the configured Replicate model. Output and fields depend on the model you select. Generation may be paid; there is no unlimited free AI video mode.</p><label className="prompt-label" htmlFor="video-prompt">VIDEO PROMPT</label><textarea id="video-prompt" className="video-prompt" rows={9} value={videoPrompt} onChange={e=>setVideoPrompt(e.target.value)} placeholder="Build a 9:16 documentary video prompt…"/><div className="video-config-note"><span>i</span><span>Configure <code>REPLICATE_API_TOKEN</code>, <code>REPLICATE_VIDEO_MODEL</code>, and <code>APP_PASSWORD</code> in Vercel. See README.</span></div><button className="button button-primary button-full" onClick={generateVideo} disabled={videoBusy}>{videoBusy?'Submitting request…':'Generate AI video'} <span>↗</span></button>{videoError && <div className="alert alert-error">{videoError}</div>}{videoJob && <div className="job-card"><div className="job-top"><span className={`job-dot ${['succeeded','successful'].includes(videoJob.status)?'job-done':''}`}/><b>Video job</b><span className="job-status">{videoJob.status || 'starting'}</span></div><p>{videoJob.id ? `Job ID: ${videoJob.id}` : 'Provider response received.'}</p>{videoJob.error && <p className="error-inline">{String(videoJob.error)}</p>}{videoJob.output && <div className="output-links">{(Array.isArray(videoJob.output)?videoJob.output:[videoJob.output]).filter(x=>typeof x==='string' && /^https?:/.test(x)).map((url,i)=><a key={url} href={url} target="_blank" rel="noreferrer" className="button button-primary button-full">Open / download output {i+1} ↗</a>)}{!((Array.isArray(videoJob.output)?videoJob.output:[videoJob.output]).some(x=>typeof x==='string' && /^https?:/.test(x))) && <pre className="output-pre">{JSON.stringify(videoJob.output,null,2)}</pre>}</div>}{videoJob.id && !['succeeded','successful','failed','canceled'].includes(videoJob.status) && <button className="button button-outline button-full" onClick={refreshVideo} disabled={videoBusy}>{videoBusy?'Checking…':'Refresh job status'}</button>}{videoJob.urls?.web && <a className="text-link" href={videoJob.urls.web} target="_blank" rel="noreferrer">Open provider job ↗</a>}</div>}<p className="microcopy">For privacy and safety, the app does not auto-post to Instagram or request your Instagram password.</p></div></div></section>}

      {active === 'planner' && <section className="page-section"><PageTitle overline="03 / WEEKLY PLAN" title="Seven days. One editorial rhythm." subtitle="A balanced plan based on the topics currently available. This is a suggested cadence, not a prediction of reach." action={<button className="button button-outline" onClick={()=>exportFile('goviral-weekly-plan.json',makeWeeklyPlan(topics))}>Export weekly plan ↓</button>}/><div className="planner-banner"><div><div className="overline">EDITORIAL RULE</div><h3>Evidence before intensity.</h3><p>Mix a documented deep dive, an explainer, a source comparison and a visual-led story. Avoid repeating the same hook format every day.</p></div><div className="planner-badge">7<span>DAYS</span></div></div><div className="week-list">{makeWeeklyPlan(topics).map((p,i)=><div className="week-row" key={p.day}><div className="week-day"><span>DAY {String(i+1).padStart(2,'0')}</span><b>{p.day}</b></div><div className="week-main"><div className="overline">{p.pillar} · {p.format}</div><h3>{p.title}</h3><p>{p.angle}</p><div className="week-tags"><span>{p.effort} effort</span><span>{p.goal}</span></div></div><button className="icon-button" onClick={()=>{const t=topics.find(t=>t.title===p.title)||topics[i%Math.max(topics.length,1)]; if(t) {setSelectedId(t.id);createPlan(t);} else setActive('research');}} aria-label={`Build storyboard for ${p.title}`}>↗</button></div>)}</div><div className="note-box">Daily research is scheduled by GitHub Actions after you enable the workflow. The dashboard cannot run in the background while a browser is closed; the repository scheduler performs the source-fetch job.</div></section>}

      {active === 'analytics' && <section className="page-section"><PageTitle overline="04 / PERFORMANCE" title="Learn from your own posts." subtitle="Import a CSV export or enter structured metrics. This workspace computes descriptive stats; it does not fetch private Instagram insights automatically." action={<button className="button button-outline" onClick={()=>exportFile('goviral-post-metrics-template.csv','title,views,reach,watch_time,shares,saves,comments,follows\nExample Reel,1200,900,8.4,42,51,12,7','text/csv')}>Download CSV template ↓</button>}/><div className="panel import-panel"><div><div className="overline">POST-LEVEL METRICS</div><h3>Bring your own data.</h3><p>CSV columns accepted: title, views, reach, watch_time, shares, saves, comments, follows. Missing columns are treated as zero, so use the template for accurate comparisons.</p></div><label className="button button-primary upload-button">↑ Import CSV<input type="file" accept=".csv,text/csv" onChange={e=>{importCsv(e.target.files?.[0]);e.target.value='';}} hidden/></label></div>{analyticsMessage && <div className="alert alert-info">{analyticsMessage}</div>}<div className="metrics-grid analytics-metrics"><Metric label="POSTS" value={stats.count} detail="Rows imported locally" icon="▤"/><Metric label="TOTAL VIEWS" value={stats.views.toLocaleString()} detail="Sum of imported views" icon="◉"/><Metric label="AVG VIEWS / POST" value={stats.averageViews.toLocaleString()} detail="Descriptive average" icon="↗"/><Metric label="SAVES + SHARES" value={(stats.saves+stats.shares).toLocaleString()} detail="Combined high-intent actions" icon="⌁"/></div>{posts.length ? <div className="panel table-panel"><div className="panel-heading"><div><div className="overline">IMPORTED DATA</div><h3>Post performance</h3></div><button className="text-link" onClick={()=>{setPosts([]);localStorage.removeItem('goviral-posts');setAnalyticsMessage('Metrics cleared from this device.');}}>Clear local data</button></div><div className="table-scroll"><table><thead><tr><th>Post</th><th>Views</th><th>Reach</th><th>Saves</th><th>Shares</th><th>Follows</th></tr></thead><tbody>{posts.map((p,i)=><tr key={`${p.title}-${i}`}><td>{p.title || `Post ${i+1}`}</td><td>{Number(p.views||0).toLocaleString()}</td><td>{Number(p.reach||0).toLocaleString()}</td><td>{Number(p.saves||0).toLocaleString()}</td><td>{Number(p.shares||0).toLocaleString()}</td><td>{Number(p.follows||0).toLocaleString()}</td></tr>)}</tbody></table></div></div> : <EmptyState title="No post metrics yet" copy="Download the CSV template, fill it with your real results and import it above. Data stays in this browser."/>}<div className="note-box">Recommendations become more meaningful after at least several comparable posts. Watch time and reach definitions can differ between platform exports; keep periods and units consistent.</div></section>}

      {active === 'settings' && <section className="page-section"><PageTitle overline="05 / SETTINGS" title="Your workspace, your controls." subtitle="Secrets belong in server environment variables. This page only stores the temporary access password for the current browser session."/><div className="settings-grid"><div className="panel settings-card"><div className="overline">CHANNEL IDENTITY</div><h3>Real_bharat_404</h3><p>Evidence-first Indian history and heritage. The workspace does not connect to your Instagram account or retrieve private analytics.</p><div className="setting-item"><span>Primary content pillar</span><b>History · Heritage · Archaeology</b></div><div className="setting-item"><span>Preferred production</span><b>9:16 documentary Reel</b></div><div className="setting-item"><span>Publishing mode</span><b>Manual review and upload</b></div></div><div className="panel settings-card"><div className="overline">SERVER ACCESS</div><h3>AI video provider</h3><p>Enter the same <code>APP_PASSWORD</code> value configured by you in Vercel environment variables. This password is kept only in session storage for this browser session.</p><label className="setting-label">App access password<input type="password" autoComplete="current-password" value={appPassword} onChange={e=>setAppPassword(e.target.value)} placeholder="Enter your APP_PASSWORD"/></label><div className="button-row"><button className="button button-primary" onClick={()=>{try{sessionStorage.setItem('goviral-app-password',appPassword);}catch{} setAnalyticsMessage('Password stored for this browser session.');}}>Save for session</button><button className="button button-outline" onClick={()=>{setAppPassword('');try{sessionStorage.removeItem('goviral-app-password');}catch{}}}>Clear</button></div><div className="setting-separator"/><div className="setting-item"><span>Text-to-video provider</span><b>Replicate API (optional)</b></div><div className="setting-item"><span>Model selection</span><b>REPLICATE_VIDEO_MODEL</b></div><div className="alert alert-warn">Keep all provider API tokens in Vercel Project Settings. Never paste a provider token into the browser, source code or public repository.</div></div></div><div className="panel setup-steps"><div className="overline">DEPLOYMENT CHECKLIST</div><h3>GitHub → Vercel</h3><div className="setup-list">{['Upload the extracted GoViral_Agent folder to a GitHub repository.','Import that repository at vercel.com/new and deploy the Next.js app.','Add APP_PASSWORD, REPLICATE_API_TOKEN and REPLICATE_VIDEO_MODEL in Vercel Environment Variables.','Add the daily-research workflow; enable Actions and allow the workflow to write repository contents.','Check README.md for exact phone-friendly setup, model configuration and troubleshooting.'].map((s,i)=><div className="setup-row" key={s}><span>{i+1}</span><p>{s}</p></div>)}</div><button className="button button-outline" onClick={()=>exportFile('goviral-config-checklist.txt','GoViral_Agent setup checklist\n\n1. Create GitHub repo and upload code.\n2. Import on Vercel.\n3. Configure APP_PASSWORD and optional Replicate variables.\n4. Enable the daily research Actions workflow.\n5. Verify the latest workflow run and research feed.','text/plain')}>Export checklist ↓</button></div></section>}
      <footer className="site-footer"><div><b>GV<span>·</span> GO VIRAL AGENT</b><span>© {new Date().getFullYear()} · Personal creator workspace</span></div><span>RESEARCH FIRST. HUMAN REVIEW ALWAYS.</span></footer>
    </section>
  </main>;
}

function Metric({ label, value, detail, icon }) { return <div className="metric-card"><div className="metric-head"><span>{label}</span><span className="metric-icon">{icon}</span></div><div className="metric-value">{value}</div><div className="metric-detail">{detail}</div></div>; }
function PageTitle({ overline, title, subtitle, action }) { return <div className="page-title"><div><div className="overline">{overline}</div><h1>{title}</h1><p>{subtitle}</p></div>{action && <div className="page-title-action">{action}</div>}</div>; }
function EmptyState({ title, copy }) { return <div className="empty-state"><div className="empty-symbol">↗</div><h3>{title}</h3><p>{copy}</p></div>; }
function TopicCard({ topic, index, onSelect, onPlan }) { return <article className="topic-card"><div className="topic-card-top"><span className="topic-index">LEAD / {String(index+1).padStart(2,'0')}</span><Score value={topic.score || 0}/></div><h3>{topic.title}</h3><p>{topic.summary || 'Research lead — review the sources to understand what can be established.'}</p><div className="topic-card-footer"><span className="evidence-chip">{topic.evidenceStatus || 'Unverified lead'}</span><button onClick={onSelect} aria-label={`Inspect ${topic.title}`}>Inspect →</button></div><button className="topic-create" onClick={onPlan}>Build story <span>↗</span></button></article>; }
function safeHost(url='') { try { return new URL(url).hostname.replace(/^www\./,''); } catch { return url; } }
function slug(s='reel') { return String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,64) || 'reel-plan'; }
function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/); if (lines.length < 2) return [];
  const split = line => { const out=[]; let cur='', inQuotes=false; for(let i=0;i<line.length;i++){const c=line[i]; if(c==='"' && line[i+1]==='"' && inQuotes){cur+='"';i++;} else if(c==='"') inQuotes=!inQuotes; else if(c===',' && !inQuotes){out.push(cur.trim());cur='';} else cur+=c;} out.push(cur.trim()); return out; };
  const headers=split(lines[0]).map(h=>h.toLowerCase().replace(/\s+/g,'_'));
  return lines.slice(1).filter(l=>l.trim()).map(line=>{const vals=split(line), obj={};headers.forEach((h,i)=>obj[h]=vals[i]||''); const toNum=k=>Number(String(obj[k]||'0').replace(/[^\d.-]/g,''))||0; return {title:obj.title||obj.reel||obj.post||'',views:toNum('views'),reach:toNum('reach'),watch_time:toNum('watch_time'),shares:toNum('shares'),saves:toNum('saves'),comments:toNum('comments'),follows:toNum('follows')};}).filter(x=>x.title || x.views || x.reach || x.saves || x.shares);
}
function createLocalPlan(topic, language) {
  const title=String(topic?.title||'Untitled topic'); const sources=topic?.sources||[]; const sourceName=sources[0]?.title||topic?.source||'available public source';
  const summary=String(topic?.summary||'').replace(/\s+/g,' ').trim();
  const scenes=[
    {time:'00–03s',label:'THE QUESTION',visual:`Editorial title card for “${title}”. Use real, licensed evidence-linked imagery; do not invent a historical scene.`,text:title},
    {time:'03–08s',label:'SET THE CONTEXT',visual:'Show a verified location map, date range or documented object and its source.',text:'Place • Period • Context'},
    {time:'08–18s',label:'THE EVIDENCE',visual:'Show primary source extracts, archive or museum material with source credits.',text:'What the sources show'},
    {time:'18–25s',label:'WHAT IS UNCERTAIN?',visual:'Use a restrained side-by-side comparison for gaps or competing accounts.',text:'Known vs. unverified'},
    {time:'25–30s',label:'THE TAKEAWAY',visual:'Neutral closing card with readable credits.',text:'Evidence. Context. No noise.'},
  ];
  return {title,format:'9:16 vertical documentary Reel',language,status:'DRAFT — human fact-check required',hook:`“${title} — is kahani ke baare mein hum asal mein kya jaante hain?”`,narration:[`Opening: ${title}. Headline aur historical evidence ek hi cheez nahi hote.`,summary?`Research lead: ${summary}`:'Sabse pehle timeline, location aur original source verify karna hoga.','Har important claim ko primary record ya independent reliable source se cross-check karo. Jahan evidence incomplete ho, wahan uncertainty ko clearly batao.',`Source check: ${sources.length} attached source link(s); first lead: ${sourceName}.`, 'Aisi evidence-first stories ke liye follow karo — agla topic comments mein suggest karo.'].join('\n\n'),scenes,caption:`${title}\n\nA research lead, not a final historical conclusion. Verify original sources, chronology and competing accounts before treating a claim as established fact.\n\n#IndianHistory #IndianHeritage #HistoryReels #Archaeology #RealBharat404`,videoPrompt:`Create a 30-second vertical 9:16 historical-documentary video concept about: ${title}. Style: restrained investigative field documentary, naturalistic lighting, neutral true-to-life colors, architecture and geography only when supported by source references, clean editorial composition, subtle camera movement. No fantasy fog, exaggerated danger, invented inscriptions, fabricated artefacts or unsourced reenactments presented as fact. Mark illustrative visuals as illustrative. Language: ${language}. Leave clean space for post-production captions; do not render factual text into generated scenes.`,disclaimer:'Structured research draft. It is not AI-verified historical scholarship. Check every claim and asset licence before publication.'};
}
function makeWeeklyPlan(topics) {
  const presets=[['Monday','DOCUMENTED DEEP DIVE','Reel','Explain one verified question','Medium'],['Tuesday','VISUAL EXPLAINER','Carousel','Break an idea into clear evidence-led frames','Low'],['Wednesday','SOURCE COMPARISON','Reel','Show what sources agree on and where they differ','High'],['Thursday','HERITAGE CONTEXT','Story / Reel','Connect a place or object to its context','Medium'],['Friday','MYTH VS RECORD','Reel','Check one popular claim against reliable evidence','High'],['Saturday','BEHIND THE RESEARCH','Story','Show maps, documents or how claims are verified','Low'],['Sunday','COMMUNITY QUESTION','Story / Carousel','Ask the audience to choose a documented next topic','Low']];
  return presets.map((p,i)=>{const topic=topics.filter(t=>!String(t.id||'').startsWith('demo-'))[i%Math.max(1,topics.filter(t=>!String(t.id||'').startsWith('demo-')).length)] || topics[i%Math.max(1,topics.length)] || {title:'A topic selected after research'};return {day:p[0],pillar:p[1],format:p[2],title:topic.title,angle:p[3],effort:p[4],goal:['Discovery','Saves','Trust','Context','Retention','Trust','Community'][i]};});
}