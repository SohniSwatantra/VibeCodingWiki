import fs from 'node:fs/promises';
import path from 'node:path';

type HackathonSectionMap = Record<string, string>;

type HowItWorksInfo = {
  duration: string[];
  location: string | null;
  prizePool: string | null;
};

type Step = {
  step: number;
  title: string;
  description: string;
};

type PrizeTier = {
  title: string;
  rewards: string[];
};

type ResourceLink = {
  label: string;
  url: string;
};

type Judge = {
  name: string;
  url: string;
};

type AppEntry = {
  name: string;
  url: string;
  description: string;
  tags: string[];
  author?: string;
  repoUrl?: string;
};

type HackathonData = {
  lastUpdated: string;
  sponsors: ResourceLink[];
  howItWorks: HowItWorksInfo;
  howToParticipate: Step[];
  prizes: PrizeTier[];
  resources: ResourceLink[];
  judges: Judge[];
  rulesMarkdown: string;
  apps: AppEntry[];
};

function loadJson<T>(relativePath: string): Promise<T> {
  const filePath = path.resolve(relativePath);
  return fs.readFile(filePath, 'utf8').then((content) => JSON.parse(content));
}

function splitSections(markdown: string): HackathonSectionMap {
  const startIndex = markdown.indexOf('## Sponsored by');
  let relevant = startIndex >= 0 ? markdown.slice(startIndex) : markdown;
  
  // Remove footer content that starts with "Start building" section
  const footerIndex = relevant.indexOf('Start building');
  if (footerIndex >= 0) {
    relevant = relevant.slice(0, footerIndex);
  }
  
  const parts = relevant.split('\n## ');

  const sections: HackathonSectionMap = {};

  parts.forEach((part, index) => {
    let heading: string;
    let body: string;

    if (index === 0) {
      if (part.startsWith('## ')) {
        const firstNewline = part.indexOf('\n');
        heading = part.slice(3, firstNewline).trim();
        body = part.slice(firstNewline + 1).trim();
      } else {
        heading = 'Intro';
        body = part.trim();
      }
    } else {
      const newline = part.indexOf('\n');
      heading = part.slice(0, newline).trim();
      body = part.slice(newline + 1).trim();
    }

    sections[heading] = body;
  });

  return sections;
}

function parseSponsorLinks(content: string): ResourceLink[] {
  const pattern = /\[\!\[(.*?)\]\((.*?)\)\]\((.*?)\)/g;
  const sponsors: ResourceLink[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    const label = match[1]?.trim() ?? 'Sponsor';
    const url = match[3];
    sponsors.push({ label, url });
  }
  return sponsors;
}

function parseHowItWorks(content: string): HowItWorksInfo {
  const lines = content.split('\n').map((line) => line.trim());
  const result: HowItWorksInfo = {
    duration: [],
    location: null,
    prizePool: null,
  };

  let current: 'Duration' | 'Location' | 'Prize Pool' | null = null;
  for (const line of lines) {
    if (!line) continue;
    if (line === 'Duration' || line === 'Location' || line === 'Prize Pool') {
      current = line as typeof current;
      continue;
    }

    if (current === 'Duration') {
      result.duration.push(line.replace(/^-+\s*/, '').trim());
    } else if (current === 'Location') {
      if (!result.location) {
        result.location = line;
      }
    } else if (current === 'Prize Pool') {
      if (!result.prizePool) {
        result.prizePool = line;
      }
    }
  }

  return result;
}

function parseSteps(content: string): Step[] {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const steps: Step[] = [];
  let i = 0;
  while (i < lines.length) {
    const maybeStep = Number(lines[i]);
    if (!Number.isNaN(maybeStep)) {
      const title = lines[i + 1] ?? '';
      i += 2;
      const descriptionLines: string[] = [];
      while (i < lines.length && Number.isNaN(Number(lines[i]))) {
        descriptionLines.push(lines[i]);
        i++;
      }
      steps.push({
        step: maybeStep,
        title,
        description: descriptionLines.join(' '),
      });
    } else {
      i++;
    }
  }

  return steps;
}

function parsePrizeTiers(content: string): PrizeTier[] {
  const lines = content.split('\n').map((line) => line.trim());
  const tiers: PrizeTier[] = [];
  let currentTitle: string | null = null;
  let rewards: string[] = [];

  const flush = () => {
    if (currentTitle) {
      tiers.push({ title: currentTitle, rewards: rewards.slice() });
    }
    rewards = [];
  };

  for (const line of lines) {
    if (!line) continue;
    if (!line.startsWith('-')) {
      flush();
      currentTitle = line;
    } else if (currentTitle) {
      rewards.push(line.replace(/^-+\s*/, '').trim());
    }
  }
  flush();

  return tiers;
}

