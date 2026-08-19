#!/usr/bin/env node

import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { ConvexHttpClient } from 'convex/browser';

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

const dataPath = new URL('../src/data/news.json', import.meta.url);
const items = JSON.parse(await readFile(dataPath, 'utf8'));
const client = new ConvexHttpClient(requiredEnv('CONVEX_URL'));
client.setAdminAuth(requiredEnv('CONVEX_ADMIN_KEY'));

const result = await client.mutation('news:upsertAutomatedNews', {
  automationSecret: requiredEnv('NEWS_AUTOMATION_SECRET'),
  origin: 'seed',
  items,
});

console.log(`Seeded ${result.total} news items (${result.inserted} inserted, ${result.updated} updated)`);
