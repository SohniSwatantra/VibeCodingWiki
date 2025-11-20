import 'dotenv/config';
import { ConvexHttpClient } from 'convex/browser';

const rawDeployment = process.env.CONVEX_DEPLOYMENT;

function extractDeploymentSlug(input?: string | null) {
  if (!input) return undefined;
  const head = input.split('|')[0]?.trim();
  if (!head) return undefined;
  const parts = head.split(':');
  return parts[parts.length - 1]?.trim() || undefined;
}

const deploymentSlug = extractDeploymentSlug(rawDeployment);

let convexUrl = process.env.CONVEX_URL;
if (deploymentSlug) {
  const deploymentUrl = `https://${deploymentSlug}.convex.cloud`;
  if (!convexUrl) {
    convexUrl = deploymentUrl;
  } else if (!convexUrl.includes(deploymentSlug)) {
    console.warn(
      `CONVEX_URL (${convexUrl}) does not match CONVEX_DEPLOYMENT (${deploymentSlug}). Using ${deploymentUrl}.`,
    );
    convexUrl = deploymentUrl;
  }
}

const convexAdminKey = process.env.CONVEX_ADMIN_KEY;

if (!convexUrl || !convexAdminKey) {
  console.error('CONVEX_URL (or CONVEX_DEPLOYMENT) and CONVEX_ADMIN_KEY must be set to run this script.');
  process.exit(1);
}

console.log(`Connecting to Convex deployment at ${convexUrl}`);

const client = new ConvexHttpClient(convexUrl);

async function main() {
  try {
    // Use admin auth to run the mutation
    (client as any).setAdminAuth?.(convexAdminKey);
    
    console.log('Running addMissingStatusField mutation...');
    // Try the function path that was visible in the deployment output
    // "functions/fix_page_status:addMissingStatusField" was visible in the logs of the user selection
    // but my last attempt to deploy it might have failed or I missed it.
    // I'll try the variations.
    
    let result;
    try {
        result = await (client as any).mutation('functions/fix_page_status:addMissingStatusField', {});
    } catch (e) {
        console.log('Failed with prefix functions/, trying without...');
        try {
            result = await (client as any).mutation('fix_page_status:addMissingStatusField', {});
        } catch (e2) {
             console.log('Failed without prefix too. Trying just fix_page_status...');
             // This shouldn't work for a mutation but worth logging
             throw e2;
        }
    }

    console.log('Success:', result);

  } catch (error) {
    console.error('Failed to run fix script:', error);
    process.exitCode = 1;
  } finally {
    client.clearAuth();
  }
}

await main();

