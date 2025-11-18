import { query, mutation } from './kit';
import { v } from 'convex/values';
import { requireUser } from './auth';
import { now } from './utils';

export const subscribe = mutation({
  args: {},
  handler: async (ctx: any) => {
    const viewer = await requireUser(ctx);
    const userId = viewer._id;
    const email = viewer.email;
    const nowTs = now();

    // Check if already subscribed
    const existing = await ctx.db
      .query('newsletterSubscribers')
      .withIndex('by_userId', (q: any) => q.eq('userId', userId))
      .unique();

    if (existing) {
      if (existing.status === 'unsubscribed') {
        // Resubscribe
        await ctx.db.patch(existing._id, {
          status: 'active',
          subscribedAt: nowTs,
        });
        return { subscriptionId: existing._id, action: 'resubscribed' };
      }
      return { subscriptionId: existing._id, action: 'already_subscribed' };
    }

    // Create new subscription
    const subscriptionId = await ctx.db.insert('newsletterSubscribers', {
      userId,
      email,
      subscribedAt: nowTs,
      status: 'active',
    });

    return { subscriptionId, action: 'subscribed' };
  },
});

export const unsubscribe = mutation({
  args: {},
  handler: async (ctx: any) => {
    const viewer = await requireUser(ctx);
    const userId = viewer._id;
    const nowTs = now();

    const subscription = await ctx.db
      .query('newsletterSubscribers')
      .withIndex('by_userId', (q: any) => q.eq('userId', userId))
      .unique();

    if (!subscription) {
      throw new Error('No subscription found');
    }

    await ctx.db.patch(subscription._id, {
      status: 'unsubscribed',
      unsubscribedAt: nowTs,
    });

    return { subscriptionId: subscription._id };
  },
});

export const getSubscriptionStatus = query({
  args: {},
  handler: async (ctx: any) => {
    const viewer = await requireUser(ctx);
    const userId = viewer._id;

    const subscription = await ctx.db
      .query('newsletterSubscribers')
      .withIndex('by_userId', (q: any) => q.eq('userId', userId))
      .unique();

    if (!subscription) {
      return { subscribed: false };
    }

    return {
      subscribed: subscription.status === 'active',
      subscribedAt: subscription.subscribedAt,
    };
  },
});

export const listSubscribers = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx: any, args) => {
    const limit = args.limit ?? 1000;
    let builder: any;

    if (args.status) {
      builder = ctx.db
        .query('newsletterSubscribers')
        .withIndex('by_status', (q: any) => q.eq('status', args.status));
    } else {
      builder = ctx.db.query('newsletterSubscribers');
    }

    return await builder.order('desc').take(limit);
  },
});
