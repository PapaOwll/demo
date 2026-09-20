---
description: Port new changes from the main project (crm-sitra-front master) into this demo
argument-hint: [--dry-run]
allowed-tools: Bash(git:*), Bash(diff:*), Bash(npx eslint:*), Bash(npx prettier:*), Bash(npm run build-only:*), Bash(node:*), Read, Write, Edit, Grep, Glob, TodoWrite, Task
---

# Sync demo from main project (crm-sitra-front → crm-demo)

Port every change that landed on the **main project's `master` branch** since the
last sync into this demo repo, then commit atomically.

## Fixed paths

- Main project: `/home/signal-mahdi/WebstormProjects/crm-sitra-front` (branch `master`)
- This repo: current working directory (crm-demo)
- Sync state: `.claude/last-main-sync` — contains the last-synced main-master commit SHA (no trailing newline handling surprises; treat content as one SHA)

## Procedure

### 1. Collect the delta

```bash
MAIN=/home/signal-mahdi/WebstormProjects/crm-sitra-front
git -C "$MAIN" fetch origin master --quiet 2>/dev/null || true   # no remote? just skip
git -C "$MAIN" rev-parse master          # current HEAD
LAST=$(cat .claude/last-main-sync)
git -C "$MAIN" log --oneline "$LAST..master"          # commits to port
git -C "$MAIN" diff --name-status "$LAST..master"     # files to port
```

If the log is empty → nothing to do; report and stop.
If `.claude/last-main-sync` is missing, ask the user for the starting SHA
(fallback: compare and treat ALL differing files as candidates, but confirm first).

Also check unmerged feature branches ONLY if the user explicitly names one —
this command syncs `master` exclusively.

### 2. Classify and port each file

For every file in the diff:

| Case | Action |
|------|--------|
| Demo file byte-identical to main's `$LAST` version | `git apply` the per-file patch directly (`git -C "$MAIN" diff "$LAST..master" -- <file> > /tmp/f.patch && git apply /tmp/f.patch`) |
| Demo file diverged (mock wiring, demo-only edits) | Manual merge with Edit — port the master hunks, PRESERVE all demo-specific code |
| Patch fails as "already applied" | Verify demo already contains the change (previously ported from a feature branch); skip |
| File only in demo (`CLAUDE.md`, `src/utils/base-url.js`, everything under `src/mock/`, smoke scripts) | SKIP — never overwrite demo-specific files |
| File deleted in master | Delete in demo too, unless demo modified it — then ask |
| New file in master | Copy over, then check imports resolve in demo |

Known intentional demo divergences to preserve while merging (non-exhaustive —
discover with `diff` per file before editing): `TpDescription.vue` (edit flow,
`durationMs`, `extractSelectedTeethFromItem`), `User/query/index.js`
(`options` forwarding on mutations), mock-related query wiring anywhere.

### 3. Mock layer (MANDATORY for any data-touching change)

Per project rules every create/update/delete must persist in the localStorage
mock db:

- Add/extend handlers in `src/mock/handlers.js` (first-match-wins dispatch —
  check no earlier route shadows yours; routes are anchored regexes).
- Seed data changes go in `src/mock/seeds/*.js` + bump `VERSION` in
  `src/mock/db.js` (reseeds localStorage; accepted demo pattern).
- Response envelopes: list = `{ data: { items } }`, single = `{ data: <row> }`,
  mutation may carry `message`. Study neighboring handlers before writing.

### 4. Quality gates (in this order)

```bash
npx eslint --fix <changed files>        # NEVER `npm run lint` (repo-wide autofix)
npx prettier --write <changed files>
npm run build-only
```

If `src/mock/handlers.js` changed: smoke-test with the vite `ssrLoadModule`
technique (script must live in project root; polyfill `localStorage` with a Map
and `FileReader` for upload paths; `handleMockRequest` is synchronous except
FormData upload handlers which are async). Delete the script afterwards.

### 5. Commit

- Atomic commits grouped by logical feature (not per file).
- Messages in **ENGLISH**, conventional emoji format (`✨ feat:`, `🐛 fix:`, …).
- **NO** Claude attribution / Co-Authored-By footer.
- Finally update `.claude/last-main-sync` to the new master HEAD SHA and amend
  it into the last port commit (or its own `🔧 chore:` commit if none).

### 6. Report

Summarize: ported commits → demo commits, skipped files + reasons, mock
endpoints added, seed/VERSION changes, verification results.

## Rules

- `--dry-run` argument: do steps 1–2 analysis only, present the port plan, change nothing.
- Persian UI strings stay Persian; code comments may stay English.
- If a conflict is genuinely ambiguous or a master change breaks demo-specific
  wiring, STOP and ask the user — do not guess.
- Never force-push, never rewrite existing demo history.
