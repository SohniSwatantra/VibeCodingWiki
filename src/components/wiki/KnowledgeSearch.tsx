import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Article } from '../../types/wiki';
import { QueryProvider } from '../providers/QueryProvider';

type SortOption = 'relevance' | 'popularity' | 'recent';

type DirectoryPayload = {
  articles: Article[];
};

function KnowledgeSearchContent() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sort, setSort] = useState<SortOption>('relevance');
  const { data, isLoading, isError } = useQuery<DirectoryPayload>({
    queryKey: ['wiki-directory'],
    queryFn: async () => {
      const response = await fetch('/api/wiki/directory');
      if (!response.ok) {
        throw new Error('Failed to load articles');
      }
      return (await response.json()) as DirectoryPayload;
    },
    staleTime: 1000 * 60,
  });

  const articles = useMemo(
    () => [...(data?.articles ?? [])].sort((a, b) => a.title.localeCompare(b.title)),
    [data],
  );

  const categories = useMemo(() => ['all', ...new Set(articles.flatMap((article) => article.categories))], [articles]);
  const tags = useMemo(() => [...new Set(articles.flatMap((article) => article.tags))].sort(), [articles]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((existing) => existing !== tag) : [...prev, tag]));
  };

  const filteredArticles = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();

    let results = articles.filter((article) => {
      const matchesQuery =
        lowerQuery.length === 0 ||
        article.title.toLowerCase().includes(lowerQuery) ||
        article.summary.toLowerCase().includes(lowerQuery);

      const matchesCategory = category === 'all' || article.categories.includes(category);

      const matchesTags = selectedTags.length === 0 || selectedTags.every((tag) => article.tags.includes(tag));

      return matchesQuery && matchesCategory && matchesTags;
    });

    if (sort === 'popularity') {
      results = [...results].sort((a, b) => b.popularity - a.popularity);
    } else if (sort === 'recent') {
      results = [...results].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } else if (sort === 'relevance' && lowerQuery) {
      const score = (article: Article) => {
        let relevance = 0;
        if (article.title.toLowerCase().includes(lowerQuery)) relevance += 2;
        if (article.summary.toLowerCase().includes(lowerQuery)) relevance += 1;
        relevance += article.tags.filter((tag) => selectedTags.includes(tag)).length;
        return relevance;
      };
      results = [...results].sort((a, b) => score(b) - score(a));
    }

    return results;
  }, [articles, category, query, selectedTags, sort]);

  return (
    <section className="rounded border border-[#a2a9b1] bg-white p-5 shadow-sm">
      {isLoading && <p className="text-sm text-[#72777d]">Loading article directory…</p>}
      {isError && (
        <p className="text-sm text-[#d33f3f]">
          Something went wrong while loading the directory. Refresh the page or try again shortly.
        </p>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex-1">
          <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#72777d]" htmlFor="knowledge-search-query">
            Search keywords
          </label>
          <input
            id="knowledge-search-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="mt-1 w-full rounded border border-[#a2a9b1] bg-white px-3 py-2 text-sm text-[#202122] focus:border-[#3366cc] focus:outline-none"
            placeholder="Search articles, events, or tools"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#72777d]" htmlFor="knowledge-search-category">
            Category
          </label>
          <select
            id="knowledge-search-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="mt-1 w-full rounded border border-[#a2a9b1] bg-white px-3 py-2 text-sm text-[#202122] focus:border-[#3366cc] focus:outline-none"
          >
            {categories.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#72777d]" htmlFor="knowledge-search-sort">
            Sort by
          </label>
          <select
            id="knowledge-search-sort"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortOption)}
            className="mt-1 w-full rounded border border-[#a2a9b1] bg-white px-3 py-2 text-sm text-[#202122] focus:border-[#3366cc] focus:outline-none"
          >
            <option value="relevance">Relevance</option>
            <option value="popularity">Popularity</option>
            <option value="recent">Recently updated</option>
          </select>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#72777d]">Tags</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {tags.map((tag) => {
            const active = selectedTags.includes(tag);
            return (
              <button
                type="button"
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`rounded-full border px-3 py-1 ${
                  active
                    ? 'border-[#3366cc] bg-[#3366cc] text-white'
                    : 'border-[#a2a9b1] bg-[#f8f9fa] text-[#202122] hover:border-[#3366cc]'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs uppercase tracking-[0.3em] text-[#72777d]">Results ({filteredArticles.length})</p>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {filteredArticles.map((article) => (
            <article key={article.slug} className="rounded border border-[#c8ccd1] bg-[#f8f9fa] p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#202122]">
                  <a className="text-[#0645ad]" href={`/wiki/${article.slug}`}>
                    {article.title}
                  </a>
                </h3>
                <span className="text-xs text-[#72777d]">Score: {article.popularity}</span>
              </div>
              <p className="mt-2 text-sm text-[#54595d]">{article.summary}</p>
              <p className="mt-2 text-xs text-[#72777d]">
                Categories: {article.categories.join(', ')} · Tags: {article.tags.join(', ')}
              </p>
            </article>
          ))}
        </div>

        {filteredArticles.length === 0 && !isLoading && !isError && (
          <p className="mt-4 text-sm text-[#54595d]">No articles match your filters yet. Try different tags.</p>
        )}
      </div>
    </section>
  );
}

export function KnowledgeSearch() {
  return (
    <QueryProvider>
      <KnowledgeSearchContent />
    </QueryProvider>
  );
}

