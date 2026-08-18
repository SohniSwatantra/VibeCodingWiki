import type { APIRoute } from 'astro';
import { runConvexMutation } from '../../../lib/convex.server';
import { buildActingIdentity, getConvexUserByWorkOSId } from '../../../lib/wiki/convexHelpers';
import { markdownToSections } from '../../../lib/markdown/parsePageContent';

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) return new Response(JSON.stringify({ message: 'Authentication required.' }), { status: 401 });
  const user = await getConvexUserByWorkOSId(locals.user.id);
  if (!user) return new Response(JSON.stringify({ message: 'Contributor profile not found.' }), { status: 403 });

  try {
    const body = await request.json();
    const title = String(body?.title ?? '').trim();
    const content = String(body?.outline ?? '').trim();
    const category = String(body?.category ?? '').trim();
    if (title.length < 3 || content.length < 20 || !category) {
      return new Response(JSON.stringify({ message: 'Provide a title, category, and an outline of at least 20 characters.' }), { status: 400 });
    }
    const parsed = markdownToSections(content);
    const result = await runConvexMutation('pages:createPage', {
      title,
      namespace: 'Main',
      summary: `Proposed new ${category} page`,
      content,
      sections: parsed.sections,
      timeline: parsed.timeline,
      tags: [category.toLowerCase().replace(/\s+/g, '-')],
    }, { actingAs: buildActingIdentity(locals.user, user) });
    return new Response(JSON.stringify({ success: true, ...result }), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to submit page proposal.';
    return new Response(JSON.stringify({ message }), { status: 400 });
  }
};
