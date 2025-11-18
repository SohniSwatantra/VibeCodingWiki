# Vibecodingwiki — Astro + TanStack Starter

This project bootstraps the rebuild of **VibeCodingWiki.com** using Astro, TanStack, Convex, WorkOS, Autumn, and Firecrawl. It collects the UI shell, learning resources, and integration scaffolding in one place so we can expand toward the full wiki experience.

## 🔭 Stack Overview

- **Astro** for routing, layouts, and SEO-friendly rendering
- **React Islands** for interactive UI (e.g., the launch checklist widget)
- **TanStack Query & Router** to handle client-side data/state for the authenticated app
- **Tailwind CSS** for styling
- **Convex** schema for pages, revisions, talk threads, moderation events, ingestion jobs
- **WorkOS** for OAuth (Google/GitHub) + email magic links, **Autumn** for donations, **Firecrawl** for content ingestion

## 📂 Project Structure

```
/
├── public/                   # Static assets
├── src/
│   ├── components/
│   │   ├── app/              # React islands (launch checklist, auth widgets, etc.)
│   │   └── providers/        # Shared providers like QueryProvider
│   ├── layouts/              # Shared Astro layouts
│   ├── pages/                # Astro routes (marketing + app shell + API endpoints)
│   ├── lib/                  # Auth helpers, cookie utilities
│   └── styles/               # Tailwind entry point
├── convex/
│   ├── auth.ts               # Viewer helpers
│   ├── kit.ts                # Lightweight wrappers around Convex helpers
│   ├── pages.ts              # Page/revision mutations & queries
│   ├── roles.ts              # Role constants + guards
│   ├── schema.ts             # Authoritative data model
│   ├── types.ts              # Shared Convex types
│   └── utils.ts              # Slug + time utilities
├── netlify/
│   ├── functions/            # Serverless functions (Autumn checkout, etc.)
│   └── edge-functions/       # Edge functions (if needed)
├── scripts/
│   ├── firecrawl-fetch.js    # Firecrawl ingestion helper
│   └── firecrawl-images.js   # Image scraping with Firecrawl
├── .env.example              # Environment variable template
├── .npmrc                    # npm configuration (legacy-peer-deps)
├── astro.config.mjs          # Astro config with Netlify adapter
├── netlify.toml              # Netlify build & deploy configuration
├── package.json
└── README.md                 # This file
```

### Deployment Files

- **netlify.toml** – Configures build settings, redirects, and serverless function routes
- **astro.config.mjs** – Includes `@astrojs/netlify` adapter for serverless deployment
- **.npmrc** – Configures npm to use `--legacy-peer-deps` for dependency resolution

## 🧭 Getting Started

```bash
# install dependencies once
npm install

# copy environment template and fill values (WorkOS, Autumn, Firecrawl keys)
cp .env.example .env

# start local dev server (binds to 127.0.0.1:4321 for WorkOS callbacks)
npm run dev

# run Astro CLI helpers
npm run astro -- add react
```

Ports & URLs:

- Local dev: `http://127.0.0.1:4321` (explicitly pinned so WorkOS redirects succeed)
- Preview builds: `netlify dev` (after Netlify config lands)
- Spec Kit console: `cd spec-kit-ui && npm install && npm run dev` (serves on `http://localhost:3000` for editing `spec.md` and `plan.md`)

## 🚧 Roadmap Highlights

1. Wire Astro components to the Convex mutations/queries under `convex/`
2. Sync WorkOS identities into Convex `users` + role tables inside API routes
3. Gate collaborative features (revisions, talk replies) with Convex permissions
4. Push Autumn usage tracking into Convex mutations once backend is connected
5. Kick off Firecrawl ingestion jobs and persist results via `ingestionJobs`
6. Deploy to Netlify (auto GitHub builds) and manage DNS via Cloudflare

- Run `npm run astro -- check` to verify type safety after schema or function changes

## 🔐 Authentication & Billing helpers

- `src/pages/api/auth/workos/login.ts` – starts OAuth with Google/GitHub via WorkOS
- `src/pages/api/auth/workos/callback.ts` – finalises login, seals session cookies
- `src/pages/api/auth/workos/magic-link.ts` – request/verify email magic codes (dev mode echoes the code)
- `src/pages/api/auth/workos/logout.ts` – clears local session cookies
- `netlify/functions/autumn-checkout.ts` – serverless endpoint for Autumn donation checkout

Environment variables:

