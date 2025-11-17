# Bugs Log

Track every bug in plain language so anyone on the team can understand what went wrong, why it happened, and how we fixed it. Add a new entry each time you resolve an issue (no matter how small) and link to relevant PRs if available.

| Date | Bug Summary | Root Cause | Fix / Follow-up |
|------|-------------|------------|-----------------|
| 2025-11-16 | `npm install` failed with `ERESOLVE` after pulling latest changes. | `openai@4.x` still advertises a peer dependency on `zod@^3`, while the repo had already moved to `zod@4`. npm refused to auto-resolve. | Installed dependencies with `npm install --legacy-peer-deps` until upstream packages align; note to revisit when OpenAI updates its peer range. |
| 2025-11-16 | WorkOS callback returned `ERR_CONNECTION_REFUSED` in the browser. | The Astro dev server wasn't bound to `localhost:4321` (previous process had died and Vite auto-switched ports). When WorkOS redirected back to `127.0.0.1:4321`, nothing was listening. | Updated `npm run dev` to always launch `astro dev --host 127.0.0.1 --port 4321`, then killed lingering processes and restarted the server. Future sessions automatically bind to the correct host/port. |
| 2025-11-17 | **CRITICAL:** All POST requests hung indefinitely in dev mode. Form submissions stuck on "Submitting...", fetch requests stayed in "pending" forever, no server logs appeared. | The `@astrojs/netlify` adapter (v6.3.2) was blocking ALL POST requests during local development. The adapter starts a Netlify Edge Functions emulation layer (Deno server) that intercepted POST requests but never forwarded them to Astro handlers. Silent failure - no errors, requests just hung. GET requests worked perfectly. | Removed `adapter: netlify({})` from `astro.config.mjs` for development. POST requests now work instantly. Also fixed unrelated bugs: (1) undefined `startTime` variable in proposals.ts (should be `handlerStart`), (2) removed Sentry which was also causing issues. For production, need to conditionally enable Netlify adapter or switch to `@astrojs/node`. See detailed analysis in NETLIFY_BUG_DETAILED.md. |

**How to add a new entry**
1. Describe what the user saw (“Talk board never loads”, “Form submits but no data saved”, etc.).
2. Summarise the technical root cause (missing env, schema mismatch, etc.).
3. Document the fix plus any preventative steps (tests added, monitoring, etc.).
4. If CodeRabbit flagged the bug, mention its comment link for easy reference.

