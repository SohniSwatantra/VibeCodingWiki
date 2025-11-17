import type { APIRoute } from 'astro';
import { runConvexQuery } from '../../../lib/convex.server';
import { loadUserProfiles } from '../../../lib/wiki/convexHelpers';

function normalizeStatus(status: string | undefined) {
  if (status === 'approved') return 'published';
  return status ?? 'pending';
}

export const GET: APIRoute = async ({ url }) => {
  const slug = url.searchParams.get('slug');
  if (!slug) {
    return new Response(JSON.stringify({ message: 'Missing slug parameter' }), {
      status: 400,
    });
  }

  const entry = await runConvexQuery<any>('pages:getPageBySlug', { slug });
  if (!entry?.page) {
    return new Response(JSON.stringify({ revisions: [] }), {
      status: 200,
    });
  }

  const history =
    (await runConvexQuery<any>('pages:getRevisionHistory', {
      pageId: entry.page._id,
      limit: 100,
    })) ?? [];

  const userIds = history.map((revision: any) => revision.createdBy).filter(Boolean);
  const profiles = await loadUserProfiles(userIds);

  const revisions = history.map((revision: any) => {
    const profile = profiles.find((user: any) => user.id === revision.createdBy);
    const username = (profile?.displayName ?? 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-');

    return {
      id: revision._id,
      summary: revision.summary ?? '(No summary provided)',
      editor: username,
      editorDisplayName: profile?.displayName ?? 'Unknown contributor',
      role: profile?.primaryRole?.replace('_', '-') ?? 'contributor',
      editedAt: new Date(revision.createdAt ?? Date.now()).toISOString(),
      status: normalizeStatus(revision.status),
    };
  });

  return new Response(
    JSON.stringify({
      pageId: entry.page._id,
      revisions,
    }),
    {
      status: 200,
    },
  );
};
