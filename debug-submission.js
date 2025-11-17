#!/usr/bin/env node

/**
 * Debug script to test the proposal submission endpoint
 * Usage: node debug-submission.js [articleSlug]
 */

const articleSlug = process.argv[2] || 'test-article';
const baseUrl = process.env.PUBLIC_SITE_URL || 'http://localhost:4321';

console.log('\n🔍 Proposal Submission Debug Tool\n');
console.log(`Target: ${baseUrl}/api/wiki/proposals`);
console.log(`Article Slug: ${articleSlug}\n`);

const testPayload = {
  articleSlug: articleSlug,
  summary: 'Test submission from debug script',
  details: 'This is a test proposal to verify the submission endpoint is working correctly.',
  alias: 'Debug Tester',
};

console.log('📤 Sending test payload:');
console.log(JSON.stringify(testPayload, null, 2));
console.log('\n⏳ Sending request...\n');

const startTime = Date.now();

fetch(`${baseUrl}/api/wiki/proposals`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testPayload),
})
  .then(async (response) => {
    const elapsed = Date.now() - startTime;
    console.log(`✅ Response received in ${elapsed}ms`);
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()));

    const text = await response.text();
    console.log('\n📥 Response Body:');
    try {
      const json = JSON.parse(text);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log(text);
    }

    if (response.ok) {
      console.log('\n✅ SUCCESS! The endpoint is working correctly.');
    } else {
      console.log('\n❌ ERROR! The endpoint returned an error status.');
    }
  })
  .catch((error) => {
    const elapsed = Date.now() - startTime;
    console.error(`\n❌ Request failed after ${elapsed}ms`);
    console.error('Error:', error.message);

    if (error.name === 'AbortError') {
      console.error('⚠️  Request was aborted (timeout or cancellation)');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('⚠️  Connection refused - is the dev server running?');
    } else if (error.message.includes('fetch')) {
      console.error('⚠️  Network error - check your connection');
    }
  });
