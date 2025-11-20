#!/usr/bin/env tsx
/**
 * Script to add tags to all VibeCoding wiki pages
 *
 * Usage:
 *   npx tsx scripts/add-page-tags.ts
 */

import 'dotenv/config';
import { ConvexHttpClient } from 'convex/browser';

// Load environment variables
const CONVEX_URL = process.env.CONVEX_URL;
const CONVEX_ADMIN_KEY = process.env.CONVEX_ADMIN_KEY;

if (!CONVEX_URL) {
  console.error('❌ Error: CONVEX_URL environment variable is not set');
  console.error('Please set CONVEX_URL in your .env file or environment');
  process.exit(1);
}

if (!CONVEX_ADMIN_KEY) {
  console.error('❌ Error: CONVEX_ADMIN_KEY environment variable is not set');
  console.error('Please set CONVEX_ADMIN_KEY in your .env file');
  process.exit(1);
}

// Create Convex client with admin auth
const client = new ConvexHttpClient(CONVEX_URL);
client.setAdminAuth(CONVEX_ADMIN_KEY);

// Define tags for each page based on content
const pageTags: Record<string, string[]> = {
  'origins-of-vibecoding': ['Andrej Karpathy', 'LLM', 'AI coding', 'history', 'Y Combinator', 'critics'],
  'timeline-of-vibecoding': ['history', 'events', 'milestones', 'media coverage', 'adoption'],
  'vibecoding-best-practices': ['security', 'development', 'TDD', 'spec-driven', 'methodology', 'prompting'],
  'vibecoding-companies': ['startups', 'platforms', 'IDE', 'infrastructure', 'funding', 'Lovable', 'Bolt', 'Cursor'],
  'vibecoding-culture': ['community', 'culture', 'social', 'movement'],
  'vibecoding-hackathons': ['competitions', 'events', 'prizes', 'Bolt', 'TanStack', 'participants'],
  'vibecoding-tools': ['software', 'platforms', 'IDE', 'AI coding', 'productivity', 'debugging'],
  'vibecoding-tutorials': ['learning', 'education', 'guides', 'training', 'getting started', 'prompting'],
};

// Main function to add tags to pages
async function addTagsToPages() {
  console.log('\n🏷️  Adding tags to VibeCoding wiki pages...\n');
  console.log('='.repeat(60));

  let successCount = 0;
  let errorCount = 0;

  for (const [slug, tags] of Object.entries(pageTags)) {
    try {
      console.log(`\n📄 Processing: ${slug}`);
      console.log(`   Tags to add: ${tags.join(', ')}`);

      // Get the page by slug
      const pageData: any = await client.query('pages:getPageBySlug' as any, {
        slug,
      });

      if (!pageData || !pageData.page) {
        console.error(`   ❌ Page not found: ${slug}`);
        errorCount++;
        continue;
      }

      const pageId = pageData.page._id;
      console.log(`   ✓ Found page (ID: ${pageId})`);

      // Get the current approved revision to preserve content
      const approvedRevision = pageData.approvedRevision;

      if (!approvedRevision) {
        console.error(`   ❌ No approved revision found for ${slug}`);
        errorCount++;
        continue;
      }

      // Update the page with tags by creating a new revision
      // Use adminUpdatePageContent mutation which creates an auto-approved revision
      const updateResult: any = await client.mutation('pages:adminUpdatePageContent' as any, {
        pageId,
        content: approvedRevision.content || '',
        summary: approvedRevision.summary || '',
        sections: approvedRevision.sections || [],
        tags: tags,
        timeline: approvedRevision.timeline || [],
        relatedTopics: approvedRevision.relatedTopics || [],
      });

      console.log(`   ✅ Tags added successfully (Revision ID: ${updateResult.revisionId})`);
      successCount++;

    } catch (error) {
      console.error(`   ❌ Error processing ${slug}:`, error);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log(`   ✅ Successfully updated: ${successCount} pages`);
  console.log(`   ❌ Failed: ${errorCount} pages`);
  console.log('='.repeat(60));

  if (successCount > 0) {
    console.log(`\n✨ Tags have been added to ${successCount} pages!`);
    console.log('   The revisions may need moderator approval.\n');
  }

  client.clearAuth();
  process.exit(errorCount > 0 ? 1 : 0);
}

// Run the script
addTagsToPages().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  client.clearAuth();
  process.exit(1);
});
