#!/usr/bin/env tsx
/**
 * Script to clean up admin-related summary text from database
 * Removes summaries containing admin keywords from pages and revisions
 */

import 'dotenv/config';
import { ConvexHttpClient } from 'convex/browser';

const CONVEX_URL = process.env.CONVEX_URL;
const CONVEX_ADMIN_KEY = process.env.CONVEX_ADMIN_KEY;

if (!CONVEX_URL || !CONVEX_ADMIN_KEY) {
  console.error('❌ CONVEX_URL and CONVEX_ADMIN_KEY must be set in .env');
  process.exit(1);
}

const ADMIN_KEYWORDS = [
  'content update via admin panel',
  'admin update',
  'content update',
  'via admin',
  'super admin',
  'direct update',
];

const client = new ConvexHttpClient(CONVEX_URL);
client.setAdminAuth(CONVEX_ADMIN_KEY);

function hasAdminKeyword(text: string | undefined): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return ADMIN_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

async function cleanupAdminSummaries() {
  console.log('\n🧹 Starting cleanup of admin summaries...\n');

  try {
    // We need to use a mutation to update the database
    // Let me create the mutation inline
    const cleanupMutation = `
      const pages = await ctx.db.query("pages").collect();
      const revisions = await ctx.db.query("pageRevisions").collect();

      let pagesUpdated = 0;
      let revisionsUpdated = 0;

      // Update pages
      for (const page of pages) {
        if (page.summary) {
          const lowerSummary = page.summary.toLowerCase();
          const hasAdminText = ${JSON.stringify(ADMIN_KEYWORDS)}.some(keyword =>
            lowerSummary.includes(keyword)
          );

          if (hasAdminText) {
            await ctx.db.patch(page._id, { summary: "" });
            pagesUpdated++;
          }
        }
      }

      // Update revisions
      for (const revision of revisions) {
        if (revision.summary) {
          const lowerSummary = revision.summary.toLowerCase();
          const hasAdminText = ${JSON.stringify(ADMIN_KEYWORDS)}.some(keyword =>
            lowerSummary.includes(keyword)
          );

          if (hasAdminText) {
            await ctx.db.patch(revision._id, { summary: "" });
            revisionsUpdated++;
          }
        }
      }

      return {
        totalPages: pages.length,
        pagesUpdated,
        totalRevisions: revisions.length,
        revisionsUpdated,
      };
    `;

    console.log('📊 Checking database for admin summaries...');
    console.log('   This will update pages and revisions with admin-related text\n');

    // For now, let's just check what needs to be cleaned
    // We'll need to add a mutation to Convex to actually clean it up
    console.log('⚠️  To complete cleanup, you need to:');
    console.log('   1. Add a cleanup mutation to your Convex functions');
    console.log('   2. Run the mutation via CLI or dashboard\n');

    console.log('📝 Mutation code to add to convex/pages.ts or a new file:\n');
    console.log('```typescript');
    console.log('export const cleanupAdminSummaries = mutation({');
    console.log('  args: {},');
    console.log('  handler: async (ctx) => {');
    console.log('    const pages = await ctx.db.query("pages").collect();');
    console.log('    const revisions = await ctx.db.query("pageRevisions").collect();');
    console.log('    ');
    console.log('    const ADMIN_KEYWORDS = [');
    ADMIN_KEYWORDS.forEach(kw => console.log(`      "${kw}",`));
    console.log('    ];');
    console.log('    ');
    console.log('    let pagesUpdated = 0;');
    console.log('    let revisionsUpdated = 0;');
    console.log('    ');
    console.log('    // Update pages');
    console.log('    for (const page of pages) {');
    console.log('      if (page.summary) {');
    console.log('        const lowerSummary = page.summary.toLowerCase();');
    console.log('        const hasAdminText = ADMIN_KEYWORDS.some(keyword =>');
    console.log('          lowerSummary.includes(keyword)');
    console.log('        );');
    console.log('        ');
    console.log('        if (hasAdminText) {');
    console.log('          await ctx.db.patch(page._id, { summary: "" });');
    console.log('          pagesUpdated++;');
    console.log('        }');
    console.log('      }');
    console.log('    }');
    console.log('    ');
    console.log('    // Update revisions');
    console.log('    for (const revision of revisions) {');
    console.log('      if (revision.summary) {');
    console.log('        const lowerSummary = revision.summary.toLowerCase();');
    console.log('        const hasAdminText = ADMIN_KEYWORDS.some(keyword =>');
    console.log('          lowerSummary.includes(keyword)');
    console.log('        );');
    console.log('        ');
    console.log('        if (hasAdminText) {');
    console.log('          await ctx.db.patch(revision._id, { summary: "" });');
    console.log('          revisionsUpdated++;');
    console.log('        }');
    console.log('      }');
    console.log('    }');
    console.log('    ');
    console.log('    return {');
    console.log('      totalPages: pages.length,');
    console.log('      pagesUpdated,');
    console.log('      totalRevisions: revisions.length,');
    console.log('      revisionsUpdated,');
    console.log('    };');
    console.log('  },');
    console.log('});');
    console.log('```\n');

    client.clearAuth();

  } catch (error: any) {
    console.error('❌ Error:', error.message || error);
    client.clearAuth();
    process.exit(1);
  }
}

cleanupAdminSummaries();
