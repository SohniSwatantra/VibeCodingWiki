#!/usr/bin/env tsx
/**
 * Direct fix for schema validation issues
 * This script directly patches problematic documents in the database
 */

import 'dotenv/config';

console.log('\n🔧 Direct Schema Fix Script');
console.log('='.repeat(60));

console.log('\n⚠️  This script requires manual intervention in the Convex Dashboard.');
console.log('\nSince Convex schema validation prevents deployment, we need to');
console.log('fix the data manually via the Dashboard first.\n');

console.log('📋 INSTRUCTIONS:');
console.log('='.repeat(60));

console.log('\n1. Open your Convex Dashboard:');
console.log('   https://dashboard.convex.dev/d/clean-pika-695\n');

console.log('2. Go to the "Data" tab\n');

console.log('3. Click on the "pages" table\n');

console.log('4. Find and fix these pages:\n');

console.log('   Page 1: "openai" (ID: js70dkhtnma4hj7gva1qk7gj2h7v2kcd)');
console.log('   - Click the edit icon');
console.log('   - Add field: status = "pending"');
console.log('   - Add field: updatedAt = 1762648700786');
console.log('   - Save\n');

console.log('   Page 2: "vibecoding" (ID: js71gqfrsvj9jq2w46p9ersw757v3479)');
console.log('   - Click the edit icon');
console.log('   - Add field: status = "pending"');
console.log('   - Add field: updatedAt = 1762701078526');
console.log('   - Save\n');

console.log('5. Check if there are any other pages missing these fields:');
console.log('   - Look through all pages in the table');
console.log('   - Any page missing "status" should have it set to "pending"');
console.log('   - Any page missing "updatedAt" should have it set to their "createdAt" value\n');

console.log('6. After fixing all pages, run:');
console.log('   npx convex dev\n');

console.log('7. Then run the content update script:');
console.log('   npx tsx scripts/update-vibecoding-tools.ts\n');

console.log('='.repeat(60));
console.log('\n✅ Once you complete these steps, the schema validation will pass');
console.log('   and you can deploy the new content!\n');

// Alternative: Show SQL-like queries for Convex dashboard
console.log('\n💡 ALTERNATIVE: Run this in Dashboard Functions tab');
console.log('='.repeat(60));
console.log('\nCreate a temporary function with this code:\n');

console.log('```typescript');
console.log('import { mutation } from "./_generated/server";');
console.log('');
console.log('export const fixPages = mutation({');
console.log('  args: {},');
console.log('  handler: async (ctx) => {');
console.log('    const pages = await ctx.db.query("pages").collect();');
console.log('    let fixed = 0;');
console.log('    ');
console.log('    for (const page of pages) {');
console.log('      const updates: any = {};');
console.log('      ');
console.log('      if (!(page as any).status) {');
console.log('        updates.status = (page as any).approvedRevisionId ? "published" : "pending";');
console.log('      }');
console.log('      ');
console.log('      if (!(page as any).updatedAt) {');
console.log('        updates.updatedAt = page.createdAt;');
console.log('      }');
console.log('      ');
console.log('      if (Object.keys(updates).length > 0) {');
console.log('        await ctx.db.patch(page._id, updates);');
console.log('        fixed++;');
console.log('      }');
console.log('    }');
console.log('    ');
console.log('    return { total: pages.length, fixed };');
console.log('  }');
console.log('});');
console.log('```');
console.log('\nThen click "Run" to execute it.');
console.log('\n' + '='.repeat(60));
console.log('\nPress Ctrl+C when done to exit.');
console.log('\n');
