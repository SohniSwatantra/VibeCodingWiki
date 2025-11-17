import fs from 'node:fs/promises';
import path from 'node:path';

const FIRECRAWL_ENDPOINT = process.env.FIRECRAWL_ENDPOINT ?? 'https://api.firecrawl.dev/v1/scrape';
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

if (!FIRECRAWL_API_KEY) {
  console.error('FIRECRAWL_API_KEY is required to run this script.');
  process.exit(1);
}

const SOURCES = [
  {
    slug: 'origins-of-vibecoding',
    url: 'https://twitter.com/karpathy/status/1753068125226313728',
    note: 'Andrej Karpathy tweet naming VibeCoding',
  },
  {
    slug: 'vibecoding-companies',
    url: 'https://www.reddit.com/r/vibecoding',
    note: 'Community report on companies adopting VibeCoding',
  },
  {
    slug: 'vibecoding-best-practices',
    url: 'https://useautumn.com/blog/vibecoding-best-practices',
    note: 'Blog roundup of best practices',
  },
  {
    slug: 'vibecoding-hackathons',
    url: 'https://www.vibehack.dev/events',
    note: 'Hackathon listings',
  },
  {
    slug: 'vibecoding-tools',
    url: 'https://www.notion.so/vibecoding/VibeCoding-Stack-3564f',
    note: 'Community curated stack',
  },
  {
    slug: 'vibecoding-tutorials',
    url: 'https://www.youtube.com/results?search_query=vibecoding',
    note: 'Tutorial playlist',
  },
];

async function scrapeToMarkdown(url) {
  const response = await fetch(FIRECRAWL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to scrape ${url}: ${response.status} ${text}`);
  }

  const payload = await response.json();
  return payload.markdown ?? payload.content ?? '';
}

async function main() {
  const outputDir = path.resolve('data/firecrawl');
  await fs.mkdir(outputDir, { recursive: true });

  for (const source of SOURCES) {
    console.log(`Scraping ${source.url}…`);
    try {
      const markdown = await scrapeToMarkdown(source.url);
      const filename = path.join(outputDir, `${source.slug}.md`);
      const banner = `<!-- scraped via Firecrawl: ${source.note} (${new Date().toISOString()}) -->\n\n`;
      await fs.writeFile(filename, banner + markdown, 'utf8');
      console.log(`Saved ${filename}`);
    } catch (error) {
      console.error(`Error scraping ${source.url}`, error);
    }
  }
}

main();


