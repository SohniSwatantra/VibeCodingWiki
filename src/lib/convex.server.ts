import { ConvexHttpClient } from 'convex/browser';

export type ActingIdentity = {
  subject: string;
  issuer?: string;
  tokenIdentifier?: string;
  name?: string;
  email?: string;
};

type ConvexRunOptions = {
  actingAs?: ActingIdentity;
  useAdmin?: boolean;
};

// Parse CONVEX_URL defensively - extract only the URL part if it's concatenated with CONVEX_ADMIN_KEY
let rawConvexUrl = import.meta.env.CONVEX_URL?.trim() || '';
let convexUrl: string | undefined;

if (rawConvexUrl) {
  // If URL is concatenated with CONVEX_ADMIN_KEY, extract only the URL part
  const adminKeyMatch = rawConvexUrl.match(/^(https?:\/\/[^\s]+?)(?:CONVEX_ADMIN_KEY|convex_admin_key)/i);
  if (adminKeyMatch) {
    console.warn('CONVEX_URL was concatenated with CONVEX_ADMIN_KEY. Extracting URL part:', adminKeyMatch[1]);
    convexUrl = adminKeyMatch[1];
  } else {
    // Extract URL up to first space or newline (in case of formatting issues)
    const urlMatch = rawConvexUrl.match(/^(https?:\/\/[^\s\n]+)/);
    convexUrl = urlMatch ? urlMatch[1] : rawConvexUrl;
  }
  
  // Validate URL format
  try {
    new URL(convexUrl);
  } catch {
    console.error('Invalid CONVEX_URL format:', convexUrl);
    convexUrl = undefined;
  }
}

const convexAdminKey = import.meta.env.CONVEX_ADMIN_KEY?.trim();

// Debug: Log the parsed values
if (typeof window === 'undefined') {
  console.log('\n========== CONVEX CONFIGURATION ==========');
  console.log('CONVEX_URL:', convexUrl || 'NOT SET');
  console.log('CONVEX_ADMIN_KEY:', convexAdminKey ? `SET (${convexAdminKey.substring(0, 10)}...)` : 'NOT SET (optional)');
  console.log('==========================================\n');
}
const CONVEX_RETRY_WINDOW_MS = 60 * 1000;

let convexUnavailableUntil = 0;
let lastUnavailableLog = 0;

function createClient(): ConvexHttpClient | null {
  if (!convexUrl) {
    console.warn('CONVEX_URL is not configured. Convex operations are disabled.');
    return null;
  }
  const clientStart = Date.now();
  console.log(`[${clientStart}] Creating Convex client for URL:`, convexUrl);
  const client = new ConvexHttpClient(convexUrl);
  console.log(`[${Date.now() - clientStart}ms] Convex client created`);
  return client;
}

function shouldSkipConvexCalls(): boolean {
  if (!convexUrl) {
    return true;
  }
  if (!convexUnavailableUntil) {
    return false;
  }
  const now = Date.now();
  if (now < convexUnavailableUntil) {
    if (now - lastUnavailableLog > 30 * 1000) {
      console.warn('Convex previously reported an error; continuing to use fallback data.');
      lastUnavailableLog = now;
    }
    return true;
  }
  convexUnavailableUntil = 0;
  return false;
}

function markConvexFailure(error: unknown) {
  convexUnavailableUntil = Date.now() + CONVEX_RETRY_WINDOW_MS;
  if (Date.now() - lastUnavailableLog > 5 * 1000) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      'Convex query failed; falling back to static wiki data for 60s.',
      sanitizeConvexErrorMessage(message),
    );
    lastUnavailableLog = Date.now();
  }
}

function sanitizeConvexErrorMessage(message: string) {
  const requestMatch = message.match(/\[Request ID: ([^\]]+)\]/);
  if (requestMatch) {
    return `request ${requestMatch[1]}`;
  }
  return message;
}

