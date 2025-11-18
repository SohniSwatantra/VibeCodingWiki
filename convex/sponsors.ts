import { query, mutation } from './kit';
import { v } from 'convex/values';
import { requireUser } from './auth';
import { now } from './utils';

export const addSponsor = mutation({
  args: {
    name: v.string(),
    thankyouNote: v.string(),
    logoUrl: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    displayOrder: v.number(),
  },
  handler: async (ctx: any, args) => {
    const viewer = await requireUser(ctx);
    const nowTs = now();

    const sponsorId = await ctx.db.insert('sponsors', {
      name: args.name,
      thankyouNote: args.thankyouNote,
      logoUrl: args.logoUrl,
      websiteUrl: args.websiteUrl,
      displayOrder: args.displayOrder,
      createdAt: nowTs,
      createdBy: viewer._id,
    });

    return { sponsorId };
  },
});

export const listSponsors = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx: any, args) => {
    const limit = args.limit ?? 100;

    return await ctx.db
      .query('sponsors')
      .withIndex('by_displayOrder')
      .order('asc')
      .take(limit);
  },
});

export const getSponsorById = query({
  args: { sponsorId: v.id('sponsors') },
  handler: async (ctx: any, args) => {
    return await ctx.db.get(args.sponsorId);
  },
});

export const updateSponsor = mutation({
  args: {
    sponsorId: v.id('sponsors'),
    name: v.optional(v.string()),
    thankyouNote: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    displayOrder: v.optional(v.number()),
  },
  handler: async (ctx: any, args) => {
    await requireUser(ctx);

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.thankyouNote !== undefined) updates.thankyouNote = args.thankyouNote;
    if (args.logoUrl !== undefined) updates.logoUrl = args.logoUrl;
    if (args.websiteUrl !== undefined) updates.websiteUrl = args.websiteUrl;
    if (args.displayOrder !== undefined) updates.displayOrder = args.displayOrder;

    await ctx.db.patch(args.sponsorId, updates);

    return { sponsorId: args.sponsorId };
  },
});

export const deleteSponsor = mutation({
  args: { sponsorId: v.id('sponsors') },
  handler: async (ctx: any, args) => {
    await requireUser(ctx);
    await ctx.db.delete(args.sponsorId);
    return { sponsorId: args.sponsorId };
  },
});
