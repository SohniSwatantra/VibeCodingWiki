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
      <div class="py-8 text-center text-sm text-[#72777d]">
        Searching...
      </div>
    );
  }

  if (isError) {
    return (
      <div class="rounded border border-[#d33] bg-[#fee7e6] p-4 text-sm text-[#d33]">
        Failed to load search results. Please try again.
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div class="space-y-4 rounded border border-[#c8ccd1] bg-[#f8f9fa] p-6">
        <p class="text-sm text-[#54595d]">
          No pages found matching "<strong>{query}</strong>".
        </p>
        <div class="text-sm text-[#54595d]">
          <p class="mb-2">Suggestions:</p>
          <ul class="list-disc space-y-1 pl-5">
            <li>Check your spelling</li>
            <li>Try different keywords</li>
            <li>Try more general terms</li>
            <li><a href="/wiki/new" class="text-[#0645ad] hover:text-[#0b0080]">Propose a new page</a> about this topic</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div class="space-y-4">
      <p class="text-sm text-[#54595d]">
        Found {results.length} {results.length === 1 ? 'result' : 'results'}
      </p>

      <div class="space-y-3">
        {results.map((result) => (
          <div
            key={result.page._id}
            class="rounded border border-[#c8ccd1] bg-[#f8f9fa] p-4 hover:border-[#0645ad]"
          >
            <h3 class="mb-2 text-lg font-semibold">
              <a
                href={`/wiki/${result.page.slug}`}
                class="text-[#0645ad] hover:text-[#0b0080]"
              >
                {result.page.title}
              </a>
            </h3>

            {result.page.summary && (
              <p class="mb-2 text-sm text-[#54595d]">
                {result.page.summary}
              </p>
            )}

            {result.snippet && !result.page.summary && (
              <p class="mb-2 text-sm text-[#54595d]">
                {result.snippet}...
              </p>
            )}

            <div class="flex items-center gap-2 text-xs text-[#72777d]">
              <span class="rounded bg-white px-2 py-0.5">
                {result.page.namespace}
              </span>
              {result.page.tags && result.page.tags.length > 0 && (
                <>
                  {result.page.tags.slice(0, 3).map((tag) => (
                    <span key={tag} class="rounded bg-white px-2 py-0.5">
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
