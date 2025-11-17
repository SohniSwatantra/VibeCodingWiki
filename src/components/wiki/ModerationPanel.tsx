import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RoleBadge } from './RoleBadge.tsx';
import { QueryProvider } from '../providers/QueryProvider';
import { DiffViewer, DiffStatsBadge, type DiffStats } from './DiffViewer.tsx';

type ModerationEntry = {
  id: string;
  summary: string;
  details: string; // Full proposed content
  contributor: string;
  role: 'super-admin' | 'moderator' | 'contributor' | 'reader';
  editedAt: string;
  status: 'published' | 'pending' | 'rejected';
  decision?: 'approved' | 'rejected' | 'rolled-back';
  notes?: string;
  // Diff tracking
  diffStats?: DiffStats;
  diffContent?: string;
  baseRevisionId?: string;
};

type ModerationPanelProps = {
  articleSlug: string;
  canModerate?: boolean;
};

function normalizeRole(role: string | undefined): ModerationEntry['role'] {
  const formatted = role?.replace(/_/g, '-') ?? 'contributor';
  if (formatted === 'super-admin' || formatted === 'moderator' || formatted === 'contributor' || formatted === 'reader') {
    return formatted;
  }
  return 'contributor';
}

function normalizeStatus(status: string | undefined): ModerationEntry['status'] {
  if (!status) return 'pending';
  if (status === 'approved' || status === 'published') return 'published';
  if (status === 'rejected') return 'rejected';
  return 'pending';
}

type ModerationPayload = {
  entries: ModerationEntry[];
  approvedContent: string; // Current approved content for diff comparison
};

