export type RoleDefinition = {
  key: 'super-admin' | 'moderator' | 'contributor' | 'reader';
  title: string;
  description: string;
  permissions: string[];
};

export const roles: RoleDefinition[] = [
  {
    key: 'super-admin',
    title: 'Super Admin',
    description: 'Oversees the entire wiki, manages billing and integrations, and finalises policy changes.',
    permissions: [
      'Approve or rollback any revision',
      'Assign and revoke roles',
      'Manage Autumn billing tiers and quotas',
      'Configure WorkOS auth providers and Convex functions',
    ],
  },
  {
    key: 'moderator',
    title: 'Moderator',
    description: 'Reviews contributions, ensures citations meet standards, and facilitates Talk page discussions.',
    permissions: [
      'Approve or reject pending edits',
      'Restore previous revisions',
      'Resolve Talk page threads and flag sensitive topics',
    ],
  },
  {
    key: 'contributor',
    title: 'Contributor',
    description: 'Creates and improves content, participates in Talk pages, and proposes new articles.',
    permissions: [
      'Submit edit proposals',
      'Draft new page outlines',
      'Participate in hackathon write-ups and tutorial curation',
    ],
  },
  {
    key: 'reader',
    title: 'Reader',
    description: 'Explores the wiki, bookmarks resources, and reacts to articles to inform popularity metrics.',
    permissions: [
      'Browse all published content',
      'Watchlist pages and receive update alerts',
      'Upvote tutorials and add Talk page questions',
    ],
  },
];

