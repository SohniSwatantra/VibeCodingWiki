import { queryGeneric, mutationGeneric } from 'convex/server';

type QueryConfig = {
  args: Record<string, unknown>;
  handler: (ctx: any, args: any) => Promise<any> | any;
};

type MutationConfig = {
  args: Record<string, unknown>;
  handler: (ctx: any, args: any) => Promise<any> | any;
};

export function query<T extends QueryConfig>(config: T): T {
  return queryGeneric(config);
}

export function mutation<T extends MutationConfig>(config: T): T {
  return mutationGeneric(config);
}

