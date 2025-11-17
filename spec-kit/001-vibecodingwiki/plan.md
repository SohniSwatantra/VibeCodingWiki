# Implementation Plan: VibeCodingWiki Platform

**Feature Branch**: `001-vibecodingwiki`  
**Created**: 2025-11-07  
**Status**: Draft  
**Input**: Implement Astro + TanStack + Convex rebuild with auth, moderation, ingestion, and deployment stack.

## Architecture Summary
- **Frontend**: Astro 5 (Netlify adapter), React 19 islands, Tailwind CSS for MediaWiki styling, TanStack Query/Router for data fetching and routing within islands.
- **Backend**: Convex functions for queries/mutations, Netlify Functions for auth callbacks, Autumn checkout, AI drafting.
- **Storage**: Convex database for users/pages/revisions/talk/ingestion jobs; Cloudflare R2 for media assets.
- **Integrations**: WorkOS (OAuth + Magic Link), OpenAI GPT-5 (draft generation), Firecrawl API (scraping), Autumn sponsorship checkout, Cloudflare DNS, Sentry (error tracking + performance tracing).

## High-Level Design
1. **Astro Marketing Shell**
   - Responsibility: Provide MediaWiki-inspired layout, header navigation, sponsorship banner, base pages.
   - Interfaces: Astro server render, React islands for interactive widgets, Tailwind theme tokens.
2. **Convex Data Layer**
   - Responsibility: Manage wiki entities (pages, revisions, talk threads, roles, ingestion jobs) and scheduled jobs (link graph, popularity).
   - Interfaces: `runConvexQuery`, `runConvexMutation` helpers in Astro, Convex HTTP API.
3. **Collaboration Modules**
   - Responsibility: Edit proposal workflow, moderation queue, talk board discussions, revision history display.
   - Interfaces: React components calling Convex endpoints, Astro middleware for user context.
4. **Platform Services**
   - Responsibility: WorkOS authentication, Autumn sponsorship checkout, Firecrawl ingestion scripts, OpenAI draft generation, Netlify deployment.
   - Interfaces: WorkOS SDK, Autumn API (Netlify Function), Firecrawl SDK, OpenAI SDK, Netlify config & DNS.

## Implementation Steps
1. **Finalize UI/Routes**
   - Description: Ensure Astro routes exist for `/`, `/wiki`, `/wiki/[slug]`, `/wiki/[slug]/history`, `/wiki/[slug]/talk`, `/wiki/[slug]/edit`, `/users/[username]`, `/login`.
   - Owner: Frontend engineer.
   - Dependencies: Tailwind theme tokens.
2. **Convex Wiring & Moderation**
   - Description: Confirm schema, queries, mutations for pages/revisions/talk/moderation; hook React islands to these endpoints.
   - Owner: Full-stack engineer.
   - Dependencies: Convex project + env vars.
3. **Auth, Sponsorship, Deployment**
   - Description: Integrate WorkOS endpoints, Autumn checkout Netlify Function, configure Netlify adapter and Cloudflare DNS, document env vars.
   - Owner: Platform engineer.
   - Dependencies: WorkOS/Autumn credentials, Netlify account, Cloudflare zone.
4. **AI Drafting & Ingestion**
   - Description: Finish OpenAI `/api/wiki/ai-draft` endpoint, Firecrawl scripts (`firecrawl-fetch`, `firecrawl-images`), ingestion job mutation.
   - Owner: Backend engineer.
   - Dependencies: OpenAI + Firecrawl API keys.
5. **Observability & Sentry**
   - Description: Wire up `@sentry/astro`, client/server init files, optional tunneling, and document DSN/sample rate env vars plus verification steps.
   - Owner: Platform engineer.
   - Dependencies: Sentry org/project, auth token for source-map uploads.

## Data & Schema Considerations
- `pages`: includes `approvedRevisionId`, `status`, `popularityScore`.
- `pageRevisions`: stores sections, tags, metadata, status, `ingestionJobId`, **diff tracking fields** (`baseRevisionId`, `diffContent`, `diffStats`).
- `talkThreads`/`talkMessages`: maintain per-page discussions with status fields.
- `roles`: assign default contributor role, first user becomes super admin.
- `ingestionJobs`: record Firecrawl outputs, keyed by source URL and status.

