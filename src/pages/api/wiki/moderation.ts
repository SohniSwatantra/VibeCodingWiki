import type { APIRoute } from 'astro';
import { runConvexMutation, runConvexQuery } from '../../../lib/convex.server';
import {
  buildActingIdentity,
  ensurePageForSlug,
  getConvexUserByWorkOSId,
  loadUserProfiles,
} from '../../../lib/wiki/convexHelpers';

function extractEntries(data: any) {
  if (!data?.revisions) return [];
  return data.revisions.map((item: any) => {
    const author = item.author;
    const roles = item.roles ?? [];
    const rolePriority = ['super_admin', 'moderator', 'contributor', 'reader'];
    const primaryRole = roles
      .map((role: any) => role.role)
      .sort((a: string, b: string) => rolePriority.indexOf(a) - rolePriority.indexOf(b))[0] ?? 'contributor';

    return {
      id: item.revision._id,
      summary: item.revision.summary ?? '(No summary provided)',
      details: item.revision.content,
      contributor: author?.displayName ?? 'Unknown contributor',
      role: primaryRole.replace('_', '-') ?? 'contributor',
      editedAt: new Date(item.revision.createdAt ?? Date.now()).toISOString(),
      status: item.revision.status,
      metadata: item.revision.metadata ?? {},
      // Diff data for visualization
      diffStats: item.revision.diffStats,
      diffContent: item.revision.diffContent,
      baseRevisionId: item.revision.baseRevisionId,
    };
  });
}

export const GET: APIRoute = async ({ url }) => {
  const slug = url.searchParams.get('slug');
  if (!slug) {
    return new Response(JSON.stringify({ message: 'Missing slug parameter' }), { status: 400 });
  }

  const queue = await runConvexQuery<any>('pages:getModerationQueue', { slug });
  const pageId = queue?.page?._id ?? null;
  const entries = extractEntries(queue);

  // Get the current approved content for diff comparison
  let approvedContent = '';
  if (queue?.page?.approvedRevisionId) {
    const approvedRevision = await runConvexQuery<any>('pages:getRevisionById', {
      revisionId: queue.page.approvedRevisionId,
    });
    approvedContent = approvedRevision?.content || '';
  }

  return new Response(
    JSON.stringify({
      pageId,
      entries,
      approvedContent, // Current approved content for diff comparison
    }),
    { status: 200 },
  );
};

export const POST: APIRoute = async ({ request, locals, url }) => {
  try {
    const body = await request.json();
    const action: string | undefined = body?.action;
    const slug = body?.slug ?? url.searchParams.get('slug');
    const revisionId: string | undefined = body?.revisionId;
    const reason: string | undefined = body?.reason;

    if (!action || !slug) {
      return new Response(JSON.stringify({ message: 'Missing moderation action or article slug.' }), {
        status: 400,
      });
    }

    const workosUser = locals.user;
    if (!workosUser) {
      return new Response(JSON.stringify({ message: 'Authentication required.' }), { status: 401 });
    }

    const convexUser = await getConvexUserByWorkOSId(workosUser.id);
    if (!convexUser) {
      return new Response(JSON.stringify({ message: 'Unable to find your contributor profile in Convex.' }), {
        status: 403,
      });
    }

    const actingIdentity = buildActingIdentity(workosUser, convexUser);
    const entry = await ensurePageForSlug(slug, actingIdentity);
    if (!entry?.page) {
      return new Response(JSON.stringify({ message: 'Article not found.' }), { status: 404 });
    }

    if (action === 'approve') {
      if (!revisionId) {
        return new Response(JSON.stringify({ message: 'Revision ID required to approve.' }), { status: 400 });
      }
      await runConvexMutation('pages:approveRevision', { revisionId }, { actingAs: actingIdentity });
    } else if (action === 'reject') {
      if (!revisionId) {
        return new Response(JSON.stringify({ message: 'Revision ID required to reject.' }), { status: 400 });
      }
      await runConvexMutation(
        'pages:rejectRevision',
        {
          revisionId,
          reason,
        },
        { actingAs: actingIdentity },
      );
    } else if (action === 'rollback') {
      await runConvexMutation(
        'pages:rollbackLatestApproval',
        {
          pageId: entry.page._id,
        },
        { actingAs: actingIdentity },
      );
    } else {
      return new Response(JSON.stringify({ message: `Unsupported action: ${action}` }), { status: 400 });
    }

    const updated = await runConvexQuery<any>('pages:getModerationQueue', { slug });
    const entries = extractEntries(updated);

    const contributorIds = entries
      .map((item: any) => item.metadata?.createdBy ?? null)
      .filter(Boolean);

    if (contributorIds.length > 0) {
      await loadUserProfiles(contributorIds);
    }

    return new Response(
      JSON.stringify({
        success: true,
        entries,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error('Moderation action failed', error);
    return new Response(JSON.stringify({ message: 'Failed to apply moderation action.' }), { status: 500 });
  }
};
