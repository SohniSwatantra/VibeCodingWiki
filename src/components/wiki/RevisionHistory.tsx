import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RoleBadge } from './RoleBadge.tsx';
import { QueryProvider } from '../providers/QueryProvider';

type Revision = {
  id: string;
  summary: string;
  editor: string;
  editorDisplayName: string;
  role: 'super-admin' | 'moderator' | 'contributor' | 'reader';
  editedAt: string;
  status: 'published' | 'pending' | 'rejected';
};

type RevisionHistoryProps = {
  articleSlug: string;
};

function normalizeRole(role: string | undefined): Revision['role'] {
  const formatted = role?.replace(/_/g, '-') ?? 'contributor';
  if (formatted === 'super-admin' || formatted === 'moderator' || formatted === 'contributor' || formatted === 'reader') {
    return formatted;
  }
  return 'contributor';
}

function normalizeStatus(status: string | undefined): Revision['status'] {
  if (!status) return 'pending';
  if (status === 'approved' || status === 'published') return 'published';
  if (status === 'rejected') return 'rejected';
  return 'pending';
}

type RevisionPayload = {
  revisions: Revision[];
};

function RevisionHistoryContent({ articleSlug }: RevisionHistoryProps) {
  const { data, isLoading, isError } = useQuery<RevisionPayload>({
    queryKey: ['wiki-revisions', articleSlug],
    queryFn: async () => {
      const response = await fetch(`/api/wiki/revisions?slug=${encodeURIComponent(articleSlug)}`);
      if (!response.ok) {
        throw new Error('Failed to load revisions');
      }
      const payload = await response.json();
      const mapped: Revision[] = (payload?.revisions ?? []).map((revision: any) => ({
        id: revision.id,
        summary: revision.summary ?? '(No summary provided)',
        editor: revision.editor ?? 'unknown-contributor',
        editorDisplayName: revision.editorDisplayName ?? 'Unknown contributor',
        role: normalizeRole(revision.role),
        editedAt: revision.editedAt ?? new Date().toISOString(),
        status: normalizeStatus(revision.status),
      }));

      return { revisions: mapped };
    },
    enabled: Boolean(articleSlug),
    staleTime: 1000 * 30,
  });

  const revisions = useMemo(() => data?.revisions ?? [], [data]);

  if (isLoading) {
    return (
      <section className="rounded border border-[#c8ccd1] bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-[#202122]">Revision history</h2>
        <p className="mt-2 text-sm text-[#54595d]">Loading revisions…</p>
      </section>
    );
  }

  if (isError || revisions.length === 0) {
    return (
      <section className="rounded border border-[#c8ccd1] bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-[#202122]">Revision history</h2>
        <p className="mt-2 text-sm text-[#54595d]">
          {isError ? 'Unable to load revision history right now.' : 'No revisions yet—be the first to contribute!'}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded border border-[#c8ccd1] bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-[#202122]">Revision history</h2>
      <table className="mt-3 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[#c8ccd1] bg-[#f8f9fa] text-left text-[#202122]">
            <th className="px-3 py-2">When</th>
            <th className="px-3 py-2">Summary</th>
            <th className="px-3 py-2">Editor</th>
            <th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {revisions.map((revision) => (
            <tr key={revision.id} className="border-b border-[#eaecf0]">
              <td className="px-3 py-2 text-[#54595d]">{new Date(revision.editedAt).toLocaleString()}</td>
              <td className="px-3 py-2 text-[#202122]">{revision.summary}</td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2 text-[#202122]">
                  <a className="text-[#0645ad]" href={`/users/${revision.editor}`}>{revision.editorDisplayName}</a>
                  <RoleBadge role={revision.role} />
                </div>
              </td>
              <td className="px-3 py-2">
                <span
                  className={`rounded-full border px-2 py-1 text-xs font-semibold ${
                    revision.status === 'published'
                      ? 'border-[#a7d7a9] bg-[#dff0d8] text-[#1b5e20]'
                      : revision.status === 'pending'
                      ? 'border-[#f8d7a1] bg-[#fff3cd] text-[#8a6d3b]'
                      : 'border-[#f2a2a2] bg-[#f8d7da] text-[#8b0000]'
                  }`}
                >
                  {revision.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function RevisionHistory(props: RevisionHistoryProps) {
  return (
    <QueryProvider>
      <RevisionHistoryContent {...props} />
    </QueryProvider>
  );
}
