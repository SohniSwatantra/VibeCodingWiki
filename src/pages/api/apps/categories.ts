import type { APIRoute } from 'astro';

const CATEGORIES = [
  'Games',
  'Tech',
  'Health',
  'Travel',
  'Habits',
  'Productivity',
  'Others',
];

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      success: true,
      categories: CATEGORIES,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
