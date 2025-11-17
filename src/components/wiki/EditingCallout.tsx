type EditingCalloutProps = {
  articleTitle: string;
};

/**
 * EditingCallout reminds readers that the wiki is collaborative and invites
 * them to propose changes. Later we will wire this to real edit submission flows.
 */
export function EditingCallout({ articleTitle }: EditingCalloutProps) {
  return (
    <section className="rounded border border-[#c8ccd1] bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-[#202122]">Collaborate on this article</h3>
      <p className="mt-2 text-sm text-[#202122]">
        Vibecodingwiki grows through community contributions. If you spot a gap in <strong>{articleTitle}</strong>, share sources, add
        new sections, or help polish existing writing.
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        <a
          href="#propose-edit"
          className="rounded border border-[#a2a9b1] bg-[#f8f9fa] px-3 py-1.5 text-[#0645ad] hover:bg-white"
        >
          Propose an edit
        </a>
        <a
          href="/guides/contribution-playbook"
          className="rounded border border-[#a2a9b1] bg-[#f8f9fa] px-3 py-1.5 text-[#0645ad] hover:bg-white"
        >
          Read contribution guide
        </a>
      </div>
    </section>
  );
}

