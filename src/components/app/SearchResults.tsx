import { useQuery } from '@tanstack/react-query';
import { QueryProvider } from '../providers/QueryProvider';

interface SearchResult {
  page: {
    _id: string;
    title: string;
    slug: string;
    summary?: string;
    tags?: string[];
    namespace: string;
  };
  snippet: string;
}

function SearchResultsContent({ query }: { query: string }) {
  const { data: results, isLoading, isError } = useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      const response = await fetch(`/api/wiki/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to search');
      return (await response.json()) as SearchResult[];
    },
    enabled: !!query,
  });

  if (isLoading) {
    return (
      <div className="py-8 text-center text-sm text-[#72777d]">
        Searching...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded border border-[#d33] bg-[#fee7e6] p-4 text-sm text-[#d33]">
        Failed to load search results. Please try again.
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="space-y-4 rounded border border-[#c8ccd1] bg-[#f8f9fa] p-6">
        <p className="text-sm text-[#54595d]">
          No pages found matching "<strong>{query}</strong>".
        </p>
        <div className="text-sm text-[#54595d]">
          <p className="mb-2">Suggestions:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Check your spelling</li>
            <li>Try different keywords</li>
            <li>Try more general terms</li>
            <li><a href="/wiki/new" className="text-[#0645ad] hover:text-[#0b0080]">Propose a new page</a> about this topic</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#54595d]">
        Found {results.length} {results.length === 1 ? 'result' : 'results'}
      </p>

      <div className="space-y-3">
        {results.map((result) => (
          <div
            key={result.page._id}
            className="rounded border border-[#c8ccd1] bg-[#f8f9fa] p-4 hover:border-[#0645ad]"
          >
            <h3 className="mb-2 text-lg font-semibold">
              <a
                href={`/wiki/${result.page.slug}`}
                className="text-[#0645ad] hover:text-[#0b0080]"
              >
                {result.page.title}
              </a>
            </h3>

            {result.page.summary && (
              <p className="mb-2 text-sm text-[#54595d]">
                {result.page.summary}
              </p>
            )}

            {result.snippet && !result.page.summary && (
              <p className="mb-2 text-sm text-[#54595d]">
                {result.snippet}...
              </p>
            )}

            <div className="flex items-center gap-2 text-xs text-[#72777d]">
              <span className="rounded bg-white px-2 py-0.5">
                {result.page.namespace}
              </span>
              {result.page.tags && result.page.tags.length > 0 && (
                <>
                  {result.page.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded bg-white px-2 py-0.5">
                      {tag}
                    </span>
                  ))}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SearchResults({ query }: { query: string }) {
  return (
    <QueryProvider>
      <SearchResultsContent query={query} />
    </QueryProvider>
  );
}
