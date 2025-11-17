import type { APIRoute } from 'astro';
import { runConvexMutation, runConvexQuery } from '../../../lib/convex.server';
import {
  buildActingIdentity,
  ensurePageForSlug,
  getConvexUserByWorkOSId,
} from '../../../lib/wiki/convexHelpers';

function mapThread(raw: any) {
  return {
    id: raw.id,
    topic: raw.topic,
    status: raw.status,
    createdAt: raw.createdAt,
    createdBy: raw.createdBy,
    posts: raw.posts.map((post: any) => ({
      id: post.id,
      body: post.body,
      postedAt: new Date(post.postedAt ?? Date.now()).toISOString(),
      author: post.authorName,
      role: post.role?.replace('_', '-') ?? 'contributor',
    })),
  };
}

export const GET: APIRoute = async ({ url }) => {
  const slug = url.searchParams.get('slug');
  if (!slug) {
    return new Response(JSON.stringify({ message: 'Missing slug parameter' }), { status: 400 });
  }

  const threads = (await runConvexQuery<any>('talk:listThreads', { slug })) ?? [];
  return new Response(
    JSON.stringify({
      threads: threads.map(mapThread),
    }),
    { status: 200 },
  );
};

export const POST: APIRoute = async ({ request, locals, url }) => {
  try {
    const body = await request.json();
    const action: string | undefined = body?.action;
    const slug = body?.slug ?? url.searchParams.get('slug');

    if (!action || !slug) {
      return new Response(JSON.stringify({ message: 'Missing Talk action or article slug.' }), {
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

    if (action === 'reply') {
      const threadId: string | undefined = body?.threadId;
      const comment: string | undefined = body?.comment;

      if (!threadId || !comment) {
        return new Response(JSON.stringify({ message: 'Missing threadId or comment for reply.' }), {
          status: 400,
        });
      }

      await runConvexMutation(
        'talk:addMessage',
        {
          threadId,
          body: comment,
        },
        { actingAs: actingIdentity },
      );
    } else if (action === 'thread') {
      const topic: string | undefined = body?.topic;
      const comment: string | undefined = body?.comment;
      if (!topic) {
        return new Response(JSON.stringify({ message: 'Missing topic for new thread.' }), {
          status: 400,
        });
      }
      await runConvexMutation(
        'talk:createThread',
        {
          slug,
          topic,
          body: comment,
        },
        { actingAs: actingIdentity },
      );
    } else {
      return new Response(JSON.stringify({ message: `Unsupported action: ${action}` }), { status: 400 });
    }

    const threads = (await runConvexQuery<any>('talk:listThreads', { slug })) ?? [];
    return new Response(
      JSON.stringify({
        threads: threads.map(mapThread),
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error('Talk action failed', error);
    return new Response(JSON.stringify({ message: 'Failed to update Talk thread.' }), { status: 500 });
  }
};
