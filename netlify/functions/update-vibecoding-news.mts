import type { Config } from '@netlify/functions';

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export default async (request: Request) => {
  const automationSecret = requiredEnv('NEWS_AUTOMATION_SECRET');
  const workerUrl = new URL('/.netlify/functions/update-vibecoding-news-worker', request.url);
  const response = await fetch(workerUrl, {
    method: 'POST',
    headers: {
      'x-news-automation-secret': automationSecret,
    },
  });
  if (!response.ok) throw new Error(`Could not start the news worker: ${response.status}`);
  console.log(JSON.stringify({ outcome: 'started', worker: workerUrl.pathname }));
};

export const config: Config = {
  schedule: '0 7 * * *',
};
