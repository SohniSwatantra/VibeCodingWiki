/**
 * Filters admin-related summary text based on user role
 * Returns empty string if user is not a super admin and summary contains admin keywords
 */

const ADMIN_KEYWORDS = [
  'content update via admin panel',
  'admin update',
  'content update',
  'via admin',
  'super admin',
  'direct update',
];

export function filterAdminSummary(summary: string | undefined | null, isSuperAdmin: boolean): string {
  // If no summary, return empty string
  if (!summary) return '';

  // Super admins see everything
  if (isSuperAdmin) return summary;

  // Check if summary contains admin keywords (case-insensitive)
  const lowerSummary = summary.toLowerCase();
  const hasAdminKeyword = ADMIN_KEYWORDS.some(keyword =>
    lowerSummary.includes(keyword)
  );

  // If admin keyword found and user is not super admin, return empty string
  if (hasAdminKeyword) return '';

  // Otherwise return the original summary
  return summary;
}
