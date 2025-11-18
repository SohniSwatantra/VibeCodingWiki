import type { ActingIdentity } from '../convex.server';
import type { Article, ConvexSectionInput, ConvexTimelineEntry } from '../../types/wiki';
import { runConvexMutation, runConvexQuery } from '../convex.server';
import { articles as fallbackArticles } from '../../data/articles';
import { transformConvexEntry } from '../articles/transform';

export type ConvexUserRecord = {
  _id: string;
  workosUserId: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  roles?: Array<{ role: string }>;
};

export type ActingUser = {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

export function formatSectionId(title: string, index: number) {
  return `${title || 'section'}-${index}`
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

type ConvexPageEntry = { page: any; approvedRevision?: any | null };
type ArticleSource = 'convex' | 'fallback' | 'missing';
type PageFetchResult = {
  entry: ConvexPageEntry | null;
  article: Article | null;
  source: ArticleSource;
};
type DirectoryResult = {
  articles: Article[];
  source: Exclude<ArticleSource, 'missing'>;
};

export function mapSectionsFromArticle(article: Article): ConvexSectionInput[] {
  return (article.sections ?? []).map((section, index) => ({
    id: formatSectionId(section.heading ?? `section-${index + 1}`, index),
    title: section.heading ?? `Section ${index + 1}`,
    level: 2,
    markdown: section.content ?? '',
  }));
}

export function mapTimelineFromArticle(article: Article): ConvexTimelineEntry[] {
  return (article.timeline ?? []).map((entry) => ({
    year: entry.year,
    title: entry.title,
    description: entry.description,
  }));
}

function buildFallbackEntry(article: Article): ConvexPageEntry {
  const sections = mapSectionsFromArticle(article);
  const timeline = mapTimelineFromArticle(article);
  const createdAt = Date.parse(article.createdAt) || Date.now();
  const updatedAt = Date.parse(article.updatedAt) || createdAt;
  const pageId = `fallback-${article.slug}`;
  const revisionId = `fallback-revision-${article.slug}`;

  return {
    page: {
      _id: pageId,
      slug: article.slug,
      title: article.title,
      namespace: 'Main',
      summary: article.summary,
      tags: article.tags,
      createdBy: 'fallback-user',
      createdAt,
      updatedAt,
      approvedRevisionId: revisionId,
      status: 'published',
      popularityScore: article.popularity,
    },
    approvedRevision: {
      _id: revisionId,
      pageId,
      revisionNumber: 1,
      content: sections.map((section) => section.markdown).join('\n\n') || article.summary,
      summary: article.summary,
      sections,
      tags: article.tags,
      timeline,
      relatedTopics: article.relatedTopics,
      createdBy: 'fallback-user',
      createdAt: updatedAt,
      status: 'approved',
      metadata: {
        source: 'fallback-static',
      },
    },
  };
}

export async function getConvexUserByWorkOSId(workosUserId: string) {
  return (await runConvexQuery<ConvexUserRecord>('users:getByWorkOSId', { workosUserId })) ?? null;
}

export function buildActingIdentity(user: ActingUser, convexUser?: ConvexUserRecord | null): ActingIdentity {
  const subject = convexUser?.workosUserId ?? user.id;
  const email = convexUser?.email ?? user.email ?? undefined;
  const name = convexUser?.displayName ?? [user.firstName, user.lastName].filter(Boolean).join(' ').trim();

  return {
    subject,
    email,
    name: name.length > 0 ? name : email,
    issuer: 'https://workos.com',
  };
}

export async function fetchPageBySlug(slug: string): Promise<PageFetchResult> {
  if (!slug) {
    return { entry: null, article: null, source: 'missing' };
  }

  const entry = (await runConvexQuery<ConvexPageEntry>('pages:getPageBySlug', { slug })) ?? null;
  if (entry?.page) {
    return {
      entry,
      article: transformConvexEntry(entry),
      source: 'convex',
    };
  }

  const fallbackArticle = fallbackArticles.find((article) => article.slug === slug);
  if (!fallbackArticle) {
    return { entry: null, article: null, source: 'missing' };
  }

  const fallbackEntry = buildFallbackEntry(fallbackArticle);
  return {
    entry: fallbackEntry,
    article: transformConvexEntry(fallbackEntry),
    source: 'fallback',
  };
}

export async function fetchDirectory(options: { status?: string; limit?: number } = {}): Promise<DirectoryResult> {
  const { limit = 200 } = options;
  const response = (await runConvexQuery<ConvexPageEntry[]>('pages:listPages', { limit })) ?? [];

  if (response.length > 0) {
    return {
      articles: response.map(transformConvexEntry),
      source: 'convex',
    };
  }

  const fallbackTransformed = fallbackArticles.map((article) => {
    const entry = buildFallbackEntry(article);
    return transformConvexEntry(entry);
  });

  return {
    articles: fallbackTransformed,
    source: 'fallback',
  };
}

export async function ensurePageForSlug(slug: string, actingIdentity: ActingIdentity) {
  console.log('ensurePageForSlug: Checking for page with slug:', slug);
  let entry = await runConvexQuery<any>('pages:getPageBySlug', { slug });
  if (entry?.page) {
    console.log('ensurePageForSlug: Page found:', entry.page._id);
    return entry;
  }

  console.log('ensurePageForSlug: Page not found, checking fallback articles');
  const fallbackArticle = fallbackArticles.find((article) => article.slug === slug);
  if (!fallbackArticle) {
    console.log('ensurePageForSlug: No fallback article found for slug:', slug);
    return null;
  }

  console.log('ensurePageForSlug: Creating page from fallback article:', fallbackArticle.title);
  const sections = mapSectionsFromArticle(fallbackArticle);
  const timeline = mapTimelineFromArticle(fallbackArticle);
  const mergedContent = sections.map((section) => section.markdown).join('\n\n') || fallbackArticle.summary;

  const createResult = await runConvexMutation(
    'pages:createPage',
    {
      title: fallbackArticle.title,
      slug: fallbackArticle.slug,
      namespace: 'Main',
      summary: fallbackArticle.summary,
      content: mergedContent,
      sections,
      tags: fallbackArticle.tags ?? [],
      timeline,
      relatedTopics: fallbackArticle.relatedTopics ?? [],
    },
    {
      actingAs: actingIdentity,
    },
  );

  if (!createResult) {
    console.error('ensurePageForSlug: Failed to create page, mutation returned null');
    return null;
  }

  console.log('ensurePageForSlug: Page created, auto-approving first revision');
  // Auto-approve the first revision so the edit form has content to display
  await runConvexMutation(
    'pages:autoApproveFirstRevision',
    { pageId: createResult.pageId },
    { actingAs: actingIdentity }
  );

  console.log('ensurePageForSlug: First revision approved, fetching entry');
  entry = await runConvexQuery<any>('pages:getPageBySlug', { slug });
  return entry;
}

export async function loadUserProfiles(userIds: string[]) {
  if (userIds.length === 0) return [];
  return (
    (await runConvexQuery<any>('users:getPublicProfiles', {
      userIds,
    })) ?? []
  );
}

export async function fetchUserProfile(userId: string) {
  if (!userId) return null;
  const profiles = await loadUserProfiles([userId]);
  return profiles[0] ?? null;
}

export async function fetchTalkThreads(slug: string) {
  if (!slug) return [];
  return (await runConvexQuery<any>('talk:listThreads', { slug })) ?? [];
}
