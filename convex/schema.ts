import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    workosUserId: v.string(),
    email: v.string(),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
    lastSeenAt: v.optional(v.number()),
  }).index('by_workosUserId', ['workosUserId']).index('by_email', ['email']),

  profiles: defineTable({
    userId: v.id('users'),
    bio: v.optional(v.string()),
    reputation: v.number(),
    contributionCount: v.number(),
    socials: v.optional(v.array(v.object({ platform: v.string(), url: v.string() }))),
    expertiseTags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_userId', ['userId']),

  roles: defineTable({
    userId: v.id('users'),
    role: v.string(),
    assignedBy: v.optional(v.id('users')),
    assignedAt: v.number(),
    expiresAt: v.optional(v.number()),
  }).index('by_userId', ['userId']).index('by_role', ['role']),

  pages: defineTable({
    slug: v.string(),
    title: v.string(),
    namespace: v.string(),
    summary: v.optional(v.string()),
    heroImage: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    createdBy: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    approvedRevisionId: v.optional(v.id('pageRevisions')),
    latestRevisionId: v.optional(v.id('pageRevisions')),
    status: v.optional(v.union(v.literal('draft'), v.literal('pending'), v.literal('published'), v.literal('archived'))),
    viewCount: v.optional(v.number()),
    popularityScore: v.optional(v.number()),
    lastScrapedAt: v.optional(v.number()),
    pageType: v.optional(v.string()),
  })
    .index('by_slug', ['slug'])
    .index('by_namespace', ['namespace'])
    .index('by_status', ['status'])
    .searchIndex('by_title', { searchField: 'title' })
    .searchIndex('by_summary', { searchField: 'summary' }),

  pageRevisions: defineTable({
    pageId: v.id('pages'),
    revisionNumber: v.number(),
    content: v.string(),
    summary: v.optional(v.string()),
    sections: v.optional(
      v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          level: v.number(),
          markdown: v.string(),
        }),
      ),
    ),
    tags: v.optional(v.array(v.string())),
    createdBy: v.id('users'),
    createdAt: v.number(),
    approvedBy: v.optional(v.id('users')),
    approvedAt: v.optional(v.number()),
    status: v.union(v.literal('draft'), v.literal('pending'), v.literal('approved'), v.literal('rejected')),
    rejectionReason: v.optional(v.string()),
    timeline: v.optional(
      v.array(
        v.object({
          year: v.union(v.string(), v.number()),
          title: v.string(),
          description: v.string(),
        }),
      ),
    ),
    relatedTopics: v.optional(v.array(v.string())),
    ingestionJobId: v.optional(v.id('ingestionJobs')),
    importedFrom: v.optional(
      v.object({
        provider: v.string(),
        sourceUrl: v.optional(v.string()),
        snapshotId: v.optional(v.string()),
      }),
    ),
    metadata: v.optional(v.any()),
    // Diff tracking fields for intelligent merging
    baseRevisionId: v.optional(v.id('pageRevisions')), // The revision this proposal is based on
    diffContent: v.optional(v.string()), // The diff patch (unified diff format)
    diffStats: v.optional(
      v.object({
        additions: v.number(),
        deletions: v.number(),
        tokens: v.optional(v.number()),
      }),
    ),
  })
    .index('by_pageId', ['pageId'])
    .index('by_pageId_status', ['pageId', 'status'])
    .index('by_creator', ['createdBy'])
    .index('by_status', ['status']),

  talkThreads: defineTable({
    pageId: v.id('pages'),
    title: v.string(),
    createdBy: v.id('users'),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
    status: v.union(v.literal('open'), v.literal('resolved'), v.literal('archived')),
    lastMessageAt: v.optional(v.number()),
  })
    .index('by_pageId', ['pageId'])
    .index('by_status', ['status']),

  talkMessages: defineTable({
    threadId: v.id('talkThreads'),
    authorId: v.id('users'),
    body: v.string(),
    createdAt: v.number(),
    editedAt: v.optional(v.number()),
    reactions: v.optional(v.array(v.object({ emoji: v.string(), count: v.number() }))),
    parentMessageId: v.optional(v.id('talkMessages')),
  }).index('by_threadId', ['threadId']),

  moderationEvents: defineTable({
    pageId: v.optional(v.id('pages')),
    revisionId: v.optional(v.id('pageRevisions')),
    actorId: v.id('users'),
    action: v.string(),
    message: v.optional(v.string()),
    createdAt: v.number(),
    metadata: v.optional(v.any())
  }).index('by_pageId', ['pageId']).index('by_revisionId', ['revisionId']).index('by_actorId', ['actorId']),

  tags: defineTable({
    slug: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal('timeline'),
      v.literal('tool'),
      v.literal('company'),
      v.literal('hackathon'),
      v.literal('tutorial'),
      v.literal('best_practice'),
      v.literal('custom'),
    ),
    createdAt: v.number(),
    createdBy: v.id('users'),
  }).index('by_slug', ['slug']).index('by_type', ['type']),

  pageTags: defineTable({
    pageId: v.id('pages'),
    tagId: v.id('tags'),
  })
    .index('by_pageId', ['pageId'])
    .index('by_tagId', ['tagId'])
    .index('by_pageTag', ['pageId', 'tagId']),

  watchlists: defineTable({
    userId: v.id('users'),
    pageId: v.id('pages'),
    createdAt: v.number(),
  }).index('by_userId', ['userId']).index('by_pageId', ['pageId']).index('by_user_page', ['userId', 'pageId']),

  notifications: defineTable({
    userId: v.id('users'),
    type: v.string(),
    payload: v.any(),
    readAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index('by_userId', ['userId']).index('by_userId_readAt', ['userId', 'readAt']),

  revisionReviews: defineTable({
    revisionId: v.id('pageRevisions'),
    reviewerId: v.id('users'),
    decision: v.union(v.literal('approved'), v.literal('rejected'), v.literal('needs_changes')),
    comment: v.optional(v.string()),
    createdAt: v.number(),
    metadata: v.optional(v.any()),
  })
    .index('by_revision', ['revisionId'])
    .index('by_reviewer', ['reviewerId'])
    .index('by_revision_reviewer', ['revisionId', 'reviewerId']),

  ingestionJobs: defineTable({
    requestedBy: v.optional(v.id('users')),
    pageId: v.optional(v.id('pages')),
    sourceUrl: v.string(),
    provider: v.string(),
    status: v.union(v.literal('queued'), v.literal('running'), v.literal('succeeded'), v.literal('failed')),
    payload: v.optional(v.any()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index('by_status', ['status'])
    .index('by_page', ['pageId'])
    .index('by_source', ['sourceUrl']),

  pageLinks: defineTable({
    fromPageId: v.id('pages'),
    toPageId: v.id('pages'),
    context: v.optional(v.string()),
    extractedAt: v.number(),
  })
    .index('by_from', ['fromPageId'])
    .index('by_to', ['toPageId'])
    .index('by_from_to', ['fromPageId', 'toPageId']),

  media: defineTable({
    pageId: v.optional(v.id('pages')),
    uploaderId: v.optional(v.id('users')),
    r2Key: v.string(),
    mimeType: v.string(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    altText: v.optional(v.string()),
    caption: v.optional(v.string()),
    license: v.optional(v.string()),
    attribution: v.optional(v.string()),
    srcUrl: v.optional(v.string()),
    externalId: v.optional(v.string()),
    status: v.union(v.literal('pending'), v.literal('active'), v.literal('archived')),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index('by_pageId', ['pageId'])
    .index('by_status', ['status'])
    .index('by_externalId', ['externalId'])
    .index('by_uploader', ['uploaderId']),

  pageMedia: defineTable({
    pageId: v.id('pages'),
    mediaId: v.id('media'),
    role: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
    addedAt: v.number(),
    addedBy: v.id('users'),
  })
    .index('by_pageId', ['pageId'])
    .index('by_mediaId', ['mediaId'])
    .index('by_page_role', ['pageId', 'role'])
    .index('by_addedBy', ['addedBy']),

  apps: defineTable({
    name: v.string(),
    category: v.string(), // Games, Tech, Health, Travel, Habits, Productivity, Others
    categoryOther: v.optional(v.string()), // If category is "Others"
    description: v.string(),
    builtIn: v.string(), // Lovable, Bolt, V0, Replit, Cursor, CoPilot, VScode, Claude Code, Vibe Code APP, Vibingbase, Others
    builtInOther: v.optional(v.string()), // If builtIn is "Others"
    submittedBy: v.id('users'),
    submittedAt: v.number(),
    status: v.union(v.literal('pending'), v.literal('approved'), v.literal('rejected')),
    approvedBy: v.optional(v.id('users')),
    approvedAt: v.optional(v.number()),
  })
    .index('by_category', ['category'])
    .index('by_status', ['status'])
    .index('by_submittedBy', ['submittedBy']),

  newsletterSubscribers: defineTable({
    userId: v.id('users'),
    email: v.string(),
    subscribedAt: v.number(),
    status: v.union(v.literal('active'), v.literal('unsubscribed')),
    unsubscribedAt: v.optional(v.number()),
  })
    .index('by_userId', ['userId'])
    .index('by_email', ['email'])
    .index('by_status', ['status']),

  sponsors: defineTable({
    name: v.string(),
    thankyouNote: v.string(),
    logoUrl: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    displayOrder: v.number(),
    createdAt: v.number(),
    createdBy: v.optional(v.id('users')),
  })
    .index('by_displayOrder', ['displayOrder']),
});

