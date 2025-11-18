import { useQuery } from '@tanstack/react-query';
import { QueryProvider } from '../providers/QueryProvider';
import { RoleBadge } from '../wiki/RoleBadge';

function ContributorsListContent() {
  const { data: contributors, isLoading, isError } = useQuery({
    queryKey: ['contributors'],
    queryFn: async () => {
      const response = await fetch('/api/users/list');
      if (!response.ok) throw new Error('Failed to load contributors');
      return await response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="rounded border border-[#c8ccd1] bg-[#f8f9fa] p-4">
        <p className="text-sm text-[#54595d]">Loading contributors...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded border border-[#d33f3f] bg-[#f8d7da] p-4">
        <p className="text-sm text-[#721c24]">Failed to load contributors.</p>
      </div>
    );
  }

  if (!contributors || contributors.length === 0) {
    return (
      <div className="rounded border border-[#c8ccd1] bg-[#f8f9fa] p-4">
        <p className="text-sm text-[#54595d]">No contributors yet.</p>
      </div>
    );
  }

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {contributors.map((contributor: any) => (
        <article key={contributor._id} className="rounded border border-[#c8ccd1] bg-[#f8f9fa] p-4 shadow-sm">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#202122]">
                <span className="text-[#0645ad]">{contributor.displayName || contributor.email}</span>
              </h2>
              {contributor.primaryRole && (
                <RoleBadge role={contributor.primaryRole.replace('_', '-')} />
              )}
            </div>
            <p className="text-xs text-[#72777d]">
              Joined {new Date(contributor.createdAt).toLocaleDateString()}
            </p>
            {contributor.bio && (
              <p className="text-sm text-[#202122]">{contributor.bio}</p>
            )}
            {contributor.reputation !== undefined && (
              <p className="text-xs text-[#54595d]">
                Reputation: {contributor.reputation}
              </p>
            )}
            {contributor.contributionCount !== undefined && (
              <p className="text-xs text-[#54595d]">
                Contributions: {contributor.contributionCount}
              </p>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}

export function ContributorsList() {
  return (
    <QueryProvider>
      <ContributorsListContent />
    </QueryProvider>
  );
}
