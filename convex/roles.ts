import { requireUser } from './auth';

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

