/**
 * Diff utilities for wiki content comparison and merging
 * Uses diff-match-patch for robust diff/patch operations
 */

import DiffMatchPatch from 'diff-match-patch';
import * as Diff from 'diff';

export type DiffStats = {
  additions: number;
  deletions: number;
  totalChanges: number;
};

export type DiffChange = {
  added?: boolean;
  removed?: boolean;
  value: string;
  count?: number;
};

const dmp = new DiffMatchPatch();

/**
 * Generate a patch/diff from original content to modified content
 * Returns a text patch that can be stored and later applied
 */
export function generateDiff(originalContent: string, modifiedContent: string): string {
  const diffs = dmp.diff_main(originalContent, modifiedContent);
  dmp.diff_cleanupSemantic(diffs); // Make diffs more human-readable
  const patches = dmp.patch_make(originalContent, diffs);
  return dmp.patch_toText(patches);
}

/**
 * Apply a diff patch to base content
 * Returns the resulting content and whether the patch applied successfully
 */
export function applyDiff(baseContent: string, diffPatch: string): {
  content: string;
  success: boolean;
  conflicts: boolean;
} {
  try {
    const patches = dmp.patch_fromText(diffPatch);
    const [patchedContent, results] = dmp.patch_apply(patches, baseContent);

    // Check if all patches applied successfully
    const allSuccess = results.every((result) => result === true);

    return {
      content: patchedContent,
      success: allSuccess,
      conflicts: !allSuccess,
    };
  } catch (error) {
    console.error('Failed to apply diff:', error);
    return {
      content: baseContent,
      success: false,
      conflicts: true,
    };
  }
}

/**
 * Calculate diff statistics (additions, deletions) from two content strings
 * Used for displaying diff stats badges
 */
export function calculateDiffStats(originalContent: string, modifiedContent: string): DiffStats {
  const diffs = dmp.diff_main(originalContent, modifiedContent);
  dmp.diff_cleanupSemantic(diffs);

  let additions = 0;
  let deletions = 0;

  diffs.forEach(([operation, text]) => {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const lineCount = lines.length;

    if (operation === 1) { // DIFF_INSERT
      additions += lineCount;
    } else if (operation === -1) { // DIFF_DELETE
      deletions += lineCount;
    }
  });

  return {
    additions,
    deletions,
    totalChanges: additions + deletions,
  };
}

/**
 * Check if applying a diff to current content would result in conflicts
 * This happens when the base content has changed since the diff was created
 */
export function hasConflicts(
  originalBase: string,
  currentBase: string,
  diffPatch: string
): boolean {
  // If base hasn't changed, no conflicts
  if (originalBase === currentBase) {
    return false;
  }

  // Try to apply the patch to current base
  const result = applyDiff(currentBase, diffPatch);
  return result.conflicts;
}

/**
 * Generate line-by-line diff changes for visualization
 * Used by the DiffViewer component
 */
export function generateLineDiff(oldContent: string, newContent: string): DiffChange[] {
  return Diff.diffLines(oldContent, newContent);
}

/**
 * Get a human-readable summary of changes
 */
export function getDiffSummary(stats: DiffStats): string {
  const parts: string[] = [];

  if (stats.additions > 0) {
    parts.push(`+${stats.additions} ${stats.additions === 1 ? 'line' : 'lines'}`);
  }

  if (stats.deletions > 0) {
    parts.push(`-${stats.deletions} ${stats.deletions === 1 ? 'line' : 'lines'}`);
  }

  if (parts.length === 0) {
    return 'No changes';
  }

  return parts.join(', ');
}

/**
 * Validate that content can be safely diffed
 */
export function isValidContent(content: unknown): content is string {
  return typeof content === 'string';
}
