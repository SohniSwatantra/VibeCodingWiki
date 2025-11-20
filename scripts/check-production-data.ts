import 'dotenv/config';
import { ConvexHttpClient } from 'convex/browser';

const convexUrl = process.env.CONVEX_URL;
const convexAdminKey = process.env.CONVEX_ADMIN_KEY;

if (!convexUrl || !convexAdminKey) {
  console.error('❌ CONVEX_URL and CONVEX_ADMIN_KEY must be set');
  process.exit(1);
}

console.log(`\n🔍 Checking PRODUCTION Convex Database`);
console.log(`📍 Deployment: ${convexUrl}\n`);

const client = new ConvexHttpClient(convexUrl);
(client as any).setAdminAuth?.(convexAdminKey);

async function checkPage(slug: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📄 Checking: ${slug}`);
  console.log('='.repeat(60));

  try {
    const entry = await (client as any).query('pages:getPageBySlug', { slug });

    if (!entry?.page) {
      console.log(`❌ Page NOT FOUND in production database`);
      console.log(`   This page is using FALLBACK static data`);
      return false;
    }

    console.log(`✅ Page EXISTS in production database`);
    console.log(`   Title: ${entry.page.title}`);
    console.log(`   Status: ${entry.page.status}`);
    console.log(`   Approved Revision ID: ${entry.page.approvedRevisionId || 'NONE'}`);

    if (entry.approvedRevision) {
      console.log(`\n✅ Approved Revision EXISTS:`);
      console.log(`   Revision ID: ${entry.approvedRevision._id}`);
      console.log(`   Status: ${entry.approvedRevision.status}`);
      console.log(`   Sections: ${entry.approvedRevision.sections?.length || 0} sections`);
      console.log(`   Timeline: ${entry.approvedRevision.timeline?.length || 0} entries`);
      console.log(`   Content length: ${entry.approvedRevision.content?.length || 0} characters`);

      if (entry.approvedRevision.sections && entry.approvedRevision.sections.length > 0) {
        console.log(`\n📝 First Section Preview:`);
        console.log(`   Title: ${entry.approvedRevision.sections[0].title}`);
        console.log(`   Markdown length: ${entry.approvedRevision.sections[0].markdown?.length || 0} characters`);
        if (entry.approvedRevision.sections[0].markdown) {
          console.log(`   First 100 chars: ${entry.approvedRevision.sections[0].markdown.substring(0, 100)}...`);
        }
      }

      return true;
    } else {
      console.log(`\n❌ NO Approved Revision found`);
      console.log(`   Edit form will be EMPTY - no content to prefill`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error checking page:`, error);
    return false;
  }
}

async function checkAllPages() {
  const slugs = [
    'origins-of-vibecoding',
    'timeline-of-vibecoding',
    'vibecoding-best-practices',
    'vibecoding-culture',
    'vibecoding-tools',
  ];

  let hasData = 0;
  let noData = 0;

  for (const slug of slugs) {
    const exists = await checkPage(slug);
    if (exists) hasData++;
    else noData++;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 SUMMARY`);
  console.log('='.repeat(60));
  console.log(`✅ Pages with data in production: ${hasData}`);
  console.log(`❌ Pages missing data (using fallback): ${noData}`);

  if (noData > 0) {
    console.log(`\n⚠️  ACTION REQUIRED:`);
    console.log(`   Run: npm run seed:convex`);
    console.log(`   This will populate the production database`);
  } else {
    console.log(`\n✅ All pages are in production database!`);
    console.log(`   If edit form is still empty, check the API endpoint`);
  }

  client.clearAuth();
}

await checkAllPages();
