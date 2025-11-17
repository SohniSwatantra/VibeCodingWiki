import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'vcw:support-dismissed-at';
const DISMISS_DURATION_DAYS = 30;

function isDismissedRecently(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return false;

  const dismissedAt = Number.parseInt(stored, 10);
  if (Number.isNaN(dismissedAt)) return false;

  const msSinceDismissed = Date.now() - dismissedAt;
  const maxMs = DISMISS_DURATION_DAYS * 24 * 60 * 60 * 1000;
  return msSinceDismissed < maxMs;
}

type CheckoutResponse = {
  url?: string;
  checkout_url?: string;
  message?: string;
};

export function SponsorshipBanner() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productId = import.meta.env.PUBLIC_AUTUMN_PRODUCT_ID;

  const successUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/thank-you`;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!productId) return;
    if (isDismissedRecently()) return;

    const timer = window.setTimeout(() => setOpen(true), 4000);
    return () => window.clearTimeout(timer);
  }, [productId]);

  if (!productId) {
    return null;
  }

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, Date.now().toString());
    }
    setOpen(false);
  };

  const handleCheckout = async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/.netlify/functions/autumn-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, successUrl }),
      });

      const data = (await response.json()) as CheckoutResponse;

      if (!response.ok) {
        throw new Error(data.message ?? 'Unable to start checkout');
      }

      const url = data.url ?? data.checkout_url;
      if (url) {
        window.location.href = url;
        return;
      }

      throw new Error('Checkout URL missing in response');
    } catch (checkoutError) {
      console.error(checkoutError);
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : 'Something went wrong starting the donation checkout.',
      );
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <aside className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div className="max-w-3xl rounded-lg border border-[#a2a9b1] bg-white p-5 shadow-2xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2 md:max-w-xl">
            <p className="text-xs uppercase tracking-[0.35em] text-[#72777d]">Support Vibecodingwiki</p>
            <h2 className="text-lg font-semibold text-[#202122]">
              We rely on community donations just like Wikipedia
            </h2>
            <p className="text-sm text-[#202122]">
              Vibecodingwiki stays independent thanks to vibecoders who chip in a few dollars. If you find these guides helpful, please
              consider donating today.
            </p>
            {error && <p className="text-xs text-[#d33f3f]">{error}</p>}
          </div>
          <div className="flex flex-col gap-2 md:w-48">
            <button
              type="button"
              onClick={handleCheckout}
              disabled={loading}
              className="rounded border border-[#3366cc] bg-[#3366cc] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#254a99] disabled:opacity-60"
            >
              {loading ? 'Connecting…' : 'Donate now'}
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded border border-transparent bg-transparent px-4 py-2 text-xs font-semibold text-[#54595d] hover:text-[#0b0080]"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}


