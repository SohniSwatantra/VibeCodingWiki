import { query, mutation } from './kit';
import { v } from 'convex/values';
import { requireUser } from './auth';
import { requireRole, ROLES } from './roles';
import { now } from './utils';

// List of supported vibecoding tools
export const BUILD_TOOLS = [
  'Lovable',
  'Bolt',
  'V0',
  'Replit',
  'Cursor',
  'CoPilot',
  'VScode',
  'Claude Code',
  'Vibe Code APP',
  'Vibingbase',
  'Base44',
  'Gemini AI Studio',
  'Others',
];

// List of app categories
export const CATEGORIES = [
  'Games',
  'Tech',
  'Health',
  'Travel',
  'Habits',
  'Productivity',
  'Others',
];

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

    const publicStatus = 'approved';
    if (args.category) {
      builder = ctx.db
        .query('apps')
        .withIndex('by_status', (q: any) => q.eq('status', publicStatus))
        .filter((q: any) => q.eq(q.field('category'), args.category));
    } else {
      builder = ctx.db.query('apps').withIndex('by_status', (q: any) => q.eq('status', publicStatus));
    }

    return await builder.order('desc').take(limit);
  },
});

export const getAppById = query({
  args: { appId: v.id('apps') },
  handler: async (ctx: any, args) => {
    const app = await ctx.db.get(args.appId);
    return app?.status === 'approved' ? app : null;
  },
});

export const approveApp = mutation({
  args: { appId: v.id('apps') },
  handler: async (ctx: any, args) => {
    const { viewer } = await requireRole(ctx, [ROLES.moderator, ROLES.superAdmin]);
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
    await requireRole(ctx, [ROLES.moderator, ROLES.superAdmin]);

    await ctx.db.patch(args.appId, {
      status: 'rejected',
    });

    return { appId: args.appId };
  },
});

// Public submission for MCP (no auth required)
export const submitAppPublic = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    categoryOther: v.optional(v.string()),
    description: v.string(),
    builtIn: v.string(),
    builtInOther: v.optional(v.string()),
  },
  handler: async (ctx: any, args) => {
    const nowTs = now();

    const appId = await ctx.db.insert('apps', {
      name: args.name,
      category: args.category,
      categoryOther: args.categoryOther,
      description: args.description,
      builtIn: args.builtIn,
      builtInOther: args.builtInOther,
      submittedAt: nowTs,
      status: 'pending',
    });

    return { appId };
  },
});

// List apps by tool (builtIn)
export const listAppsByTool = query({
  args: {
    builtIn: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx: any, args) => {
    await requireRole(ctx, [ROLES.moderator, ROLES.superAdmin]);
    const limit = args.limit ?? 100;
    const status = args.status ?? 'approved';
    let builder: any;

    if (args.builtIn) {
      builder = ctx.db
        .query('apps')
        .withIndex('by_builtIn', (q: any) => q.eq('builtIn', args.builtIn))
        .filter((q: any) => q.eq(q.field('status'), status));
    } else {
      builder = ctx.db
        .query('apps')
        .withIndex('by_status', (q: any) => q.eq('status', status));
    }

    return await builder.order('desc').take(limit);
  },
});

// Get app counts by tool for the main vibecoded-apps page
export const getAppCountsByTool = query({
  args: {},
  handler: async (ctx: any) => {
    const apps = await ctx.db
      .query('apps')
      .withIndex('by_status', (q: any) => q.eq('status', 'approved'))
      .collect();

    const counts: Record<string, number> = {};
    for (const app of apps) {
      const tool = app.builtIn;
      counts[tool] = (counts[tool] || 0) + 1;
    }

    return counts;
  },
});

// Get list of tools (for MCP)
export const getTools = query({
  args: {},
  handler: async () => {
    return BUILD_TOOLS;
  },
});

// Get list of categories (for MCP)
export const getCategories = query({
  args: {},
  handler: async () => {
    return CATEGORIES;
  },
});

// Admin: List all apps with submitter info (for admin console)
export const listAllAppsAdmin = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx: any, args) => {
    const limit = args.limit ?? 200;

    const apps = await ctx.db
      .query('apps')
      .order('desc')
      .take(limit);

    // Enrich with submitter info
    const enriched = await Promise.all(
      apps.map(async (app: any) => {
        const submitter = app.submittedBy ? await ctx.db.get(app.submittedBy) : null;
        return {
          ...app,
          submitterName: submitter?.displayName ?? submitter?.email ?? 'Anonymous',
          submitterEmail: submitter?.email ?? null,
        };
      })
    );

    return enriched;
  },
});

// Admin: Delete an app (super_admin only)
export const deleteApp = mutation({
  args: { appId: v.id('apps') },
  handler: async (ctx: any, args) => {
    await requireRole(ctx, [ROLES.superAdmin]);
    const app = await ctx.db.get(args.appId);
    if (!app) {
      throw new Error('App not found');
    }

    await ctx.db.delete(args.appId);

    return { deleted: true, appId: args.appId, appName: app.name };
  },
});

// Admin: Approve all pending apps (one-time migration)
export const approveAllPendingApps = mutation({
  args: {},
  handler: async (ctx: any) => {
    const { viewer } = await requireRole(ctx, [ROLES.superAdmin]);
    const timestamp = now();

    const pendingApps = await ctx.db
      .query('apps')
      .withIndex('by_status', (q: any) => q.eq('status', 'pending'))
      .collect();

    let approved = 0;
    for (const app of pendingApps) {
      await ctx.db.patch(app._id, {
        status: 'approved',
        approvedBy: viewer._id,
        approvedAt: timestamp,
      });
      approved++;
    }

    return { approved, total: pendingApps.length };
  },
});
