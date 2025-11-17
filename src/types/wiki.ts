export type ArticleSection = {
  heading: string;
  content: string;
};

export type ArticleTimelineEntry = {
  year: number;
  title: string;
  description: string;
};

export type Article = {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  categories: string[];
  popularity: number;
  createdAt: string;
  updatedAt: string;
  sections: ArticleSection[];
  timeline: ArticleTimelineEntry[];
  relatedTopics: string[];
};

export type ConvexSectionInput = {
  id: string;
  title: string;
  level: number;
  markdown: string;
};

export type ConvexTimelineEntry = {
  year: string | number;
  title: string;
  description: string;
};

