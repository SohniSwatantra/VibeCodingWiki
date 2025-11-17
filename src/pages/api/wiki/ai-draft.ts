import type { APIRoute } from 'astro';
import { runConvexMutation } from '../../../lib/convex.server';
import {
  buildActingIdentity,
  ensurePageForSlug,
  getConvexUserByWorkOSId,
} from '../../../lib/wiki/convexHelpers';
import { generateStructuredWikiContent } from '../../../lib/openai/client.server';
import { articles as fallbackArticles } from '../../../data/articles';

type DraftRequest = {
  slug: string;
  summaryHint?: string;
  refresh?: boolean;
};

function sanitiseMarkdown(value: string): string {
  return value.replace(/\s+$/g, '').trim();
}

function fallbackSectionsForSlug(slug: string) {
  const article = fallbackArticles.find((item) => item.slug === slug);
  if (!article) return [];
  return (article.sections ?? []).map((section, index) => ({
    id: (section as any).id ?? `section-${index + 1}`,
    title: section.heading ?? `Section ${index + 1}`,
    level: (section as any).level ?? 2,
    markdown: section.content ?? '',
  }));
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = (await request.json()) as DraftRequest;
    const slug = body?.slug?.trim();

    if (!slug) {
      return new Response(JSON.stringify({ message: 'Article slug is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const workosUser = locals.user;
    if (!workosUser) {
      return new Response(JSON.stringify({ message: 'Authentication required.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const convexUser = await getConvexUserByWorkOSId(workosUser.id);
    if (!convexUser) {
      return new Response(JSON.stringify({ message: 'Unable to locate your contributor profile in Convex.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const actingIdentity = buildActingIdentity(workosUser, convexUser);
    const entry = await ensurePageForSlug(slug, actingIdentity);

    if (!entry?.page) {
      return new Response(JSON.stringify({ message: 'Article not found.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const baseSections = (entry.approvedRevision?.sections as Array<{ id?: string; title?: string; level?: number; markdown?: string }> | undefined)
      ?.map((section, index) => {
        const baseId = (section as any).id ?? `section-${index + 1}`;
        const baseTitle = section.title ?? `Section ${index + 1}`;
        return {
          id: baseId,
          title: baseTitle,
          level: section.level ?? 2,
          markdown: section.markdown ?? '',
        };
      }) ?? fallbackSectionsForSlug(slug);

    const summaryBaseline = entry.approvedRevision?.summary ?? entry.page.summary ?? body.summaryHint ?? '';

    if (baseSections.length === 0) {
      return new Response(JSON.stringify({ message: 'No section structure found to populate.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const prompt = `Write factual, citation-backed wiki copy for the article "${entry.page.title}".
Context summary: ${summaryBaseline || 'None provided'}.
The article must retain the exact section identifiers and titles listed below. Provide 2-3 paragraphs per section, emphasising the culture, history, tools, companies, hackathons, tutorials, and best practices for VibeCoding. Highlight verifiable events (for example Andrej Karpathy's February 2025 "vibe coding" post) and include concrete sources.

Return JSON that matches the provided schema. Do not change ids or titles.

Sections:
${baseSections
      .map((section) => `- id: ${section.id}\n  title: ${section.title}\n  existingMarkdown: ${section.markdown?.slice(0, 200) || '(empty)'}`)
      .join('\n')}

Include at least three sources with URLs, and rebuild the timeline to reflect key milestones.`;

    const draft = await generateStructuredWikiContent(prompt);

    const mergedSections = baseSections.map((section) => {
      const updated = draft.sections.find((item) => item.id === section.id);
      return {
        id: section.id,
        title: section.title,
        level: section.level,
        markdown: sanitiseMarkdown(updated?.markdown ?? section.markdown ?? ''),
      };
    });

    const combinedContent = mergedSections
      .map((section) => `## ${section.title}\n\n${section.markdown}`)
      .join('\n\n');

    const mutationPayload = await runConvexMutation(
      'pages:submitRevision',
      {
        pageId: entry.page._id,
        content: combinedContent,
        summary: draft.summary ?? summaryBaseline,
        sections: mergedSections,
        tags: entry.approvedRevision?.tags ?? entry.page.tags ?? [],
        timeline: draft.metadata?.timeline ?? entry.approvedRevision?.timeline ?? [],
        relatedTopics: entry.approvedRevision?.relatedTopics ?? [],
        metadata: {
          generatedBy: 'openai',
          model: 'gpt-5',
          sources: draft.metadata?.sources ?? [],
          timeline: draft.metadata?.timeline ?? entry.approvedRevision?.metadata?.timeline ?? [],
        },
      },
      { actingAs: actingIdentity },
    );

    return new Response(
      JSON.stringify({
        success: true,
        revision: mutationPayload,
        draft,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Failed to generate OpenAI draft', error);
    return new Response(JSON.stringify({ message: 'Failed to generate draft content.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

