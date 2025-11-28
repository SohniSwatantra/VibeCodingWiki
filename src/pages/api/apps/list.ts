import type { APIRoute } from 'astro';
import { runConvexQuery } from '../../../lib/convex.server';

const BUILD_TOOLS = [
  'Lovable',
  'Bolt',
  'V0',
  'Replit',
  'Cursor',
  'CoPilot',
  'VScode',
  'Claude Code',
  'Vibe Code APP',
  'Vibingbase',
  'Base44',
  'Gemini AI Studio',
  'Others',
];

const CATEGORIES = [
  'Games',
  'Tech',
  'Health',
  'Travel',
  'Habits',
  'Productivity',
  'Others',
];

export const GET: APIRoute = async ({ url }) => {
  try {
    const builtIn = url.searchParams.get('builtIn') || undefined;
    const category = url.searchParams.get('category') || undefined;
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 100;

    // Validate builtIn if provided
    if (builtIn && !BUILD_TOOLS.includes(builtIn)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Invalid tool. Must be one of: ${BUILD_TOOLS.join(', ')}`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate category if provided
    if (category && !CATEGORIES.includes(category)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Invalid category. Must be one of: ${CATEGORIES.join(', ')}`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Query Convex for apps
    const apps = await runConvexQuery('apps:listAppsByTool', {
      builtIn,
      status: 'approved',
      limit: Math.min(limit, 100),
    });

    // If category filter is provided, filter the results
    let filteredApps = apps || [];
    if (category && Array.isArray(filteredApps)) {
      filteredApps = filteredApps.filter((app: any) => app.category === category);
    }

    return new Response(
      JSON.stringify({
        success: true,
        apps: filteredApps,
        count: filteredApps.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch apps.';
    return new Response(
      JSON.stringify({ success: false, message: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// Also support POST for convenience
export const POST: APIRoute = GET;
