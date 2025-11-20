import { mutation } from './kit';

const ADMIN_KEYWORDS = [
  'content update via admin panel',
  'admin update',
  'content update',
  'via admin',
  'super admin',
  'direct update',
];

export const cleanupAdminSummaries = mutation({
  args: {},
  handler: async (ctx: any) => {
    const pages = await ctx.db.query('pages').collect();
    const revisions = await ctx.db.query('pageRevisions').collect();

    let pagesUpdated = 0;
    let revisionsUpdated = 0;
    const updatedPages: string[] = [];
    const updatedRevisions: string[] = [];

    // Update pages
    for (const page of pages) {
      if (page.summary) {
        const lowerSummary = page.summary.toLowerCase();
        const hasAdminText = ADMIN_KEYWORDS.some(keyword =>
          lowerSummary.includes(keyword)
        );

        if (hasAdminText) {
          await ctx.db.patch(page._id, { summary: '' });
          updatedPages.push(`${page.slug} (was: "${page.summary}")`);
          pagesUpdated++;
        }
      }
    }

    // Update revisions
    for (const revision of revisions) {
      if (revision.summary) {
        const lowerSummary = revision.summary.toLowerCase();
        const hasAdminText = ADMIN_KEYWORDS.some(keyword =>
          lowerSummary.includes(keyword)
        );

        if (hasAdminText) {
          await ctx.db.patch(revision._id, { summary: '' });
          updatedRevisions.push(`Revision ${revision.revisionNumber} (was: "${revision.summary}")`);
          revisionsUpdated++;
        }
      }
    }

    return {
      totalPages: pages.length,
      pagesUpdated,
      updatedPages,
      totalRevisions: revisions.length,
      revisionsUpdated,
      updatedRevisions: updatedRevisions.slice(0, 10), // Limit output
      message: `Cleaned up ${pagesUpdated} pages and ${revisionsUpdated} revisions`,
    };
  },
});
