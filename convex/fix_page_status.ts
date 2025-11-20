/**
 * One-time fix script to restore pages that were incorrectly set to 'pending' status
 * when proposals were submitted.
 *
 * Run this from Convex dashboard or using: npx convex run fix-page-status:restorePendingPages
 */

import { mutation } from './_generated/server';

export const restorePendingPages = mutation({
  args: {},
  handler: async (ctx) => {
    // Find all pages with status 'pending'
    const pendingPages = await ctx.db
      .query('pages')
      .withIndex('by_status', (q: any) => q.eq('status', 'pending'))
      .collect();

    console.log(`Found ${pendingPages.length} pages with status 'pending'`);

    let fixed = 0;
    for (const page of pendingPages) {
      // Check if there's an approved revision - if yes, restore to published
      if (page.approvedRevisionId) {
        await ctx.db.patch(page._id, { status: 'published' });
        console.log(`Restored page: ${page.slug} (${page.title}) to 'published'`);
        fixed++;
      } else {
        console.log(`Skipped page: ${page.slug} (no approved revision)`);
      }
    }

    console.log(`Fixed ${fixed} pages`);

    return {
      total: pendingPages.length,
      fixed,
      skipped: pendingPages.length - fixed,
    };
  },
});

export const restoreSpecificPage = mutation({
  args: {},
  handler: async (ctx) => {
    // Restore vibecoding-tools specifically
    const page = await ctx.db
      .query('pages')
      .filter((q: any) => q.eq(q.field('slug'), 'vibecoding-tools'))
      .first();

    if (!page) {
      return { success: false, message: 'Page not found' };
    }

    await ctx.db.patch(page._id, { status: 'published' });

    return {
      success: true,
      message: `Restored ${page.title} to published status`,
      pageId: page._id,
      slug: page.slug,
    };
  },
});

export const addMissingStatusField = mutation({
  args: {},
  handler: async (ctx) => {
    // Find all pages that might be missing the status field or updatedAt field
    const allPages = await ctx.db.query('pages').collect();

    let fixed = 0;
    for (const page of allPages) {
      const updates: any = {};
      
      // @ts-ignore - checking for missing status field
      if (!page.status) {
        // Determine the appropriate status based on whether they have an approved revision
        updates.status = page.approvedRevisionId ? 'published' : 'pending';
      }

      // @ts-ignore - checking for missing updatedAt field
      if (!page.updatedAt) {
        updates.updatedAt = page.createdAt || Date.now();
      }

      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(page._id, updates);
        console.log(`Patched page: ${page.slug} (${page.title}) with`, updates);
        fixed++;
      }
    }

    console.log(`Fixed ${fixed} pages with missing fields`);

    return {
      total: allPages.length,
      fixed,
    };
  },
});
