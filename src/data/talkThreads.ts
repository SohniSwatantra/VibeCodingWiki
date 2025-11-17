export type TalkPost = {
  id: string;
  author: string;
  role: 'super-admin' | 'moderator' | 'contributor' | 'reader';
  postedAt: string;
  body: string;
};

export type TalkThread = {
  id: string;
  articleSlug: string;
  topic: string;
  status: 'open' | 'resolved' | 'archived';
  posts: TalkPost[];
};

const talkSeed: TalkThread[] = [
  {
    id: 'thread-001',
    articleSlug: 'origins-of-vibecoding',
    topic: 'Add more sources for early Twitch streams',
    status: 'open',
    posts: [
      {
        id: 'post-001',
        author: 'luna',
        role: 'moderator',
        postedAt: '2025-09-14T13:05:00.000Z',
        body: 'We should reference the 2020 “Code the Vibe” stream series. Does anyone have archived timestamps?',
      },
      {
        id: 'post-002',
        author: 'aiko',
        role: 'contributor',
        postedAt: '2025-09-14T15:20:00.000Z',
        body: 'I have a playlist saved. Uploading to the media repository today and will link back here.',
      },
    ],
  },
  {
    id: 'thread-002',
    articleSlug: 'vibecoding-culture',
    topic: 'Clarify “Flow, Feel, Form” citations',
    status: 'resolved',
    posts: [
      {
        id: 'post-003',
        author: 'jamal',
        role: 'moderator',
        postedAt: '2025-07-23T09:45:00.000Z',
        body: 'Added the missing links to the manifesto PDF and the retrospective blog. Closing this thread.',
      },
    ],
  },
  {
    id: 'thread-003',
    articleSlug: 'vibecoding-tools',
    topic: 'Document new GrooveSync API endpoints',
    status: 'open',
    posts: [
      {
        id: 'post-004',
        author: 'kai',
        role: 'super-admin',
        postedAt: '2025-10-01T18:30:00.000Z',
        body: 'GrooveSync 2.0 introduces the `/presets` endpoint. Need someone from the team to draft the API section.',
      },
    ],
  },
];

export function getTalkThreads(articleSlug: string) {
  return talkSeed.filter((thread) => thread.articleSlug === articleSlug);
}

