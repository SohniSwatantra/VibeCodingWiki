#!/bin/zsh

set -u

readonly REPOSITORY_DIR="/Users/swatantrasohni/Downloads/mediawiki-master/mediawiki-tanstack"
readonly CODEX_BIN="/Users/swatantrasohni/.bun/bin/codex"

export PATH="/Users/swatantrasohni/.bun/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export LANG="en_US.UTF-8"

print -r -- "[$(/bin/date -u '+%Y-%m-%dT%H:%M:%SZ')] Starting VibeCoding news sweep"

if [[ ! -x "$CODEX_BIN" ]]; then
  print -u2 -r -- "Codex CLI is unavailable at $CODEX_BIN"
  exit 1
fi

if [[ -n "$(/usr/bin/git -C "$REPOSITORY_DIR" status --porcelain)" ]]; then
  print -u2 -r -- "Skipped: repository has uncommitted changes"
  exit 0
fi

readonly TASK_PROMPT='Use $update-vibecoding-news for the daily VibeCodingWiki news sweep. Work only in the current repository. First fetch origin/main and fast-forward only when safe; stop without changes if the branch diverged or the worktree is dirty. Research evidence-qualified developments since the latest verified sweep across VibeCoding tools, acquisitions, Product Hunt launches, security changes, and notable community projects. Verify direct sources, deduplicate against src/data/news.json, and add only material new stories. Run npm run news:validate and npm run build. When intended news changes exist and checks pass, commit them with a concise message and push normally to the current branch so Netlify can deploy; never force-push. Verify the production /news page and new source links. Do not change the visual style, publish rumors, expose credentials, or create filler. If nothing qualifies, leave the repository unchanged and report a concise no-change result.'

"$CODEX_BIN" exec \
  --approve-for-me \
  --ephemeral \
  --color never \
  --cd "$REPOSITORY_DIR" \
  "$TASK_PROMPT"

exit_code=$?
print -r -- "[$(/bin/date -u '+%Y-%m-%dT%H:%M:%SZ')] Sweep finished with exit code $exit_code"
exit "$exit_code"