```
WORKOS_API_KEY=
WORKOS_CLIENT_ID=
WORKOS_REDIRECT_URI=http://localhost:4321/api/auth/workos/callback
WORKOS_COOKIE_PASSWORD=change-me-please
AUTUMN_API_KEY=
PUBLIC_AUTUMN_PRODUCT_ID=pro
FIRECRAWL_API_KEY=
OPENAI_API_KEY=
PUBLIC_SENTRY_DSN=
PUBLIC_SENTRY_ENVIRONMENT=development
PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0
PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=1
PUBLIC_SENTRY_TUNNEL=
SENTRY_ENVIRONMENT=development
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=

# Cloudflare R2 (media storage)
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET_NAME=
CLOUDFLARE_R2_ENDPOINT=
CLOUDFLARE_R2_PUBLIC_BASE_URL=
CLOUDFLARE_R2_PREFIX=uploads
CONVEX_DEPLOYMENT=
CONVEX_URL=
CONVEX_ADMIN_KEY=
CODERABBIT_API_KEY=
```

> ℹ️ `WORKOS_COOKIE_PASSWORD` is used to seal encrypted session cookies. Give it at least 32 characters (a long random string works best). If you accidentally set a shorter value, the server will fall back to a SHA-256 digest and log a warning—still, update your `.env` so WorkOS cookies stay secure.

## 📡 Error monitoring (Sentry)

We ship `@sentry/astro` so both Astro SSR and React islands report crashes, performance spans, and optional session replays.

1. **Install + configure**  
   The dependency is already in `package.json`. The SDK reads `PUBLIC_SENTRY_*` values that you set in `.env`/Netlify envs. Keep DSN blank locally when you don’t want telemetry; the SDK auto-disables itself.

2. **Source maps & auth**  
   Fill `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` to upload source maps during `npm run build`. Tokens only need `project:write` + `org:read`.

3. **Sample rates**
   - `PUBLIC_SENTRY_TRACES_SAMPLE_RATE` controls performance tracing (default `0.1`).
   - `PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE` and `PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE` control browser replays (`0` and `1` by default).  
     Tune them per environment—e.g., lower in production, higher in staging.

4. **Optional tunneling**  
   Some ad blockers stop calls to `o*.ingest.sentry.io`. Set `PUBLIC_SENTRY_TUNNEL=/api/sentry/tunnel`, add the tunnel endpoint described in the Sentry docs, and the SDK will proxy events through your domain.

5. **Verify the wiring**  
   Add a throwaway button to any React island while developing:

   ```tsx
   <button
     type="button"
     onClick={() => {
       throw new Error("Sentry Test Error");
     }}
   >
     Break the world
   </button>
   ```

   Load the page, click the button, and confirm a “Sentry Test Error” issue appears in your project (usually within 1–2 minutes). Remove the button afterward.

6. **Troubleshooting**
   - No DSN? The SDK logs a friendly warning and stays disabled.
   - Need to silence telemetry locally? Leave `PUBLIC_SENTRY_DSN` empty or set `PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0`.
   - Want to inspect events? Use the Sentry UI breadcrumbs plus Astro route metadata that is automatically attached by our middleware.

## ✅ Convex connection checklist

1. `cp .env.example .env` and fill in `WORKOS_*`, `AUTUMN_*`, `FIRECRAWL_API_KEY`, `OPENAI_API_KEY`, and the Convex trio (`CONVEX_DEPLOYMENT`, `CONVEX_URL`, `CONVEX_ADMIN_KEY`).
2. Run `npx convex dev` (or ensure the hosted Convex deployment is live), then `npm run dev` to boot Astro.
3. Navigate to `/wiki`, `/wiki/<slug>`, `/wiki/<slug>/talk`, and `/wiki/<slug>/history` to confirm pages render real Convex data. React Query islands should show live proposals, moderation queues, and Talk threads.
4. For smoke tests, submit an edit proposal and approve it through the moderation panel. Check the Convex dashboard to verify new `pageRevisions` and `moderationEvents` entries.
5. If Convex goes offline, the app automatically falls back to the static seed data for ~60 seconds and suppresses repeated log spam. Fix the backend, then refresh to resume live data.

### Seeding Convex with the static articles

The wiki currently ships with static seed content in `src/data/articles.ts`. To push that content into Convex so it’s editable through the moderation workflow:

1. Ensure `CONVEX_URL` and `CONVEX_ADMIN_KEY` are set (optionally add `SEED_WORKOS_*` overrides if you don’t want to reuse the default `seed-script` identity).
2. Run `npm run seed:convex`. The script will:
   - Sync a system user (`seed-script@vibecoding.wiki`) via `users:syncWorkOSIdentity`.
   - Skip any pages that already exist in Convex.
   - Create and immediately approve a revision for every missing article so it lands in the “published” state.
3. Reload `/wiki/<slug>` and verify the data now comes from Convex (edits and talk threads will work end-to-end).

## 🗂 Checkpoints

The file `mediawiki-tanstack/checkpoints.md` logs restore points such as the legacy `fallback-data` state and the current `convex-wired` milestone. Update the table whenever you land a major feature so that future rollbacks (with or without Git tags) have clear instructions.

## 🤖 CodeRabbit & Bug Log

