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

### Role-Based Access Control (Implemented)
The wiki implements comprehensive role-based access control to protect user privacy and control feature visibility:

**Role Hierarchy:**
1. **super_admin** (highest) - All permissions + full history access
2. **moderator** - Can approve/reject edits on any page
3. **contributor** - Can propose edits
4. **reader** (lowest) - Can view published content only

**Authentication & Access Flow:**

**Non-Authenticated Users:**
- ❌ NO "Propose an edit" form visible
- ❌ NO "Recent proposals" section visible
- ❌ NO revision history visible
- ✅ Can click "Sign in to propose edit" button
- ✅ Redirected to login with return URL: `/login?next=/wiki/{slug}`
- ✅ After authentication, returned to original page

**Authenticated Contributors:**
- ✅ Can see "Propose an edit" form
- ✅ Form prefilled with current page content
- ✅ Can edit and submit proposals
- ✅ Recent proposals shows 2-line summary:
  - Name, date, role, title
  - Status badge (pending/published/rejected)
  - NO full content details
- ✅ Can see revision history
- ❌ Cannot approve/reject proposals

**Moderators:**
- ✅ All contributor permissions +
- ✅ Can see moderation panel on regular wiki pages (not restricted to admin URL)
- ✅ Can approve/reject/rollback proposals
- ✅ See diff view with change highlights
- ✅ Same Recent proposals view as contributors

**Super Admins:**
- ✅ All moderator permissions +
- ✅ Can access admin dashboard (`/admin`)
- ✅ Can access pages via normal URLs too
- ✅ See FULL past changes in Recent proposals (complete content details)
- ✅ Can assign roles to other users
- ✅ First user automatically becomes super_admin
- ✅ Acts as moderator by default (can moderate on normal page URLs)

**Implementation Details:**
- Files Modified:
  - `src/pages/wiki/[slug].astro` - Added userRole detection and passing to components
  - `src/components/wiki/EditProposalForm.tsx` - Added authentication checks, sign-in redirect, role-based Recent proposals display
  - `src/components/wiki/RevisionHistory.tsx` - Already hides for non-authenticated users
  - `src/components/wiki/ModerationPanel.tsx` - Already checks canModerate permission
- Role Assignment Logic: `convex/users.ts` (syncWorkOSIdentity mutation)
- Role Management: `convex/roles.ts` (assignRole mutation, getUserByEmail query)

**Security Considerations:**
- All authentication checks performed server-side in Astro
- Client-side components receive boolean flags (isAuthenticated, canModerate)
- User role determined from Convex roles table
- No sensitive data exposed to non-authenticated users
- Return URLs validated to prevent open redirects

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

## Additional Implementation Steps

### 6. **Community Features - Apps, Newsletter, Sponsors**
   - Description: Implement app submission form (`/submit-app`), newsletter subscription (`/newsletter`), sponsors page (`/sponsors`), and about creator page (`/about`).
   - Owner: Full-stack engineer.
   - Dependencies: Convex schema for apps/newsletters/sponsors, RapidForms embed code for sponsors.

**App Submission Flow:**
1. User visits `/submit-app` (authentication required)
2. Fills form with: name, category (Games/Tech/Health/Travel/Habits/Productivity/Others + custom), description, built-in tool (Lovable/Bolt/V0/Replit/Cursor/CoPilot/VScode/Claude Code/Vibe Code APP/Vibingbase/Others + custom)
3. Form submits to `/api/apps/submit` → creates app with status='pending'
4. Moderators can approve/reject apps via admin interface (future enhancement)
5. Approved apps appear in apps gallery (future enhancement)

**Newsletter Flow:**
1. User visits `/newsletter` (authentication required)
2. Clicks "Sign me up for newsletter" button
3. System checks if already subscribed
4. Creates/reactivates subscription with status='active'
5. Displays confirmation message

**Sponsors Flow:**
1. Any visitor can view `/sponsors` page
2. Page displays list of sponsors ordered by displayOrder
3. Each sponsor shows: name, thank you note, optional logo, optional website link
4. RapidForms payment form embedded for new sponsorships (no auth required)
5. Admin can manually add/update sponsors via Convex dashboard

**About Creator Flow:**
1. Any visitor can view `/about` page
2. Page displays:
   - Profile image (upload functionality placeholder)
   - Bio: AI Generalist, Founder VibeCodeFixers, r/MCPservers
   - Twitter: @TheGeneralistHQ
   - Key Achievements: VibeCodeFixers (550 experts), r/MCPservers (15K devs)
   - Communities: r/MCPservers (14k+ devs), r/JulesAgent (3k+ devs), r/AgentExperience (upcoming)
   - Focus Areas: AI Agents, MCP, Content, SEO, Automation

### 7. **Real Contributors Page**
   - Description: Update `/users` page to fetch real contributors from Convex instead of fake data.
   - Owner: Frontend engineer.
   - Dependencies: Convex `users:listContributors` query.

**Contributors Display:**
- Shows real users from Convex database
- Displays: displayName, email, join date, bio, reputation, contribution count
- Shows role badge (super_admin, moderator, contributor, reader)
- Ordered by most recent join date

## Data Schema Updates

### New Tables
- **apps**: Stores submitted vibe-coded applications
  - Fields: name, category, categoryOther, description, builtIn, builtInOther, submittedBy, submittedAt, status, approvedBy, approvedAt
  - Indexes: by_category, by_status, by_submittedBy

- **newsletterSubscribers**: Tracks newsletter subscriptions
  - Fields: userId, email, subscribedAt, status, unsubscribedAt
  - Indexes: by_userId, by_email, by_status

- **sponsors**: Manages sponsor listings
  - Fields: name, thankyouNote, logoUrl, websiteUrl, displayOrder, createdAt, createdBy
  - Indexes: by_displayOrder

### Updated Navigation
- Removed: Discover, Recent changes, Community portal, Documentation
- Kept: Main page, All pages, Contributors
- Updated: "Vibe app" → "VibeCodingWiki App"
- Added: Submit an APP, VibeCoding Newsletter, Sponsors, About Creator

## Open Questions
- Will we migrate legacy useautumn.com data into Convex? (TBD)
- Should AI draft endpoint be rate-limited per user? (Future enhancement)
- What governance process will moderators follow for approving AI-generated content? (Needs policy)
- How will submitted apps be displayed in a gallery view? (Future enhancement)
- Should app submissions be auto-approved or require moderation? (Currently requires moderation)



