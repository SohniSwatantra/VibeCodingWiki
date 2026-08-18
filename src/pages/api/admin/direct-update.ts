import type { APIRoute } from 'astro';
import { runConvexMutation } from '../../../lib/convex.server';
import { buildActingIdentity, getConvexUserByWorkOSId } from '../../../lib/wiki/convexHelpers';

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  const convexUser = await getConvexUserByWorkOSId(user.id);
  if (!convexUser?.roles?.some((assignment) => assignment.role === 'super_admin')) {
    return new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 });
  }
  
  try {
    const body = await request.json();
    const { pageId, content, sections, timeline } = body;

    if (!pageId || !content) {
      return new Response(JSON.stringify({ message: 'Missing pageId or content' }), { status: 400 });
    }

    // Call the admin mutation
    const result = await runConvexMutation('pages:adminUpdatePageContent', {
      pageId,
      content,
      sections,
      timeline,
      // Don't set a summary - keep it empty
      summary: body.summary || '',
    }, { actingAs: buildActingIdentity(user, convexUser) });

    return new Response(JSON.stringify({ success: true, result }), { status: 200 });
  } catch (error) {
    console.error('Direct update failed:', error);
    return new Response(JSON.stringify({ message: 'Update failed', error: String(error) }), { status: 500 });
  }
};
