import { execFileSync } from 'node:child_process';
import { vibecoding2026 } from '../src/data/vibecoding-2026';

const identity = process.env.CONVEX_PUBLISHER_SUBJECT;
if (!identity) throw new Error('Set CONVEX_PUBLISHER_SUBJECT to a super-admin WorkOS user ID.');

const auth = ['--prod', '--identity', JSON.stringify({ subject: identity, issuer: 'https://workos.com', tokenIdentifier: `https://workos.com|${identity}` })];
const run = (name: string, args: unknown, inherit = false) => execFileSync(
  'npx', ['convex', 'run', name, JSON.stringify(args), ...auth],
  inherit ? { stdio: 'inherit' } : { encoding: 'utf8' },
);
const existingOutput = run('pages:getPageBySlug', { slug: vibecoding2026.slug }) as string;
const existing = existingOutput.trim() ? JSON.parse(existingOutput) : null;
const payload = {
  title: vibecoding2026.title,
  slug: vibecoding2026.slug,
  namespace: 'Main',
  summary: vibecoding2026.summary,
  content: vibecoding2026.sections.map((section) => `## ${section.heading}\n\n${section.content}`).join('\n\n'),
  sections: vibecoding2026.sections.map((section, index) => ({
    id: `${section.heading}-${index}`.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
    title: section.heading,
    level: 2,
    markdown: section.content,
  })),
  tags: vibecoding2026.tags,
  timeline: vibecoding2026.timeline,
  relatedTopics: vibecoding2026.relatedTopics,
};

if (!existing?.page) {
  const created = JSON.parse(run('pages:createPage', payload) as string);
  run('pages:approveRevision', { revisionId: created.revisionId }, true);
  console.log(`Published ${vibecoding2026.slug}.`);
} else {
  const { title: _title, slug: _slug, namespace: _namespace, ...update } = payload;
  run('pages:adminUpdatePageContent', { ...update, pageId: existing.page._id }, true);
  console.log(`Updated ${vibecoding2026.slug}.`);
}
