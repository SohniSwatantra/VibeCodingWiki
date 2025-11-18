#!/usr/bin/env tsx
/**
 * Auto-approve first revisions for migrated pages
 *
 * This script fixes pages that were created from fallback data but never had
 * their first revision approved, causing the edit form to show empty content.
 *
 * Usage:
 *   npm run approve:revisions
 *   or
 *   npx tsx scripts/approve-first-revisions.ts
 */

import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

// Load environment variables
const CONVEX_URL = process.env.CONVEX_URL;

if (!CONVEX_URL) {
  console.error('❌ Error: CONVEX_URL environment variable is not set');
  console.error('Please set CONVEX_URL in your .env file or environment');
  process.exit(1);
}

// Create Convex client
const client = new ConvexHttpClient(CONVEX_URL);

// Main function
async function approveFirstRevisions() {
  console.log(`\n🔄 Starting auto-approval of first revisions...\n`);

  try {
    // Get all pages
    const pages = await client.query(api.pages.listPages, { limit: 1000 });

    if (!pages || pages.length === 0) {
      console.log('No pages found.');
      return;
    }

    console.log(`Found ${pages.length} pages. Checking for unapproved first revisions...\n`);

    let approvedCount = 0;
    let skippedCount = 0;
    let failCount = 0;
    const failures: Array<{ pageId: string; title: string; error: string }> = [];

    for (let i = 0; i < pages.length; i++) {
      const entry = pages[i];
      const page = entry.page;
      const progress = `[${i + 1}/${pages.length}]`;

      try {
        console.log(`${progress} Processing: ${page.title} (${page._id})...`);

        // Check if page already has an approved revision
        if (page.approvedRevisionId) {
          console.log(`  ⏭️  Already has approved revision, skipping`);
          skippedCount++;
          continue;
        }

        // Auto-approve the first revision
        const result = await client.mutation(api.pages.autoApproveFirstRevision, {
          pageId: page._id,
        });

        if (result.alreadyApproved) {
          console.log(`  ⏭️  Already approved`);
          skippedCount++;
        } else {
          console.log(`  ✅ Approved revision ${result.revisionId}`);
          approvedCount++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`  ❌ Failed: ${errorMessage}`);
        failCount++;
        failures.push({ pageId: page._id, title: page.title, error: errorMessage });
      }
    }

    // Print summary
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 Auto-Approval Summary:`);
    console.log(`${'='.repeat(60)}`);
    console.log(`✅ Approved: ${approvedCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📄 Total: ${pages.length}`);

    if (failures.length > 0) {
      console.log(`\n❌ Failed pages:`);
      failures.forEach(({ title, error }) => {
        console.log(`  - ${title}: ${error}`);
      });
      process.exit(1);
    } else {
      console.log(`\n🎉 All first revisions processed successfully!`);
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
approveFirstRevisions().catch((error) => {
  console.error('\n❌ Fatal error during auto-approval:', error);
  process.exit(1);
});
