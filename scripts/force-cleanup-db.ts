#!/usr/bin/env tsx
/**
 * Force cleanup admin summaries by directly patching database via admin API
 */

import 'dotenv/config';

const CONVEX_URL = process.env.CONVEX_URL;
const CONVEX_ADMIN_KEY = process.env.CONVEX_ADMIN_KEY;

if (!CONVEX_URL || !CONVEX_ADMIN_KEY) {
  console.error('❌ CONVEX_URL and CONVEX_ADMIN_KEY must be set in .env');
  process.exit(1);
}

const ADMIN_KEYWORDS = [
  'direct update via super admin editor',
  'content update via admin panel',
  'admin update',
  'content update',
  'via admin',
  'super admin',
  'direct update',
];

function hasAdminKeyword(text: string | undefined): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return ADMIN_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

async function makeRequest(endpoint: string, body: any) {
  const response = await fetch(`${CONVEX_URL}/api/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Convex ${CONVEX_ADMIN_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  const data = await response.json();
  if (data.status === 'error') {
    throw new Error(`Convex error: ${data.errorMessage || JSON.stringify(data)}`);
  }

  return data.value;
}

async function cleanupDatabase() {
  console.log('\n🧹 Starting direct database cleanup...\n');

  try {
    // Query all pages using the listPages function
    console.log('📊 Fetching all pages...');
    const pagesResult = await makeRequest('query', {
      path: 'functions/page:listPages',
      args: [{ limit: 1000 }],
      format: 'json',
    });

    console.log(`   Found ${pagesResult.length} pages\n`);

    let pagesWithAdminText = 0;
    const pagesToUpdate: any[] = [];

    // Check which pages have admin text
    for (const entry of pagesResult) {
      const page = entry.page;
      if (page && hasAdminKeyword(page.summary)) {
        pagesToUpdate.push({
          id: page._id,
          slug: page.slug,
          oldSummary: page.summary,
        });
        pagesWithAdminText++;
      }
    }

    if (pagesToUpdate.length === 0) {
      console.log('✅ No pages with admin text found!');
      return;
    }

    console.log(`⚠️  Found ${pagesWithAdminText} pages with admin text:`);
    pagesToUpdate.forEach(p => {
      console.log(`   - ${p.slug}: "${p.oldSummary}"`);
    });

    console.log('\n❌ Cannot directly patch database via HTTP API');
    console.log('   Convex requires mutations to modify data\n');

    console.log('🔧 SOLUTION: Use Convex Dashboard');
    console.log('\n1. Go to: https://dashboard.convex.dev/d/insightful-panda-585');
    console.log('2. Click "Data" tab');
    console.log('3. Select "pages" table');
    console.log('4. For each page with admin text, click Edit and clear the summary field\n');

    console.log('📋 Pages to update:');
    pagesToUpdate.forEach(p => {
      console.log(`   ${p.id} (${p.slug})`);
    });

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanupDatabase();
