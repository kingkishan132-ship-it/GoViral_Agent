GoViral_Agent
A research-first Instagram growth workspace for Real_bharat_404. It is designed to run from GitHub + Vercel, with no Replit dependency.
What is included
Mobile-first dashboard with overview, research desk, storyboard studio, seven-day editorial planner, CSV performance import and settings.
Public-source research using Wikipedia / MediaWiki search plus optional RSS/Atom feeds configured through RSS_FEEDS.
Topic deduplication and transparent heuristic scoring, source links, evidence warnings and JSON/Markdown export.
Daily research workflow via GitHub Actions at 08:00 India Standard Time. If results change, the workflow commits the feed JSON to main; when the GitHub repository is connected to Vercel, this will normally trigger a deployment so the static feed updates.
Optional text-to-video API integration via Replicate. It submits a prompt to a model configured by you and polls the prediction status. The model's input schema and outputs vary.
Build/test workflows and basic automated tests.
Honest feature boundaries
No service here can guarantee a viral post. Scores are heuristics; use your actual performance data to experiment.
This project does not scan the entire internet. The no-key research pipeline queries public MediaWiki search and any RSS/Atom feeds you configure. RSS headlines and encyclopedia pages are research leads, not primary historical evidence. Verify claims against archives, museums, government records, peer-reviewed work or other reliable sources before publication.
True AI text-to-video is not free just because the web app is hosted for free. The Vercel deployment can be free within plan limits, but text-to-video model access via Replicate requires an API token and can incur provider charges. This repo deliberately does not fake video output when the provider is missing. The prompt-to-video endpoint requires an app password and a provider token. No Instagram password is collected and the app does not auto-post.
The nightly job produces a fresh research feed, not a rendered AI video. Automatically generating a video every day would spend provider credits and requires extra queue/storage safeguards. The dashboard lets you choose a topic and request a real video job explicitly. That prevents unexpected costs.
Video outputs are usually provider-hosted URLs. Download finished outputs to your own storage because a provider's output retention and URL lifetime depend on its terms. The app does not store large MP4 files in the Vercel source repository.
Requirements
Node.js 20 or newer and npm for local development.
GitHub account and repository.
Vercel account to deploy the web app.
Optional: Replicate account/token and a supported text-to-video model if you want real video generation.
Local setup
Extract the ZIP.
Open a terminal in the GoViral_Agent directory.
Run:
npm install
cp .env.example .env.local
npm run dev
Open http://localhost:3000.
Test public research with Run live research. A network connection is required; RSS feeds are optional.
Run checks:
npm test
npm run build
Windows PowerShell: use Copy-Item .env.example .env.local instead of cp.
Optional RSS feeds
Set RSS_FEEDS to comma-separated RSS or Atom URLs, for example:
RSS_FEEDS=https://example.org/feed.xml,https://another.example/feed
Only add feeds you are allowed to read. Feed availability and formats can change. Errors are shown rather than silently counted as sources.
GitHub → Vercel deployment (no Replit)
A. Create a repository from the ZIP
Create a new GitHub repository named GoViral_Agent.
Extract the ZIP locally (a computer is easiest for the initial push). Upload all contents inside the GoViral_Agent folder, including the hidden .github directory. Do not upload node_modules or .env.local.
Commit to the main branch. For scheduled research commits, the workflow needs Settings → Actions → General → Workflow permissions → Read and write permissions. Ensure GitHub Actions is enabled.
Under repository Settings → Secrets and variables → Actions → Variables, optional, add RSS_FEEDS as a comma-separated list. Without it, MediaWiki search still works.
After the first commit, open Actions and run Daily public-source research → Run workflow once to test. Inspect logs; it may take a minute or two. The daily schedule is UTC 02:30 / 08:00 IST. It can be delayed by GitHub scheduling and requires Actions enabled.
B. Deploy to Vercel
Open Vercel New Project, import GoViral_Agent from GitHub and keep the detected Next.js settings.
Deploy. The app can run without an AI video API token.
In Vercel → Project → Settings → Environment Variables, optionally add:
Variable
Meaning
APP_PASSWORD
A long, private passphrase protecting the video-generation endpoint.
REPLICATE_API_TOKEN
Provider API token; usage may cost money. Keep it server-side.
REPLICATE_VIDEO_MODEL
A text-to-video model slug supported by your account, formatted owner/model-name. Default is minimax/video-01, but model availability/schema can change.
VIDEO_MODEL_INPUT_JSON
Optional JSON object of additional model-specific inputs. Read the chosen model's docs first.
RSS_FEEDS
Optional comma-separated RSS/Atom URLs (can also be a GitHub Actions variable for the daily workflow).
Redeploy after changing environment variables.
In the app open Settings and enter the same APP_PASSWORD value to submit video jobs. It is kept only in the current browser session.
C. Verify deployment
Visit /api/health to check the app responds and see whether video provider settings are configured (no tokens are returned).
Run Run live research in the dashboard.
Visit GitHub → Actions and confirm the scheduled workflow succeeds.
If the source feed remains empty, see the error logs. RSS providers may block automated requests; use allowed feeds and do not bypass access restrictions.
AI video configuration
The route uses Replicate's official-model prediction API. Official model inputs are model-specific. The default model slug is a starting value, not a guarantee that it remains available or accepts all inputs. If provider responds with a schema/input error, select a currently available text-to-video model in your Replicate account and update REPLICATE_VIDEO_MODEL and VIDEO_MODEL_INPUT_JSON using the model's published documentation.
The app intentionally asks for a user action before calling the video provider. Set usage limits and monitor provider billing. Do not configure daily automatic video generation without adding an explicit per-day spending limit and persistent job queue. The daily GitHub Action only refreshes public-source research.
About portrait aspect ratio
The prompt requests 9:16 vertical output, but actual aspect-ratio support depends on the selected model. If the provider requires a field such as aspect_ratio, add the field to VIDEO_MODEL_INPUT_JSON and confirm that the model's documented schema uses that name. A generated output may still require editing/cropping for Reels.
UI workflow
Overview: run fresh public-source research and see the current opportunity radar.
Research desk: search and sort leads; inspect links and flags; export a topic JSON.
Video studio: build a source-aware story structure, edit hook/narration/caption, export Markdown/JSON, save drafts locally and optionally submit a real video-generation request.
Weekly plan: export a seven-day schedule that varies format/pillar.
Performance: import CSV columns title,views,reach,watch_time,shares,saves,comments,follows; summary data stays in browser local storage.
Settings: enter video endpoint's app password for the current session and see deployment checklist.
Security notes
Do not commit .env.local, API tokens or passwords.
Keep the repository private if you add personal notes; a public repository is visible to everyone.
The current app intentionally has no multi-user account system or server-side database. Research files are public repository artifacts and drafts/metrics are stored in each user's browser. Do not store sensitive material in them.
The video endpoint is protected by APP_PASSWORD, but a single shared password is a lightweight personal-tool gate, not full account authentication. Use strong secrets and never share the deployed URL publicly if the workspace is private.
No Instagram login, password scraping, private analytics scraping or automated posting is implemented.
Check licence/usage terms individually for every photo, clip, archival asset, voice and music track. “Found on the web” does not mean public domain.
Architecture
GitHub main ───────────────► Vercel (Next.js dashboard + API)
     │                              │
     │ daily GitHub Actions          ├─ /api/research: public MediaWiki + configured RSS
     ▼                              ├─ /api/video: optional authenticated Replicate request/status
