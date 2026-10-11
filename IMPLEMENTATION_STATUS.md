Implementation status and non-goals
This archive is a runnable-oriented starter codebase, not a claim that a complete autonomous production service has been independently hosted or integration-tested.
Implemented in source
Next.js App Router shell and responsive creator dashboard.
Public MediaWiki search plus optional RSS/Atom ingestion, heuristic scoring, deduplication, timestamps, source links and error notes.
Storyboard/script/caption template editor, JSON/Markdown export, local drafts and CSV-based performance summary.
Replicate text-to-video submission and status-check routes, protected by a configurable app password.
GitHub Actions daily research and CI/test workflows.
README with GitHub/Vercel setup, environment variables, security notes and known limitations.
Not implemented / not guaranteed
A free text-to-video model or unlimited generation. Provider access and credits may cost money.
A daily auto-video queue. The daily workflow refreshes research; a person explicitly requests an AI video job to control cost.
Automatic voiceover generation, karaoke captions, music, multi-clip montage or full post-production rendering after video-provider output. The output is the provider's video result; review/edit it before posting.
An LLM-powered research synthesis engine. Research text generation is a cautious template, not generative model reasoning. The public-source scorer cannot independently prove factual claims.
Full Instagram account integration, private insights, login, auto-publishing or a viral guarantee.
Persistent private multi-user database. Research feed is committed as repository data; drafts and CSV metrics are browser-local.
Verification performed for this archive
Node built-in tests: passed (4 tests).
node --check on .mjs and API .js files: passed.
TypeScript transpiler JSX syntax parsing for app/page.jsx and app/layout.jsx: passed.
Full Next.js production build: not verified in this environment because dependency installation did not complete before timeout. Run npm install and npm run build locally or in GitHub Actions before relying on deployment.