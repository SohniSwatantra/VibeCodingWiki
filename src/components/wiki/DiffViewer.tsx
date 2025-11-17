/**
 * DiffViewer - Display unified inline diff with color-coded changes
 * Shows additions in green, deletions in red, similar to GitHub
 */

import { useMemo } from 'react';
import { generateLineDiff, type DiffChange } from '../../lib/diff/diffUtils';

export type DiffStats = {
  additions: number;
  deletions: number;
};

export type DiffViewerProps = {
  oldContent: string;
  newContent: string;
  stats?: DiffStats;
  className?: string;
};

export function DiffViewer({ oldContent, newContent, stats, className = '' }: DiffViewerProps) {
  const diffChanges = useMemo(() => {
    return generateLineDiff(oldContent, newContent);
  }, [oldContent, newContent]);

  return (
    <div className={`diff-viewer ${className}`}>
      {/* Stats Badge */}
      {stats && (stats.additions > 0 || stats.deletions > 0) && (
        <div className="diff-stats" style={{
          marginBottom: '1rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#f6f8fa',
          border: '1px solid #d0d7de',
          borderRadius: '6px',
          fontSize: '0.875rem',
          fontFamily: 'monospace',
        }}>
          <span style={{ color: '#1f883d', fontWeight: '600' }}>
            +{stats.additions}
          </span>
          {' '}
          <span style={{ color: '#cf222e', fontWeight: '600' }}>
            -{stats.deletions}
          </span>
          {' '}
          <span style={{ color: '#656d76' }}>
            ({stats.additions + stats.deletions} {stats.additions + stats.deletions === 1 ? 'line' : 'lines'} changed)
          </span>
        </div>
      )}

      {/* Unified Diff View */}
      <div className="diff-content" style={{
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
        fontSize: '12px',
        lineHeight: '20px',
        border: '1px solid #d0d7de',
        borderRadius: '6px',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
      }}>
        {diffChanges.map((change, index) => {
          const lines = change.value.split('\n');

          return lines.map((line, lineIndex) => {
            // Skip empty lines at the end
            if (lineIndex === lines.length - 1 && line === '') {
              return null;
            }

            const key = `${index}-${lineIndex}`;

            // Unchanged lines
            if (!change.added && !change.removed) {
              return (
                <div
                  key={key}
                  style={{
                    padding: '0 10px',
                    backgroundColor: '#ffffff',
                    color: '#1f2328',
                  }}
                >
                  <span style={{ color: '#656d76', marginRight: '1rem', userSelect: 'none' }}>
                    {' '}
                  </span>
                  {line || ' '}
                </div>
              );
            }

            // Added lines (green)
            if (change.added) {
              return (
                <div
                  key={key}
                  style={{
                    padding: '0 10px',
                    backgroundColor: '#dafbe1',
                    color: '#1f2328',
                  }}
                >
                  <span style={{ color: '#1f883d', marginRight: '1rem', fontWeight: '600', userSelect: 'none' }}>
                    +
                  </span>
                  {line || ' '}
                </div>
              );
            }

            // Removed lines (red)
            if (change.removed) {
              return (
                <div
                  key={key}
                  style={{
                    padding: '0 10px',
                    backgroundColor: '#ffebe9',
                    color: '#1f2328',
                  }}
                >
                  <span style={{ color: '#cf222e', marginRight: '1rem', fontWeight: '600', userSelect: 'none' }}>
                    -
                  </span>
                  {line || ' '}
                </div>
              );
            }

            return null;
          });
        })}
      </div>
    </div>
  );
}

/**
 * Compact stats badge that can be used separately
 */
export function DiffStatsBadge({ stats }: { stats: DiffStats }) {
  if (stats.additions === 0 && stats.deletions === 0) {
    return <span style={{ color: '#656d76', fontSize: '0.875rem' }}>No changes</span>;
  }

  return (
    <span style={{
      fontSize: '0.875rem',
      fontFamily: 'monospace',
      fontWeight: '600',
    }}>
      {stats.additions > 0 && (
        <span style={{ color: '#1f883d' }}>
          +{stats.additions}
        </span>
      )}
      {stats.additions > 0 && stats.deletions > 0 && ' '}
      {stats.deletions > 0 && (
        <span style={{ color: '#cf222e' }}>
          -{stats.deletions}
        </span>
      )}
    </span>
  );
}