public/data/research-feed.json      └─ /api/health
     │
     └─ daily commit → Vercel deploy → dashboard reads refreshed feed

Browser LocalStorage: drafts, CSV metrics and current research cache
Browser SessionStorage: temporary APP_PASSWORD only
Troubleshooting
Research returns zero topics: check network access, GitHub Action logs and optional feed errors; public APIs may be rate-limited or temporarily unavailable.
Video buttons return 503: set APP_PASSWORD and REPLICATE_API_TOKEN on Vercel, then redeploy.
Video request returns 400: check the model slug and its exact expected input fields. See the official Replicate docs: https://replicate.com/docs/topics/predictions/create-a-prediction.
Daily workflow cannot push: permit workflow write access to repository contents and check branch name main. If your default branch differs, update ref and git push in the workflow.
Vercel build fails: inspect deployment logs and ensure the repository contains package.json, app/, lib/, next.config.mjs and lock file.
No output video URL: refresh the job in the Studio. Failed provider jobs include an error; do not retry repeatedly until you understand the provider cost.
Scripts and tests
npm run dev — local dev server
npm test — parser/scoring unit tests
npm run build — production build check
npm run research:daily — fetch and write the scheduled JSON feed
Licensing
Original app code is provided in this ZIP. Dependencies retain their own licences. Source media, external model outputs and external feeds remain subject to each provider's terms and licences.