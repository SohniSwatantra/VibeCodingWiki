import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RoleBadge } from './RoleBadge.tsx';
import { QueryProvider } from '../providers/QueryProvider';

type TalkPost = {
  id: string;
  author: string;
  role: 'super-admin' | 'moderator' | 'contributor' | 'reader';
  postedAt: string;
  body: string;
};

type TalkThread = {
  id: string;
  topic: string;
  status: 'open' | 'resolved' | 'archived';
  posts: TalkPost[];
  newComment: string;
};

type TalkBoardProps = {
  articleSlug: string;
  canParticipate?: boolean;
};

function normalizeRole(role: string | undefined): TalkPost['role'] {
  const formatted = role?.replace(/_/g, '-') ?? 'contributor';
  if (formatted === 'super-admin' || formatted === 'moderator' || formatted === 'contributor' || formatted === 'reader') {
    return formatted;
  }
  return 'contributor';
}

type TalkPayload = {
  threads: any[];
};

function TalkBoardContent({ articleSlug, canParticipate = true }: TalkBoardProps) {
  const [threads, setThreads] = useState<TalkThread[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mapThreads = (rawThreads: any[]): TalkThread[] =>
    (rawThreads ?? []).map((thread: any) => ({
      id: thread.id,
      topic: thread.topic ?? 'Discussion',
      status: thread.status === 'resolved' || thread.status === 'archived' ? thread.status : 'open',
      posts: (thread.posts ?? []).map((post: any) => ({
        id: post.id,
        author: post.author ?? 'Anonymous',
        role: normalizeRole(post.role),
        postedAt: post.postedAt ?? new Date().toISOString(),
        body: post.body ?? '',
      })),
      newComment: '',
    }));

  const { isLoading, isError } = useQuery<TalkPayload>({
    queryKey: ['wiki-talk', articleSlug],
    queryFn: async () => {
      const response = await fetch(`/api/wiki/talk?slug=${encodeURIComponent(articleSlug)}`);
      if (!response.ok) {
        throw new Error('Failed to load talk threads');
      }
      return response.json();
    },
    onSuccess: (payload) => {
      setThreads(mapThreads(payload?.threads ?? []));
    },
    staleTime: 1000 * 15,
  });

  const replyMutation = useMutation({
    mutationFn: async (input: { threadId: string; comment: string }) => {
      const response = await fetch('/api/wiki/talk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reply',
          slug: articleSlug,
          threadId: input.threadId,
          comment: input.comment,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to participate in Talk pages.');
        }
        const payload = await response.json().catch(() => ({ message: 'Failed to post reply.' }));
        throw new Error(payload?.message ?? 'Failed to post reply.');
      }

      return response.json();
    },
    onSuccess: (payload) => {
      const mapped = mapThreads(payload?.threads ?? []);
      setThreads(mapped);
      queryClient.setQueryData<TalkPayload>(['wiki-talk', articleSlug], { threads: payload?.threads ?? [] });
      setActionError(null);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'We ran into a problem posting your reply. Please try again.';
      setActionError(message);
    },
    onSettled: () => {
      setActiveThread(null);
    },
  });

  const handleCommentChange = (threadId: string, value: string) => {
    if (!canParticipate) return;
    setThreads((prev) => prev.map((thread) => (thread.id === threadId ? { ...thread, newComment: value } : thread)));
  };

  const addComment = async (threadId: string) => {
    if (!canParticipate) return;
    const thread = threads.find((item) => item.id === threadId);
    if (!thread) return;
    if (!thread.newComment.trim()) {
      setThreads((prev) =>
        prev.map((item) => (item.id === threadId ? { ...item, newComment: item.newComment.trim() } : item)),
      );
      return;
    }

    setActiveThread(threadId);
    replyMutation.mutate({ threadId, comment: thread.newComment.trim() });
  };

  return (
    <section className="rounded border border-[#c8ccd1] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-[#202122]">Talk page</h2>
      <p className="mt-1 text-xs text-[#54595d]">
        Collaborate on improvements, request citations, or flag areas needing moderator review. Threads auto-archive once marked resolved.
      </p>

      {isLoading ? <p className="mt-3 text-xs text-[#72777d]">Loading discussions…</p> : null}
      {isError ? <p className="mt-3 text-xs text-[#d33f3f]">Unable to load Talk threads right now.</p> : null}
      {actionError ? <p className="mt-3 text-xs text-[#d33f3f]">{actionError}</p> : null}

      <div className="mt-4 space-y-4">
        {threads.length === 0 && !isLoading && (
          <p className="text-sm text-[#54595d]">No discussions yet. Start one below!</p>
        )}

        {threads.map((thread) => (
          <article key={thread.id} className="rounded border border-[#eaecf0] bg-[#f8f9fa] p-4">
            <header className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#202122]">{thread.topic}</h3>
                <span
                  className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${
                    thread.status === 'open'
                      ? 'border-[#f8d7a1] bg-[#fff3cd] text-[#8a6d3b]'
                      : thread.status === 'resolved'
                      ? 'border-[#a7d7a9] bg-[#dff0d8] text-[#1b5e20]'
                      : 'border-[#c8ccd1] bg-white text-[#54595d]'
                  }`}
                >
                  {thread.status}
                </span>
              </div>
            </header>

            <ul className="mt-3 space-y-3 text-sm text-[#202122]">
              {thread.posts.map((post) => (
                <li key={post.id} className="rounded border border-[#c8ccd1] bg-white p-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#72777d]">
                    <span>{post.author}</span>
                    <RoleBadge role={post.role} />
                    <span>· {new Date(post.postedAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 text-sm text-[#202122]">{post.body}</p>
                </li>
              ))}
            </ul>

            <div className="mt-3">
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#72777d]" htmlFor={`${thread.id}-comment`}>
                Add to this thread
              </label>
              <textarea
                id={`${thread.id}-comment`}
                value={thread.newComment}
                onChange={(event) => handleCommentChange(thread.id, event.target.value)}
                rows={3}
                className="mt-1 w-full rounded border border-[#a2a9b1] bg-white px-3 py-2 text-sm text-[#202122] focus:border-[#3366cc] focus:outline-none disabled:bg-[#f0f1f2]"
                placeholder={canParticipate ? 'Share context, links, or follow-up questions.' : 'Sign in to join this discussion.'}
                disabled={!canParticipate || activeThread !== null}
              />
              <button
                type="button"
                onClick={() => addComment(thread.id)}
                className="mt-2 rounded border border-[#3366cc] bg-[#3366cc] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#254a99] disabled:opacity-60"
                disabled={!canParticipate || activeThread !== null}
              >
                {activeThread === thread.id ? 'Posting…' : 'Post reply'}
              </button>
              {!canParticipate && (
                <p className="mt-1 text-xs text-[#72777d]">
                  You need to <a className="text-[#0645ad]" href={`/login?next=/wiki/${articleSlug}/talk`}>sign in</a> to participate in Talk pages.
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function TalkBoard(props: TalkBoardProps) {
  return (
    <QueryProvider>
      <TalkBoardContent {...props} />
    </QueryProvider>
  );
}
