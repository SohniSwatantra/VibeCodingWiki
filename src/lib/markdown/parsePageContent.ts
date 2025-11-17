/**
 * Utilities for converting between structured page data (sections, timeline)
 * and editable Markdown format.
 */

export type PageSection = {
  id: string;
  title: string;
  level: number;
  markdown: string;
};

export type TimelineEntry = {
  year: string | number;
  title: string;
  description: string;
};

/**
 * Convert structured sections and timeline to editable Markdown format.
 * This is used when pre-filling the edit form.
 */
export function sectionsToMarkdown(
  sections: PageSection[] | undefined,
  timeline: TimelineEntry[] | undefined,
  fallbackContent?: string
): string {
  let markdown = '';

  // Add sections with headings
  if (sections && sections.length > 0) {
    markdown = sections
      .map((section) => {
        const level = section.level || 2;
        const heading = '#'.repeat(level) + ' ' + (section.title || 'Section');
        return heading + '\n\n' + (section.markdown || '').trim();
      })
      .join('\n\n');
  } else if (fallbackContent) {
    // If no sections, use fallback content
    markdown = fallbackContent;
  }

  // Add timeline section if it exists
  if (timeline && timeline.length > 0) {
    const timelineMarkdown =
      '\n\n## Timeline\n\n' +
      timeline
        .map((entry) => {
          return `**${entry.year}** - **${entry.title}**: ${entry.description}`;
        })
        .join('\n\n');
    markdown += timelineMarkdown;
  }

  return markdown.trim();
}

/**
 * Parse Markdown content back into structured sections and timeline.
 * This is used when processing submitted edits.
 */
export function markdownToSections(markdown: string): {
  sections: PageSection[];
  timeline: TimelineEntry[];
  content: string;
} {
  const lines = markdown.split('\n');
  const sections: PageSection[] = [];
  const timeline: TimelineEntry[] = [];

  let currentSection: PageSection | null = null;
  let currentContent: string[] = [];
  let inTimelineSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this is a heading (starts with ##, ###, etc.)
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      // Save previous section if it exists
      if (currentSection) {
        currentSection.markdown = currentContent.join('\n').trim();
        sections.push(currentSection);
        currentContent = [];
      }

      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();

      // Check if this is the Timeline section
      if (title.toLowerCase() === 'timeline') {
        inTimelineSection = true;
        currentSection = null; // Don't create a section for timeline
      } else {
        inTimelineSection = false;
        currentSection = {
          id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          title: title,
          level: level,
          markdown: '',
        };
      }
    } else if (inTimelineSection) {
      // Parse timeline entry: **2023** - **Title**: Description
      const timelineMatch = line.match(/^\*\*(.+?)\*\*\s*-\s*\*\*(.+?)\*\*:\s*(.+)$/);
      if (timelineMatch) {
        timeline.push({
          year: timelineMatch[1].trim(),
          title: timelineMatch[2].trim(),
          description: timelineMatch[3].trim(),
        });
      }
    } else if (currentSection) {
      // Add content to current section
      currentContent.push(line);
    } else if (line.trim()) {
      // Content before any heading - create a default section
      if (!currentSection) {
        currentSection = {
          id: 'introduction',
          title: 'Introduction',
          level: 2,
          markdown: '',
        };
      }
      currentContent.push(line);
    }
  }

  // Save the last section
  if (currentSection) {
    currentSection.markdown = currentContent.join('\n').trim();
    sections.push(currentSection);
  }

  // Build merged content (without headings, just section text)
  const content = sections.map((s) => s.markdown).join('\n\n');

  return { sections, timeline, content };
}

/**
 * Helper to generate a unique section ID from a title
 */
export function generateSectionId(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}
