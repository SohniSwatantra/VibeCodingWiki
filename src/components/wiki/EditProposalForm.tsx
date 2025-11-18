import React, { useMemo, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FormEvent } from 'react';
import { QueryProvider } from '../providers/QueryProvider';

type Proposal = {
  id: string;
  contributor: string;
  summary: string;
  details: string;
  createdAt: string;
  role: 'super-admin' | 'moderator' | 'contributor' | 'reader';
  status: 'pending' | 'published' | 'rejected';
};

type EditProposalFormProps = {
  articleSlug: string;
  isAuthenticated?: boolean;
  userRole?: 'super_admin' | 'moderator' | 'contributor' | 'reader';
};

type ProposalPayload = {
  proposals: Proposal[];
};

/**
 * EditProposalForm collects suggested improvements from contributors.
 * Submissions are stored in-memory for now and displayed beneath the form
 * to emulate a collaborative workflow until Convex persistence is added.
 */
function EditProposalFormContent({ articleSlug, isAuthenticated = true, userRole = 'reader' }: EditProposalFormProps) {
  const [contributor, setContributor] = useState('');
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const queryClient = useQueryClient();

  // Debug: Log authentication status
  useEffect(() => {
    console.log('[AUTH] isAuthenticated prop:', isAuthenticated);
  }, [isAuthenticated]);

  // Fetch current page content to pre-fill the editor
  const { data: pageData, isLoading: isLoadingPageData } = useQuery({
    queryKey: ['wiki-page-content', articleSlug],
    queryFn: async () => {
      console.log('[CONTENT] Fetching page content for slug:', articleSlug);
      const response = await fetch(`/api/wiki/proposals?slug=${encodeURIComponent(articleSlug)}`);
      if (!response.ok) {
        console.error('[CONTENT] Failed to fetch page content, status:', response.status);
        throw new Error('Failed to load page content');
      }
      const payload = await response.json();
      console.log('[CONTENT] Received payload:', payload);
      console.log('[CONTENT] Approved content length:', payload.approvedContent?.length || 0);
      // Use the approvedContent field directly from the API
      return {
        currentContent: payload.approvedContent || '',
        pageId: payload.pageId,
      };
    },
    staleTime: 1000 * 30,
    retry: 2, // Retry failed requests
    retryDelay: 1000, // Wait 1 second between retries
  });

  // Pre-fill the details field with current content when it loads
  useEffect(() => {
    if (pageData !== undefined && isLoadingContent) {
      console.log('[CONTENT] Pre-filling editor with content, length:', pageData.currentContent?.length || 0);
      setDetails(pageData.currentContent || '');
      setIsLoadingContent(false);
    }
  }, [pageData, isLoadingContent]);

  // Also stop loading if the query finishes (even with empty content)
  useEffect(() => {
    if (!isLoadingPageData && isLoadingContent) {
      console.log('[CONTENT] Query finished, stopping loading state');
      console.log('[CONTENT] Current details length:', details.length);
      console.log('[CONTENT] Page data content length:', pageData?.currentContent?.length || 0);
      // If details is still empty, force populate it
      if (!details || details.length === 0) {
        setDetails(pageData?.currentContent || '');
      }
      setIsLoadingContent(false);
    }
  }, [isLoadingPageData, isLoadingContent, details, pageData]);

  const normalizeRole = (role: string | undefined): Proposal['role'] => {
    const formatted = role?.replace(/_/g, '-') ?? 'contributor';
    if (formatted === 'super-admin' || formatted === 'moderator' || formatted === 'contributor' || formatted === 'reader') {
      return formatted;
    }
    return 'contributor';
  };

  const normalizeStatus = (status: string | undefined): Proposal['status'] => {
    if (!status) return 'pending';
    if (status === 'approved' || status === 'published') return 'published';
    if (status === 'rejected') return 'rejected';
    return 'pending';
  };

  const mapProposal = (proposal: any, fallbackContributor?: string): Proposal => ({
    id: proposal.id,
    contributor: proposal.contributor ?? fallbackContributor ?? 'Unknown contributor',
    summary: proposal.summary ?? '(No summary provided)',
    details: proposal.details ?? '',
    createdAt: proposal.createdAt ?? new Date().toISOString(),
    role: normalizeRole(proposal.role),
    status: normalizeStatus(proposal.status),
  });

  const { data, isLoading, isError } = useQuery<ProposalPayload>({
    queryKey: ['wiki-proposals', articleSlug],
    queryFn: async () => {
      const response = await fetch(`/api/wiki/proposals?slug=${encodeURIComponent(articleSlug)}`);
      if (!response.ok) {
        throw new Error('Failed to load proposals');
      }
      const payload = await response.json();
      const mapped: Proposal[] = (payload?.proposals ?? []).map((proposal: any) => mapProposal(proposal));
      return { proposals: mapped };
    },
    staleTime: 1000 * 30,
  });

  const proposals = useMemo(() => data?.proposals ?? [], [data]);

  const proposalMutation = useMutation({
    mutationFn: async (body: { summary: string; details: string; alias?: string }) => {
      try {
        const startTime = Date.now();
        console.log('[CLIENT] Starting proposal submission at', new Date().toISOString());
        
        // Log the current origin and construct the full URL
        const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
        const apiUrl = '/api/wiki/proposals';
        const fullUrl = currentOrigin ? `${currentOrigin}${apiUrl}` : apiUrl;
        console.log('[CLIENT] Current origin:', currentOrigin);
        console.log('[CLIENT] Fetch URL:', fullUrl);
        
        const controller = new AbortController();
        // Server has 8s Convex timeouts + overhead, so 20s should be sufficient
        // If it takes longer, something is wrong and we should fail fast
        const timeoutId = setTimeout(() => {
          console.log('[CLIENT] Aborting request after 20 seconds');
          controller.abort();
        }, 20000); // 20 second timeout - should be enough for server processing
        
        console.log('[CLIENT] Sending fetch request to:', fullUrl);
        console.log('[CLIENT] Request payload:', {
          articleSlug,
          summary: body.summary,
          details: body.details?.substring(0, 100) + '...',
          alias: body.alias,
        });
        
        const response = await fetch(fullUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            articleSlug,
            summary: body.summary,
            details: body.details,
            alias: body.alias,
          }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        console.log(`[CLIENT] Received response in ${Date.now() - startTime}ms, status: ${response.status}`);

        if (!response.ok) {
          if (response.status === 401) {
            // Session expired or user not authenticated - redirect to login
            const searchParams = new URLSearchParams({ next: `/wiki/${articleSlug}` });
            window.location.href = `/login?${searchParams.toString()}`;
            throw new Error('Redirecting to login...');
          }
          if (response.status === 504) {
            // Gateway Timeout - server took too long
            const payload = await response.json().catch(() => ({ message: 'Request timed out.' }));
            throw new Error(payload?.message ?? 'The request took too long to process. Please try again.');
          }
          const payload = await response.json().catch(() => ({ message: 'Failed to submit proposal.' }));
          const errorMessage = payload?.message ?? `Failed to submit proposal (${response.status}).`;
          console.error('Proposal submission failed:', errorMessage, payload);
          throw new Error(errorMessage);
        }

        return (await response.json()) as { proposal?: any };
      } catch (error) {
        console.error('Proposal mutation error:', error);
        // Handle client-side timeout (AbortError)
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timed out after 20 seconds. The server may be experiencing issues. Please try again in a moment.');
        }
        // Re-throw server errors (including 504 Gateway Timeout) as-is
        throw error;
      }
    },
    onSuccess: async (payload) => {
      console.log('[MUTATION] onSuccess triggered with payload:', payload);
      // Simply refetch the data from the server instead of trying to optimistically update
      // This avoids potential data structure mismatches and ensures we have the correct data
      await queryClient.invalidateQueries({ queryKey: ['wiki-proposals', articleSlug] });
      setContributor('');
      setSummary('');
      setDetails('');
      setNotice('Proposal captured! A moderator will review it shortly.');
      console.log('[MUTATION] onSuccess completed');
    },
    onError: (error: unknown) => {
      console.error('[MUTATION] onError triggered:', error);
      const message = error instanceof Error ? error.message : 'We ran into a problem saving your proposal. Please try again.';
      console.error('[MUTATION] Error message:', message);
      setNotice(message);
    },
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    console.log('[FORM] handleSubmit called');
    event.preventDefault();
    console.log('[FORM] preventDefault called');

    // Removed client-side auth check - backend will handle 401 errors
    // This avoids hydration issues with the isAuthenticated prop

    if (!summary || !details) {
      console.log('[FORM] Missing fields - summary:', !!summary, 'details:', !!details);
      setNotice('Please complete every field before submitting your proposal.');
      return;
    }

    console.log('[FORM] Calling mutation with:', { summary, details, alias: contributor || undefined });
    setNotice(null);
    proposalMutation.mutate({
      summary,
      details,
      alias: contributor || undefined,
    });
    console.log('[FORM] Mutation called, isPending:', proposalMutation.isPending);
  };

  // Hide form for non-authenticated users
  if (!isAuthenticated) {
    return (
      <section id="propose-edit" className="rounded border border-[#c8ccd1] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[#202122]">Propose an edit</h2>
        <p className="mt-2 text-sm text-[#54595d]">
          Sign in to propose edits to this page. Your contributions will be reviewed by moderators before being published.
        </p>
        <a
          href={`/login?next=${encodeURIComponent(`/wiki/${articleSlug}`)}`}
          className="mt-4 inline-block rounded border border-[#3366cc] bg-[#3366cc] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#254a99]"
        >
          Sign in to propose edit
        </a>
      </section>
    );
  }

  return (
    <section id="propose-edit" className="rounded border border-[#c8ccd1] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-[#202122]">Propose an edit</h2>
      <p className="mt-2 text-sm text-[#54595d]">
        The editor below is pre-filled with the current page content. Make your changes directly, and moderators will review a highlighted diff showing exactly what changed.
      </p>

      {isLoadingContent && (
        <p className="mt-3 text-xs text-[#72777d]">Loading current content...</p>
      )}

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#72777d]" htmlFor="proposal-contributor">
            Your contributor handle
          </label>
          <input
            id="proposal-contributor"
            value={contributor}
            onChange={(event) => setContributor(event.target.value)}
            className="mt-1 w-full rounded border border-[#a2a9b1] bg-white px-3 py-2 text-sm text-[#202122] focus:border-[#3366cc] focus:outline-none"
            placeholder="e.g. luna"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#72777d]" htmlFor="proposal-summary">
            Edit summary
          </label>
          <input
            id="proposal-summary"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            className="mt-1 w-full rounded border border-[#a2a9b1] bg-white px-3 py-2 text-sm text-[#202122] focus:border-[#3366cc] focus:outline-none"
            placeholder="Describe the change in one sentence"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#72777d]" htmlFor="proposal-details">
            Page content (edit directly)
          </label>
          <textarea
            id="proposal-details"
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            rows={12}
            className="mt-1 w-full rounded border border-[#a2a9b1] bg-white px-3 py-2 text-sm text-[#202122] font-mono focus:border-[#3366cc] focus:outline-none"
            placeholder={isLoadingContent ? "Loading current content..." : "Edit the page content..."}
            disabled={isLoadingContent}
          />
          <p className="mt-1 text-xs text-[#72777d]">
            ✏️ Make your edits above. Moderators will see a diff highlighting additions (green) and deletions (red).
          </p>
        </div>

        {isLoadingContent && (
          <p className="text-sm text-[#72777d]">
            ⏳ Loading current page content...
          </p>
        )}

        <button
          type="submit"
          className="rounded border border-[#3366cc] bg-[#3366cc] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#254a99] disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={proposalMutation.isPending || isLoadingContent}
        >
          {proposalMutation.isPending ? 'Submitting…' : isLoadingContent ? 'Loading content…' : 'Submit proposal'}
        </button>
      </form>

      {notice && <p className="mt-3 text-xs text-[#0b0080]">{notice}</p>}
      {isError && <p className="mt-3 text-xs text-[#d33f3f]">Unable to load existing proposals right now.</p>}

      {isLoading && proposals.length === 0 ? (
        <p className="mt-4 text-xs text-[#72777d]">Loading existing proposals…</p>
      ) : null}
      {!isLoading && proposals.length === 0 && !isError ? (
        <p className="mt-4 text-xs text-[#72777d]">No proposals yet—share the first revision!</p>
      ) : null}

      {proposals.length > 0 && (
        <div className="mt-5 rounded border border-[#eaecf0] bg-[#f8f9fa] p-3">
          <h3 className="text-sm font-semibold text-[#202122]">Recent proposals</h3>
          <ul className="mt-2 space-y-2 text-sm text-[#202122]">
            {proposals.map((proposal) => (
              <li key={proposal.id} className="rounded border border-[#c8ccd1] bg-white p-3">
                <p className="text-xs text-[#72777d]">
                  {proposal.contributor} · {new Date(proposal.createdAt).toLocaleString()} · {proposal.role.replace('-', ' ')}
                </p>
                <p className="mt-1 font-semibold">{proposal.summary}</p>
                {/* Show full details only to super_admins */}
                {userRole === 'super_admin' ? (
                  <>
                    <p className="mt-1 text-sm text-[#54595d]">{proposal.details}</p>
                    <p className="mt-2 text-xs text-[#54595d]">Status: {proposal.status}</p>
                  </>
                ) : (
                  <p className="mt-2 text-xs text-[#54595d]">
                    Status: <span className={`font-semibold ${
                      proposal.status === 'published' ? 'text-[#008000]' :
                      proposal.status === 'pending' ? 'text-[#f4a500]' :
                      'text-[#d33f3f]'
                    }`}>{proposal.status}</span>
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export function EditProposalForm(props: EditProposalFormProps) {
  return (
    <QueryProvider>
      <EditProposalFormContent {...props} />
    </QueryProvider>
  );
}

