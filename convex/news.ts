import { mutation, query } from './kit';
import { v } from 'convex/values';

const sourceValidator = v.object({
  name: v.string(),
  url: v.string(),
  kind: v.union(
    v.literal('primary'),
    v.literal('platform'),
    v.literal('creator'),
    v.literal('reporting'),
  ),
});

const newsItemValidator = v.object({
  id: v.string(),
  title: v.string(),
  summary: v.string(),
  category: v.union(
    v.literal('Tools'),
    v.literal('Funding'),
    v.literal('Acquisitions'),
    v.literal('Product Hunt'),
    v.literal('Community'),
    v.literal('Security'),
  ),
  publishedAt: v.string(),
  verifiedAt: v.string(),
  sources: v.array(sourceValidator),
  tags: v.array(v.string()),
});

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const markupPattern = /<[a-z!/][^>]*>|!?\[[^\]]+\]\([^)]+\)/i;

function normalizeUrl(value: string) {
  const url = new URL(value);
  url.hash = '';
  url.search = '';
  return url.toString().replace(/\/$/, '');
}

function validateItem(item: any) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id)) throw new Error(`${item.id}: invalid story id`);
  if (item.title.trim().length < 12) throw new Error(`${item.id}: title is too short`);
  if (item.summary.trim().length < 50) throw new Error(`${item.id}: summary is too short`);
  if (markupPattern.test(`${item.title} ${item.summary}`)) {
    throw new Error(`${item.id}: title and summary must be plain text; put links in sources`);
  }
  if (!datePattern.test(item.publishedAt) || !datePattern.test(item.verifiedAt)) {
    throw new Error(`${item.id}: invalid date format`);
  }
  if (item.publishedAt > item.verifiedAt) throw new Error(`${item.id}: publication date follows verification date`);
  if (item.sources.length === 0 || item.sources.length > 4) throw new Error(`${item.id}: invalid source count`);
  if (item.tags.length === 0 || item.tags.length > 6) throw new Error(`${item.id}: invalid tag count`);

  for (const source of item.sources) {
    if (!source.name.trim() || markupPattern.test(source.name)) throw new Error(`${item.id}: source name must be plain text`);
    const url = new URL(source.url);
    if (url.protocol !== 'https:') throw new Error(`${item.id}: source must use HTTPS`);
  }
  if (item.tags.some((tag: string) => !tag.trim() || markupPattern.test(tag))) {
    throw new Error(`${item.id}: tags must be non-empty plain text`);
  }
}

export const listNews = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx: any, args) => {
    const limit = Math.min(Math.max(args.limit ?? 100, 1), 200);
    const records = await ctx.db.query('news').withIndex('by_publishedAt').order('desc').take(limit);

    return records.map(({ _id, _creationTime, storyId, origin, createdAt, updatedAt, ...record }: any) => ({
      id: storyId,
      ...record,
    }));
  },
});

export const upsertAutomatedNews = mutation({
  args: {
    automationSecret: v.string(),
    origin: v.optional(v.union(v.literal('seed'), v.literal('automation'))),
    items: v.array(newsItemValidator),
  },
  handler: async (ctx: any, args) => {
    const expectedSecret = process.env.NEWS_AUTOMATION_SECRET;
    if (!expectedSecret || args.automationSecret !== expectedSecret) throw new Error('Unauthorized news update');
    if (args.items.length > 10) throw new Error('A single news update cannot contain more than 10 stories');

    const existingRecords = await ctx.db.query('news').collect();
    const sourceOwners = new Map<string, string>();
    for (const record of existingRecords) {
      for (const source of record.sources) sourceOwners.set(normalizeUrl(source.url), record.storyId);
    }

    let inserted = 0;
    let updated = 0;
    const now = Date.now();
    for (const item of args.items) {
      validateItem(item);
      for (const source of item.sources) {
        const owner = sourceOwners.get(normalizeUrl(source.url));
        if (owner && owner !== item.id) throw new Error(`${item.id}: source URL already belongs to ${owner}`);
      }

      const existing = await ctx.db.query('news').withIndex('by_storyId', (q: any) => q.eq('storyId', item.id)).unique();
      const record = {
        storyId: item.id,
        title: item.title.trim(),
        summary: item.summary.trim(),
        category: item.category,
        publishedAt: item.publishedAt,
        verifiedAt: item.verifiedAt,
        sources: item.sources.map((source: any) => ({ ...source, name: source.name.trim(), url: source.url.trim() })),
        tags: [...new Set(item.tags.map((tag: string) => tag.trim()).filter(Boolean))],
        origin: args.origin ?? 'automation',
        updatedAt: now,
      };

      if (existing) {
        await ctx.db.patch(existing._id, record);
        updated += 1;
      } else {
        await ctx.db.insert('news', { ...record, createdAt: now });
        inserted += 1;
      }

      for (const source of item.sources) sourceOwners.set(normalizeUrl(source.url), item.id);
    }

    return { inserted, updated, total: args.items.length };
  },
});
