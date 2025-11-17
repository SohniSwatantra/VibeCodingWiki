import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Article } from '../../types/wiki';
import { QueryProvider } from '../providers/QueryProvider';

type DirectoryPayload = {
  articles: Article[];
  source?: string;
};

function ArticleDirectoryContent() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { data, isLoading, isError } = useQuery<DirectoryPayload>({
    queryKey: ['wiki-directory'],
    queryFn: async () => {
      const response = await fetch('/api/wiki/directory');
      if (!response.ok) {
        throw new Error('Failed to load directory');
      }
      return (await response.json()) as DirectoryPayload;
    },
    staleTime: 1000 * 60,
  });

  const articles = useMemo(() => {
    return [...(data?.articles ?? [])].sort((a, b) => a.title.localeCompare(b.title));
  }, [data]);

  const categories = useMemo(() => ['all', ...new Set(articles.flatMap((article) => article.categories))], [articles]);

  const filtered = useMemo(() => {
    if (selectedCategory === 'all') return articles;
    return articles.filter((article) => article.categories.includes(selectedCategory));
  }, [articles, selectedCategory]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#72777d]">Filter by category</p>
        <select
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value)}
          className="w-full max-w-xs rounded border border-[#a2a9b1] bg-white px-3 py-2 text-sm text-[#202122] focus:border-[#3366cc] focus:outline-none"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p className="text-sm text-[#72777d]">Loading articles…</p>}
      {isError && <p className="text-sm text-[#d33f3f]">Unable to load articles right now. Please try again soon.</p>}

      {!isLoading && !isError && filtered.length === 0 && (
        <p className="text-sm text-[#72777d]">No articles match this category yet.</p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((article) => (
          <article key={article.slug} className="rounded border border-[#c8ccd1] bg-[#f8f9fa] p-4 shadow-sm">
            <h2 className="text-base font-semibold text-[#202122]">
              <a className="text-[#0645ad]" href={`/wiki/${article.slug}`}>
                {article.title}
              </a>
            </h2>
            <p className="mt-2 text-sm text-[#54595d]">{article.summary}</p>
            <p className="mt-3 text-xs text-[#72777d]">
              Categories: {article.categories.join(', ')} · Tags: {article.tags.join(', ')}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ArticleDirectory() {
  return (
    <QueryProvider>
      <ArticleDirectoryContent />
    </QueryProvider>
  );
}

