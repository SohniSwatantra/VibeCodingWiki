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
  const relevant = startIndex >= 0 ? markdown.slice(startIndex) : markdown;
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

  const data: HackathonData = {
    lastUpdated: new Date().toISOString(),
    sponsors: parseSponsorLinks(sections['Sponsored by'] ?? ''),
    howItWorks: parseHowItWorks(sections['How it works'] ?? ''),
    howToParticipate: parseSteps(sections['How to participate'] ?? ''),
    prizes: parsePrizeTiers(sections['Prizes'] ?? ''),
    resources: parseResourceLinks(sections['Resources'] ?? ''),
    judges: parseJudges(sections['Meet the Judges'] ?? ''),
    rulesMarkdown: sections['Rules & Guidelines'] ?? '',
    apps: parseApps(appsRaw.data.markdown),
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