function ModerationPanelContent({ articleSlug, canModerate = true }: ModerationPanelProps) {
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mapEntry = (entry: any): ModerationEntry => ({
    id: entry.id,
    summary: entry.summary ?? '(No summary provided)',
    details: entry.details ?? '',
    contributor: entry.contributor ?? 'Unknown contributor',
    role: normalizeRole(entry.role),
    editedAt: entry.editedAt ?? new Date().toISOString(),
    status: normalizeStatus(entry.status),
    decision: entry.decision,
    notes: entry.notes,
    diffStats: entry.diffStats,
    diffContent: entry.diffContent,
    baseRevisionId: entry.baseRevisionId,
  });

  const { data, isLoading, isError } = useQuery<ModerationPayload>({
    queryKey: ['wiki-moderation', articleSlug],
    queryFn: async () => {
      const response = await fetch(`/api/wiki/moderation?slug=${encodeURIComponent(articleSlug)}`);
      if (!response.ok) {
        throw new Error('Failed to load moderation queue');
      }
      const payload = await response.json();
      const mapped: ModerationEntry[] = (payload?.entries ?? []).map(mapEntry);
      return {
        entries: mapped,
        approvedContent: payload?.approvedContent ?? '',
      };
    },
    staleTime: 1000 * 15,
  });

  const entries = useMemo(() => data?.entries ?? [], [data]);
  const approvedContent = useMemo(() => data?.approvedContent ?? '', [data]);

  const moderationMutation = useMutation({
    mutationFn: async (input: { action: 'approve' | 'reject' | 'rollback'; revisionId?: string }) => {
      const response = await fetch('/api/wiki/moderation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: input.action,
          slug: articleSlug,
          revisionId: input.revisionId,
          reason: input.action === 'reject' ? 'Needs more supporting citations.' : undefined,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in with a moderator account to review edits.');
        }
        const payload = await response.json().catch(() => ({ message: 'Failed to apply moderation action.' }));
        throw new Error(payload?.message ?? 'Failed to apply moderation action.');
      }

      return await response.json();
    },
    onSuccess: (payload) => {
      const mapped: ModerationEntry[] = (payload?.entries ?? []).map(mapEntry);
      queryClient.setQueryData<ModerationPayload>(['wiki-moderation', articleSlug], {
        entries: mapped,
        approvedContent: payload?.approvedContent ?? approvedContent,
      });
      setActionError(null);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Moderation action failed. Please try again.';
      setActionError(message);
    },
    onSettled: () => {
      setActiveAction(null);
    },
  });

  const applyModeration = (action: 'approve' | 'reject' | 'rollback', revisionId?: string) => {
    if (!canModerate) return;
    const actionKey = `${action}-${revisionId ?? 'all'}`;
    setActiveAction(actionKey);
    moderationMutation.mutate({ action, revisionId });
  };

  const approve = (id: string) => {
    applyModeration('approve', id);
  };

  const reject = (id: string) => {
    applyModeration('reject', id);
  };

  const rollback = () => {
    applyModeration('rollback');
  };

  const pending = entries.filter((entry) => entry.status === 'pending');
  const historical = entries.filter((entry) => entry.status !== 'pending');

  return (
    <section className="rounded border border-[#c8ccd1] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#202122]">Moderation queue</h2>
          <p className="text-xs text-[#54595d]">
            Approve or reject proposals. Rollbacks move the latest published edit back to review.
          </p>
        </div>
        <button
          type="button"
          className="self-start rounded border border-[#d33f3f] bg-[#d33f3f] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#a82f2f] disabled:opacity-60"
          onClick={rollback}
          disabled={!canModerate || isLoading || activeAction !== null}
        >
          Rollback latest publish
        </button>
      </div>

      {isLoading ? <p className="mt-3 text-xs text-[#72777d]">Loading moderation queue…</p> : null}
      {isError ? <p className="mt-3 text-xs text-[#d33f3f]">Unable to load the moderation queue right now.</p> : null}
      {actionError ? <p className="mt-1 text-xs text-[#d33f3f]">{actionError}</p> : null}

      <div className="mt-4 space-y-3">
        {pending.length === 0 && !isLoading ? (
          <p className="text-sm text-[#54595d]">No pending submissions. Great job staying on top of reviews!</p>
        ) : (
          pending.map((entry) => (
            <article key={entry.id} className="rounded border border-[#c8ccd1] bg-[#f8f9fa] p-4">
              <header className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[#202122]">{entry.summary}</p>
                  {entry.diffStats && (
                    <DiffStatsBadge stats={entry.diffStats} />
                  )}
                </div>
                <RoleBadge role={entry.role} />
              </header>
              <p className="text-xs text-[#72777d] mt-1">
                {entry.contributor} · {new Date(entry.editedAt).toLocaleString()}
              </p>

              {/* Diff Viewer */}
              <div className="mt-3">
                <DiffViewer
                  oldContent={approvedContent}
                  newContent={entry.details}
                  stats={entry.diffStats}
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => approve(entry.id)}
                  className="rounded border border-[#28a745] bg-[#28a745] px-3 py-1 text-white hover:bg-[#1d7f34] disabled:opacity-60"
                  disabled={!canModerate || activeAction !== null}
                >
                  Approve & publish
                </button>
                <button
                  type="button"
                  onClick={() => reject(entry.id)}
                  className="rounded border border-[#d33f3f] bg-white px-3 py-1 text-[#d33f3f] hover:bg-[#f8d7da] disabled:opacity-60"
                  disabled={!canModerate || activeAction !== null}
                >
                  Request changes
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {historical.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#72777d]">Decision log</h3>
          <ul className="mt-3 space-y-2 text-xs text-[#54595d]">
            {historical.map((entry) => (
              <li key={entry.id} className="rounded border border-[#eaecf0] bg-[#f8f9fa] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[#202122]">{entry.summary}</span>
                  <RoleBadge role={entry.role} />
                  <span>· {entry.contributor}</span>
                  <span>· {new Date(entry.editedAt).toLocaleString()}</span>
                </div>
                <p className="mt-1">
                  Decision: <strong>{entry.decision ?? entry.status}</strong>
                  {entry.notes ? ` — ${entry.notes}` : ''}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export function ModerationPanel(props: ModerationPanelProps) {
  return (
    <QueryProvider>
      <ModerationPanelContent {...props} />
    </QueryProvider>
  );
}
