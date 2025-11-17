import type { Article, ArticleSection } from '../../types/wiki';

function toIso(value: unknown): string {
  if (typeof value === 'number') {
    return new Date(value).toISOString();
  }
  if (typeof value === 'string') {
    return value;
  }
  return new Date().toISOString();
}

function normalizeNamespace(namespace: unknown): string {
  if (typeof namespace !== 'string' || namespace.length === 0) {
    return 'Main';
  }
  return namespace.charAt(0).toUpperCase() + namespace.slice(1);
}

export function transformConvexEntry(entry: { page: any; approvedRevision?: any | null }): Article {
  const { page, approvedRevision } = entry;
  const sections: ArticleSection[] = Array.isArray(approvedRevision?.sections)
    ? approvedRevision.sections.map((section: any) => ({
        heading: section.title ?? 'Section',
        content: section.markdown ?? '',
      }))
    : [];

  if (sections.length === 0 && typeof approvedRevision?.content === 'string') {
    sections.push({ heading: 'Overview', content: approvedRevision.content });
  }

  const tags = Array.isArray(approvedRevision?.tags) ? approvedRevision.tags : [];
  const namespaceCategory = normalizeNamespace(page.namespace);

  return {
    slug: page.slug,
    title: page.title,
    summary: page.summary ?? approvedRevision?.summary ?? '',
    tags,
    categories: [namespaceCategory, ...tags.map((tag: string) => tag.replace(/_/g, ' '))],
    popularity: page.popularityScore ?? 0,
    createdAt: toIso(page.createdAt),
    updatedAt: toIso(page.updatedAt ?? page.createdAt),
    sections,
    timeline: Array.isArray(approvedRevision?.timeline) ? approvedRevision.timeline : [],
    relatedTopics: Array.isArray(approvedRevision?.relatedTopics) ? approvedRevision.relatedTopics : [],
  };
}
