import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import type { PropsWithChildren } from 'react';

/**
 * QueryProvider creates a single React Query client instance the first time
 * the component renders, then shares it with every child component.
 * We wrap interactive React "islands" with this provider when we need
 * client-side data fetching and caching.
 */
export function QueryProvider({ children }: PropsWithChildren) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 1000 * 30,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      {/* Devtools show cache state in development to help beginners debug */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

