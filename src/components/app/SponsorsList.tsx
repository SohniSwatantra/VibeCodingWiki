import { useQuery } from '@tanstack/react-query';
import { QueryProvider } from '../providers/QueryProvider';

function SponsorsListContent() {
  const { data: sponsors, isLoading, isError } = useQuery({
    queryKey: ['sponsors'],
    queryFn: async () => {
      const response = await fetch('/api/sponsors/list');
      if (!response.ok) throw new Error('Failed to load sponsors');
      return await response.json();
    },
  });

  if (isLoading) {
    return <p className="text-sm text-[#54595d]">Loading sponsors...</p>;
  }

  if (isError) {
    return <p className="text-sm text-[#d33f3f]">Failed to load sponsors.</p>;
  }

  if (!sponsors || sponsors.length === 0) {
    return (
      <p className="text-sm text-[#54595d]">
        No sponsors yet. Be the first to support VibeCodingWiki!
      </p>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {sponsors.map((sponsor: any) => (
        <article
          key={sponsor._id}
          className="rounded border border-[#c8ccd1] bg-[#f8f9fa] p-4 shadow-sm"
        >
          {sponsor.logoUrl && (
            <div className="mb-3">
              <img
                src={sponsor.logoUrl}
                alt={`${sponsor.name} logo`}
                className="h-16 w-auto object-contain"
              />
            </div>
          )}

          <h3 className="mb-2 text-lg font-semibold text-[#202122]">
            {sponsor.websiteUrl ? (
              <a
                href={sponsor.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0645ad] hover:text-[#0b0080]"
              >
                {sponsor.name}
              </a>
            ) : (
              sponsor.name
            )}
          </h3>

          <p className="text-sm text-[#54595d]">{sponsor.thankyouNote}</p>
        </article>
      ))}
    </div>
  );
}

export function SponsorsList() {
  return (
    <QueryProvider>
      <SponsorsListContent />
    </QueryProvider>
  );
}
