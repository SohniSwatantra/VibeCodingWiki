import { query, mutation } from './kit';
import { v } from 'convex/values';

import { requireUser } from './auth';
import { requireRole, ROLES } from './roles';
import { normalizeNamespace, now, slugify } from './utils';
// Note: Autumn is only used for sponsorship payments, not for editing/creating pages

export const getPageBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx: any, args: { slug: string }) => {
    const page = await ctx.db
      .query('pages')
      .withIndex('by_slug', (q: any) => q.eq('slug', args.slug))
      .unique();

    if (!page) {
      return null;
    }

    const approvedRevision = page.approvedRevisionId
      ? await ctx.db.get(page.approvedRevisionId)
      : null;

    return { page, approvedRevision };
  },
});

export const listPages = query({
  args: {
    namespace: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (
    ctx: any,
    args: { namespace?: string; status?: string; limit?: number },
  ) => {
    const namespace = args.namespace ? normalizeNamespace(args.namespace) : undefined;
    const limit = args.limit ?? 50;

    let builder: any;

    if (namespace) {
      builder = ctx.db
        .query('pages')
        .withIndex('by_namespace', (q: any) => q.eq('namespace', namespace));

      if (args.status) {
        builder = builder.filter((q: any) => q.eq('status', args.status));
      }
    } else if (args.status) {
      builder = ctx.db
        .query('pages')
        .withIndex('by_status', (q: any) => q.eq('status', args.status));
    } else {
      builder = ctx.db.query('pages');
    }

    const pages = await builder.order('desc').take(limit);

    return await Promise.all(
      pages.map(async (page: any) => {
        const approvedRevision = page.approvedRevisionId ? await ctx.db.get(page.approvedRevisionId) : null;
        return { page, approvedRevision };
      }),
    );
  },
});

export const getRevisionHistory = query({
  args: { pageId: v.id('pages'), limit: v.optional(v.number()) },
  handler: async (ctx: any, args: { pageId: string; limit?: number }) => {
    return await ctx.db
      .query('pageRevisions')
      .withIndex('by_pageId', (q: any) => q.eq('pageId', args.pageId))
      .order('desc')
      .take(args.limit ?? 100);
  },
});

export const getRevisionById = query({
  args: { revisionId: v.id('pageRevisions') },
  handler: async (ctx: any, args: { revisionId: string }) => {
    return await ctx.db.get(args.revisionId);
  },
});

export const getModerationQueue = query({
  args: {
    slug: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx: any, args: { slug: string; limit?: number }) => {
    const page = await ctx.db
      .query('pages')
      .withIndex('by_slug', (q: any) => q.eq('slug', args.slug))
      .unique();

    if (!page) {
      return null;
    }

    const revisions = await ctx.db
      .query('pageRevisions')
      .withIndex('by_pageId', (q: any) => q.eq('pageId', page._id))
      .order('desc')
      .take(args.limit ?? 50);

    const enriched = await Promise.all(
      revisions.map(async (revision: any) => {
        const author = await ctx.db.get(revision.createdBy);
        const roles = await ctx.db
          .query('roles')
          .withIndex('by_userId', (q: any) => q.eq('userId', revision.createdBy))
          .collect();

        return {
          revision,
          author,
          roles,
        };
      }),
    );

    return {
      page,
      revisions: enriched,
    };
  },
});

export const createPage = mutation({
  args: {
    title: v.string(),
    slug: v.optional(v.string()),
    namespace: v.optional(v.string()),
    summary: v.optional(v.string()),
    content: v.string(),
    sections: v.optional(
      v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          level: v.number(),
          markdown: v.string(),
        }),
      ),
    ),
    tags: v.optional(v.array(v.string())),
    timeline: v.optional(
      v.array(
        v.object({
          year: v.union(v.string(), v.number()),
          title: v.string(),
          description: v.string(),
        }),
      ),
    ),
    relatedTopics: v.optional(v.array(v.string())),
  },
  handler: async (
    ctx: any,
    args: {
      title: string;
      slug?: string;
      namespace?: string;
      summary?: string;
      content: string;
      sections?: Array<{ id: string; title: string; level: number; markdown: string }>;
      tags?: string[];
      timeline?: Array<{ year: string | number; title: string; description: string }>;
      relatedTopics?: string[];
    },
  ) => {
    const viewer = await requireUser(ctx);
    const userId = viewer._id;
    // Editing/creating pages is free - no feature access check needed
    const nowTs = now();
    const namespace = normalizeNamespace(args.namespace);

    const slug = (args.slug ?? slugify(args.title)) || slugify(args.title);
    if (!slug) {
      throw new Error('Unable to generate slug for this page title.');
    }

    const existing = await ctx.db
      .query('pages')
      .withIndex('by_slug', (q: any) => q.eq('slug', slug))
      .unique();
    if (existing) {
      throw new Error('A page with this slug already exists.');
    }

    const pageId = await ctx.db.insert('pages', {
      slug,
      title: args.title,
      namespace,
      summary: args.summary,
      tags: args.tags ?? [],
      createdBy: userId,
      createdAt: nowTs,
      updatedAt: nowTs,
      status: 'pending',
    });

    const revisionId = await ctx.db.insert('pageRevisions', {
      pageId,
      revisionNumber: 1,
      content: args.content,
      summary: args.summary,
      sections: args.sections,
      tags: args.tags,
      timeline: args.timeline,
      relatedTopics: args.relatedTopics,
      createdBy: userId,
      createdAt: nowTs,
      status: 'pending',
    });

    // No usage tracking needed - editing/creating pages is free
    return { pageId, revisionId };
  },
});

