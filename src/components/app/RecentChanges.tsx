import { useQuery } from '@tanstack/react-query';
import { QueryProvider } from '../providers/QueryProvider';
import { RoleBadge } from '../wiki/RoleBadge';
import { filterAdminSummary } from '../../lib/utils/filterAdminSummary';

interface RecentChangesContentProps {
  isSuperAdmin: boolean;
}

function RecentChangesContent({ isSuperAdmin }: RecentChangesContentProps) {
  const { data: changes, isLoading, isError } = useQuery({
    queryKey: ['recent-changes'],
    queryFn: async () => {
      const response = await fetch('/api/wiki/recent-changes');
      if (!response.ok) throw new Error('Failed to load recent changes');
      return await response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="rounded border border-[#c8ccd1] bg-[#f8f9fa] p-4">
        <p className="text-sm text-[#54595d]">Loading recent changes...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded border border-[#d33f3f] bg-[#f8d7da] p-4">
        <p className="text-sm text-[#721c24]">Failed to load recent changes.</p>
      </div>
    );
  }

  if (!changes || changes.length === 0) {
    return (
      <div className="rounded border border-[#c8ccd1] bg-[#f8f9fa] p-4">
        <p className="text-sm text-[#54595d]">No recent changes to display.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {changes.map((change: any) => {
        const filteredSummary = filterAdminSummary(change.summary, isSuperAdmin);
        return (
          <article
            key={change.revisionId}
            className="rounded border border-[#c8ccd1] bg-[#f8f9fa] p-4 hover:bg-white"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex-grow">
                <h3 className="text-base font-semibold text-[#202122]">
                  <a href={`/wiki/${change.pageSlug}`} className="text-[#0645ad] hover:text-[#0b0080]">
                    {change.pageTitle}
                  </a>
                </h3>
                {filteredSummary && <p className="mt-1 text-sm text-[#54595d]">{filteredSummary}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#72777d]">
                <span>{change.authorName}</span>
                {change.authorRole && <RoleBadge role={change.authorRole.replace('_', '-')} />}
                <span>•</span>
                <span>{new Date(change.approvedAt).toLocaleString()}</span>
                {change.approvedByName && (
                  <>
                    <span>•</span>
                    <span>Approved by {change.approvedByName}</span>
                  </>
                )}
              </div>
            </div>
            <a
              href={`/wiki/${change.pageSlug}/history`}
              className="text-xs text-[#0645ad] hover:text-[#0b0080]"
            >
              View history
            </a>
          </div>
        </article>
        );
      })}
    </div>
  );
}

interface RecentChangesProps {
  isSuperAdmin: boolean;
}

export function RecentChanges({ isSuperAdmin }: RecentChangesProps) {
  return (
    <QueryProvider>
      <RecentChangesContent isSuperAdmin={isSuperAdmin} />
    </QueryProvider>
  );
}
