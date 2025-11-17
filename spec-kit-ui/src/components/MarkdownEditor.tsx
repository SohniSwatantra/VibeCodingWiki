import { type ChangeEvent, useEffect, useMemo, useState } from 'react';

type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

type MarkdownEditorProps = {
  initialContent: string;
  endpoint: string;
  documentName: string;
};

function formatTimestamp() {
  return new Date().toLocaleString();
}

export function MarkdownEditor({ initialContent, endpoint, documentName }: MarkdownEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  useEffect(() => {
    setContent(initialContent);
    setStatus('idle');
    setMessage(null);
    setLastSavedAt(null);
  }, [initialContent]);

  const characterCount = useMemo(() => content.length, [content]);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(event.target.value);
    setStatus('dirty');
    setMessage(null);
  };

  const handleReset = () => {
    setContent(initialContent);
    setStatus('idle');
    setMessage(null);
    setLastSavedAt(null);
  };

  const handleSave = async () => {
    if (status === 'saving') return;
    if (!content.trim()) {
      setMessage('Document cannot be blank.');
      setStatus('error');
      return;
    }

    try {
      setStatus('saving');
      setMessage(null);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.message ?? 'Unable to save document.');
      }

      setStatus('saved');
      setMessage('Changes saved successfully.');
      setLastSavedAt(formatTimestamp());
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unable to save document.');
    }
  };

  return (
    <section className="space-y-4">
      <header className="rounded border border-[#c8ccd1] bg-[#f8f9fa] px-4 py-3">
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#72777d]">Document</p>
            <h2 className="text-xl font-semibold text-[#202122]">{documentName}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#54595d]">
            <span>Characters: {characterCount.toLocaleString()}</span>
            {lastSavedAt ? <span>Last saved: {lastSavedAt}</span> : null}
            <span>
              Status:{' '}
              {status === 'saving'
                ? 'Saving…'
                : status === 'saved'
                  ? 'Saved'
                  : status === 'dirty'
                    ? 'Unsaved changes'
                    : status === 'error'
                      ? 'Error'
                      : 'Idle'}
            </span>
          </div>
        </div>
      </header>

      {message ? (
        <p
          className={
            status === 'error'
              ? 'rounded border border-[#d33f3f] bg-[#f8d7da] px-4 py-2 text-sm text-[#842029]'
              : 'rounded border border-[#a2a9b1] bg-[#f5f5f5] px-4 py-2 text-sm text-[#202122]'
          }
        >
          {message}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#72777d]">Markdown Source</span>
          <textarea
            value={content}
            onChange={handleChange}
            rows={24}
            className="min-h-[28rem] w-full resize-y rounded border border-[#a2a9b1] bg-white px-3 py-2 text-sm text-[#202122] focus:border-[#3366cc] focus:outline-none"
          />
        </label>

        <div className="flex flex-col gap-2 rounded border border-[#c8ccd1] bg-white p-4">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#72777d]">Quick Preview</span>
          <div className="max-h-[28rem] space-y-3 overflow-auto whitespace-pre-wrap rounded border border-dashed border-[#eaecf0] bg-[#f8f9fa] px-3 py-2 text-sm text-[#202122]">
            {content.trim().length === 0 ? (
              <p className="text-[#72777d]">Start typing to see a preview.</p>
            ) : (
              content.split('\n\n').map((block, index) => (
                <p key={index}>{block}</p>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={status === 'saving'}
          className="rounded border border-[#3366cc] bg-[#3366cc] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#254a99] disabled:opacity-60"
        >
          {status === 'saving' ? 'Saving…' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded border border-[#a2a9b1] bg-white px-4 py-2 text-sm font-semibold text-[#202122] shadow-sm hover:bg-[#f8f9fa]"
        >
          Reset
        </button>
      </div>
    </section>
  );
}

