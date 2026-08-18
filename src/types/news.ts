export const newsCategories = ['Tools', 'Acquisitions', 'Product Hunt', 'Community', 'Security'] as const;

export type NewsCategory = (typeof newsCategories)[number];

export type NewsSource = {
  name: string;
  url: string;
  kind: 'primary' | 'platform' | 'creator' | 'reporting';
};

export type NewsItem = {
  id: string;
  title: string;
  summary: string;
  category: NewsCategory;
  publishedAt: string;
  verifiedAt: string;
  sources: NewsSource[];
  tags: string[];
};
