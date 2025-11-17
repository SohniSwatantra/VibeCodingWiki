# VibeCodingWiki Checkpoints

Keeping lightweight restore points makes it easy to roll the app back to a known-good configuration even without Git metadata in this workspace.

| Checkpoint | Date | Description | Restore Notes |
|------------|------|-------------|---------------|
| `fallback-data` | 2025-11-16 | Astro pages rendered static `src/data/articles.ts` content; React islands read from in-memory arrays. Convex schema lacked timeline/metadata fields. | If you captured a zip/tarball earlier, replace `mediawiki-tanstack/src` with that snapshot. Otherwise revert the files listed in this document to the versions prior to `convex-wired`. |
| `convex-wired` | 2025-11-16 | Current state. Convex schema includes tags/timeline/metadata, Astro routes hydrate from Convex helpers, React islands use TanStack Query + `/api/wiki/*` endpoints, and checkpoints doc exists. | Tag this state in Git when available (`git tag convex-wired`). To restore later, checkout the tag or stash/branch created at this point. |

## Manual rollback checklist

1. **Back up current work**: `rsync -a mediawiki-tanstack/ mediawiki-tanstack-backup/`.
2. **Identify target checkpoint**: choose from the table above.
3. **Restore files**:
   - With Git: `git checkout <checkpoint-tag> -- mediawiki-tanstack`.
   - Without Git: copy the backed-up directory from the corresponding snapshot archive.
4. **Install deps & verify**:
   ```bash
   cd mediawiki-tanstack
   npm install
   npm run dev
   ```
5. **Confirm behaviour**: load `/wiki`, `/wiki/<slug>`, and `/wiki/<slug>/talk` to ensure the restored state matches the checkpoint description.

Add a new entry to this file whenever you complete a major milestone (e.g., auth sync, ingestion jobs). Include the date, a short description, and how to recreate the state.

