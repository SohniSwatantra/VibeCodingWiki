import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryProvider } from '../providers/QueryProvider';

function NewsletterSignupContent() {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const queryClient = useQueryClient();

  // Check subscription status
  const { data: subscriptionStatus, isLoading } = useQuery({
    queryKey: ['newsletter-status'],
    queryFn: async () => {
      const response = await fetch('/api/newsletter/status');
      if (!response.ok) throw new Error('Failed to check subscription status');
      return await response.json();
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to subscribe');
      }

      return await response.json();
    },
    onSuccess: () => {
      setStatus('success');
      queryClient.invalidateQueries({ queryKey: ['newsletter-status'] });
    },
    onError: (error: any) => {
      setStatus('error');
      setErrorMessage(error.message || 'Failed to subscribe. Please try again.');
    },
  });

  const handleSubscribe = () => {
    setStatus('idle');
    setErrorMessage('');
    subscribeMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="text-sm text-[#54595d]">
        Loading subscription status...
      </div>
    );
  }

  if (subscriptionStatus?.subscribed) {
    return (
      <div className="rounded border border-[#28a745] bg-[#d4edda] px-4 py-3 text-sm text-[#155724]">
        <p className="font-semibold">You're subscribed to the VibeCoding Newsletter!</p>
        <p className="mt-1">
          You subscribed on {new Date(subscriptionStatus.subscribedAt).toLocaleDateString()}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {status === 'success' && (
        <div className="rounded border border-[#28a745] bg-[#d4edda] px-4 py-3 text-sm text-[#155724]">
          Successfully subscribed to the newsletter! You'll receive updates at your registered email.
        </div>
      )}

      {status === 'error' && (
        <div className="rounded border border-[#d33f3f] bg-[#f8d7da] px-4 py-3 text-sm text-[#721c24]">
          {errorMessage}
        </div>
      )}

      {status === 'idle' && (
        <div className="rounded border border-[#c8ccd1] bg-[#f8f9fa] p-4">
          <p className="text-sm text-[#202122]">
            Click the button below to subscribe to the VibeCoding Newsletter. You'll receive:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#54595d]">
            <li>Weekly updates on new VibeCoding tools and resources</li>
            <li>Community highlights and success stories</li>
            <li>Tips and best practices from experienced vibe coders</li>
            <li>Early access to new features and announcements</li>
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={handleSubscribe}
        disabled={subscribeMutation.isPending || status === 'success'}
        className="rounded border border-[#0645ad] bg-[#0645ad] px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0b0080] disabled:opacity-60"
      >
        {subscribeMutation.isPending ? 'Subscribing...' : 'Sign me up for newsletter'}
      </button>
    </div>
  );
}

export function NewsletterSignup() {
  return (
    <QueryProvider>
      <NewsletterSignupContent />
    </QueryProvider>
  );
}
