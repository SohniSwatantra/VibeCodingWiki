import { mutation } from './kit';
import { v } from 'convex/values';
import { now } from './utils';

export const recordFirecrawlImages = mutation({
  args: {
    slug: v.string(),
    sourceUrl: v.string(),
    images: v.array(
      v.object({
        url: v.string(),
        alt: v.optional(v.string()),
        title: v.optional(v.string()),
      }),
    ),
  },
  handler: async (
    ctx: any,
    args: { slug: string; sourceUrl: string; images: Array<{ url: string; alt?: string; title?: string }> },
  ) => {
    const page = await ctx.db
      .query('pages')
      .withIndex('by_slug', (q: any) => q.eq('slug', args.slug))
      .unique();

    const timestamp = now();

    const jobId = await ctx.db.insert('ingestionJobs', {
      provider: 'firecrawl',
      status: 'succeeded',
      sourceUrl: args.sourceUrl,
      payload: {
        images: args.images,
      },
      createdAt: timestamp,
      startedAt: timestamp,
      completedAt: timestamp,
      pageId: page?._id ?? undefined,
      requestedBy: page?.createdBy ?? undefined,
    });

    return { jobId };
  },
});