### Diff-Based Editing Workflow (Implemented)
The wiki now uses an intelligent diff-based editing system instead of full content replacement:

**Contributor Flow:**
1. User clicks "Propose edit" on a wiki page
2. Edit form **pre-fills with current approved content** (not empty!)
3. User edits the content directly in the textarea (like a document editor)
4. On submit:
   - API calculates diff from approved content → proposed content
   - Stores both full content AND diff patch + stats
   - Tracks `baseRevisionId` (which version this is based on)

**Moderator Flow:**
1. Moderation panel shows proposals with **diff stats badges** (+45 -12 lines)
2. Each proposal displays a **unified inline diff view**:
   - Green highlighting = added lines
   - Red highlighting = deleted lines
   - GitHub-style visualization
3. Moderator clicks "Approve & publish"
4. System performs **conflict detection**:
   - Checks if `page.approvedRevisionId === revision.baseRevisionId`
   - If base changed since proposal → **Error: "Conflict detected, resubmit required"**
   - If unchanged → Approves and publishes new content
5. Page content updates to reflect approved changes

**Key Benefits:**
- ✅ No more full content replacement
- ✅ Moderators see exactly what changed
- ✅ Prevents conflicting edits (stale proposals rejected)
- ✅ Better user experience (edit existing content, not start from scratch)
- ✅ Audit trail with diff history

**Technical Implementation:**
- Libraries: `diff-match-patch` (diff generation), `diff` (line-by-line comparison)
- Components: `DiffViewer.tsx` (visualization), `DiffStatsBadge.tsx`
- Utilities: `src/lib/diff/diffUtils.ts` (generateDiff, applyDiff, calculateDiffStats)
- Conflict policy: Reject on base mismatch (no auto-merge)

## Testing Strategy
- **Unit Tests**: Pending (future) for Convex functions and React components (placeholder).
- **Integration Tests**: Manual verification of auth/login/logout, proposal submission, moderation actions, talk board interactions, AI draft generation.
- **Monitoring Tests**: Trigger the “Sentry Test Error” button locally/previews to confirm events + Astro route context arrive in Sentry.
- **E2E Tests**: Manual flows in Netlify preview to ensure article pages and moderation behave; consider Playwright later.
- **Performance/Security**: Validate WorkOS session handling, ensure Netlify functions respond under 2s; monitor OpenAI/Firecrawl usage.
- **Code Review Automation**: Every PR must run through CodeRabbit. Capture any defects CodeRabbit finds (and the fixes) in `Bugs.md` so the team can learn from recurring issues.

## Deployment & Rollout
- **Environments**: Local (`npm run dev`), Netlify preview builds, production Netlify site.
- **Feature Flags**: Potential flag for enabling AI draft endpoint per environment.
- **Migration Steps**: None yet (greenfield); future migration for existing Autumn data if needed.
- **Monitoring**: Netlify logs, Convex dashboard, WorkOS admin portal, Cloudflare analytics.
- **Alerts**: Sentry issues + performance traces; configure environment variables per README for Netlify contexts.

## Risks & Mitigations
- **Risk 1**: API key misconfiguration across environments.  
  - Mitigation: Document env vars in README, use Netlify environment contexts.
- **Risk 2**: GPT-5 endpoint costs or failures.  
  - Mitigation: Provide manual fallback instructions and log errors.
- **Risk 3**: Firecrawl scraping rate limits.  
  - Mitigation: Limit script frequency, store ingestion job history for retries.
- **Risk 4**: Missing Sentry tokens leading to failed builds.  
  - Mitigation: Make DSN optional, guard uploads behind env checks, document fallback instructions.

## Open Questions
- Will we migrate legacy useautumn.com data into Convex? (TBD)
- Should AI draft endpoint be rate-limited per user? (Future enhancement)
- What governance process will moderators follow for approving AI-generated content? (Needs policy)



