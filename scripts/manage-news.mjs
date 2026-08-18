#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const categories = new Set(['Tools', 'Acquisitions', 'Product Hunt', 'Community', 'Security']);
const sourceKinds = new Set(['primary', 'platform', 'creator', 'reporting']);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const defaultDataPath = fileURLToPath(new URL('../src/data/news.json', import.meta.url));

function fail(message) {
  throw new Error(message);
}

function getFlag(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function normalizedUrl(value) {
  const url = new URL(value);
  url.hash = '';
  url.search = '';
  return url.toString().replace(/\/$/, '');
}

function validateDate(value, field, id) {
  if (!datePattern.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    fail(`${id}: ${field} must be a valid YYYY-MM-DD date`);
  }
}

function validateItem(item, index) {
  const label = item?.id || `item ${index + 1}`;
  if (!item || typeof item !== 'object' || Array.isArray(item)) fail(`item ${index + 1} must be an object`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id || '')) fail(`${label}: id must use lowercase kebab-case`);
  if (typeof item.title !== 'string' || item.title.trim().length < 12) fail(`${label}: title is missing or too short`);
  if (typeof item.summary !== 'string' || item.summary.trim().length < 50) fail(`${label}: summary is missing or too short`);
  if (!categories.has(item.category)) fail(`${label}: unsupported category ${JSON.stringify(item.category)}`);
  validateDate(item.publishedAt, 'publishedAt', label);
  validateDate(item.verifiedAt, 'verifiedAt', label);
  if (item.publishedAt > item.verifiedAt) fail(`${label}: publishedAt cannot be after verifiedAt`);

  if (!Array.isArray(item.sources) || item.sources.length === 0) fail(`${label}: at least one source is required`);

  item.sources.forEach((source, sourceIndex) => {
    const sourceLabel = `${label}: source ${sourceIndex + 1}`;
    if (typeof source?.name !== 'string' || !source.name.trim()) fail(`${sourceLabel} needs a name`);
    if (!sourceKinds.has(source?.kind)) fail(`${sourceLabel} has an unsupported kind`);
    try {
      const url = new URL(source.url);
      if (url.protocol !== 'https:') fail(`${sourceLabel} must use HTTPS`);
    } catch (error) {
      if (error.message.includes('must use HTTPS')) throw error;
      fail(`${sourceLabel} has an invalid URL`);
    }
  });

  if (!Array.isArray(item.tags) || item.tags.length === 0 || item.tags.some((tag) => typeof tag !== 'string' || !tag.trim())) {
    fail(`${label}: tags must contain at least one non-empty string`);
  }
}

function validateCollection(items) {
  if (!Array.isArray(items)) fail('news data must be an array');
  items.forEach(validateItem);

  const ids = new Set();
  const sourceUrls = new Map();
  for (const item of items) {
    if (ids.has(item.id)) fail(`${item.id}: duplicate id`);
    ids.add(item.id);
    for (const source of item.sources) {
      const url = normalizedUrl(source.url);
      const existing = sourceUrls.get(url);
      if (existing && existing !== item.id) fail(`${item.id}: source URL already belongs to ${existing}`);
      sourceUrls.set(url, item.id);
    }
  }

  const expectedOrder = [...items].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id));
  if (items.some((item, index) => item.id !== expectedOrder[index].id)) {
    fail('news items must be sorted newest first');
  }
}

async function loadJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

const command = process.argv[2] || 'validate';
const dataPath = resolve(getFlag('--data') || defaultDataPath);

try {
  const current = await loadJson(dataPath);

  if (command === 'validate') {
    validateCollection(current);
    console.log(`Validated ${current.length} news items in ${dataPath}`);
  } else if (command === 'add') {
    const itemPath = getFlag('--file');
    if (!itemPath) fail('add requires --file <path-to-item-or-array.json>');
    const incomingValue = await loadJson(resolve(itemPath));
    const incoming = Array.isArray(incomingValue) ? incomingValue : [incomingValue];
    const combined = [...current, ...incoming].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id));
    validateCollection(combined);
    await writeFile(dataPath, `${JSON.stringify(combined, null, 2)}\n`);
    console.log(`Added ${incoming.length} news item${incoming.length === 1 ? '' : 's'} to ${dataPath}`);
  } else {
    fail(`unknown command ${JSON.stringify(command)}; use validate or add`);
  }
} catch (error) {
  console.error(`News update failed: ${error.message}`);
  process.exitCode = 1;
}
