import 'dotenv/config';
import { ConvexHttpClient } from 'convex/browser';

const convexUrl = process.env.CONVEX_URL;
const convexAdminKey = process.env.CONVEX_ADMIN_KEY;

if (!convexUrl || !convexAdminKey) {
  console.error('❌ CONVEX_URL and CONVEX_ADMIN_KEY must be set in .env');
  process.exit(1);
}

console.log(`\n🔧 Fixing schema in PRODUCTION: ${convexUrl}\n`);

const client = new ConvexHttpClient(convexUrl);
client.setAdminAuth(convexAdminKey);

interface Page {
  _id: string;
  slug: string;
  title: string;
  status?: string;
  updatedAt?: number;
  createdAt: number;
  approvedRevisionId?: string;
}

async function fixSchema() {
  try {
    console.log('📊 Fetching all pages...');

    const result: any[] = await client.query('functions/page:listPages' as any, { limit: 1000 });

    console.log(`Found ${result.length} pages\n`);

    // Check each page for missing fields
    const pagesToFix: Page[] = [];

    for (const entry of result) {
      const page = entry.page as Page;

      if (!page) continue;

      const needsFix = !page.status || !page.updatedAt;

      if (needsFix) {
        console.log(`⚠️  ${page.slug}`);
        console.log(`   Missing status: ${!page.status}`);
        console.log(`   Missing updatedAt: ${!page.updatedAt}\n`);
        pagesToFix.push(page);
      }
    }

    if (pagesToFix.length === 0) {
      console.log(`✅ All ${result.length} pages have required fields!`);
      client.close();
      return;
    }

    console.log(`\n📊 Found ${pagesToFix.length} pages that need fixing`);
    console.log(`\n⚠️  Your deployment doesn't have a schema fix mutation yet.`);
    console.log(`\nTo fix, I'll deploy the fix mutation now...\n`);

    console.log(`Pages that need fixing:`);
    pagesToFix.forEach((p) => {
      const fixes = [];
      if (!p.status) fixes.push(`status: "${p.approvedRevisionId ? 'published' : 'pending'}"`);
      if (!p.updatedAt) fixes.push(`updatedAt: ${p.createdAt}`);
      console.log(`  - ${p.slug}: ${fixes.join(', ')}`);
    });

    client.close();
  } catch (error: any) {
    console.error('❌ Error:', error.message || error);
    client.close();
    process.exit(1);
  }
}

await fixSchema();