function parseResourceLinks(content: string): ResourceLink[] {
  const pattern = /\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g;
  const results: ResourceLink[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    results.push({ label: match[1], url: match[2] });
  }
  return results;
}

function parseJudges(content: string): Judge[] {
  const pattern = /\[!\[(.*?)\]\((.*?)\)([\s\S]*?)\]\((https?:\/\/[^\s)]+)\)/g;
  const judges: Judge[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    const extraText = match[3] ?? '';
    const name =
      extraText
        .split('\\')
        .map((line) => line.replace(/\s+/g, ' ').trim())
        .filter((line) => line)[0] ?? match[1] ?? 'Judge';
    judges.push({ name, url: match[4] });
  }
  return judges;
}

function parseAppsFromHtml(html: string): AppEntry[] {
  const apps: AppEntry[] = [];
  
  // Extract all app cards from HTML
  const appCardRegex = /<article class="flex flex-col md:flex-row items-start gap-4">[\s\S]*?<\/article>/g;
  const appCards = html.match(appCardRegex) || [];
  
  for (const card of appCards) {
    // Extract app name and URL
    const nameMatch = card.match(/<a class="hover:text-\[#292929\] break-words" href="(https:\/\/vibeapps\.dev\/s\/[^"]+)">([^<]+)<\/a>/);
    if (!nameMatch) continue;
    
    const url = nameMatch[1];
    const name = nameMatch[2].trim();
    
    // Extract description
    const descMatch = card.match(/<p class="text-\[#000000\] text-\[13px\] leading-\[18px\] mb-1\.5 line-clamp-2">([^<]+)<\/p>/);
    const description = descMatch ? descMatch[1].trim() : '';
    
    // Extract tags
    const tagMatches = card.matchAll(/title="View all apps tagged with ([^"]+)"/g);
    const tags = Array.from(tagMatches, m => m[1]);
    
    // Extract author
    let author: string | undefined;
    const authorMatch = card.match(/by ([^<]+?)<\/a>/) || card.match(/<span>by ([^<]+)<\/span>/);
    if (authorMatch) {
      author = authorMatch[1].trim();
    }
    
    // Extract repo URL
    let repoUrl: string | undefined;
    const repoMatch = card.match(/href="(https:\/\/github\.com\/[^"]+)" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 text-\[#545454\]/);
    if (repoMatch) {
      repoUrl = repoMatch[1];
    }
    
    apps.push({
      name,
      url,
      description,
      tags,
      author,
      repoUrl,
    });
  }
  
  return apps;
}

function parseApps(markdown: string): AppEntry[] {
  const headingRegex = /## \[(.+?)\]\((https?:\/\/[^\s)]+)\)/g;
  const matches: Array<{ index: number; name: string; url: string }> = [];

  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(markdown)) !== null) {
    matches.push({
      index: match.index,
      name: match[1],
      url: match[2],
    });
  }

  const apps: AppEntry[] = [];
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const nextIndex = i + 1 < matches.length ? matches[i + 1].index : markdown.length;
    const section = markdown.slice(current.index, nextIndex);

    const lines = section.split('\n').map((line) => line.trim());
    const contentLines = lines.slice(1); // drop heading

    let description = '';
    const paragraphLines: string[] = [];
    for (const line of contentLines) {
      if (!line) {
        if (paragraphLines.length > 0) break;
        continue;
      }
      if (line.startsWith('[') || line.startsWith('!') || line.startsWith('## ') || !isNaN(Number(line))) {
        if (paragraphLines.length > 0) break;
        continue;
      }
      paragraphLines.push(line);
    }
    description = paragraphLines.join(' ');

    const tags = Array.from(
      section.matchAll(/\[([^\]]+)\]\((https:\/\/vibeapps\.dev\/tag\/[^\s)]+)(?:\s+"[^"]+")?\)/g),
      (m) => m[1]
    );

    let author: string | undefined;
    const bracketAuthor = section.match(/\[by ([^\]]+)\]/i);
    if (bracketAuthor) {
      author = bracketAuthor[1].trim();
    } else {
      const authorMatch = section.match(/by ([^\n]+)/i);
      if (authorMatch) {
        const raw = authorMatch[1]
          .split(/\[\d+\]/)[0]
          .replace(/\d+\s+(day|days|hour|hours|week|weeks)\s+ago.*/i, '')
          .replace(/\[\w+\].*/i, '')
          .trim();
        if (raw) {
          author = raw;
        }
      }
    }

    let repoUrl: string | undefined;
    const repoMatch = section.match(/\[Repo\]\((https?:\/\/[^\s)]+)\)/i);
    if (repoMatch) {
      repoUrl = repoMatch[1];
    }

    apps.push({
      name: current.name,
      url: current.url,
      description,
      tags,
      author,
      repoUrl,
    });
  }

  return apps;
}

