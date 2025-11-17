import { query, mutation } from './kit';
import { v } from 'convex/values';
import { requireRole, ROLES } from './roles';
import { now } from './utils';

const ROLE_PRIORITY = [ROLES.superAdmin, ROLES.moderator, ROLES.contributor, ROLES.reader] as const;
type RoleKey = (typeof ROLE_PRIORITY)[number];

function isRoleKey(role: string): role is RoleKey {
  return (ROLE_PRIORITY as readonly string[]).includes(role);
}

async function resolvePrimaryRole(ctx: any, userId: string) {
  const assignments = await ctx.db
    .query('roles')
    .withIndex('by_userId', (q: any) => q.eq('userId', userId))
    .collect();

  const ordered = assignments
    .map((assignment: any) => assignment.role as string)
    .filter((role: string): role is RoleKey => isRoleKey(role))
    .sort((a: RoleKey, b: RoleKey) => ROLE_PRIORITY.indexOf(a) - ROLE_PRIORITY.indexOf(b));

  return ordered[0] ?? ROLES.reader;
}

export const listThreads = query({
  args: { slug: v.string() },
  handler: async (ctx: any, args: { slug: string }) => {
    const page = await ctx.db
      .query('pages')
      .withIndex('by_slug', (q: any) => q.eq('slug', args.slug))
      .unique();

    if (!page) return [];

    const threads = await ctx.db
      .query('talkThreads')
      .withIndex('by_pageId', (q: any) => q.eq('pageId', page._id))
      .order('desc')
      .collect();

    return await Promise.all(
      threads.map(async (thread: any) => {
        const posts = await ctx.db
          .query('talkMessages')
          .withIndex('by_threadId', (q: any) => q.eq('threadId', thread._id))
          .order('asc')
          .collect();

        const enrichedPosts = await Promise.all(
          posts.map(async (post: any) => {
            const author = post.authorId ? await ctx.db.get(post.authorId) : null;
            const role = post.authorId ? await resolvePrimaryRole(ctx, post.authorId) : ROLES.reader;
            return {
              id: post._id,
              body: post.body,
              postedAt: post.createdAt,
              authorId: post.authorId ?? null,
              authorName: author?.displayName ?? post.authorName ?? 'Unknown contributor',
              role,
            };
          }),
        );

        return {
          id: thread._id,
          topic: thread.title,
          status: thread.status,
          createdAt: thread.createdAt,
          createdBy: thread.createdBy,
          posts: enrichedPosts,
        };
      }),
    );
  },
});

export const createThread = mutation({
  args: {
    slug: v.string(),
    topic: v.string(),
    body: v.optional(v.string()),
    status: v.optional(v.union(v.literal('open'), v.literal('resolved'), v.literal('archived'))),
  },
  handler: async (
    ctx: any,
    args: { slug: string; topic: string; body?: string; status?: 'open' | 'resolved' | 'archived' },
  ) => {
    const { viewer } = await requireRole(ctx, [ROLES.contributor, ROLES.moderator, ROLES.superAdmin]);

    const page = await ctx.db
      .query('pages')
      .withIndex('by_slug', (q: any) => q.eq('slug', args.slug))
      .unique();

    if (!page) {
      throw new Error('Page not found. Create the article before starting a Talk thread.');
    }

    const threadId = await ctx.db.insert('talkThreads', {
      pageId: page._id,
      title: args.topic,
      createdBy: viewer._id,
      createdAt: now(),
      resolvedAt: undefined,
      status: args.status ?? 'open',
    });

    if (args.body && args.body.trim().length > 0) {
      await ctx.db.insert('talkMessages', {
        threadId,
        authorId: viewer._id,
        body: args.body.trim(),
        createdAt: now(),
        editedAt: undefined,
        reactions: [],
      });
    }

    return threadId;
  },
});

export const addMessage = mutation({
  args: {
    threadId: v.id('talkThreads'),
    body: v.string(),
  },
  handler: async (ctx: any, args: { threadId: string; body: string }) => {
    const { viewer } = await requireRole(ctx, [ROLES.contributor, ROLES.moderator, ROLES.superAdmin]);

    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      throw new Error('Talk thread not found.');
    }

    const messageId = await ctx.db.insert('talkMessages', {
      threadId: args.threadId,
      authorId: viewer._id,
      body: args.body.trim(),
      createdAt: now(),
      editedAt: undefined,
      reactions: [],
    });

    if (thread.status === 'archived') {
      await ctx.db.patch(thread._id, {
        status: 'open',
      });
    }

    return messageId;
  },
});
