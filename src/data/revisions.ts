export type RevisionEntry = {
  id: string;
  articleSlug: string;
  summary: string;
  editedAt: string;
  editor: string;
  role: 'super-admin' | 'moderator' | 'contributor';
  status: 'published' | 'pending' | 'rejected';
};

const revisionSeed: RevisionEntry[] = [
  {
    id: 'rev-001',
    articleSlug: 'origins-of-vibecoding',
    summary: 'Expanded early experiments with Moodboard CLI references.',
    editedAt: '2025-09-12T08:45:00.000Z',
    editor: 'luna',
    role: 'moderator',
    status: 'published',
  },
  {
    id: 'rev-002',
    articleSlug: 'origins-of-vibecoding',
    summary: 'Added citations for Twitch streams.',
    editedAt: '2025-07-18T14:10:00.000Z',
    editor: 'aiko',
    role: 'contributor',
    status: 'published',
  },
  {
    id: 'rev-003',
    articleSlug: 'vibecoding-culture',
    summary: 'Documented new vibe retrospective format.',
    editedAt: '2025-07-22T16:20:00.000Z',
    editor: 'jamal',
    role: 'moderator',
    status: 'published',
  },
  {
    id: 'rev-004',
    articleSlug: 'vibecoding-tutorials',
    summary: 'Linked Sync with GlowStack tutorial playlist.',
    editedAt: '2025-05-19T10:40:00.000Z',
    editor: 'nina',
    role: 'contributor',
    status: 'published',
  },
  {
    id: 'rev-005',
    articleSlug: 'vibecoding-tools',
    summary: 'Updated GrooveSync features for v2.0.',
    editedAt: '2025-03-04T09:00:00.000Z',
    editor: 'kai',
    role: 'super-admin',
    status: 'published',
  },
  {
    id: 'rev-006',
    articleSlug: 'vibecoding-tools',
    summary: 'Pending addition of Synesthetic DevTools case study.',
    editedAt: '2025-10-08T12:15:00.000Z',
    editor: 'mira',
    role: 'contributor',
    status: 'pending',
  },
];

export function getRevisionsForArticle(articleSlug: string) {
  return revisionSeed
    .filter((revision) => revision.articleSlug === articleSlug)
    .sort((a, b) => new Date(b.editedAt).getTime() - new Date(a.editedAt).getTime());
}

