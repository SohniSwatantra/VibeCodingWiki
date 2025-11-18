import { query, mutation } from './kit';
import { v } from 'convex/values';
import { requireUser } from './auth';
import { now } from './utils';

export const ROLES = {
  superAdmin: 'super_admin',
  moderator: 'moderator',
  contributor: 'contributor',
  reader: 'reader',
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

export async function requireRole(ctx: any, allowed: RoleName[] = [ROLES.reader]) {
  const viewer = await requireUser(ctx);

  const assignments = await ctx.db
    .query('roles')
    .withIndex('by_userId', (q: any) => q.eq('userId', viewer._id))
    .collect();

  const roleNames: RoleName[] = assignments.map((assignment: any) => assignment.role);

  const hasPermission = allowed.some((role) => roleNames.includes(role));
  if (!hasPermission) {
    throw new Error('Insufficient permissions for this action.');
  }

  return { viewer, roleNames };
}

export const getUserRoles = query({
  args: { userId: v.id('users') },
  handler: async (ctx: any, args: { userId: string }) => {
    return await ctx.db
      .query('roles')
      .withIndex('by_userId', (q: any) => q.eq('userId', args.userId))
      .collect();
  },
});

export const assignRole = mutation({
  args: {
    targetUserId: v.id('users'),
    role: v.string(),
  },
  handler: async (ctx: any, args: { targetUserId: string; role: string }) => {
    // Require super_admin role to assign roles
    const { viewer } = await requireRole(ctx, [ROLES.superAdmin]);

    // Validate the role
    const validRoles = Object.values(ROLES);
    if (!validRoles.includes(args.role as RoleName)) {
      throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    // Check if the user already has this role
    const existingRole = await ctx.db
      .query('roles')
      .withIndex('by_userId', (q: any) => q.eq('userId', args.targetUserId))
      .filter((q: any) => q.eq(q.field('role'), args.role))
      .unique();

    if (existingRole) {
      throw new Error('User already has this role');
    }

    // Assign the new role
    const roleId = await ctx.db.insert('roles', {
      userId: args.targetUserId,
      role: args.role,
      assignedBy: viewer._id,
      assignedAt: now(),
      expiresAt: undefined,
    });

    return { roleId };
  },
});

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx: any, args: { email: string }) => {
    const user = await ctx.db
      .query('users')
      .filter((q: any) => q.eq(q.field('email'), args.email))
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

