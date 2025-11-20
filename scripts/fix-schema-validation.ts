#!/usr/bin/env tsx
/**
 * Script to fix schema validation issues in the Convex database
 * This will add missing required fields and remove deprecated fields
 *
 * Usage:
 *   npx tsx scripts/fix-schema-validation.ts
 */

import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

// Load environment variables
const CONVEX_URL = process.env.CONVEX_URL;

if (!CONVEX_URL) {
  console.error('❌ Error: CONVEX_URL environment variable is not set');
  console.error('Please set CONVEX_URL in your .env.local file');
  process.exit(1);
}

// Create Convex client
const client = new ConvexHttpClient(CONVEX_URL);

async function fixSchemaValidation() {
  console.log('\n🔧 Fixing schema validation issues...\n');

  try {
    // Run the fix mutation
    console.log('1. Running schema validation fixes...');
    const result = await client.mutation(api.fix_page_status.addMissingStatusField);

    console.log(`  ✅ Fixed ${result.fixed} pages out of ${result.total} total pages`);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Schema validation issues fixed!');
    console.log('='.repeat(60));
    console.log('\nYou can now deploy Convex functions:');
    console.log('  npx convex dev\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error fixing schema:', error);
    console.error('\nThis might be because:');
    console.error('1. Convex functions are not deployed yet (schema validation blocking)');
    console.error('2. The mutation does not exist in the current deployment');
    console.error('\nTrying alternative approach...\n');

    // Since we can't deploy due to schema issues, we need to manually fix via dashboard
    console.log('📋 MANUAL FIX REQUIRED:');
    console.log('='.repeat(60));
    console.log('\nGo to your Convex Dashboard:');
    console.log('  https://dashboard.convex.dev/d/clean-pika-695');
    console.log('\nRun this command in the Dashboard\'s "Data" tab:');
    console.log('\n// Fix missing status and updatedAt fields');
    console.log('const pages = await ctx.db.query("pages").collect();');
    console.log('for (const page of pages) {');
    console.log('  const updates = {};');
    console.log('  if (!page.status) {');
    console.log('    updates.status = page.approvedRevisionId ? "published" : "pending";');
    console.log('  }');
    console.log('  if (!page.updatedAt) {');
    console.log('    updates.updatedAt = page.createdAt;');
    console.log('  }');
    console.log('  if (Object.keys(updates).length > 0) {');
    console.log('    await ctx.db.patch(page._id, updates);');
    console.log('  }');
    console.log('}');
    console.log('\n' + '='.repeat(60));

    process.exit(1);
  }
}

// Run the fix
fixSchemaValidation().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
