import type { APIRoute } from 'astro';
import { runConvexMutation } from '../../../lib/convex.server';
import { getConvexUserByWorkOSId, buildActingIdentity } from '../../../lib/wiki/convexHelpers';

export const POST: APIRoute = async ({ locals }) => {
  try {
    const workosUser = locals.user;
    if (!workosUser) {
      return new Response(JSON.stringify({ message: 'Authentication required.' }), { status: 401 });
    }

    // Try to get existing Convex user
    let convexUser = await getConvexUserByWorkOSId(workosUser.id);

    // If user doesn't exist in Convex, create them
    if (!convexUser) {
      await runConvexMutation('users:syncWorkOSIdentity', {
        workosUserId: workosUser.id,
        email: workosUser.email || '',
        firstName: workosUser.firstName,
        lastName: workosUser.lastName,
        avatarUrl: workosUser.profilePictureUrl,
      });

      convexUser = await getConvexUserByWorkOSId(workosUser.id);

      if (!convexUser) {
        return new Response(
          JSON.stringify({ message: 'Failed to create user profile. Please try again.' }),
          { status: 500 }
        );
      }
    }

    const actingIdentity = buildActingIdentity(workosUser, convexUser);
    const result = await runConvexMutation(
      'newsletters:subscribe',
      {},
      { actingAs: actingIdentity }
    );

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to subscribe.';
    return new Response(
      JSON.stringify({ message: errorMessage }),
      { status: 500 }
    );
  }
};