- Create a CodeRabbit access token and paste it into `CODERABBIT_API_KEY` inside `.env` so automated reviews can run locally or in CI.
- Every pull request should wait for the CodeRabbit status check before merging. If the bot surfaces an issue, add a short entry to `Bugs.md` describing the bug in plain English, the root cause, and the fix.
- Re-run CodeRabbit (or `npx coderabbit review`) after addressing feedback to keep the report clean for the next reviewer.

## 🗃️ Convex Schema snapshot

- `pages`, `pageRevisions`, `revisionReviews`, `moderationEvents`
- `talkThreads`, `talkMessages` (with nested replies)
- `tags`, `pageTags`, `watchlists`, `notifications`
- `ingestionJobs`, `pageLinks` to coordinate Firecrawl imports and link analysis

## 🔧 Useful scripts

- `npm run firecrawl:fetch` – scrape configured sources into `data/firecrawl/` (requires `FIRECRAWL_API_KEY`)
- `npm run firecrawl:images` – capture image metadata with Firecrawl and persist the results in `ingestionJobs`
- `npm run astro -- check` – type check Astro + TypeScript files

## 🛰 Firecrawl image ingestion

Use `scripts/firecrawl-images.js` to snapshot image references from trusted sources (currently the Wikipedia “Vibe coding” article). The script stores the results as Convex ingestion jobs for moderators to review:

```bash
# ensure FIRECRAWL_API_KEY, CONVEX_URL, and CONVEX_ADMIN_KEY are present
npm run firecrawl:images
```

Each job records the source URL and the first few discovered image URLs in the `payload.images` array. Moderators can decide which assets to upload to Cloudflare R2 and link to wiki pages.

## 🚀 Deployment (Netlify + Cloudflare)

### Primary Deployment Platform: Netlify

VibeCodingWiki is deployed on **Netlify** with automatic builds from the GitHub repository.

#### Initial Setup

1. **Adapter** – Astro is configured with the Netlify Functions adapter in `astro.config.mjs`, producing serverless output compatible with Netlify.
2. **Netlify project** – Connect the repository to Netlify:
   - Build command: `npm run build`
   - Publish directory: `dist/`
   - The provided `netlify.toml` routes `/api/*` requests to Netlify Functions
3. **Environment variables** – Populate all secrets in Netlify's dashboard:
   - WorkOS credentials (`WORKOS_API_KEY`, `WORKOS_CLIENT_ID`, `WORKOS_REDIRECT_URI`, `WORKOS_COOKIE_PASSWORD`)
   - Autumn API key for payments (`AUTUMN_API_KEY`, `PUBLIC_AUTUMN_PRODUCT_ID`)
   - Firecrawl API key for content ingestion (`FIRECRAWL_API_KEY`)
   - OpenAI API key (`OPENAI_API_KEY`)
   - Convex credentials (`CONVEX_URL`, `CONVEX_ADMIN_KEY`, `CONVEX_DEPLOYMENT`)
   - Cloudflare R2 media storage (`CLOUDFLARE_R2_*`)
   - Sentry monitoring (`PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, etc.)
4. **Cloudflare DNS** – Create CNAME records pointing `www` to the assigned Netlify subdomain, and either use CNAME flattening or A records (`75.2.60.5`, `99.83.190.102`) for the apex. Keep the proxy enabled to leverage Cloudflare TLS and caching.
5. **TLS & cache** – After DNS propagates, trigger certificate issuance in Netlify. In Cloudflare, enable Always Use HTTPS and configure cache rules to respect Netlify cache headers.

#### Automatic Deployments

- **Production**: Every push to `main` branch triggers an automatic production deployment
- **Preview**: Pull requests automatically generate preview deployments with unique URLs
- **Build time**: Typically ~2-3 minutes for full builds

#### Netlify Agent Runner for Micro Changes

For quick fixes and micro changes, you can use **Netlify Agent** to make updates directly without going through the full CI/CD pipeline:

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Authenticate with Netlify
netlify login

# Link to your Netlify site
netlify link

# Make changes and test locally
npm run dev

# Deploy directly to Netlify (bypasses GitHub)
netlify deploy --prod

# Or deploy to preview first
netlify deploy
```

**When to use Netlify Agent:**
- Quick content updates (typos, text changes)
- Small styling adjustments
- Minor configuration tweaks
- Emergency hotfixes

**Best practices:**
- Always test changes locally first with `npm run dev`
- Use preview deployments (`netlify deploy`) before going to production
- Commit changes back to GitHub after deploying to maintain version control
- For major features, always use the GitHub → Netlify automatic deployment flow

## 🤝 Contributing

- Follow the plan in `/docs/architecture` (to be added)
- Use Bolt.new for rapid UI prototyping, then export into `src/components`
- Run linting and unit tests (coming soon) before opening a PR
- All PRs go through CodeRabbit for automated review

Happy building! Reach out in the VibeCoding community if you get stuck.
