const DEFAULT_NAMESPACE = 'main';

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalizeNamespace(namespace?: string): string {
  if (!namespace) return DEFAULT_NAMESPACE;
  return namespace.toLowerCase();
}

export function now(): number {
  return Date.now();
}

