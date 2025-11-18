import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QueryProvider } from '../providers/QueryProvider';

const CATEGORIES = [
  'Games',
  'Tech',
  'Health',
  'Travel',
  'Habits',
  'Productivity',
  'Others',
];

const BUILD_TOOLS = [
  'Lovable',
  'Bolt',
  'V0',
  'Replit',
  'Cursor',
  'CoPilot',
  'VScode',
  'Claude Code',
  'Vibe Code APP',
  'Vibingbase',
  'Others',
];

function AppSubmissionFormContent() {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    categoryOther: '',
    description: '',
    builtIn: '',
    builtInOther: '',
  });
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/apps/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit app');
      }

      return await response.json();
    },
    onSuccess: () => {
      setSubmitStatus('success');
      setFormData({
        name: '',
        category: '',
        categoryOther: '',
        description: '',
        builtIn: '',
        builtInOther: '',
      });
      queryClient.invalidateQueries({ queryKey: ['apps'] });
    },
    onError: (error: any) => {
      setSubmitStatus('error');
      setErrorMessage(error.message || 'Failed to submit app. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus('idle');
    setErrorMessage('');

    // Validation
    if (!formData.name.trim()) {
      setErrorMessage('Please enter the app name');
      setSubmitStatus('error');
      return;
    }
    if (!formData.category) {
      setErrorMessage('Please select a category');
      setSubmitStatus('error');
      return;
    }
    if (formData.category === 'Others' && !formData.categoryOther.trim()) {
      setErrorMessage('Please specify the category');
      setSubmitStatus('error');
      return;
    }
    if (!formData.description.trim()) {
      setErrorMessage('Please enter a description');
      setSubmitStatus('error');
      return;
    }
    if (!formData.builtIn) {
      setErrorMessage('Please select the tool used to build the app');
      setSubmitStatus('error');
      return;
    }
    if (formData.builtIn === 'Others' && !formData.builtInOther.trim()) {
      setErrorMessage('Please specify the tool used');
      setSubmitStatus('error');
      return;
    }

    submitMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-[#202122] mb-1">
          Name of App *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full rounded border border-[#a2a9b1] px-3 py-2 text-sm text-[#202122] focus:border-[#0645ad] focus:outline-none focus:ring-1 focus:ring-[#0645ad]"
          placeholder="My Awesome App"
          required
        />
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-semibold text-[#202122] mb-1">
          Category *
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full rounded border border-[#a2a9b1] px-3 py-2 text-sm text-[#202122] focus:border-[#0645ad] focus:outline-none focus:ring-1 focus:ring-[#0645ad]"
          required
        >
          <option value="">Select a category</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Category Other */}
      {formData.category === 'Others' && (
        <div>
          <label htmlFor="categoryOther" className="block text-sm font-semibold text-[#202122] mb-1">
            Specify Category *
          </label>
          <input
            type="text"
            id="categoryOther"
            name="categoryOther"
            value={formData.categoryOther}
            onChange={handleChange}
            className="w-full rounded border border-[#a2a9b1] px-3 py-2 text-sm text-[#202122] focus:border-[#0645ad] focus:outline-none focus:ring-1 focus:ring-[#0645ad]"
            placeholder="Your category"
            required
          />
        </div>
      )}

      {/* Built In */}
      <div>
        <label htmlFor="builtIn" className="block text-sm font-semibold text-[#202122] mb-1">
          Built In *
        </label>
        <select
          id="builtIn"
          name="builtIn"
          value={formData.builtIn}
          onChange={handleChange}
          className="w-full rounded border border-[#a2a9b1] px-3 py-2 text-sm text-[#202122] focus:border-[#0645ad] focus:outline-none focus:ring-1 focus:ring-[#0645ad]"
          required
        >
          <option value="">Select a tool</option>
          {BUILD_TOOLS.map((tool) => (
            <option key={tool} value={tool}>
              {tool}
            </option>
          ))}
        </select>
      </div>

      {/* Built In Other */}
      {formData.builtIn === 'Others' && (
        <div>
          <label htmlFor="builtInOther" className="block text-sm font-semibold text-[#202122] mb-1">
            Specify Tool *
          </label>
          <input
            type="text"
            id="builtInOther"
            name="builtInOther"
            value={formData.builtInOther}
            onChange={handleChange}
            className="w-full rounded border border-[#a2a9b1] px-3 py-2 text-sm text-[#202122] focus:border-[#0645ad] focus:outline-none focus:ring-1 focus:ring-[#0645ad]"
            placeholder="Your tool"
            required
          />
        </div>
      )}

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-semibold text-[#202122] mb-1">
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={5}
          className="w-full rounded border border-[#a2a9b1] px-3 py-2 text-sm text-[#202122] focus:border-[#0645ad] focus:outline-none focus:ring-1 focus:ring-[#0645ad]"
          placeholder="Describe your app..."
          required
        />
      </div>

      {/* Status Messages */}
      {submitStatus === 'success' && (
        <div className="rounded border border-[#28a745] bg-[#d4edda] px-4 py-3 text-sm text-[#155724]">
          Your app has been submitted successfully! It will be reviewed before being published.
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="rounded border border-[#d33f3f] bg-[#f8d7da] px-4 py-3 text-sm text-[#721c24]">
          {errorMessage}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitMutation.isPending}
        className="rounded border border-[#0645ad] bg-[#0645ad] px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0b0080] disabled:opacity-60"
      >
        {submitMutation.isPending ? 'Submitting...' : 'Submit App'}
      </button>
    </form>
  );
}

export function AppSubmissionForm() {
  return (
    <QueryProvider>
      <AppSubmissionFormContent />
    </QueryProvider>
  );
}
