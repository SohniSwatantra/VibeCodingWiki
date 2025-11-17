# Feature Specification: VibeCodingWiki Platform

**Feature Branch**: `001-vibecodingwiki`  
**Created**: 2025-11-07  
**Status**: Draft  
**Input**: Rebuild useautumn.com as VibeCodingWiki using Astro, TanStack, Convex, WorkOS, Netlify, Firecrawl, OpenAI.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read & discover articles (Priority: P1)

Authenticated or anonymous visitors can browse VibeCodingWiki, search for topics, and read rich wiki-style articles styled like MediaWiki.

**Why this priority**: Core value proposition; knowledge consumption must work before collaboration.

**Independent Test**: Visit `/wiki/origins-of-vibecoding`, ensure article renders sections, timeline, tags, related links, and sponsorship banner displays without blocking reading.

**Acceptance Scenarios**:

1. **Given** an anonymous visitor, **When** they open `/wiki/<slug>`, **Then** the page loads with article title, sections, timeline, tags, and links styled per MediaWiki.
2. **Given** a visitor, **When** they search using the header form, **Then** results route to `/wiki` directory filtering (future).

---

### User Story 2 - Propose and moderate edits (Priority: P2)

Signed-in contributors can submit edit proposals; moderators review revisions, approve, reject, or rollback using Convex-backed workflow.

**Why this priority**: Collaborative knowledge base relies on contributions and moderation to maintain quality.

**Independent Test**: Log in via WorkOS, submit proposal on `/wiki/<slug>/edit`, verify revision enters moderation queue, approve via moderation panel to publish.

**Acceptance Scenarios**:

1. **Given** a contributor, **When** they submit an edit proposal, **Then** a pending revision is created and visible in moderation queue.
2. **Given** a moderator, **When** they approve the pending revision, **Then** the article updates and revision history shows new status.

---

### User Story 3 - Discuss via talk pages (Priority: P3)

Contributors use Talk pages to start threads, reply, and coordinate improvements.

**Why this priority**: Enables collaborative discussion before edits reach production, mirroring MediaWiki behavior.

**Independent Test**: Visit `/wiki/<slug>/talk`, start a thread, post replies, ensure unauthenticated users are prompted to sign in.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they create a thread, **Then** the talk board displays the new topic with metadata.
2. **Given** a moderator, **When** they respond to a thread, **Then** the message appears immediately with role badge.

---

### Edge Cases

- What happens when OpenAI draft generation fails (network error, invalid response)? => Return 500 with friendly error and instruct contributor to retry manually.
- How does the system handle sponsorship banner when Autumn API returns error? => Show dismissible fallback messaging without blocking page.
- Re-authentication mid-session: ensure expired WorkOS sessions redirect to login cleanly.
- What if `PUBLIC_SENTRY_DSN` is missing or blocked by ad blockers? => SDK stays disabled locally, and the documented tunneling option forwards events through a first-party endpoint when needed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render MediaWiki-styled marketing and wiki pages using Astro + Tailwind.
- **FR-002**: System MUST fetch and persist article data (pages, revisions, talk threads) in Convex.
- **FR-003**: Users MUST be able to authenticate via WorkOS Google, GitHub, or email magic link.
- **FR-004**: Moderators MUST approve/reject/rollback revisions via ModerationPanel.
- **FR-005**: Talk board MUST allow thread creation and replies for authenticated users.
- **FR-006**: System MUST surface sponsorship banner and route to Netlify Autumn checkout function.
- **FR-007**: `/api/wiki/ai-draft` MUST produce structured drafts using OpenAI GPT-5 and record metadata in revisions.
- **FR-008**: Firecrawl scripts MUST log article/image ingestion jobs in Convex `ingestionJobs` table.
- **FR-009**: Netlify deployment MUST serve serverless functions for auth, moderation, AI, and ingestion endpoints.
- **FR-010**: Every pull request MUST pass CodeRabbit's automated review before merge to ensure accessibility, security, and performance regressions are caught.
- **FR-011**: Observability MUST stream client + server exceptions to Sentry with documented sample-rate controls and verification steps.

### Key Entities

- **Page**: Represents wiki topic (slug, title, summary, status, approvedRevisionId).
- **PageRevision**: Proposed or approved content (sections, tags, metadata, status, createdBy).
- **TalkThread/TalkMessage**: Discussion artifacts tied to page, storing author, status, hierarchy.
- **Role**: Maps user to role (`superAdmin`, `moderator`, `contributor`, `reader`).
- **IngestionJob**: Logs Firecrawl fetch runs, including images metadata, status, timestamps.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of article routes (`/wiki`, `/wiki/[slug]`, `/wiki/[slug]/history`, `/wiki/[slug]/talk`, `/wiki/[slug]/edit`) respond with 200 within 2s on Netlify US East edge.
- **SC-002**: Contributors can submit proposals end-to-end; approval publishes within 30s including Convex mutations.
- **SC-003**: Talk board interactions persist and display immediately; 95% of attempts succeed without errors.
- **SC-004**: Sponsorship CTA click-through to Autumn checkout loads under 3s; banner respects dismissal via localStorage.
- **SC-005**: Firecrawl scripts capture at least 3 reference images per article and store metadata in Convex ingestionJobs.
- **SC-006**: Triggering the documented Sentry test button results in an issue inside the Sentry project (with route + user context) within 2 minutes.

## Risks & Mitigations

- **Risk**: OpenAI instability causing draft endpoint failures. *Mitigation*: Return actionable error, allow manual editing fallback.
- **Risk**: Convex schema changes impacting production data. *Mitigation*: Use migrations and staging testing prior to deploy.
- **Risk**: WorkOS session misconfiguration. *Mitigation*: Validate redirect URIs in WorkOS admin and add integration tests.
- **Risk**: Manual reviews miss subtle regressions. *Mitigation*: Require passing CodeRabbit status checks and capture fixes in `Bugs.md`.



