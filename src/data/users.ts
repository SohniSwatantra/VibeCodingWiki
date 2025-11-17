type Contribution = {
  articleSlug: string;
  articleTitle: string;
  summary: string;
  editedAt: string;
};

export type UserProfile = {
  username: string;
  displayName: string;
  role: 'super-admin' | 'moderator' | 'contributor' | 'reader';
  joinedAt: string;
  bio: string;
  reputation: number;
  badges: string[];
  contributions: Contribution[];
};

const users: UserProfile[] = [
  {
    username: 'luna',
    displayName: 'Luna Vega',
    role: 'moderator',
    joinedAt: '2021-06-20T00:00:00.000Z',
    bio: 'Community storyteller and vibe session facilitator. Loves documenting the culture behind creative code.',
    reputation: 1280,
    badges: ['Vibe Manifesto Editor', 'Talk Steward'],
    contributions: [
      {
        articleSlug: 'origins-of-vibecoding',
        articleTitle: 'Origins of VibeCoding',
        summary: 'Expanded early experiments with Moodboard CLI references.',
        editedAt: '2025-09-12T08:45:00.000Z',
      },
      {
        articleSlug: 'vibecoding-culture',
        articleTitle: 'VibeCoding Culture',
        summary: 'Documented new retrospective ritual template.',
        editedAt: '2025-07-22T16:20:00.000Z',
      },
    ],
  },
  {
    username: 'kai',
    displayName: 'Kai Moreno',
    role: 'super-admin',
    joinedAt: '2020-11-02T00:00:00.000Z',
    bio: 'Co-founder of the VibeCoding guild. Maintains GlowStack templates and handles governance upgrades.',
    reputation: 2030,
    badges: ['GlowStack Architect', 'Policy Maintainer'],
    contributions: [
      {
        articleSlug: 'vibecoding-tools',
        articleTitle: 'VibeCoding Tools',
        summary: 'Updated GrooveSync feature list for v2.0.',
        editedAt: '2025-03-04T09:00:00.000Z',
      },
      {
        articleSlug: 'timeline-of-vibecoding',
        articleTitle: 'Timeline of VibeCoding',
        summary: 'Added VibeCoding wiki relaunch milestone.',
        editedAt: '2025-02-14T11:12:00.000Z',
      },
    ],
  },
  {
    username: 'mira',
    displayName: 'Mira Adebayo',
    role: 'contributor',
    joinedAt: '2022-04-11T00:00:00.000Z',
    bio: 'Product designer experimenting with synesthetic UI patterns. Runs accessibility audits for vibe sessions.',
    reputation: 780,
    badges: ['Accessibility Advocate'],
    contributions: [
      {
        articleSlug: 'vibecoding-tools',
        articleTitle: 'VibeCoding Tools',
        summary: 'Pending addition of Synesthetic DevTools case study.',
        editedAt: '2025-10-08T12:15:00.000Z',
      },
      {
        articleSlug: 'vibecoding-best-practices',
        articleTitle: 'VibeCoding Best Practices',
        summary: 'Drafted sustainability playbook outline.',
        editedAt: '2025-09-29T19:05:00.000Z',
      },
    ],
  },
];

export function getUserProfile(username: string) {
  return users.find((user) => user.username === username);
}

export function getAllUsers() {
  return [...users];
}

