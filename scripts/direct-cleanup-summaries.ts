#!/usr/bin/env tsx
/**
 * Direct database cleanup using Convex admin API
 */

import 'dotenv/config';

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

async function makeConvexRequest(path: string, args: any) {
  const response = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Convex ${CONVEX_ADMIN_KEY}`,
    },
    body: JSON.stringify({
      path,
      args: [args],
      format: 'json',
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  const data = await response.json();
  if (data.status === 'error') {
    throw new Error(`Convex error: ${data.errorMessage}`);
  }

  return data.value;
}

async function cleanupDatabase() {
  console.log('\n🧹 Starting database cleanup...\n');
  console.log('⚠️  Your production Convex deployment uses a functions/ structure');
  console.log('   that is NOT in your local code. This means:');
  console.log('   1. Local Convex deploys are not reaching production');
  console.log('   2. Production code is from a different source\n');

  console.log('📋 To clean up the database, you need to:');
  console.log('\n1. Find where your production Convex code is located');
  console.log('   (It has a functions/ directory with functions/page, functions/revision, etc.)');
  console.log('\n2. Add this mutation to that codebase:\n');
  console.log('```typescript');
  console.log('// Add to any .ts file in your production Convex codebase');
  console.log('export const cleanupAdminSummaries = mutation({');
  console.log('  args: {},');
  console.log('  handler: async (ctx) => {');
  console.log('    const ADMIN_KEYWORDS = [');
  ADMIN_KEYWORDS.forEach(kw => console.log(`      "${kw}",`));
  console.log('    ];');
  console.log('');
  console.log('    const pages = await ctx.db.query("pages").collect();');
  console.log('    const revisions = await ctx.db.query("pageRevisions").collect();');
  console.log('');
  console.log('    let pagesUpdated = 0;');
  console.log('    let revisionsUpdated = 0;');
  console.log('');
  console.log('    for (const page of pages) {');
  console.log('      if (page.summary) {');
  console.log('        const hasAdminText = ADMIN_KEYWORDS.some(kw =>');
  console.log('          page.summary.toLowerCase().includes(kw)');
  console.log('        );');
  console.log('        if (hasAdminText) {');
  console.log('          await ctx.db.patch(page._id, { summary: "" });');
  console.log('          pagesUpdated++;');
  console.log('        }');
  console.log('      }');
  console.log('    }');
  console.log('');
  console.log('    for (const revision of revisions) {');
  console.log('      if (revision.summary) {');
  console.log('        const hasAdminText = ADMIN_KEYWORDS.some(kw =>');
  console.log('          revision.summary.toLowerCase().includes(kw)');
  console.log('        );');
  console.log('        if (hasAdminText) {');
  console.log('          await ctx.db.patch(revision._id, { summary: "" });');
  console.log('          revisionsUpdated++;');
  console.log('        }');
  console.log('      }');
  console.log('    }');
  console.log('');
  console.log('    return { pagesUpdated, revisionsUpdated };');
  console.log('  }');
  console.log('});');
  console.log('```');
  console.log('\n3. Deploy and run:');
  console.log('   npx convex deploy');
  console.log('   npx convex run <file>:cleanupAdminSummaries\n');
}

cleanupDatabase();
