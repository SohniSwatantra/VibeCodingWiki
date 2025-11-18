import { mutation, query } from './kit';
import { v } from 'convex/values';
import { now } from './utils';
import { ROLES } from './roles';

const ROLE_PRIORITY = [ROLES.superAdmin, ROLES.moderator, ROLES.contributor, ROLES.reader] as const;
type RoleKey = (typeof ROLE_PRIORITY)[number];

function isRoleKey(role: string): role is RoleKey {
  return (ROLE_PRIORITY as readonly string[]).includes(role);
}

export const syncWorkOSIdentity = mutation({
  args: {
    workosUserId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (
    ctx: any,
    args: {
      workosUserId: string;
      email: string;
      firstName?: string;
      lastName?: string;
      avatarUrl?: string;
    },
  ) => {
    const displayName = `${args.firstName ?? ''} ${args.lastName ?? ''}`.trim() || args.email.split('@')[0];
    const timestamp = now();

    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_workosUserId', (q: any) => q.eq('workosUserId', args.workosUserId))
      .unique();

    let userId;

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        displayName,
        avatarUrl: args.avatarUrl,
        lastSeenAt: timestamp,
      });
      userId = existingUser._id;
    } else {
      userId = await ctx.db.insert('users', {
        workosUserId: args.workosUserId,
        email: args.email,
        displayName,
        avatarUrl: args.avatarUrl,
        createdAt: timestamp,
        lastSeenAt: timestamp,
      });

      await ctx.db.insert('profiles', {
        userId,
        bio: '',
        reputation: 0,
        contributionCount: 0,
        socials: [],
        expertiseTags: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    const existingRoles = await ctx.db
      .query('roles')
      .withIndex('by_userId', (q: any) => q.eq('userId', userId))
      .collect();

    if (existingRoles.length === 0) {
      const hasAdmins = (
        await ctx.db
          .query('roles')
          .withIndex('by_role', (q: any) => q.eq('role', ROLES.superAdmin))
          .take(1)
      ).length > 0;

      const role = hasAdmins ? ROLES.contributor : ROLES.superAdmin;

      await ctx.db.insert('roles', {
        userId,
        role,
        assignedBy: userId,
        assignedAt: timestamp,
        expiresAt: undefined,
      });
    }

    return { userId };
  },
});


export const getByWorkOSId = query({
  args: {
    workosUserId: v.string(),
  },
  handler: async (ctx: any, args: { workosUserId: string }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_workosUserId', (q: any) => q.eq('workosUserId', args.workosUserId))
      .unique();

    if (!user) return null;

    const roles = await ctx.db
      .query('roles')
      .withIndex('by_userId', (q: any) => q.eq('userId', user._id))
      .collect();

    return {
      ...user,
      roles,
    };
  },
});

export const getPublicProfiles = query({
  args: {
    userIds: v.array(v.id('users')),
  },
  handler: async (ctx: any, args: { userIds: string[] }) => {
    const uniqueIds = Array.from(new Set(args.userIds.map((id) => id.toString())));
    if (uniqueIds.length === 0) return [];

    const users = await Promise.all(
      uniqueIds.map(async (rawId) => {
        const user = await ctx.db.get(rawId as any);
        if (!user) return null;

        const roles = await ctx.db
          .query('roles')
          .withIndex('by_userId', (q: any) => q.eq('userId', user._id))
          .collect();

        const profile = await ctx.db
          .query('profiles')
          .withIndex('by_userId', (q: any) => q.eq('userId', user._id))
          .unique();

        const primaryRole =
          roles
            .map((role: any) => role.role as string)
            .filter((role: string): role is RoleKey => isRoleKey(role))
            .sort((a: RoleKey, b: RoleKey) => ROLE_PRIORITY.indexOf(a) - ROLE_PRIORITY.indexOf(b))[0] ?? ROLES.reader;

        return {
          id: user._id,
          displayName: user.displayName ?? user.email,
          email: user.email,
          avatarUrl: user.avatarUrl,
          primaryRole,
          profile,
        };
      }),
    );

    return users.filter(Boolean);
  },
});

export const listContributors = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx: any, args: { limit?: number }) => {
    const limit = args.limit ?? 100;
    const users = await ctx.db.query('users').order('desc').take(limit);

    const contributors = await Promise.all(
      users.map(async (user: any) => {
        const roles = await ctx.db
          .query('roles')
          .withIndex('by_userId', (q: any) => q.eq('userId', user._id))
          .collect();

        const profile = await ctx.db
          .query('profiles')
          .withIndex('by_userId', (q: any) => q.eq('userId', user._id))
          .unique();

        const primaryRole =
          roles
            .map((role: any) => role.role as string)
            .filter((role: string): role is RoleKey => isRoleKey(role))
            .sort((a: RoleKey, b: RoleKey) => ROLE_PRIORITY.indexOf(a) - ROLE_PRIORITY.indexOf(b))[0] ?? ROLES.reader;

        return {
          _id: user._id,
          displayName: user.displayName ?? user.email,
          email: user.email,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
          primaryRole,
          bio: profile?.bio,
          reputation: profile?.reputation ?? 0,
          contributionCount: profile?.contributionCount ?? 0,
        };
      }),
    );

    return contributors;
  },
});

