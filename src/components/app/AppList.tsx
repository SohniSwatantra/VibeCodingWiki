import { useQuery } from '@tanstack/react-query';
import { QueryProvider } from '../providers/QueryProvider';

interface App {
  _id: string;
  name: string;
  category: string;
  categoryOther?: string;
  description: string;
  builtIn: string;
  builtInOther?: string;
  submittedAt: number;
}

interface AppListProps {
  builtIn?: string;
  category?: string;
  limit?: number;
}

function AppCard({ app }: { app: App }) {
  const displayCategory = app.category === 'Others' ? app.categoryOther : app.category;
  const displayTool = app.builtIn === 'Others' ? app.builtInOther : app.builtIn;

  return (
    <div className="rounded border border-[#a2a9b1] bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold text-[#202122] mb-2">{app.name}</h3>
      <p className="text-sm text-[#54595d] mb-3 line-clamp-3">{app.description}</p>
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full bg-[#eaecf0] px-2.5 py-0.5 text-xs font-medium text-[#202122]">
          {displayCategory}
        </span>
        <span className="inline-flex items-center rounded-full bg-[#d5fdf4] px-2.5 py-0.5 text-xs font-medium text-[#14866d]">
          Built with {displayTool}
        </span>
      </div>
    </div>
  );
}

function AppListContent({ builtIn, category, limit = 100 }: AppListProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['apps', builtIn, category, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (builtIn) params.append('builtIn', builtIn);
      if (category) params.append('category', category);
      params.append('limit', String(limit));

      const response = await fetch(`/api/apps/list?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch apps');
      }
      const result = await response.json();
      return result.apps as App[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-[#0645ad] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded border border-[#d33f3f] bg-[#f8d7da] px-4 py-3 text-sm text-[#721c24]">
        Failed to load apps. Please try again later.
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-[#54595d]">
        <p className="text-lg">No apps found</p>
        <p className="text-sm mt-2">Be the first to submit an app!</p>
        <a
          href="/submit-app"
          className="inline-block mt-4 rounded border border-[#0645ad] bg-[#0645ad] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b0080]"
        >
          Submit Your App
        </a>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((app) => (
        <AppCard key={app._id} app={app} />
      ))}
    </div>
  );
}

export function AppList(props: AppListProps) {
  return (
    <QueryProvider>
      <AppListContent {...props} />
    </QueryProvider>
  );
}
