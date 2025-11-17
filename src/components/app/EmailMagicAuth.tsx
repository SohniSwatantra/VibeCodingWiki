import { useState } from 'react';
import type { FormEvent } from 'react';

type Stage = 'idle' | 'code-sent' | 'verifying' | 'done';

export function EmailMagicAuth() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<Stage>('idle');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/workos/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request', email }),
      });

      const data = (await response.json()) as { message?: string; devCode?: string };

      if (!response.ok) {
        throw new Error(data.message ?? 'Failed to send magic link');
      }

      setDevCode(data.devCode ?? null);
      setStage('code-sent');
    } catch (magicError) {
      setError(magicError instanceof Error ? magicError.message : 'Unexpected error requesting code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    setStage('verifying');

    try {
      const response = await fetch('/api/auth/workos/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', email, code }),
      });

      const data = (await response.json()) as { message?: string; success?: boolean };

      if (!response.ok) {
        throw new Error(data.message ?? 'Invalid code');
      }

      setStage('done');
      window.setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (magicError) {
      setStage('code-sent');
      setError(magicError instanceof Error ? magicError.message : 'Unable to verify code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded border border-[#c8ccd1] bg-[#f8f9fa] p-4 shadow-sm">
      <h3 className="text-base font-semibold text-[#202122]">Email magic link</h3>
      {stage === 'idle' && (
        <form className="space-y-3" onSubmit={handleRequestCode}>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#72777d]" htmlFor="magic-email">
              Email address
            </label>
            <input
              id="magic-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded border border-[#a2a9b1] bg-white px-3 py-2 text-sm text-[#202122] focus:border-[#3366cc] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !email}
            className="rounded border border-[#3366cc] bg-[#3366cc] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#254a99] disabled:opacity-60"
          >
            {loading ? 'Sending…' : 'Send magic code'}
          </button>
        </form>
      )}

      {stage === 'code-sent' && (
        <form className="space-y-3" onSubmit={handleVerifyCode}>
          <p className="text-sm text-[#54595d]">
            Enter the 6-digit code sent to <strong>{email}</strong>.
            {devCode && (
              <span className="ml-2 text-xs text-[#d33f3f]">
                Dev code: <code>{devCode}</code>
              </span>
            )}
          </p>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#72777d]" htmlFor="magic-code">
              Verification code
            </label>
            <input
              id="magic-code"
              required
              minLength={4}
              maxLength={10}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="mt-1 w-full rounded border border-[#a2a9b1] bg-white px-3 py-2 text-sm text-[#202122] focus:border-[#3366cc] focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || !code}
              className="rounded border border-[#3366cc] bg-[#3366cc] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#254a99] disabled:opacity-60"
            >
              {loading ? 'Checking…' : 'Verify & sign in'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStage('idle');
                setCode('');
                setDevCode(null);
              }}
              className="rounded border border-transparent px-3 py-2 text-xs font-semibold text-[#72777d] hover:text-[#0b0080]"
            >
              Use a different email
            </button>
          </div>
        </form>
      )}

      {stage === 'verifying' && <p className="text-sm text-[#54595d]">Verifying code…</p>}
      {stage === 'done' && <p className="text-sm text-[#202122]">Signed in! Redirecting…</p>}
      {error && <p className="text-xs text-[#d33f3f]">{error}</p>}
    </div>
  );
}