export const submitRevision = mutation({
  args: {
    pageId: v.id('pages'),
    content: v.string(),
    summary: v.optional(v.string()),
    sections: v.optional(
      v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          level: v.number(),
          markdown: v.string(),
        }),
      ),
    ),
    tags: v.optional(v.array(v.string())),
    timeline: v.optional(
      v.array(
        v.object({
          year: v.union(v.string(), v.number()),
          title: v.string(),
          description: v.string(),
        }),
      ),
    ),
    relatedTopics: v.optional(v.array(v.string())),
    metadata: v.optional(v.any()),
    // Diff tracking fields
    baseRevisionId: v.optional(v.id('pageRevisions')),
    diffContent: v.optional(v.string()),
    diffStats: v.optional(
      v.object({
        additions: v.number(),
        deletions: v.number(),
      }),
    ),
  },
  handler: async (
    ctx: any,
    args: {
      pageId: string;
      content: string;
      summary?: string;
      sections?: Array<{ id: string; title: string; level: number; markdown: string }>;
      tags?: string[];
      timeline?: Array<{ year: string | number; title: string; description: string }>;
      relatedTopics?: string[];
      metadata?: any;
      baseRevisionId?: string;
      diffContent?: string;
      diffStats?: { additions: number; deletions: number };
    },
  ) => {
    const viewer = await requireUser(ctx);
    const userId = viewer._id;
    const page = await ctx.db.get(args.pageId);
    if (!page) {
      throw new Error('Page not found.');
    }

    // Editing/creating pages is free - no feature access check needed

    const latest = await ctx.db
      .query('pageRevisions')
      .withIndex('by_pageId', (q: any) => q.eq('pageId', args.pageId))
      .order('desc')
      .first();

    const revisionNumber = latest ? latest.revisionNumber + 1 : 1;
    const nowTs = now();

    const revisionId = await ctx.db.insert('pageRevisions', {
      pageId: args.pageId,
      revisionNumber,
      content: args.content,
      summary: args.summary,
      sections: args.sections,
      tags: args.tags,
      timeline: args.timeline,
      relatedTopics: args.relatedTopics,
      createdBy: userId,
      createdAt: nowTs,
      status: 'pending',
      metadata: args.metadata,
      // Diff tracking for intelligent merging
      baseRevisionId: args.baseRevisionId,
      diffContent: args.diffContent,
      diffStats: args.diffStats,
    });

    // Update the page's timestamp but DON'T change status to 'pending'
    // The page should remain published/visible while the revision is pending moderation
    await ctx.db.patch(args.pageId, {
      updatedAt: nowTs,
      // status: 'pending',  // REMOVED - this was hiding the page from listings
    });

    // No usage tracking needed - editing/creating pages is free

    return { revisionId, revisionNumber };
  },
});

