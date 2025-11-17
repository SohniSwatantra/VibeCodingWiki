import type { APIRoute } from 'astro';
import { readDocument, writeDocument } from '../../lib/files';

export const GET: APIRoute = async () => {
  try {
    const markdown = await readDocument('spec');
    return new Response(
      JSON.stringify({
        content: markdown,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error('Failed to load specification', error);
    return new Response(JSON.stringify({ message: 'Unable to load specification.' }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const payload = await request.json();
    const content = typeof payload?.content === 'string' ? payload.content : '';
    if (!content.trim()) {
      return new Response(JSON.stringify({ message: 'Specification cannot be empty.' }), { status: 400 });
    }

    await writeDocument('spec', content);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Failed to save specification', error);
    return new Response(JSON.stringify({ message: 'Unable to save specification.' }), { status: 500 });
  }
};

