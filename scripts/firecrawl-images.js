import { FirecrawlApp } from '@firecrawl/js';
import { ConvexHttpClient } from 'convex/browser';
import 'dotenv/config';

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const CONVEX_URL = process.env.CONVEX_URL;
const CONVEX_ADMIN_KEY = process.env.CONVEX_ADMIN_KEY;

if (!FIRECRAWL_API_KEY) {
  console.error('FIRECRAWL_API_KEY is not set.');
  process.exit(1);
}

if (!CONVEX_URL) {
  console.error('CONVEX_URL is not set.');
  process.exit(1);
}

const sources = [
  {
    slug: 'origins-of-vibecoding',
    sourceUrl: 'https://en.wikipedia.org/wiki/Vibe_coding',
    note: 'Karpathy tweet coverage and press references',
  },
  {
    slug: 'timeline-of-vibecoding',
    sourceUrl: 'https://en.wikipedia.org/wiki/Vibe_coding#Reception_and_use',
    note: 'Media coverage timeline and statistics',
  },
];

const app = new FirecrawlApp({ apiKey: FIRECRAWL_API_KEY });
const convex = new ConvexHttpClient(CONVEX_URL);

if (CONVEX_ADMIN_KEY) {
  const maybeSetAdminAuth =
    typeof convex.setAdminAuth === 'function'
      ? convex.setAdminAuth
      : typeof convex['setAdminAuth'] === 'function'
      ? convex['setAdminAuth']
      : undefined;

  if (maybeSetAdminAuth) {
    maybeSetAdminAuth.call(convex, CONVEX_ADMIN_KEY);
  }
}

async function collectImages() {
  for (const source of sources) {
    console.log(`Scraping ${source.sourceUrl} …`);
    try {
      const result = await app.scrapeUrl(source.sourceUrl, {
        pageOptions: {
          includeImages: true,
        },
      });

      const images = (result?.data?.images ?? [])
        .filter((img) => typeof img?.url === 'string')
        .map((img) => ({
          url: img.url,
          alt: img?.alt ?? undefined,
          title: img?.title ?? undefined,
        }))
        .slice(0, 10);

      if (images.length === 0) {
        console.warn(`No images detected for ${source.sourceUrl}`);
        continue;
      }

      await convex.mutation('ingestion:recordFirecrawlImages', {
        slug: source.slug,
        sourceUrl: source.sourceUrl,
        images,
      });

      console.log(`Recorded ${images.length} images for ${source.slug}`);
    } catch (error) {
      console.error(`Failed to process ${source.sourceUrl}`, error);
    }
  }
}

collectImages()
  .then(() => {
    console.log('Firecrawl image ingestion complete.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Firecrawl image ingestion failed.', error);
    process.exit(1);
  });

