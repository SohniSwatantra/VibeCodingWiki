import { useState } from 'react';
import type { FormEvent } from 'react';

type NewPageProposal = {
  id: string;
  title: string;
  contributor: string;
  category: string;
  outline: string;
  createdAt: string;
};

const categories = ['History', 'Culture', 'Tools', 'Companies', 'Hackathons', 'Tutorials', 'Best Practices'];

export function NewPageProposalForm() {
  const [title, setTitle] = useState('');
  const [contributor, setContributor] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [outline, setOutline] = useState('');
  const [proposals, setProposals] = useState<NewPageProposal[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title || !contributor || !outline) {
      setNotice('Please complete title, contributor, and outline so reviewers understand your idea.');
      return;
    }

    const proposal: NewPageProposal = {
      id: `new-${Date.now()}`,
      title,
      contributor,
      category,
      outline,
      createdAt: new Date().toISOString(),
    };

    setProposals((prev) => [proposal, ...prev]);
    setTitle('');
    setContributor('');
    setCategory(categories[0]);
    setOutline('');
    setNotice('Thanks! A moderator will review your new page proposal.');
  };

  return (
    <section className="rounded border border-[#a2a9b1] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-[#202122]">Propose a new page</h2>
      <p className="mt-2 text-sm text-[#54595d]">
        Suggest new topics for the encyclopedia. Explain why the subject matters, outline the sections you plan to draft, and provide any
        references so moderators can help you publish quickly.
      </p>

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#72777d]" htmlFor="new-title">
            Working title
          </label>
          <input
            id="new-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1 w-full rounded border border-[#a2a9b1] bg-white px-3 py-2 text-sm text-[#202122] focus:border-[#3366cc] focus:outline-none"
            placeholder="e.g. VibeCoding Accessibility Playbook"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#72777d]" htmlFor="new-contributor">
              Contributor handle
            </label>
            <input
              id="new-contributor"
              value={contributor}
              onChange={(event) => setContributor(event.target.value)}
              className="mt-1 w-full rounded border border-[#a2a9b1] bg-white px-3 py-2 text-sm text-[#202122] focus:border-[#3366cc] focus:outline-none"
              placeholder="@username"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#72777d]" htmlFor="new-category">
              Category
            </label>
            <select
              id="new-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="mt-1 w-full rounded border border-[#a2a9b1] bg-white px-3 py-2 text-sm text-[#202122] focus:border-[#3366cc] focus:outline-none"
            >
              {categories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#72777d]" htmlFor="new-outline">
            Outline and references
          </label>
          <textarea
            id="new-outline"
            value={outline}
            onChange={(event) => setOutline(event.target.value)}
            rows={5}
            className="mt-1 w-full rounded border border-[#a2a9b1] bg-white px-3 py-2 text-sm text-[#202122] focus:border-[#3366cc] focus:outline-none"
            placeholder="List your planned sections, sources, and any collaborators."
          />
        </div>

        <button
          type="submit"
          className="rounded border border-[#3366cc] bg-[#3366cc] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#254a99]"
        >
          Send to moderators
        </button>
      </form>

      {notice && <p className="mt-3 text-xs text-[#0b0080]">{notice}</p>}

      {proposals.length > 0 && (
        <div className="mt-5 rounded border border-[#eaecf0] bg-[#f8f9fa] p-3">
          <h3 className="text-sm font-semibold text-[#202122]">Submitted ideas (local preview)</h3>
          <ul className="mt-2 space-y-2 text-sm text-[#202122]">
            {proposals.map((proposal) => (
              <li key={proposal.id} className="rounded border border-[#c8ccd1] bg-white p-3">
                <p className="text-xs text-[#72777d]">
                  {proposal.contributor} · {new Date(proposal.createdAt).toLocaleString()} · {proposal.category}
                </p>
                <p className="mt-1 font-semibold">{proposal.title}</p>
                <p className="mt-1 text-sm text-[#54595d]">{proposal.outline}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

