import 'dotenv/config';
import { ConvexHttpClient } from 'convex/browser';
import { articles } from '../src/data/articles';
import type { Article } from '../src/types/wiki';
import { normalizeNamespace } from '../convex/utils';

type SeedIdentity = {
  subject: string;
  issuer: string;
  email: string;
  name: string;
};

const rawDeployment = process.env.CONVEX_DEPLOYMENT;

function extractDeploymentSlug(input?: string | null) {
  if (!input) return undefined;
  const head = input.split('|')[0]?.trim();
  if (!head) return undefined;
  const parts = head.split(':');
  return parts[parts.length - 1]?.trim() || undefined;
}

const deploymentSlug = extractDeploymentSlug(rawDeployment);

let convexUrl = process.env.CONVEX_URL;
if (deploymentSlug) {
  const deploymentUrl = `https://${deploymentSlug}.convex.cloud`;
  if (!convexUrl) {
    convexUrl = deploymentUrl;
  } else if (!convexUrl.includes(deploymentSlug)) {
    console.warn(
      `CONVEX_URL (${convexUrl}) does not match CONVEX_DEPLOYMENT (${deploymentSlug}). Using ${deploymentUrl}.`,
    );
    convexUrl = deploymentUrl;
  }
}

const convexAdminKey = process.env.CONVEX_ADMIN_KEY;

if (!convexUrl || !convexAdminKey) {
  console.error('CONVEX_URL (or CONVEX_DEPLOYMENT) and CONVEX_ADMIN_KEY must be set to seed content.');
  process.exit(1);
}

console.log(`Seeding Convex deployment at ${convexUrl}`);

const seedIdentity: SeedIdentity = {
  subject: process.env.SEED_WORKOS_USER_ID ?? 'seed-script',
  issuer: process.env.SEED_WORKOS_ISSUER ?? 'https://workos.com',
  email: process.env.SEED_WORKOS_EMAIL ?? 'seed-script@vibecoding.wiki',
  name: process.env.SEED_WORKOS_NAME ?? 'Seed Script',
};

const client = new ConvexHttpClient(convexUrl);

async function ensureSeedUser() {
  try {
    console.log(`Creating/syncing seed user: ${seedIdentity.email}...`);
    // Use admin auth without identity for syncWorkOSIdentity (it doesn't need user auth)
    (client as any).setAdminAuth?.(convexAdminKey);
    await (client as any).mutation('users:syncWorkOSIdentity', {
      workosUserId: seedIdentity.subject,
      email: seedIdentity.email,
      firstName: seedIdentity.name.split(' ')[0] ?? 'Seed',
      lastName: seedIdentity.name.split(' ').slice(1).join(' ') || 'Script',
    });
    // Now set admin auth with identity for subsequent mutations that need user context
    (client as any).setAdminAuth?.(convexAdminKey, {
      subject: seedIdentity.subject,
      issuer: seedIdentity.issuer,
      tokenIdentifier: `${seedIdentity.issuer}|${seedIdentity.subject}`,
      name: seedIdentity.name,
      email: seedIdentity.email,
    });
    console.log(`✓ Seed user ready.`);
  } catch (error) {
    console.error('Failed to create seed user:', error);
    throw error;
  }
}

function formatSectionId(title: string, index: number) {
  return `${title || 'section'}-${index}`
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

function mapSectionsFromArticle(article: Article) {
  return (article.sections ?? []).map((section, index) => ({
    id: formatSectionId(section.heading ?? `section-${index + 1}`, index),
    title: section.heading ?? `Section ${index + 1}`,
    level: 2,
    markdown: section.content ?? '',
  }));
}

function mapTimelineFromArticle(article: Article) {
  return (article.timeline ?? []).map((entry) => ({
    year: entry.year,
    title: entry.title,
    description: entry.description,
  }));
}

async function seedArticle(article: (typeof articles)[number]) {
  try {
    console.log(`Processing ${article.slug}...`);
    const existing = await (client as any).query('pages:getPageBySlug', { slug: article.slug });
    if (existing?.page) {
      console.log(`✓ ${article.slug} already exists, skipping.`);
      return;
    }

    const sections = mapSectionsFromArticle(article);
    const timeline = mapTimelineFromArticle(article);
    const content = sections.map((section) => section.markdown).join('\n\n') || article.summary || '';
    const namespace = normalizeNamespace(article.categories?.[0]);

    console.log(`  Creating page...`);
    const { revisionId } = await (client as any).mutation('pages:createPage', {
      title: article.title,
      slug: article.slug,
      namespace,
      summary: article.summary,
      content,
      sections,
      tags: article.tags ?? [],
      timeline: timeline.length > 0 ? timeline : undefined,
      relatedTopics: article.relatedTopics ?? [],
    });

    console.log(`  Approving revision ${revisionId}...`);
    await (client as any).mutation('pages:approveRevision', { revisionId });
    console.log(`✓ Seeded and approved ${article.slug}`);
  } catch (error: any) {
    console.error(`✗ Failed to seed ${article.slug}:`, error?.message || error);
    throw error;
  }
}

async function main() {
  try {
    await ensureSeedUser();

    for (const article of articles) {
      await seedArticle(article);
    }

    console.log('All articles processed.');
  } catch (error) {
    console.error('Failed to seed Convex content:', error);
    process.exitCode = 1;
  } finally {
    client.clearAuth();
  }
}

await main();

