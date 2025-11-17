import { useState } from 'react';

type ChecklistItem = {
  id: string;
  label: string;
};

const defaultItems: ChecklistItem[] = [
  { id: 'bolt-new', label: 'Prototype UI flow in Bolt.new and export to Astro' },
  { id: 'convex-schema', label: 'Design Convex schema for pages, revisions, and discussions' },
  { id: 'workos-auth', label: 'Configure WorkOS OAuth + magic links for sign-in' },
  { id: 'autumn-billing', label: 'Set up Autumn products and feature gates' },
  { id: 'firecrawl-import', label: 'Trigger a Firecrawl ingestion job into Convex' },
  { id: 'netlify-deploy', label: 'Deploy preview to Netlify with Cloudflare DNS' },
];

/**
 * LaunchChecklist is a tiny interactive widget that lets you track progress
 * through the major integration steps. We use local component state so new
 * learners can see how React islands behave within Astro pages.
 */
export function LaunchChecklist() {
  const [completed, setCompleted] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setCompleted((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const progress = Math.round((completed.length / defaultItems.length) * 100);

  return (
    <section className="mt-6 flex flex-col gap-4 rounded border border-[#a2a9b1] bg-white p-5 shadow-sm">
      <header className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-[#202122]">Getting to launch</h3>
        <p className="text-sm text-[#54595d]">
          Toggle each task as you wire the stack together. This list mirrors the implementation plan.
        </p>
      </header>

      <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#e3e4e6]">
        <div
          className="h-full rounded-full bg-[#3366cc] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-[#54595d]">Progress: {progress}%</p>

      <ul className="flex flex-col gap-2">
        {defaultItems.map((item) => {
          const isDone = completed.includes(item.id);

          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                className={`flex w-full items-center justify-between rounded border px-3 py-2 text-left transition ${
                  isDone
                    ? 'border-[#3366cc] bg-[#eef2ff] text-[#202122]'
                    : 'border-[#c8ccd1] bg-[#f8f9fa] text-[#202122] hover:border-[#3366cc]'
                }`}
              >
                <span className="max-w-[75%] text-sm">{item.label}</span>
                <span
                  aria-hidden
                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold ${
                    isDone
                      ? 'border-[#3366cc] bg-[#3366cc] text-white'
                      : 'border-[#c8ccd1] bg-white text-[#54595d]'
                  }`}
                >
                  {isDone ? '✔' : '○'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

