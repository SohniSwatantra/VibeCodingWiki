const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

function safeHref(value: string) {
  if (value.startsWith('/')) return value;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Render the small, safe inline subset used by article paragraphs. */
export function renderInlineContent(value: string) {
  const links: string[] = [];
  const captureLink = (_match: string, href: string, label: string) => {
    const safe = safeHref(href);
    if (!safe) return label;
    const token = `ARTICLELINKTOKEN${links.length}END`;
    links.push(`<a href="${escapeHtml(safe)}" rel="noreferrer">${escapeHtml(label)}</a>`);
    return token;
  };

  const tokenized = value
    .replace(/<a\s+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, captureLink)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/g, (_match, label, href) => captureLink(_match, href, label));

  return links.reduce(
    (html, link, index) => html.replace(`ARTICLELINKTOKEN${index}END`, link),
    escapeHtml(tokenized),
  );
}
