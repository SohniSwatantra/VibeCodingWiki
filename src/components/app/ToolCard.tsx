interface ToolCardProps {
  name: string;
  count: number;
  slug: string;
}

export function ToolCard({ name, count, slug }: ToolCardProps) {
  return (
    <a
      href={`/vibecoded-apps/${slug}`}
      className="block rounded border border-[#a2a9b1] bg-white p-6 shadow-sm hover:shadow-md hover:border-[#0645ad] transition-all"
    >
      <h3 className="text-xl font-semibold text-[#202122] mb-2">{name}</h3>
      <p className="text-sm text-[#54595d]">
        {count} {count === 1 ? 'app' : 'apps'} built
      </p>
    </a>
  );
}

// Helper to convert tool name to URL slug
export function toolToSlug(toolName: string): string {
  return toolName.toLowerCase().replace(/\s+/g, '-');
}

// Helper to convert URL slug back to tool name
export function slugToTool(slug: string): string {
  const toolMap: Record<string, string> = {
    'lovable': 'Lovable',
    'bolt': 'Bolt',
    'v0': 'V0',
    'replit': 'Replit',
    'cursor': 'Cursor',
    'copilot': 'CoPilot',
    'vscode': 'VScode',
    'claude-code': 'Claude Code',
    'vibe-code-app': 'Vibe Code APP',
    'vibingbase': 'Vibingbase',
    'base44': 'Base44',
    'gemini-ai-studio': 'Gemini AI Studio',
    'others': 'Others',
  };
  return toolMap[slug] || slug;
}
