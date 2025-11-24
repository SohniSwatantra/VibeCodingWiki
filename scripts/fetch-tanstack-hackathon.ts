import fs from 'node:fs/promises';
import path from 'node:path';
import 'dotenv/config';

const FIRECRAWL_ENDPOINT = process.env.FIRECRAWL_ENDPOINT ?? 'https://api.firecrawl.dev/v1/scrape';
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

if (!FIRECRAWL_API_KEY) {
  console.error('FIRECRAWL_API_KEY is required to run this script.');
  process.exit(1);
}

const SOURCES = [
  {
    slug: 'tanstack-start-hackathon',
    url: 'https://www.convex.dev/hackathons/tanstack',
    note: 'Official hackathon overview (Convex + TanStack Start)',
  },
  {
    slug: 'tanstack-start-apps',
    url: 'https://vibeapps.dev/',
    note: 'Directory of hackathon submissions',
  },
];

async function scrape(url: string) {
  const response = await fetch(FIRECRAWL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
    },
    body: JSON.stringify({
      url,
      formats: ['markdown', 'html'],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to scrape ${url}: ${response.status} ${text}`);
  }

  const payload = await response.json();
  return payload;
}

async function main() {
  const outputDir = path.resolve('data/firecrawl');
  await fs.mkdir(outputDir, { recursive: true });

  for (const source of SOURCES) {
    const filename = path.join(outputDir, `${source.slug}.json`);
    console.log(`Scraping ${source.url} …`);
    try {
      const payload = await scrape(source.url);
      payload.__meta = {
        note: source.note,
        scrapedAt: new Date().toISOString(),
      };
      await fs.writeFile(filename, JSON.stringify(payload, null, 2), 'utf8');
      console.log(`Saved ${filename}`);
    } catch (error) {
      console.error(`Failed to scrape ${source.url}`, error);
    }
  }
}

main();

