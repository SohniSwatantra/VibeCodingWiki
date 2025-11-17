import type { APIRoute } from 'astro';
import { runConvexMutation, runConvexQuery } from '../../../lib/convex.server';
import {
  buildActingIdentity,
  ensurePageForSlug,
  getConvexUserByWorkOSId,
  loadUserProfiles,
} from '../../../lib/wiki/convexHelpers';
import { generateDiff, calculateDiffStats } from '../../../lib/diff/diffUtils';
import { sectionsToMarkdown, markdownToSections } from '../../../lib/markdown/parsePageContent';

function mapStatus(status: string | undefined) {
  if (status === 'approved') return 'published';
  return status ?? 'pending';
}

export const OPTIONS: APIRoute = async () => {
  // Handle CORS preflight requests
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
};

export const GET: APIRoute = async ({ url }) => {
  const slug = url.searchParams.get('slug');
  if (!slug) {
    return new Response(JSON.stringify({ message: 'Missing slug parameter' }), {
      status: 400,
    });
  }

  const entry = await runConvexQuery<any>('pages:getPageBySlug', { slug });
  if (!entry?.page) {
    return new Response(JSON.stringify({ proposals: [] }), {
      status: 200,
    });
  }

  const revisions =
    (await runConvexQuery<any>('pages:getRevisionHistory', {
      pageId: entry.page._id,
      limit: 50,
    })) ?? [];

  const contributorIds = revisions
    .map((revision: any) => revision.createdBy)
    .filter((id: any) => typeof id === 'string');

  const profiles = await loadUserProfiles(contributorIds);

  const proposals = revisions.map((revision: any) => {
    const profile = profiles.find((user: any) => user.id === revision.createdBy);
    return {
      id: revision._id,
      summary: revision.summary ?? '(No summary provided)',
      details: revision.content,
      createdAt: new Date(revision.createdAt ?? Date.now()).toISOString(),
      contributor: profile?.displayName ?? 'Unknown contributor',
      role: profile?.primaryRole ?? 'contributor',
      status: mapStatus(revision.status),
      metadata: revision.metadata ?? {},
    };
  });

  // Include the current approved content for pre-filling the editor
  // Convert structured sections and timeline to editable Markdown format
  const approvedContent = sectionsToMarkdown(
    entry.approvedRevision?.sections,
    entry.approvedRevision?.timeline,
    entry.approvedRevision?.content // Fallback to raw content if no sections
  );

  return new Response(
    JSON.stringify({
      pageId: entry.page._id,
      proposals,
      approvedContent, // Current approved content for editing (Markdown format)
    }),
    {
      status: 200,
    },
  );
};

