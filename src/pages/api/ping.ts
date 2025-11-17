import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  console.error('🟢 PING GET HIT');
  return new Response('PONG GET', { status: 200 });
};

export const POST: APIRoute = async () => {
  console.error('🔴 PING POST HIT');
  return new Response('PONG POST', { status: 200 });
};

export const ALL: APIRoute = async ({ request }) => {
  console.error('🟡 PING ALL HIT, method:', request.method);
  return new Response(`PONG ${request.method}`, { status: 200 });
};
