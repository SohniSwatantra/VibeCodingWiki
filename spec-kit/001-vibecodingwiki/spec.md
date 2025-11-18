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

### User Story 2 - Propose and moderate edits with role-based access (Priority: P2)

Authenticated users can submit edit proposals with role-based visibility controls; moderators and super_admins review revisions, approve, reject, or rollback using Convex-backed workflow.

**Why this priority**: Collaborative knowledge base relies on contributions and moderation to maintain quality while protecting user privacy.

**Independent Test**: Log in via WorkOS, submit proposal on wiki page, verify revision enters moderation queue, approve via moderation panel to publish.

**Acceptance Scenarios**:

1. **Given** an unauthenticated user, **When** they visit a wiki page, **Then** they see NO "Propose an edit" form and NO "Recent proposals" section.
2. **Given** an unauthenticated user, **When** they click any propose edit link, **Then** they are redirected to sign-in page with return URL to original page.
3. **Given** an authenticated contributor, **When** they visit a wiki page, **Then** they see "Propose an edit" form prefilled with current page content.
4. **Given** an authenticated contributor, **When** they submit an edit proposal, **Then** a pending revision is created and visible in moderation queue for moderators/super_admins.
5. **Given** an authenticated contributor, **When** they view Recent proposals, **Then** they see 2-line summary (name, date, role, title, status) without full content.
6. **Given** a super_admin, **When** they view Recent proposals, **Then** they see FULL past changes with complete details.
7. **Given** a moderator, **When** they visit any wiki page via normal URL, **Then** they can see and use moderation panel to approve/reject proposals.
8. **Given** a super_admin, **When** they visit any wiki page, **Then** they have all moderator permissions plus full history access.
9. **Given** a moderator or super_admin, **When** they approve a pending revision, **Then** the article updates and revision history shows new status.

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
- **FR-021**: System MUST hide "Propose an edit" form and "Recent proposals" section from unauthenticated users.
- **FR-022**: System MUST redirect unauthenticated users to sign-in page with return URL when attempting to propose edits.
- **FR-023**: System MUST prefill edit form with current page content for all authenticated users.
- **FR-024**: System MUST show 2-line summary of Recent proposals (name, date, role, title, status) to contributors.
- **FR-025**: System MUST show FULL past changes in Recent proposals to super_admins only.
- **FR-026**: System MUST allow moderators to approve/reject proposals on regular wiki page URLs (not restricted to admin dashboard).
- **FR-027**: System MUST grant super_admins all moderator permissions plus full history access.
- **FR-028**: System MUST ensure first user is assigned super_admin role; subsequent users get contributor role.
- **FR-029**: System MUST support role hierarchy: super_admin (highest) > moderator > contributor > reader (lowest).

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

---

### User Story 4 - Submit and discover apps (Priority: P2)

Contributors can submit vibe-coded applications through a form; approved apps are displayed in a community gallery.

**Why this priority**: Showcasing community-built applications drives engagement and demonstrates VibeCoding value.

**Independent Test**: Log in, visit `/submit-app`, fill form with app details, submit; verify app enters pending queue for approval.

**Acceptance Scenarios**:

1. **Given** a contributor, **When** they submit an app with name, category, description, and build tool, **Then** the app is created with status='pending'.
2. **Given** a moderator, **When** they approve a pending app, **Then** the app appears in the apps gallery.

---

### User Story 5 - Subscribe to newsletter (Priority: P3)

Authenticated users can subscribe to the VibeCoding Newsletter to receive updates and community highlights.

**Why this priority**: Building an engaged email list supports community growth and retention.

**Independent Test**: Log in, visit `/newsletter`, click subscribe button; verify subscription is active.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they click "Sign me up for newsletter", **Then** their subscription is created with status='active'.
2. **Given** a user already subscribed, **When** they visit `/newsletter`, **Then** they see confirmation of their existing subscription.

---

### User Story 6 - View and become a sponsor (Priority: P3)

Visitors can view current sponsors and submit sponsorship through an embedded payment form.

**Why this priority**: Sponsorships provide sustainable funding and community recognition.

**Independent Test**: Visit `/sponsors`, view sponsor list, access embedded RapidForms payment form.

**Acceptance Scenarios**:

1. **Given** a visitor, **When** they visit `/sponsors`, **Then** they see a list of current sponsors with thank you notes.
2. **Given** a potential sponsor, **When** they complete the embedded form, **Then** their sponsorship is processed and they're added to the list.

---

### User Story 7 - Learn about the creator (Priority: P4)

Visitors can view information about the VibeCodingWiki creator, including bio, achievements, and community links.

**Why this priority**: Transparency and personal connection build trust and community engagement.

**Independent Test**: Visit `/about`, view creator profile with Twitter info and community links.

**Acceptance Scenarios**:

1. **Given** a visitor, **When** they visit `/about`, **Then** they see creator bio, achievements, and links to r/MCPservers, r/JulesAgent, and r/AgentExperience.

---

## Additional Functional Requirements

- **FR-012**: System MUST allow authenticated users to submit apps via `/submit-app` with fields: name, category, description, built-in tool.
- **FR-013**: Apps MUST support categories: Games, Tech, Health, Travel, Habits, Productivity, Others (with open field).
- **FR-014**: Apps MUST support build tools: Lovable, Bolt, V0, Replit, Cursor, CoPilot, VScode, Claude Code, Vibe Code APP, Vibingbase, Others (with open field).
- **FR-015**: Newsletter subscription MUST be available to authenticated users via `/newsletter`.
- **FR-016**: Newsletter subscriptions MUST track status (active/unsubscribed) and subscription date.
- **FR-017**: Sponsors page MUST display sponsor list ordered by displayOrder with name, thank you note, logo, and website link.
- **FR-018**: Sponsors page MUST embed RapidForms payment form for new sponsorships (no authentication required).
- **FR-019**: About Creator page MUST display bio, achievements, community links, and profile image.
- **FR-020**: Contributors page MUST show real users from Convex with display name, join date, bio, reputation, and contribution count.

## Additional Key Entities

- **App**: Submitted vibe-coded application (name, category, description, builtIn, submittedBy, status).
- **NewsletterSubscriber**: User subscription to newsletter (userId, email, status, subscribedAt).
- **Sponsor**: Sponsor record (name, thankyouNote, logoUrl, websiteUrl, displayOrder).

## Additional Success Criteria

- **SC-007**: App submission form successfully creates pending apps; moderators can approve/reject via admin interface.
- **SC-008**: Newsletter subscription toggles work seamlessly; subscription status persists across sessions.
- **SC-009**: Sponsors page loads sponsor list in under 2s; RapidForms embed loads within 3s.
- **SC-010**: Contributors page displays real user data from Convex with accurate role badges and stats.



