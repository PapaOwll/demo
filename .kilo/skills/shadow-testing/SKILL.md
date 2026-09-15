---
name: shadow-testing
description: "تولید خودکار طرح تست سایه (Shadow Testing Plan) پس از اتمام تغییرات: Happy Path, Edge Cases و Side-Effects."
globs:
  - "**/*.vue"
  - "**/*.js"
  - "**/*.jsx"
  - "**/*.cjs"
  - "**/*.mjs"
alwaysApply: true
---

# Shadow Testing Plan

## Purpose

After completing code changes, generate a structured testing plan to ensure quality and catch regressions before handoff.

## When to Activate

After all implementation changes are complete and code passes lint validation.

## Output Format

Provide the following three sections in chat:

### 1. Happy Path

Step-by-step verification of the main acceptance criteria. For each criterion:
- **Action:** What the user/system does
- **Expected:** What should happen
- **Where:** Component/page and relevant route

### 2. Edge Cases

Highlight framework-specific and project-specific edge cases:
- **Quasar gotchas:** e.g., `pointer-events` on disabled items that need a wrapper `<div>` to be clickable
- **Reactivity traps:** e.g., `ref` vs `reactive` for arrays/objects, watchers on nested props
- **Empty data:** What happens when API returns `[]`, `null`, or `{}`
- **Large datasets:** Pagination, virtual scroll behavior
- **Network failures:** Timeout handling, offline state

### 3. Side-Effects Checklist

List other views/components that share the modified data/state and could regress:
- **Shared composables** — other consumers of the modified composable
- **Shared store modules** — other components reading/writing the same Pinia store
- **Route dependencies** — guards, beforeEnter hooks, or query params affected
- **Shared API endpoints** — other calls to the same endpoint that may be impacted
- **Layout/Navigation** — breadcrumbs, menu items, or tabs that reference the changed feature

## Example Output

```
## Shadow Testing Plan

### Happy Path
1. Navigate to /settings/profile → form renders with current user data
2. Edit display name → input updates, save button enables
3. Click save → success notification, data persists on reload

### Edge Cases
- [ ] Special characters in display name (emoji, RTL text)
- [ ] Network timeout on save → error toast with retry
- [ ] Empty display name → validation message appears

### Side-Effects Checklist
- [ ] Header user avatar (uses same store module)
- [ ] /dashboard greeting (reads user display name)
- [ ] Mobile nav sidebar (reflects updated name)
```