export const approveRevision = mutation({
  args: {
    revisionId: v.id('pageRevisions'),
  },
  handler: async (ctx: any, args: { revisionId: string }) => {
    const { viewer } = await requireRole(ctx, [ROLES.moderator, ROLES.superAdmin]);
    const revision = await ctx.db.get(args.revisionId);
    if (!revision) {
      throw new Error('Revision not found.');
    }

    const page = await ctx.db.get(revision.pageId);
    if (!page) {
      throw new Error('Page not found for revision.');
    }

    // CONFLICT DETECTION: Check if the base revision has changed since proposal was submitted
    if (revision.baseRevisionId && page.approvedRevisionId !== revision.baseRevisionId) {
      // The approved content has changed since this proposal was created
      // Reject the approval to prevent conflicts
      throw new Error(
        'Conflict detected: The page has been updated since this proposal was submitted. ' +
        'The contributor needs to resubmit their changes based on the latest version.'
      );
    }

    const timestamp = now();

    // Mark revision as approved
    await ctx.db.patch(args.revisionId, {
      status: 'approved',
      approvedBy: viewer._id,
      approvedAt: timestamp,
    });

    // Update page to point to the newly approved revision
    // The revision's full content becomes the new approved content
    await ctx.db.patch(page._id, {
      approvedRevisionId: args.revisionId,
      status: 'published',
      summary: revision.summary ?? page.summary,
      tags: revision.tags ?? page.tags,
      updatedAt: timestamp,
    });

    // Log the moderation event
    await ctx.db.insert('moderationEvents', {
      pageId: page._id,
      revisionId: args.revisionId,
      actorId: viewer._id,
      action: 'approved',
      message: revision.summary ?? 'Revision approved',
      createdAt: timestamp,
      metadata: {
        revisionNumber: revision.revisionNumber,
        hadDiff: Boolean(revision.diffContent),
        diffStats: revision.diffStats,
      },
    });

    return { pageId: page._id, revisionId: args.revisionId };
  },
});

export const rejectRevision = mutation({
  args: {
    revisionId: v.id('pageRevisions'),
    reason: v.optional(v.string()),
  },
  handler: async (ctx: any, args: { revisionId: string; reason?: string }) => {
    const { viewer } = await requireRole(ctx, [ROLES.moderator, ROLES.superAdmin]);
    const revision = await ctx.db.get(args.revisionId);
    if (!revision) {
      throw new Error('Revision not found.');
    }

    const timestamp = now();

    await ctx.db.patch(args.revisionId, {
      status: 'rejected',
      rejectionReason: args.reason,
    });

    await ctx.db.insert('moderationEvents', {
      pageId: revision.pageId,
      revisionId: args.revisionId,
      actorId: viewer._id,
      action: 'rejected',
      message: args.reason ?? 'Revision rejected',
      createdAt: timestamp,
    });

    return { revisionId: args.revisionId };
  },
});

export const rollbackLatestApproval = mutation({
  args: {
    pageId: v.id('pages'),
  },
  handler: async (ctx: any, args: { pageId: string }) => {
    const { viewer } = await requireRole(ctx, [ROLES.moderator, ROLES.superAdmin]);
    const page = await ctx.db.get(args.pageId);
    if (!page) {
      throw new Error('Page not found.');
    }

    if (!page.approvedRevisionId) {
      throw new Error('No approved revision to roll back.');
    }

    const revisions = await ctx.db
      .query('pageRevisions')
      .withIndex('by_pageId', (q: any) => q.eq('pageId', page._id))
      .order('desc')
      .collect();

    const currentApprovedId = page.approvedRevisionId;
    const previousApproved = revisions.find(
      (revision: any) => revision.status === 'approved' && revision._id !== currentApprovedId,
    );

    await ctx.db.patch(currentApprovedId, {
      status: 'pending',
    });

    const timestamp = now();

    if (previousApproved) {
      await ctx.db.patch(page._id, {
        approvedRevisionId: previousApproved._id,
        updatedAt: timestamp,
      });
    } else {
      await ctx.db.patch(page._id, {
        approvedRevisionId: undefined,
        status: 'pending',
        updatedAt: timestamp,
      });
    }

    await ctx.db.insert('moderationEvents', {
      pageId: page._id,
      revisionId: currentApprovedId,
      actorId: viewer._id,
      action: 'rollback',
      message: 'Rolled back latest approved revision',
      createdAt: timestamp,
    });

    return {
      pageId: page._id,
      revertedRevisionId: currentApprovedId,
      restoredRevisionId: previousApproved?._id ?? null,
    };
  },
});

/**
 * Auto-approve first revision for migrated pages from fallback data
 * This is used during migrations to ensure pages have approved content
 * No role check - intended for migration scripts only
 */
