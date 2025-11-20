import 'dotenv/config';
import { ConvexHttpClient } from 'convex/browser';

const convexUrl = process.env.CONVEX_URL;
const convexAdminKey = process.env.CONVEX_ADMIN_KEY;

if (!convexUrl || !convexAdminKey) {
  console.error('CONVEX_URL and CONVEX_ADMIN_KEY must be set');
  process.exit(1);
}

const client = new ConvexHttpClient(convexUrl);
(client as any).setAdminAuth?.(convexAdminKey);

async function checkPage(slug: string) {
  console.log(`\n========== Checking ${slug} ==========`);

  const entry = await (client as any).query('pages:getPageBySlug', { slug });

  if (!entry?.page) {
    console.log(`❌ Page not found in database`);
    return;
  }

  console.log(`✅ Page found:`, entry.page.title);
  console.log(`   Status:`, entry.page.status);
  console.log(`   Approved Revision ID:`, entry.page.approvedRevisionId);

  if (entry.approvedRevision) {
    console.log(`✅ Approved revision found:`);
    console.log(`   Revision ID:`, entry.approvedRevision._id);
    console.log(`   Status:`, entry.approvedRevision.status);
    console.log(`   Sections count:`, entry.approvedRevision.sections?.length || 0);
    console.log(`   Timeline count:`, entry.approvedRevision.timeline?.length || 0);
    console.log(`   Content length:`, entry.approvedRevision.content?.length || 0);

    if (entry.approvedRevision.sections && entry.approvedRevision.sections.length > 0) {
      console.log(`   First section:`, entry.approvedRevision.sections[0].title);
      console.log(`   First section markdown length:`, entry.approvedRevision.sections[0].markdown?.length || 0);
    }
  } else {
    console.log(`❌ No approved revision found`);
  }
}

async function main() {
  const slugs = [
    'origins-of-vibecoding',
    'timeline-of-vibecoding',
    'vibecoding-best-practices'
  ];

  for (const slug of slugs) {
    await checkPage(slug);
  }

  client.clearAuth();
}

await main();
