export function createReelPlan(topic, language = 'Hinglish') {
  const title = String(topic?.title || 'Untitled research topic').trim();
  const sources = Array.isArray(topic?.sources) ? topic.sources : [];
  const firstSource = sources[0]?.title || topic?.source || 'available public source';
  const summary = String(topic?.summary || '').replace(/\s+/g, ' ').trim();
  const sourceNote = sources.length ? `Available lead: ${firstSource}. ${sources.length} source link(s) are attached; verify the primary evidence before recording.` : 'No source links attached yet; collect and verify sources before recording.';
  return {
    title,
    format: '9:16 vertical documentary Reel',
    language,
    status: 'DRAFT — human fact-check required',
    hook: `“${title} — is kahani ke baare mein hum asal mein kya jaante hain?”`,
    thesis: 'Build the story around verifiable evidence, not a sensational claim.',
    narration: [
      `Opening: ${title}. Lekin headline aur historical evidence ek hi cheez nahi hote.`,
      summary ? `Research lead: ${summary}` : 'Sabse pehle humein timeline, location aur original source ko verify karna hoga.',
      'Har important claim ko primary record ya independent reliable source se cross-check karo. Jahan evidence incomplete ho, wahan uncertainty ko clearly batao.',
      `Source check: ${sourceNote}`,
      'Aisi evidence-first stories ke liye follow karo — aur comments mein batao ki kis topic par agla investigation hona chahiye.',
    ].join('\n\n'),
    scenes: [
      { time: '00–03s', label: 'THE QUESTION', visual: `Title card for “${title}”; use a real, licensed image or a simple editorial map—not a fabricated historical scene.`, text: title, narration: 'Start with a concise question.' },
      { time: '03–08s', label: 'SET THE CONTEXT', visual: 'Show a verified location map, date range or archival object with its source displayed.', text: 'Place • Period • Context', narration: 'Explain what is known and where the information comes from.' },
      { time: '08–18s', label: 'THE EVIDENCE', visual: 'Show source excerpts, museum/archive images or documented material; show citations on screen.', text: 'What the sources show', narration: 'Present only claims supported by cited sources.' },
      { time: '18–25s', label: 'WHAT IS UNCERTAIN?', visual: 'Clean comparison layout for competing accounts or gaps; no invented artefacts.', text: 'Known vs. unverified', narration: 'Make unresolved questions explicit.' },
      { time: '25–30s', label: 'THE TAKEAWAY', visual: 'Neutral documentary closing card with source credits.', text: 'Evidence. Context. No noise.', narration: 'Invite viewers to suggest a documented topic for the next investigation.' },
    ],
    caption: `${title}\n\nA research lead, not a final historical conclusion. We are checking the original sources, chronology and competing accounts before treating any claim as established fact.\n\nSources and context should be reviewed before publishing.\n\n#IndianHistory #IndianHeritage #HistoryReels #Archaeology #RealBharat404`,
    cta: 'Follow for evidence-first Indian history and heritage stories. Suggest the next topic below.',
    productionChecklist: ['Verify each factual sentence against a source.', 'Prefer primary records, museums, archives and peer-reviewed work where available.', 'Check the individual licence for every asset and music track.', 'Add legible burned-in subtitles and source credits.', 'Do not imply AI-generated visuals are authentic historical footage.'],
    videoPrompt: `Create a 30-second vertical 9:16 historical-documentary video concept about: ${title}. Style: restrained investigative field documentary, naturalistic lighting, neutral true-to-life colors, precise geography and architecture only when supported by references, clean editorial composition, subtle camera movement, no fantasy fog, no exaggerated danger, no invented inscriptions, no fabricated artefacts, no unsourced reenactment presented as fact. Visuals should be marked as illustrative when they are not archival. On-screen language: ${language}. Use the storyboard and source notes supplied by the editor. Do not render readable factual text into scenes; leave clean space for post-production captions.`,
    disclaimer: 'This script is a structured draft produced from research leads. It is not AI-verified historical scholarship. Fact-check all claims and licences before publication.',
  };
}
