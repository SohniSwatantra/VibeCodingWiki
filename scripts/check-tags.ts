#!/usr/bin/env tsx
import 'dotenv/config';
import { ConvexHttpClient } from 'convex/browser';

const CONVEX_URL = process.env.CONVEX_URL;
const CONVEX_ADMIN_KEY = process.env.CONVEX_ADMIN_KEY;

if (!CONVEX_URL || !CONVEX_ADMIN_KEY) {
  console.error('Missing env vars');
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);
client.setAdminAuth(CONVEX_ADMIN_KEY);

async function check() {
  const result: any = await client.query('pages:getPageBySlug' as any, {
    slug: 'origins-of-vibecoding',
  });
  console.log('Page:', result.page.title);
  console.log('Approved Revision ID:', result.page.approvedRevisionId);
  console.log('Approved Revision tags:', result.approvedRevision?.tags);
  client.clearAuth();
  process.exit(0);
}

check().catch(console.error);
