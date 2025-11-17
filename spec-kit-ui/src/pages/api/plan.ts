import type { APIRoute } from 'astro';
import { readDocument, writeDocument } from '../../lib/files';

export const GET: APIRoute = async () => {
  try {
    const markdown = await readDocument('plan');
    return new Response(
      JSON.stringify({
        content: markdown,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error('Failed to load plan', error);
    return new Response(JSON.stringify({ message: 'Unable to load plan.' }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const payload = await request.json();
    const content = typeof payload?.content === 'string' ? payload.content : '';
    if (!content.trim()) {
      return new Response(JSON.stringify({ message: 'Plan cannot be empty.' }), { status: 400 });
    }

    await writeDocument('plan', content);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Failed to save plan', error);
    return new Response(JSON.stringify({ message: 'Unable to save plan.' }), { status: 500 });
  }
};

