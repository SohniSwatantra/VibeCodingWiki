import { mutation } from './kit';
import { now } from './utils';

function extractWikiLinks(markdown: string): string[] {
  const pattern = /\[\[([^\]]+)\]\]/g;
  const matches: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(markdown)) !== null) {
    const slug = match[1].trim().toLowerCase();
    if (slug && !matches.includes(slug)) {
      matches.push(slug);
    }
  }
  return matches;
}

export const pollIngestionJobs = mutation({
  args: {},
  handler: async (ctx: any) => {
    const limit = 5;
    const nowTs = now();

    const queuedJobs = await ctx.db
      .query('ingestionJobs')
      .withIndex('by_status', (q: any) => q.eq('status', 'queued'))
      .take(limit);

    for (const job of queuedJobs) {
      await ctx.db.patch(job._id, {
        status: 'running',
        startedAt: nowTs,
      });
    }

    const runningJobs = await ctx.db
      .query('ingestionJobs')
      .withIndex('by_status', (q: any) => q.eq('status', 'running'))
      .take(limit);

    const timeoutMs = 1000 * 60 * 15; // 15 minutes
    for (const job of runningJobs) {
      if (!job.startedAt || nowTs - job.startedAt < timeoutMs) continue;

      await ctx.db.patch(job._id, {
        status: 'failed',
        error: 'Job timed out while running. Please retry.',
        completedAt: nowTs,
      });
    }

    return { queued: queuedJobs.length, timedOut: runningJobs.length };
  },
});

export const rebuildLinkGraph = mutation({
  args: {},
  handler: async (ctx: any) => {
    const publishedPages = await ctx.db
      .query('pages')
      .withIndex('by_status', (q: any) => q.eq('status', 'published'))
      .collect();

    let created = 0;
    let cleared = 0;

    for (const page of publishedPages) {
      if (!page.approvedRevisionId) continue;
      const revision = await ctx.db.get(page.approvedRevisionId);
      if (!revision?.content) continue;

      const existingLinks = await ctx.db
        .query('pageLinks')
        .withIndex('by_from', (q: any) => q.eq('fromPageId', page._id))
        .collect();

      for (const link of existingLinks) {
        await ctx.db.delete(link._id);
        cleared += 1;
      }

      const linkSlugs = extractWikiLinks(revision.content);
      for (const slug of linkSlugs) {
        const target = await ctx.db
          .query('pages')
          .withIndex('by_slug', (q: any) => q.eq('slug', slug))
          .unique();

        if (!target || target._id === page._id) continue;

        await ctx.db.insert('pageLinks', {
          fromPageId: page._id,
          toPageId: target._id,
          context: slug,
          extractedAt: now(),
        });
        created += 1;
      }
    }

    return { created, cleared };
  },
});

export const refreshPopularityScores = mutation({
  args: {},
  handler: async (ctx: any) => {
    const pages = await ctx.db.query('pages').collect();
    let updated = 0;

    for (const page of pages) {
      const watcherCount = (
        await ctx.db
          .query('watchlists')
          .withIndex('by_pageId', (q: any) => q.eq('pageId', page._id))
          .collect()
      ).length;

      const revisionCount = (
        await ctx.db
          .query('pageRevisions')
          .withIndex('by_pageId', (q: any) => q.eq('pageId', page._id))
          .collect()
      ).length;

      const threads = await ctx.db
        .query('talkThreads')
        .withIndex('by_pageId', (q: any) => q.eq('pageId', page._id))
        .collect();

      let talkMessages = 0;
      for (const thread of threads) {
        talkMessages += (
          await ctx.db
            .query('talkMessages')
            .withIndex('by_threadId', (q: any) => q.eq('threadId', thread._id))
            .collect()
        ).length;
      }

      const baseScore = watcherCount * 5 + revisionCount * 2 + talkMessages;
      const popularityScore = Math.round(baseScore);

      if (page.popularityScore !== popularityScore) {
        await ctx.db.patch(page._id, {
          popularityScore,
          updatedAt: now(),
        });
        updated += 1;
      }
    }

    return { updated };
  },
});