export const POST: APIRoute = async ({ request, locals, url }) => {
  // Immediate log to confirm route handler is called - use both console.log and console.error
  const handlerStart = Date.now();
  console.error('\n🚨🚨🚨 POST HANDLER CALLED 🚨🚨🚨');
  console.error(`Time: ${new Date().toISOString()}`);
  console.error(`URL: ${url.toString()}`);
  console.error(`Method: ${request.method}`);
  console.log(`\n========== PROPOSAL SUBMISSION STARTED ==========`);
  console.log(`[${new Date().toISOString()}] Timestamp: ${handlerStart}`);
  console.log(`Request URL: ${url.toString()}`);
  console.log(`Request method: ${request.method}`);
  
  // Try to log headers safely
  try {
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log(`Request headers:`, headers);
  } catch (e) {
    console.log(`Could not log headers:`, e);
  }
  
  // Check if Convex is configured
  const convexUrl = import.meta.env.CONVEX_URL?.trim();
  if (!convexUrl) {
    console.error('CONVEX_URL is not configured');
    return new Response(
      JSON.stringify({ message: 'Server configuration error: Convex is not configured. Please contact an administrator.' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  console.log(`Convex URL configured: ${convexUrl.substring(0, 30)}...`);
  console.log(`================================================\n`);
  
  try {
    const parseStart = Date.now();
    console.log(`[${Date.now() - handlerStart}ms] Starting request body parsing...`);
    
    // Check if request body is readable
    if (!request.body) {
      console.error('Request body is null or undefined');
      return new Response(
        JSON.stringify({ message: 'Request body is missing' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Use a promise-based approach with timeout
    // Read as text first, then parse JSON (more reliable than request.json())
    let body: any;
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request body parsing timed out after 5 seconds'));
      }, 5000);
    });
    
    try {
      // Read body as text with timeout
      const bodyTextPromise = request.text();
      const bodyText = await Promise.race([bodyTextPromise, timeoutPromise]);
      
      // Parse JSON from text
      if (!bodyText || bodyText.trim() === '') {
        throw new Error('Request body is empty');
      }
      
      body = JSON.parse(bodyText);
      console.log(`[${Date.now() - parseStart}ms] Request body parsed successfully`);
    } catch (parseError) {
      const errorMsg = parseError instanceof Error ? parseError.message : String(parseError);
      console.error(`[${Date.now() - parseStart}ms] Request body parsing failed:`, errorMsg);
      if (errorMsg.includes('timed out')) {
        return new Response(
          JSON.stringify({ message: 'Request body parsing timed out. Please try again with a smaller payload.' }),
          { 
            status: 408,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      return new Response(
        JSON.stringify({ message: `Failed to parse request body: ${errorMsg}` }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    const slug = body?.articleSlug ?? url.searchParams.get('slug');
    const summary: string | undefined = body?.summary;
    const details: string | undefined = body?.details;
    const alias: string | undefined = body?.alias;

    if (!slug || !details) {
      return new Response(JSON.stringify({ message: 'Missing article slug or proposal details.' }), { status: 400 });
    }

    const authStart = Date.now();
    const workosUser = locals.user;
    console.log(`[${Date.now() - authStart}ms] User authentication checked`);
    if (!workosUser) {
      console.error('Proposal submission: No WorkOS user found in locals');
      return new Response(JSON.stringify({ message: 'Authentication required.' }), { status: 401 });
    }

    const userLookupStart = Date.now();
    console.log('Proposal submission: Looking up Convex user for WorkOS ID:', workosUser.id);
    const convexUser = await getConvexUserByWorkOSId(workosUser.id);
    console.log(`[${Date.now() - userLookupStart}ms] Convex user lookup completed`);
    if (!convexUser) {
      console.error('Proposal submission: Convex user not found for WorkOS ID:', workosUser.id);
      return new Response(
        JSON.stringify({
          message: `Unable to find your contributor profile in Convex. WorkOS ID: ${workosUser.id}. Please try signing out and signing back in.`,
        }),
        {
          status: 403,
        },
      );
    }
    console.log('Proposal submission: Found Convex user:', convexUser._id, convexUser.email);

    const actingIdentity = buildActingIdentity(workosUser, convexUser);
    console.log('Proposal submission: Checking if page exists for slug:', slug);
    
    // Optimize: Just check if page exists, don't create it synchronously (page creation is slow)
    // Use a shorter timeout since we're only querying, not creating
    // Note: runConvexQuery already has an 8-second timeout, so this is a backup
    let entry: any;
    try {
      const pageLookupStart = Date.now();
      console.log(`[${Date.now() - handlerStart}ms] Starting page lookup for slug: ${slug}`);
      entry = await runConvexQuery<any>('pages:getPageBySlug', { slug });
      console.log(`[${Date.now() - pageLookupStart}ms] Page lookup completed`);
      
      // If Convex query timed out, it returns null, so check for that
      if (entry === null) {
        console.error('Proposal submission: Page lookup returned null (likely timed out or Convex unavailable)');
        return new Response(
          JSON.stringify({ 
            message: 'The request took too long to process. Please try again in a moment.' 
          }), 
          { status: 504 } // 504 Gateway Timeout
        );
      }
    } catch (error) {
      console.error('Proposal submission: Page lookup error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('timed out')) {
        return new Response(
          JSON.stringify({ 
            message: 'The request took too long to process. Please try again in a moment.' 
          }), 
          { status: 504 } // 504 Gateway Timeout
        );
      }
      throw error; // Re-throw if it's not a timeout error
    }
    
    if (!entry?.page) {
      console.error('Proposal submission: Page not found for slug:', slug);
      return new Response(
        JSON.stringify({ 
          message: `Article not found for slug: ${slug}. The page must exist before you can propose edits. Please create the article first or contact an administrator.` 
        }), 
        { status: 404 }
      );
    }
    console.log('Proposal submission: Found page:', entry.page._id, entry.page.title);

    // Parse the submitted Markdown into structured sections and timeline
    console.log('Parsing submitted Markdown content...');
    const parsedContent = markdownToSections(details);
    console.log(`Parsed ${parsedContent.sections.length} sections and ${parsedContent.timeline.length} timeline entries`);

    // Get the current approved content (as Markdown) to calculate diff
    const approvedContentMarkdown = sectionsToMarkdown(
      entry.approvedRevision?.sections,
      entry.approvedRevision?.timeline,
      entry.approvedRevision?.content
    );
    const approvedRevisionId = entry.page.approvedRevisionId;

    console.log('Calculating diff from approved content...');
    const diffPatch = generateDiff(approvedContentMarkdown, details);
    const diffStats = calculateDiffStats(approvedContentMarkdown, details);
    console.log(`Diff stats: +${diffStats.additions} -${diffStats.deletions} lines`);

    const mutationStart = Date.now();
    console.log(`[${Date.now() - handlerStart}ms] Starting revision mutation`);
    let mutationResult: any;
    try {
      // Note: runConvexMutation already has an 8-second timeout built in
      mutationResult = await runConvexMutation(
        'pages:submitRevision',
        {
          pageId: entry.page._id,
          content: parsedContent.content, // Merged content without headings
          summary,
          sections: parsedContent.sections, // Structured sections with headings
          timeline: parsedContent.timeline.length > 0 ? parsedContent.timeline : undefined, // Timeline entries
          baseRevisionId: approvedRevisionId, // Track which revision this is based on
          diffContent: diffPatch, // Store the diff patch
          diffStats: { // Store statistics
            additions: diffStats.additions,
            deletions: diffStats.deletions,
          },
          metadata: {
            alias,
            submittedVia: 'web_form',
          },
        },
        { actingAs: actingIdentity },
      );
      console.log(`[${Date.now() - mutationStart}ms] Mutation completed successfully`);
      
      // If Convex mutation timed out, it returns null, so check for that
      if (mutationResult === null) {
        console.error('Proposal submission: Mutation returned null (likely timed out or Convex unavailable)');
        return new Response(
          JSON.stringify({
            message: 'The submission is taking longer than expected. Your proposal may still be processing. Please wait a moment and check if it appears in the proposals list.',
          }),
          { status: 504 },
        );
      }
    } catch (mutationError) {
      console.error('Proposal submission: Mutation error:', mutationError);
      const errorMessage = mutationError instanceof Error ? mutationError.message : String(mutationError);
      if (errorMessage.includes('timed out')) {
        return new Response(
          JSON.stringify({
            message: 'The submission is taking longer than expected. Your proposal may still be processing. Please wait a moment and check if it appears in the proposals list.',
          }),
          { status: 504 },
        );
      }
      throw mutationError;
    }

    if (!mutationResult) {
      console.error('Convex mutation returned null for submitRevision', {
        pageId: entry.page._id,
        slug,
        userId: convexUser._id,
      });
      return new Response(
        JSON.stringify({
          message: 'Failed to record proposal. The Convex mutation returned no result. Check server logs for details.',
        }),
        { status: 500 },
      );
    }

    // Optimize: Return response immediately using data we already have
    // The client can refetch the full proposal list if needed
    const now = new Date().toISOString();
    console.log(`[${Date.now() - handlerStart}ms] Total request time - returning success response`);
    return new Response(
      JSON.stringify({
        success: true,
        proposal: {
          id: mutationResult.revisionId ?? 'pending',
          summary: summary ?? '(No summary provided)',
          details: details,
          createdAt: now,
          contributor: actingIdentity.name ?? convexUser.displayName ?? 'You',
          role: convexUser.roles?.[0]?.role?.replace('_', '-') ?? 'contributor',
          status: 'pending',
          metadata: { alias },
        },
      }),
      { status: 200 },
    );
  } catch (error) {
    const totalTime = Date.now() - handlerStart;
    console.error(`\n========== PROPOSAL SUBMISSION FAILED ==========`);
    console.error(`Total time: ${totalTime}ms`);
    console.error(`Error:`, error);
    console.error(`================================================\n`);
    
    const errorMessage = error instanceof Error ? error.message : 'Unexpected error when submitting proposal.';
    const statusCode = errorMessage.includes('timed out') ? 504 : 500;
    return new Response(
      JSON.stringify({ 
        message: errorMessage.includes('timed out') 
          ? 'The request took too long to process. Please try again.'
          : 'Unexpected error when submitting proposal. Please try again.' 
      }), 
      { status: statusCode }
    );
  }
};
