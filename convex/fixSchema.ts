import { mutation } from './kit';

export const fixMissingFields = mutation({
  args: {},
  handler: async (ctx: any) => {
    const pages = await ctx.db.query('pages').collect();

    let fixed = 0;
    const results = [];

    for (const page of pages) {
      const updates: any = {};

      // @ts-ignore - checking for missing fields
      if (!page.status) {
        const status = page.approvedRevisionId ? 'published' : 'pending';
        updates.status = status;
        results.push(`${page.slug}: added status='${status}'`);
      }

      // @ts-ignore - checking for missing updatedAt
      if (!page.updatedAt) {
        updates.updatedAt = page.createdAt;
        results.push(`${page.slug}: added updatedAt=${page.createdAt}`);
      }

      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(page._id, updates);
        fixed++;
      }
    }

    console.log(`Fixed ${fixed} pages out of ${pages.length} total`);
    results.forEach(r => console.log(r));

    return {
      total: pages.length,
      fixed,
      results,
      message: `Successfully fixed ${fixed} pages with missing fields`
    };
  },
});