function applyAdminAuth(client: ConvexHttpClient, identity?: ActingIdentity | null) {
  if (!convexAdminKey) {
    if (identity) {
      const errorMsg = 'CONVEX_ADMIN_KEY is required to impersonate a user when calling Convex mutations. Please set CONVEX_ADMIN_KEY in your .env file.';
      console.error('\n❌ CONVEX ADMIN KEY MISSING:', errorMsg);
      throw new Error(errorMsg);
    }
    return;
  }

  if (!identity) {
    (client as any).setAdminAuth?.(convexAdminKey);
    return;
  }

  const issuer = identity.issuer ?? 'https://workos.com';
  const subject = identity.subject;
  if (!subject) {
    throw new Error('Convex acting identity is missing a subject.');
  }
  const tokenIdentifier = identity.tokenIdentifier ?? `${issuer}|${subject}`;

  (client as any).setAdminAuth?.(convexAdminKey, {
    subject,
    issuer,
    tokenIdentifier,
    name: identity.name,
    email: identity.email,
  });
}

export async function runConvexQuery<T = any>(
  name: string,
  args: Record<string, unknown> = {},
  options: ConvexRunOptions = {},
): Promise<T | null> {
  if (shouldSkipConvexCalls()) {
    console.log(`runConvexQuery: Skipping ${name} (Convex calls disabled)`);
    return null;
  }
  const client = createClient();
  if (!client) return null;

  try {
    const queryStart = Date.now();
    console.log(`[${queryStart}] runConvexQuery: Calling ${name} with args:`, JSON.stringify(args).substring(0, 100));
    
    const authStart = Date.now();
    if (options.useAdmin || options.actingAs) {
      applyAdminAuth(client, options.actingAs ?? null);
    }
    console.log(`[${Date.now() - authStart}ms] Admin auth applied for query`);
    
    // Wrap the actual query call with a timeout to prevent hanging
    // Use a more aggressive timeout approach
    let timeoutId: NodeJS.Timeout;
    const queryCallPromise = Promise.race([
      (client as any).query(name, args),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Convex query ${name} timed out after 8 seconds`));
        }, 8000);
      }),
    ]);
    
    try {
      const result = await queryCallPromise;
      clearTimeout(timeoutId!);
      console.log(`[${Date.now() - queryStart}ms] runConvexQuery: ${name} succeeded`);
      return result as T;
    } catch (error) {
      clearTimeout(timeoutId!);
      throw error;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`runConvexQuery: ${name} failed:`, errorMessage);
    markConvexFailure(error);
    return null;
  } finally {
    client.clearAuth();
  }
}

export async function runConvexMutation<T = any>(
  name: string,
  args: Record<string, unknown> = {},
  options: ConvexRunOptions = {},
): Promise<T | null> {
  if (shouldSkipConvexCalls()) {
    console.log(`runConvexMutation: Skipping ${name} (Convex calls disabled)`);
    return null;
  }
  const client = createClient();
  if (!client) return null;

  try {
    const mutationStart = Date.now();
    console.log(`[${mutationStart}] runConvexMutation: Calling ${name} with args:`, JSON.stringify(args).substring(0, 100));
    
    const authStart = Date.now();
    try {
      if (options.actingAs || options.useAdmin) {
        applyAdminAuth(client, options.actingAs ?? null);
      } else if (convexAdminKey) {
        // Default to admin auth for server-side mutations when available.
        applyAdminAuth(client, null);
      }
      console.log(`[${Date.now() - authStart}ms] Admin auth applied`);
    } catch (authError) {
      console.error(`[${Date.now() - authStart}ms] Admin auth FAILED:`, authError);
      throw authError; // Re-throw to fail fast
    }
    
    // Wrap the actual mutation call with a timeout to prevent hanging
    // Use a more aggressive timeout approach
    let timeoutId: NodeJS.Timeout;
    const mutationCallPromise = Promise.race([
      (client as any).mutation(name, args),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Convex mutation ${name} timed out after 8 seconds`));
        }, 8000);
      }),
    ]);
    
    try {
      const result = await mutationCallPromise;
      clearTimeout(timeoutId!);
      console.log(`[${Date.now() - mutationStart}ms] runConvexMutation: ${name} succeeded`);
      return result as T;
    } catch (error) {
      clearTimeout(timeoutId!);
      throw error;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Convex mutation "${name}" failed:`, errorMessage, error);
    markConvexFailure(error);
    return null;
  } finally {
    client.clearAuth();
  }
}
