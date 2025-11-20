import 'dotenv/config';
import { ConvexHttpClient } from 'convex/browser';

const convexUrl = process.env.CONVEX_URL;
const convexAdminKey = process.env.CONVEX_ADMIN_KEY;

if (!convexUrl || !convexAdminKey) {
  console.error('❌ Missing CONVEX_URL or CONVEX_ADMIN_KEY in .env');
  process.exit(1);
}

console.log(`🔧 Connecting to: ${convexUrl}\n`);

const client = new ConvexHttpClient(convexUrl);
client.setAdminAuth(convexAdminKey);

async function fixDatabase() {
  try {
    // Get all pages using existing function
    console.log('📊 Fetching pages...');
    const result: any[] = await client.query('functions/page:listPages' as any, { limit: 1000 });

    console.log(`Found ${result.length} pages\n`);

    const pagesToFix = [];

    for (const entry of result) {
      const page = entry.page;
      if (!page) continue;

      const needsFix = !page.status || !page.updatedAt;
      if (needsFix) {
        pagesToFix.push({
          _id: page._id,
          slug: page.slug,
          status: page.status,
          updatedAt: page.updatedAt,
          createdAt: page.createdAt,
          approvedRevisionId: page.approvedRevisionId
        });
      }
    }

    if (pagesToFix.length === 0) {
      console.log('✅ All pages already have required fields!');
      client.clearAuth();
      return;
    }

    console.log(`⚠️  Found ${pagesToFix.length} pages missing fields:\n`);

    for (const page of pagesToFix) {
      const fixes = [];
      if (!page.status) fixes.push(`status (will be: ${page.approvedRevisionId ? 'published' : 'pending'})`);
      if (!page.updatedAt) fixes.push(`updatedAt (will be: ${page.createdAt})`);
      console.log(`  - ${page.slug}: missing ${fixes.join(', ')}`);
    }

    console.log(`\n❌ Cannot auto-fix via client - Convex requires mutations to modify data`);
    console.log(`\n📋 Solution: Add this mutation to your deployed Convex code:\n`);

    console.log(`// Add to any .ts file in your deployed convex directory`);
    console.log(`export const fixSchema = mutation({`);
    console.log(`  args: {},`);
    console.log(`  handler: async (ctx) => {`);
    console.log(`    const updates = [`);

    for (const page of pagesToFix) {
      const patches = [];
      if (!page.status) {
        const status = page.approvedRevisionId ? 'published' : 'pending';
        patches.push(`status: "${status}"`);
      }
      if (!page.updatedAt) {
        patches.push(`updatedAt: ${page.createdAt}`);
      }
      console.log(`      { _id: "${page._id}", ${patches.join(', ')} },`);
    }

    console.log(`    ];`);
    console.log(`    for (const update of updates) {`);
    console.log(`      await ctx.db.patch(update._id, update);`);
    console.log(`    }`);
    console.log(`    return { fixed: updates.length };`);
    console.log(`  }`);
    console.log(`});`);

    client.clearAuth();

  } catch (error: any) {
    console.error('❌ Error:', error.message || error);
    client.clearAuth();
    process.exit(1);
  }
}

await fixDatabase();
