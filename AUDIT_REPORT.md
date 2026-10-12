# GoViral Agent — ZIP Audit & Repair Report

Audit date: 2026-10-12  
Scope: supplied ZIP archive only; deployment secrets and live Vercel/GitHub settings were not available.

## Executive summary

The archive had a malformed `package.json`, a leading-space ` lib/` directory, and UI code duplicated into the root layout and API route files. Those were release-blocking defects. The project also lacked GitHub workflow files in the supplied archive despite documentation describing them. Core research and dashboard code were retained where practical; the app shell and invalid API routes were repaired.

## Findings and status

| Severity | Area | File(s) | Finding / impact | Correction | Status |
|---|---|---|---|---|---|
| Critical | Configuration | `package.json` | Missing comma between `scripts` and `dependencies`; npm could not parse project manifest. | Rewrote as valid JSON with explicit scripts and compatible pinned Next/React versions. | Fixed |
| Critical | Imports/deployment | ` lib/research.mjs`, ` lib/reel-plan.mjs`, imports | Directory name included a leading space; expected `lib/research.mjs` path did not exist. | Renamed directory to `lib/` and retained modules. | Fixed |
| Critical | Next.js root layout | `app/layout.jsx` | Contained the entire client dashboard rather than an HTML root layout; invalid App Router structure. | Restored `<html>`, `<body>`, metadata, viewport, CSS import; moved dashboard implementation to `app/dashboard.jsx`. | Fixed |
| Critical | API route architecture | `app/api/health/route.js` | Contained copied React dashboard code instead of an HTTP handler. | Replaced with JSON health/configuration response. | Fixed |
| Critical | API route architecture | `app/api/video/route.js` | Contained copied React dashboard code; video API could not handle HTTP requests. | Implemented authenticated Replicate prediction submission and status lookup, validation, timeout, and sanitized errors. | Fixed; provider requires configuration |
| High | UI routing | `app/page.jsx` | Duplicated full dashboard code and blurred route/component responsibilities. | Thin page wrapper imports the retained client dashboard. | Fixed |
| High | CI / scheduling | `.github/workflows/` | No workflows were present in the archive, while docs claimed CI and daily scheduling. | Added CI workflow and scheduled/manual research workflow. | Fixed in repository; GitHub permissions must be enabled |
| High | Tests | `tests/reserch.test.mjs` | Filename typo; coverage was limited to four small research tests. | Renamed and expanded to five focused tests. | Partially fixed; broader integration/browser tests remain |
| Medium | Text parsing | `lib/research.mjs` | `&nbsp;` was not decoded; existing test expected text normalization. | Added `&nbsp;` decoding and matching test. | Fixed |
| Medium | Honest status | `app/api/health/route.js` | A simple status could be mistaken for proof every integration works. | Health JSON explicitly reports video provider and persistence configuration; it does not claim a live provider probe. | Fixed |
| Medium | Persistence | `app/dashboard.jsx`, `public/data/` | Drafts/metrics remain browser-local and public research feed is repository-backed; no private DB exists. | Documented limitation; no unconfigured database or fake multi-user support was added. | Not implemented; requires database/auth decision and credentials |
| Medium | Research evidence | `lib/research.mjs`, `lib/reel-plan.mjs` | Research results are leads; one encyclopedia result is not independent corroboration. | Existing warnings retained; audit documents that fact approval still requires human/source review. | Partially implemented |
| High | Video production completeness | `app/api/video/route.js`, `scripts/daily-research.mjs` | Research schedule does not produce a finished video; no end-to-end TTS, timed subtitles, multi-clip rendering or asset storage pipeline. | Restored a real provider endpoint and preserved honest 503 when unconfigured. | Blocked by provider, worker/storage, and cost choices |
| Medium | Security | `app/api/video/route.js` | Video endpoint requires a shared password; this is not user authentication or per-user authorization. | Timing-safe comparison, server-only secrets, input bounds, no provider error logs/stack traces returned. | Partially fixed; shared-password gate is not production multi-user auth |
| Medium | Security | project config | No `.env.example` or `.gitignore` in the supplied file list. | Added `.env.example` and `.gitignore`. | Fixed |

## Historical leads checked

- Leading-space ` lib/`: **present**, corrected.
- `/vercel/lib/research.mjs` import/build issue: **plausibly explained** by the leading-space folder; actual Vercel logs were not available to prove it was the sole cause.
- Dashboard copied into `app/layout.jsx`: **present**, corrected.
- Dashboard copied into API route files: **present in health and video routes**, corrected.
- Missing GitHub Actions workflows: **present in supplied ZIP**, workflows added.
- Daily research script not rendering a finished video: **present by design**; it writes a research feed only. It is not described as auto-video production.

## Verification performed

The five Node tests passed, JSON parsing passed, server-module syntax checks passed, and the three JSX files passed TypeScript JSX parser transpilation. `npm install` timed out in this environment, so lint and production build were not run. This archive cannot validate live Vercel configuration, GitHub Actions permissions, provider credentials, model compatibility, generated video quality, or actual browser/device behavior. See `TEST_RESULTS.md`; do not treat unrun checks as passing.

## Remaining production gaps

1. Private database, authentication, per-user authorization, and object storage.
2. Full claim-level evidence UI and approval persistence.
3. Queue/worker for long-running video production; TTS, timed subtitle alignment, post-production rendering and artifact validation.
4. Browser end-to-end and accessibility testing.
5. Verified model-specific input schema and output behavior for the configured Replicate model.
6. Official Instagram API integration, if later required and eligible.
