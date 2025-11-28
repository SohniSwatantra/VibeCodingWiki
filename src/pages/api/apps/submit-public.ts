import type { APIRoute } from 'astro';
import { runConvexMutation } from '../../../lib/convex.server';

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

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, category, categoryOther, description, builtIn, builtInOther } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'App name is required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!category || !CATEGORIES.includes(category)) {
      return new Response(
        JSON.stringify({ success: false, message: `Invalid category. Must be one of: ${CATEGORIES.join(', ')}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (category === 'Others' && (!categoryOther || categoryOther.trim().length === 0)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Please specify the category when selecting "Others".' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'Description is required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!builtIn || !BUILD_TOOLS.includes(builtIn)) {
      return new Response(
        JSON.stringify({ success: false, message: `Invalid tool. Must be one of: ${BUILD_TOOLS.join(', ')}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (builtIn === 'Others' && (!builtInOther || builtInOther.trim().length === 0)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Please specify the tool when selecting "Others".' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Submit to Convex (public mutation, no auth required)
    const result = await runConvexMutation(
      'apps:submitAppPublic',
      {
        name: name.trim(),
        category,
        categoryOther: categoryOther?.trim(),
        description: description.trim(),
        builtIn,
        builtInOther: builtInOther?.trim(),
      },
      { useAdmin: true }
    );

    if (!result) {
      return new Response(
        JSON.stringify({ success: false, message: 'Failed to submit app. Please try again.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        appId: result.appId,
        message: 'App submitted successfully! It will be reviewed before being published.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to submit app.';
    return new Response(
      JSON.stringify({ success: false, message: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