export const autoApproveFirstRevision = mutation({
  args: {
    pageId: v.id('pages'),
  },
  handler: async (ctx: any, args: { pageId: string }) => {
    const page = await ctx.db.get(args.pageId);
    if (!page) {
      throw new Error('Page not found.');
    }

    // Check if page already has an approved revision
    if (page.approvedRevisionId) {
      return { pageId: page._id, revisionId: page.approvedRevisionId, alreadyApproved: true };
    }

    // Find the first revision
    const revisions = await ctx.db
      .query('pageRevisions')
      .withIndex('by_pageId', (q: any) => q.eq('pageId', page._id))
      .order('asc')
      .take(1);

    if (revisions.length === 0) {
      throw new Error('No revisions found for page.');
    }

    const firstRevision = revisions[0];
    const timestamp = now();

    // Mark revision as approved (system approval)
    await ctx.db.patch(firstRevision._id, {
      status: 'approved',
      approvedAt: timestamp,
    });

    // Update page to point to the approved revision
    await ctx.db.patch(page._id, {
      approvedRevisionId: firstRevision._id,
      status: 'published',
      summary: firstRevision.summary ?? page.summary,
      tags: firstRevision.tags ?? page.tags,
      updatedAt: timestamp,
    });

    return { pageId: page._id, revisionId: firstRevision._id, alreadyApproved: false };
  },
});

export const getRecentApprovedChanges = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx: any, args: { limit?: number }) => {
    const limit = args.limit ?? 50;

    // Get recently approved revisions
    const approvedRevisions = await ctx.db
      .query('pageRevisions')
      .withIndex('by_status', (q: any) => q.eq('status', 'approved'))
      .order('desc')
      .take(limit);

    // Enrich with page and user data
    const enriched = await Promise.all(
      approvedRevisions.map(async (revision: any) => {
        const page = await ctx.db.get(revision.pageId);
        const author = await ctx.db.get(revision.createdBy);
        const approver = revision.approvedBy ? await ctx.db.get(revision.approvedBy) : null;

        // Get author roles
        const authorRoles = await ctx.db
          .query('roles')
          .withIndex('by_userId', (q: any) => q.eq('userId', revision.createdBy))
          .collect();

        const primaryRole = authorRoles.length > 0 ? authorRoles[0].role : 'contributor';

        return {
          revisionId: revision._id,
          pageId: page?._id,
          pageTitle: page?.title,
          pageSlug: page?.slug,
          summary: revision.summary,
          authorName: author?.displayName ?? author?.email ?? 'Unknown',
          authorRole: primaryRole,
          approvedAt: revision.approvedAt ?? revision.createdAt,
          approvedByName: approver?.displayName ?? approver?.email,
        };
      }),
    );

    return enriched.filter((item) => item.pageId); // Filter out any missing pages
  },
});

export const searchPages = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx: any, args: { query: string; limit?: number }) => {
    const searchQuery = args.query.toLowerCase().trim();
    const limit = args.limit ?? 20;

    if (!searchQuery) {
      return [];
    }

    // Get all published pages
    const pages = await ctx.db
      .query('pages')
      .withIndex('by_status', (q: any) => q.eq('status', 'published'))
      .collect();

    // Filter pages based on search query
    const matchingPages = pages.filter((page: any) => {
      const titleMatch = page.title.toLowerCase().includes(searchQuery);
      const summaryMatch = page.summary?.toLowerCase().includes(searchQuery);
      const tagMatch = page.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery));

      return titleMatch || summaryMatch || tagMatch;
    });

    // Sort by relevance (title matches first)
    const sortedPages = matchingPages.sort((a: any, b: any) => {
      const aTitleMatch = a.title.toLowerCase().includes(searchQuery);
      const bTitleMatch = b.title.toLowerCase().includes(searchQuery);

      if (aTitleMatch && !bTitleMatch) return -1;
      if (!aTitleMatch && bTitleMatch) return 1;
      return 0;
    });

    // Get approved revisions and limit results
    const results = await Promise.all(
      sortedPages.slice(0, limit).map(async (page: any) => {
        const approvedRevision = page.approvedRevisionId
          ? await ctx.db.get(page.approvedRevisionId)
          : null;

        return {
          page,
          approvedRevision,
          snippet: approvedRevision?.content.substring(0, 200) ?? page.summary ?? '',
        };
      }),
    );

    return results;
  },
});

