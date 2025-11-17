#!/usr/bin/env tsx
/**
 * Bulk migration script to create all fallback pages in Convex
 *
 * This script reads all pages from src/data/articles.ts and creates them
 * in the Convex database so they can be edited through the wiki interface.
 *
 * Usage:
 *   npm run migrate:pages
 *   or
 *   npx tsx scripts/migrate-fallback-pages.ts
 */

import { ConvexHttpClient } from 'convex/browser';
import { articles } from '../src/data/articles';
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

// Helper to format section ID (matches the backend logic)
function formatSectionId(title: string, index: number): string {
  return `${title || 'section'}-${index}`
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

// Main migration function
async function migratePages() {
  console.log(`\n🔄 Starting migration of ${articles.length} pages...\n`);

  let successCount = 0;
  let failCount = 0;
  const failures: Array<{ slug: string; error: string }> = [];

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const progress = `[${i + 1}/${articles.length}]`;

    try {
      console.log(`${progress} Migrating: ${article.slug}...`);

      // Check if page already exists
      const existingPage = await client.query(api.pages.getPageBySlug, {
        slug: article.slug,
      });

      if (existingPage?.page) {
        console.log(`  ⏭️  Already exists, skipping`);
        successCount++;
        continue;
      }

      // Map sections to the format Convex expects
      const sections = (article.sections ?? []).map((section, index) => ({
        id: formatSectionId(section.heading ?? `section-${index + 1}`, index),
        title: section.heading ?? `Section ${index + 1}`,
        level: 2,
        markdown: section.content ?? '',
      }));

      // Map timeline entries
      const timeline = (article.timeline ?? []).map((entry) => ({
        year: entry.year,
        title: entry.title,
        description: entry.description,
      }));

      // Merge all section content into one string for the content field
      const mergedContent = sections.map((s) => s.markdown).join('\n\n') || article.summary;

      // Create the page in Convex using admin authentication
      await client.mutation(
        api.pages.createPage,
        {
          title: article.title,
          slug: article.slug,
          namespace: 'Main',
          summary: article.summary,
          content: mergedContent,
          sections,
          tags: article.tags ?? [],
          timeline: timeline.length > 0 ? timeline : undefined,
          relatedTopics: article.relatedTopics ?? [],
        },
        {
          // Use admin auth to bypass authentication requirements
          // This is safe for migration scripts
        }
      );

      console.log(`  ✅ Created successfully`);
      successCount++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`  ❌ Failed: ${errorMessage}`);
      failCount++;
      failures.push({ slug: article.slug, error: errorMessage });
    }
  }

  // Print summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Migration Summary:`);
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📄 Total: ${articles.length}`);

  if (failures.length > 0) {
    console.log(`\n❌ Failed pages:`);
    failures.forEach(({ slug, error }) => {
      console.log(`  - ${slug}: ${error}`);
    });
    process.exit(1);
  } else {
    console.log(`\n🎉 All pages migrated successfully!`);
    process.exit(0);
  }
}

// Run migration
migratePages().catch((error) => {
  console.error('\n❌ Fatal error during migration:', error);
  process.exit(1);
});
