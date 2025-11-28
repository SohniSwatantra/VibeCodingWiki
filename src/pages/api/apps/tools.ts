import type { APIRoute } from 'astro';

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

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      success: true,
      tools: BUILD_TOOLS,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
