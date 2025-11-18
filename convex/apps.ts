import { query, mutation } from './kit';
import { v } from 'convex/values';
import { requireUser } from './auth';
import { now } from './utils';

export const submitApp = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    categoryOther: v.optional(v.string()),
    description: v.string(),
    builtIn: v.string(),
    builtInOther: v.optional(v.string()),
  },
  handler: async (ctx: any, args) => {
    const viewer = await requireUser(ctx);
    const userId = viewer._id;
    const nowTs = now();

    const appId = await ctx.db.insert('apps', {
      name: args.name,
      category: args.category,
      categoryOther: args.categoryOther,
      description: args.description,
      builtIn: args.builtIn,
      builtInOther: args.builtInOther,
      submittedBy: userId,
      submittedAt: nowTs,
      status: 'pending',
    });

    return { appId };
  },
});

export const listApps = query({
  args: {
    status: v.optional(v.string()),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx: any, args) => {
    const limit = args.limit ?? 100;
    let builder: any;

    if (args.status && args.category) {
      builder = ctx.db
        .query('apps')
        .withIndex('by_status', (q: any) => q.eq('status', args.status))
        .filter((q: any) => q.eq(q.field('category'), args.category));
    } else if (args.status) {
      builder = ctx.db
        .query('apps')
        .withIndex('by_status', (q: any) => q.eq('status', args.status));
    } else if (args.category) {
      builder = ctx.db
        .query('apps')
        .withIndex('by_category', (q: any) => q.eq('category', args.category));
    } else {
      builder = ctx.db.query('apps');
    }

    return await builder.order('desc').take(limit);
  },
});

export const getAppById = query({
  args: { appId: v.id('apps') },
  handler: async (ctx: any, args) => {
    return await ctx.db.get(args.appId);
  },
});

export const approveApp = mutation({
  args: { appId: v.id('apps') },
  handler: async (ctx: any, args) => {
    const viewer = await requireUser(ctx);
    const timestamp = now();

    await ctx.db.patch(args.appId, {
      status: 'approved',
      approvedBy: viewer._id,
      approvedAt: timestamp,
    });

    return { appId: args.appId };
  },
});

export const rejectApp = mutation({
  args: { appId: v.id('apps') },
  handler: async (ctx: any, args) => {
    await requireUser(ctx);

    await ctx.db.patch(args.appId, {
      status: 'rejected',
    });

    return { appId: args.appId };
  },
});
