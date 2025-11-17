const AUTUMN_API_KEY: string | undefined = process.env.AUTUMN_API_KEY;
const AUTUMN_API_BASE = process.env.AUTUMN_API_BASE ?? 'https://api.useautumn.com';
const AUTUMN_EDIT_FEATURE_ID = process.env.AUTUMN_FEATURE_EDIT_ID ?? process.env.AUTUMN_FEATURE_EDIT ?? 'wiki_edits';

async function callAutumn(path: string, body: Record<string, any>) {
  if (!AUTUMN_API_KEY) return null;
  try {
    // Add timeout to prevent hanging on slow Autumn API calls
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${AUTUMN_API_BASE}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AUTUMN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Autumn request failed (${response.status})`);
    }
    return await response.json();
  } catch (error) {
    // Silently fail if timeout or error - don't block the operation
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Autumn API call timed out after 5 seconds, continuing anyway');
    } else {
      console.error('Autumn API error', error);
    }
    return null;
  }
}

export async function ensureFeatureAccess(ctx: any, userId: string, featureId: string | null | undefined, metadata?: Record<string, any>) {
  if (!featureId || !AUTUMN_API_KEY) {
    return; // Skip check if no API key or feature ID
  }

  const user = await ctx.db.get(userId);
  if (!user) return;

  const customerId = user.workosUserId ?? user.email ?? userId;
  const payload = await callAutumn('/v1/feature_access', {
    customerId,
    featureId,
    metadata,
  });

  // Only block if we got a clear "not allowed" response
  // If API times out or fails, allow the operation (fail open for better UX)
  if (payload && payload.allowed === false) {
    throw new Error(payload.message ?? 'Feature is limited on your current plan.');
  }
  // If payload is null (timeout/error), we silently allow the operation
}

export async function recordFeatureUsage(ctx: any, userId: string, featureId: string | null | undefined, quantity = 1, metadata?: Record<string, any>) {
  if (!featureId || !AUTUMN_API_KEY) {
    return;
  }

  const user = await ctx.db.get(userId);
  if (!user) return;

  const customerId = user.workosUserId ?? user.email ?? userId;
  await callAutumn('/v1/usage_events', {
    customerId,
    featureId,
    quantity,
    metadata,
  });
}

export { AUTUMN_EDIT_FEATURE_ID };