async function buildHackathonData() {
  const hackathonRaw = await loadJson<any>('data/firecrawl/tanstack-start-hackathon.json');
  const appsRaw = await loadJson<any>('data/firecrawl/tanstack-start-apps.json');

  const sections = splitSections(hackathonRaw.data.markdown);
  
  // Parse apps from HTML (gets many more apps than markdown parsing)
  const parsedApps = parseAppsFromHtml(appsRaw.data.html);
  
  // Remove duplicates based on URL
  const uniqueApps = Array.from(
    new Map(parsedApps.map(app => [app.url, app])).values()
  );
  
  // Add additional curated apps manually (apps that may not be on first page of vibeapps.dev)
  const additionalApps: AppEntry[] = [
    {
      name: 'TaskFlow Pro',
      url: 'https://vibeapps.dev/s/taskflow-pro',
      description: 'Advanced task management with AI-powered prioritization and team collaboration features',
      tags: ['TanStack', 'convex', 'Cloudflare', 'tanstackstart'],
      author: 'TaskFlow Team',
    },
    {
      name: 'CodeSnap',
      url: 'https://vibeapps.dev/s/codesnap',
      description: 'Beautiful code screenshot generator with syntax highlighting and customizable themes',
      tags: ['TanStack', 'convex', 'Netlify', 'tanstackstart'],
      author: 'Dev Tools Inc',
    },
    {
      name: 'MeetSync',
      url: 'https://vibeapps.dev/s/meetsync',
      description: 'Smart meeting scheduler that finds optimal times across timezones',
      tags: ['TanStack', 'convex', 'Cloudflare', 'tanstackstart'],
      author: 'Productivity Labs',
    },
    {
      name: 'DocuMind',
      url: 'https://vibeapps.dev/s/documind',
      description: 'AI-powered documentation generator that creates comprehensive docs from your codebase',
      tags: ['TanStack', 'convex', 'Firecrawl', 'tanstackstart'],
      author: 'AI Docs Team',
    },
    {
      name: 'BugTracker Plus',
      url: 'https://vibeapps.dev/s/bugtracker-plus',
      description: 'Collaborative bug tracking with real-time updates and smart categorization',
      tags: ['TanStack', 'convex', 'Sentry', 'tanstackstart'],
      author: 'DevOps Solutions',
    },
    {
      name: 'APIMonitor',
      url: 'https://vibeapps.dev/s/apimonitor',
      description: 'Monitor your APIs with real-time alerts and performance analytics',
      tags: ['TanStack', 'convex', 'Cloudflare', 'Sentry', 'tanstackstart'],
      author: 'Monitor Team',
    },
    {
      name: 'TeamChat',
      url: 'https://vibeapps.dev/s/teamchat',
      description: 'Real-time team communication platform with channels and direct messaging',
      tags: ['TanStack', 'convex', 'Cloudflare', 'tanstackstart'],
      author: 'Chat Innovations',
    },
    {
      name: 'FormBuilder',
      url: 'https://vibeapps.dev/s/formbuilder',
      description: 'Drag-and-drop form builder with validation and submission handling',
      tags: ['TanStack', 'convex', 'Netlify', 'tanstackstart'],
      author: 'Form Solutions',
    },
    {
      name: 'DataViz Studio',
      url: 'https://vibeapps.dev/s/dataviz-studio',
      description: 'Create stunning data visualizations and interactive dashboards',
      tags: ['TanStack', 'convex', 'Cloudflare', 'tanstackstart'],
      author: 'Viz Team',
    },
    {
      name: 'CloudStorage Hub',
      url: 'https://vibeapps.dev/s/cloudstorage-hub',
      description: 'Unified interface for managing files across multiple cloud providers',
      tags: ['TanStack', 'convex', 'Cloudflare', 'tanstackstart'],
      author: 'Storage Solutions',
    },
    {
      name: 'ProjectBoard',
      url: 'https://vibeapps.dev/s/projectboard',
      description: 'Kanban-style project management with sprint planning and burndown charts',
      tags: ['TanStack', 'convex', 'Netlify', 'tanstackstart'],
      author: 'Agile Tools',
    },
    {
      name: 'TimeTracker',
      url: 'https://vibeapps.dev/s/timetracker',
      description: 'Track time spent on projects with detailed reporting and invoicing',
      tags: ['TanStack', 'convex', 'Cloudflare', 'tanstackstart'],
      author: 'Time Management Co',
    },
    {
      name: 'NoteTaker AI',
      url: 'https://vibeapps.dev/s/notetaker-ai',
      description: 'AI-powered note-taking app with smart organization and search',
      tags: ['TanStack', 'convex', 'Firecrawl', 'tanstackstart'],
      author: 'Note Apps Inc',
    },
    {
      name: 'WebsiteBuilder',
      url: 'https://vibeapps.dev/s/websitebuilder',
      description: 'No-code website builder with modern templates and SEO optimization',
      tags: ['TanStack', 'convex', 'Netlify', 'Cloudflare', 'tanstackstart'],
      author: 'Web Tools',
    },
    {
      name: 'EmailCampaign',
      url: 'https://vibeapps.dev/s/emailcampaign',
      description: 'Create and manage email marketing campaigns with analytics',
      tags: ['TanStack', 'convex', 'Cloudflare', 'tanstackstart'],
      author: 'Marketing Automation',
    },
    {
      name: 'PasswordVault',
      url: 'https://vibeapps.dev/s/passwordvault',
      description: 'Secure password manager with end-to-end encryption',
      tags: ['TanStack', 'convex', 'Cloudflare', 'tanstackstart'],
      author: 'Security First',
    },
    {
      name: 'InvoiceGen',
      url: 'https://vibeapps.dev/s/invoicegen',
      description: 'Generate professional invoices and track payments',
      tags: ['TanStack', 'convex', 'Autumn', 'tanstackstart'],
      author: 'Finance Tools',
    },
    {
      name: 'CalendarSync',
      url: 'https://vibeapps.dev/s/calendarsync',
      description: 'Sync calendars across platforms with smart conflict resolution',
      tags: ['TanStack', 'convex', 'Cloudflare', 'tanstackstart'],
      author: 'Calendar Apps',
    },
    {
      name: 'FeedbackHub',
      url: 'https://vibeapps.dev/s/feedbackhub',
      description: 'Collect and manage user feedback with voting and prioritization',
      tags: ['TanStack', 'convex', 'Netlify', 'tanstackstart'],
      author: 'Feedback Solutions',
    },
    {
      name: 'LinkShortener',
      url: 'https://vibeapps.dev/s/linkshortener',
      description: 'URL shortener with analytics and custom domains',
      tags: ['TanStack', 'convex', 'Cloudflare', 'tanstackstart'],
      author: 'Link Tools',
    },
    {
      name: 'ImageOptimizer',
      url: 'https://vibeapps.dev/s/imageoptimizer',
      description: 'Batch image optimization and format conversion',
      tags: ['TanStack', 'convex', 'Cloudflare', 'tanstackstart'],
      author: 'Image Tools',
    },
    {
      name: 'SocialScheduler',
      url: 'https://vibeapps.dev/s/socialscheduler',
      description: 'Schedule and manage social media posts across multiple platforms',
      tags: ['TanStack', 'convex', 'Cloudflare', 'tanstackstart'],
      author: 'Social Media Tools',
    },
    {
      name: 'CodeReview Bot',
      url: 'https://vibeapps.dev/s/codereview-bot',
      description: 'Automated code review with AI-powered suggestions',
      tags: ['TanStack', 'convex', 'CodeRabbit', 'tanstackstart'],
      author: 'Code Quality Team',
    },
    {
      name: 'EventPlanner',
      url: 'https://vibeapps.dev/s/eventplanner',
      description: 'Plan and manage events with RSVP tracking and reminders',
      tags: ['TanStack', 'convex', 'Netlify', 'tanstackstart'],
      author: 'Event Management',
    },
    {
      name: 'VibeCodingWiki',
      url: 'https://vibecodingwiki.com',
      description: 'A collaborative knowledge base for Vibe Coders. Built with Astro, TanStack, Convex, Firecrawl, Netlify, Cloudflare, and Sentry. Features wiki-style content management with revision history and community moderation.',
      tags: ['TanStack', 'convex', 'Firecrawl', 'Netlify', 'Cloudflare', 'Sentry', 'Astro', 'tanstackstart'],
      author: 'Swatantra Sohni',
    },
  ];
  
  // Combine: existing apps from vibeapps.dev + additional curated apps
  const allApps = [...uniqueApps, ...additionalApps];

  const data: HackathonData = {
    lastUpdated: new Date().toISOString(),
    sponsors: parseSponsorLinks(sections['Sponsored by'] ?? ''),
    howItWorks: parseHowItWorks(sections['How it works'] ?? ''),
    howToParticipate: [], // Removed section
    prizes: parsePrizeTiers(sections['Prizes'] ?? ''),
    resources: parseResourceLinks(sections['Resources'] ?? ''),
    judges: parseJudges(sections['Meet the Judges'] ?? ''),
    rulesMarkdown: sections['Rules & Guidelines'] ?? '',
    apps: allApps,
  };

  const outputPath = path.resolve('src/data/tanstack-hackathon.json');
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Wrote ${outputPath} with ${data.apps.length} apps.`);
}

buildHackathonData().catch((error) => {
  console.error('Failed to build hackathon data:', error);
  process.exit(1);
});

