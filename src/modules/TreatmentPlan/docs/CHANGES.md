# TreatmentPlan Providers — Refactor Changelog

> Complete record of changes applied to `TpProvider.js`, `TppProvider.js` (deleted), and related files. Each entry includes: what changed, why, the code-level diff, and verification status.

**Date**: 2026-07-08 (initial), 2026-06-05 (unification) **Scope**: `src/modules/TreatmentPlan/{providers,composables,constants}/` **Status**: All changes pass `npm run lint`, `npm run format`, `npm run build`

---

## Table of Contents

1. [Phase P4 — Unification (2026-06-05)](#phase-p4--unification-2026-06-05)
2. [Files Modified (historical)](#files-modified)
3. [Phase P0 — Critical Bug Fix](#phase-p0--critical-bug-fix)
4. [Phase P1 — Architecture](#phase-p1--architecture)
5. [Phase P2 — Consistency & DX](#phase-p2--consistency--dx)
6. [Phase P3 — Polish](#phase-p3--polish)
7. [Review-Driven Fixes](#review-driven-fixes)
8. [Verification Gates](#verification-gates)
9. [Deferred Decisions](#deferred-decisions)
10. [Migration Notes for Consumers (historical)](#migration-notes-for-consumers)

---

## Phase P4 — Unification (2026-06-05)

> **This is the current architecture.** Phases P0–P3 below are the historical record of the two-provider era and are preserved for context. `TppProvider.js` has been **deleted**; all consumers now use the unified `useTpProvider()` hook.

### P4-1 — Combine two providers into one mode-aware `TpProvider`

**Files**: `providers/TpProvider.js` (rewritten), `providers/TppProvider.js` (deleted) **Severity**: Architecture (cleanup) **Phase Status**: ✅ Shipped

#### Problem

Two near-identical providers (`TpProvider` for edit, `TppProvider` for preview) duplicated wiring logic and forced cross-mode composables (`use-tp-pricing.js`) to inject from **both** providers and dispatch by route mode. Consumers imported ~25 distinct `Symbol` exports and called `inject(Symbol)` individually — verbose and error-prone.

#### Fix

`TpProvider` now accepts a `mode` prop (`'edit'` | `'preview'`) and branches internally:

- Both queries (`useGetTreatmentPlanByIdQuery`, `useGetTreatmentPlanByKeyQuery`) are registered **unconditionally** and gated by `enabled` (TanStack Query requirement — conditional hook calls are forbidden).
- `serveData` query is edit-only.
- Step resolution: dynamic `backendStepNumber` (edit) vs static `TREATMENT_PLAN_STEP.PROPOSED` (preview).
- The store shape is mode-aware: preview exposes a reduced subset (5 state + 3 actions), edit exposes the full surface (7 state + 10 actions).

`TppProvider.js` was deleted via `git rm`.

### P4-2 — Move ALL state logic into `useTreatmentState`

**Files**: `composables/use-treatment-state.js` (expanded), `providers/TpProvider.js` (slimmed) **Severity**: Architecture (separation of concerns) **Phase Status**: ✅ Shipped

#### Problem

Edit-only actions (`updateTeeth`, `onSelectServe`, `removeService`, `updateSelectedInstallment`, `updateSelectedCheque`, `autoSelectServe`) were sitting in the provider ("waiter") even though they are state mutations that belong in the state machine ("kitchen").

#### Fix

ALL state refs, computeds, and actions now live in `useTreatmentState`. The composable's signature expanded:

```js
useTreatmentState({ initialDataRef, getStep, isPreview = false, serveDataRef = null })
```

- `isPreview` flag gates `onSelectServe` (skips tooth filtering in preview) and `autoSelectServe` (stays null when `serveDataRef` is absent).
- `serveDataRef` is passed in so `autoSelectServe` can react to the serve-items query.

`TpProvider.setup()` is now pure wiring: route → queries → step resolution → `useTreatmentState(...)` → store shape → `provide(...)` → watchers → cleanup. Zero state logic remains in the provider.

### P4-3 — Introduce the `useTpProvider()` flat composable hook

**Files**: NEW `composables/use-tp-provider.js` **Severity**: DX (consumer ergonomics) **Phase Status**: ✅ Shipped

#### Problem

Consumers wrote boilerplate for every piece of state:

```js
// BEFORE (per consumer, repeated ~25 times)
import { TreatmentSymbol, FinalPriceSymbol, UpdateFinalPriceSymbol } from '.../TpProvider'
const treatmentData = inject(TreatmentSymbol)
const finalPrice = inject(FinalPriceSymbol)
const updateFinalPrice = inject(UpdateFinalPriceSymbol)
```

#### Fix

A single flat hook replaces all Symbol imports:

```js
// AFTER
import { useTpProvider } from '@/modules/TreatmentPlan/composables/use-tp-provider'
const { treatmentData, finalPrice, updateFinalPrice } = useTpProvider()
```

The hook `inject`s the single `TpStoreSymbol`, flattens `{ state, actions, mode }` into one object, and adds an `isPreview` boolean. It **throws** if used outside a `<TpProvider>`.

### P4-4 — Migrate all 30 consumers + 2 composables

**Files**: 24 `TpUpsert/` components, 6 `TpPreview/` components, 4 pages, `composables/use-tp-pricing.js`, `composables/use-tp-perform.js` **Severity**: Migration **Phase Status**: ✅ Shipped

All consumers replaced `inject(Symbol)` with `useTpProvider()` destructuring. Where local variable names differed from store keys, destructuring aliases preserved them:

```js
const {
  serveData: serveItems,
  finalPrice: cashPrice,
  isNewCalculationDate: isNewDate,
  updateSelectedInstallment: updateInstallment,
} = useTpProvider()
```

`use-tp-pricing.js`'s dual-symbol dispatch (it previously injected from BOTH providers and branched on route mode) collapsed to a single `useTpProvider()` call — the unified hook returns the correct `isNewCalculationDate` regardless of which mode wraps the component.

4 pages updated to pass `mode`:

- `TpEdit.vue`, `TpCreateDraft.vue`, `TpShowDraft.vue` → `<Provider mode="edit">`
- `TpPublicPreview.vue` → `<Provider mode="preview">`

### P4-5 — Dev-mode Proxy guard for edit-only keys

**Files**: `composables/use-tp-provider.js` **Severity**: DX (safety net) **Phase Status**: ✅ Shipped

Destructuring an edit-only key (e.g. `updateTeeth`) in a preview component silently yields `undefined`. In development, a `Proxy` on the returned object logs a `console.warn` so the mistake is caught immediately. No-op in production.

```js
const EDIT_ONLY_KEYS = new Set([
  'serveData',
  'selectedCheque',
  'updateTeeth',
  'updateItems',
  'updateSelectedInstallment',
  'updateSelectedCheque',
  'updateTreatment',
  'removeService',
  'resetLocalState',
])
```

### P4-6 — Review-driven fixes (code-review-expert)

**Files**: `composables/use-tp-pricing.js`, `composables/use-tp-perform.js`, `composables/use-treatment-state.js`, `components/TpUpsert/TpRecordingReminderModal.vue` **Severity**: Correctness / clarity **Phase Status**: ✅ Shipped

After a `code-review-expert` pass:

1. **🚨 Rules-of-Hooks violation** — `use-tp-pricing.js` called `useTpProvider()` (which calls `inject()`) **after** an early-return guard. Moved the call above the guard so it always runs.
2. **Dead optional chaining** — `use-tp-perform.js` had `resetLocalState?.()`. Since `useTpProvider()` now guarantees the function exists or throws, removed the `?.`.
3. **Clarifying comments** — added on `onSelectServe` (why preview skips tooth filtering) and `TpRecordingReminderModal` (must be rendered inside `<TpProvider>`).

### P4-7 — Documentation sync

**Files**: `docs/PROVIDERS.md`, `docs/CHANGES.md` **Phase Status**: ✅ Shipped

`PROVIDERS.md` rewritten to v2.0 reflecting the unified architecture. This `CHANGES.md` section added. Phases P0–P3 below are preserved as the historical record of the two-provider era.

---

## Historical Record (Phases P0–P3)

> The sections below describe the refactor that **preceded** the unification (Phase P4). They reference `TppProvider.js`, which has since been deleted, and the per-Symbol `inject()` pattern, which has been replaced by `useTpProvider()`. They are retained for context on how the codebase arrived at its current shape.

---

## Files Modified

| File | Status | Lines Before → After |
| --- | --- | --- |
| `providers/TpProvider.js` | Refactored | 276 → 252 |
| `providers/TppProvider.js` | Refactored | 120 → 98 |
| `composables/use-treatment-state.js` | **NEW** | — → 129 |
| `constants/enums.js` | Extended | 43 → 46 |
| `docs/CHANGES.md` | **NEW** | this document |
| `docs/PROVIDERS.md` | **NEW** | current-state reference for both providers + composable |

**Net runtime LOC**: providers shrank by 46 lines (276+120 → 252+98); the new composable adds 129 lines; `enums.js` adds 3 lines → **net +86 lines**. The metric that matters is **deduplication**: ~110 lines of previously duplicated state/filtering logic now live in exactly one place (`use-treatment-state.js`), so future fixes apply once instead of twice.

---

## Phase P0 — Critical Bug Fix

### P0-1 — Fix `updateFinalPrice` zero-value bug in TppProvider

**File**: `providers/TppProvider.js` **Severity**: P0 (silent correctness bug) **Phase Status**: ✅ Shipped

#### Problem

The original guard used strict greater-than, which silently skipped legitimate `0` values:

```js
// BEFORE (TppProvider.js:91-95, original)
const updateFinalPrice = (value) => {
  if (value > 0) {
    finalPrice.value = Math.round(value)
  }
}
```

When the computed price dropped to `0` (e.g., total equals all discounts), the ref **never reset back to 0** — the previous positive value persisted.

#### Fix

Aligned with `TpProvider`'s correct semantics:

```js
// AFTER (now in composables/use-treatment-state.js)
const updateFinalPrice = (value) => {
  finalPrice.value = value >= 0 ? Math.round(value) : 0
}
```

#### Why Safe

The single consumer (`TppPricing.vue:188-192`) fires from a `watch` on `finalPrice.value` which is computed in `useTpPricing` as `Math.max(0, Math.round(...))` — always `>= 0`. No consumer relies on the old "skip if not positive" behavior.

#### Verification

- ESLint clean
- `npm run build` green
- Consumer behavior unchanged for all values `> 0`
- New ability to reset to `0` correctly handled

---

## Phase P1 — Architecture

### P1-2 — Extract hardcoded cutover date to a constant

**Files**: `constants/enums.js`, `providers/TpProvider.js`, `providers/TppProvider.js` **Severity**: P1 (magic value, duplicated) **Phase Status**: ✅ Shipped

#### Problem

The literal `'2026-01-18 13:00:00'` was hardcoded in **both** provider files. If the cutover date ever changes, both must be updated in lockstep — and it is very easy to forget one.

#### Fix

Added a single exported constant in `constants/enums.js`:

```js
// constants/enums.js (added)
// Cutover datetime (Gregorian) for the new pricing-calculation logic.
// Treatment plans created after this moment use the new calculation flow.
export const NEW_CALCULATION_CUTOVER_DATETIME = '2026-01-18 13:00:00'
```

Both providers now import and use it:

```js
// In both providers
import { NEW_CALCULATION_CUTOVER_DATETIME } from '../constants/enums'

const isNewCalculationDate = computed(
  () =>
    formatDate(treatmentData.value?.createdAt, 'YYYY-MM-DD HH:mm:ss') >
    NEW_CALCULATION_CUTOVER_DATETIME
)
```

#### Verification

- `grep` for `'2026-01-18 13:00:00'` in runtime code returns exactly one match: the constant definition
- Build green

---

### P1-3 — Extract `useTreatmentState` composable

**Files**: NEW `composables/use-treatment-state.js`, both providers refactored **Severity**: P1 (duplication, maintainability) **Phase Status**: ✅ Shipped

#### Problem

~60% of the logic was duplicated between the two providers:

| Duplicated Logic                           | Lines Each |
| ------------------------------------------ | ---------- |
| `updatedTreatmentData` ref                 | 1          |
| `treatmentData` computed                   | 3          |
| `updateTreatment(updates)`                 | 3          |
| `updateFinalPrice(value)`                  | 3          |
| `updateNewFinalPrice(value)`               | 3          |
| `isNewCalculationDate` computed            | 4          |
| `filterAllTeeth()`                         | 25         |
| `filterTeethForServe()` (mostly identical) | 10         |
| `resetLocalState()`                        | 3          |

Every future bug fix had to be applied twice → high drift risk.

#### Fix — Composable API

```js
// composables/use-treatment-state.js
useTreatmentState({ initialDataRef, getStep }) → {
  // State
  updatedTreatmentData, finalPrice, newFinalPrice, selectedServe,
  // Computed
  treatmentData, isNewCalculationDate,
  // Actions
  updateTreatment, updateFinalPrice, updateNewFinalPrice,
  // Tooth helpers
  filterTeethForServe, filterAllTeeth,
  // Misc
  resetLocalState,
}
```

**Key design decisions**:

1. **`getStep` as a callback thunk (not a ref)** — lets each provider choose its own step source without forcing reactivity ownership. `TppProvider` passes a constant; `TpProvider` passes a lazy read of `backendStepNumber`.

2. **The composable does NOT auto-register the `watch(initialDataRef, filterAllTeeth)`** — the caller wires it up. This is critical for `TpProvider`, which must defer registration until _after_ `useTpStatus(treatmentData)` has produced `backendStepNumber`. See [P1-3b](#p1-3b--lazy-binding-for-backendstepnumber-in-tpprovider) below.

#### P1-3a — TppProvider refactor

Reduced from 121 → 98 lines:

```js
// TppProvider.js (after refactor)
const { data: initialTreatmentData } = useGetTreatmentPlanByKeyQuery(hashKey)

const {
  finalPrice,
  newFinalPrice,
  selectedServe,
  treatmentData,
  isNewCalculationDate,
  updateFinalPrice,
  updateNewFinalPrice,
  filterAllTeeth,
  resetLocalState,
} = useTreatmentState({
  initialDataRef: initialTreatmentData,
  getStep: () => TREATMENT_PLAN_STEP.PROPOSED, // static for preview
})

watch(
  () => initialTreatmentData.value,
  (val) => {
    if (val) filterAllTeeth()
  },
  { immediate: true }
)
```

#### P1-3b — Lazy binding for `backendStepNumber` in TpProvider

`useTpStatus(treatmentData)` needs `treatmentData` from the composable, but the composable's `getStep` needs `backendStepNumber` from `useTpStatus`. To break the cycle without race conditions (comment at `TpProvider.js:55-58`):

```js
// TpProvider.js
// `backendStepNumber` is produced by `useTpStatus(treatmentData)` below, but
// `useTreatmentState` needs `getStep()` up front. Because closures capture
// bindings (not values), we declare the binding with `let` and reference it
// lazily; by the time `getStep()` is invoked, the binding is initialized.
let backendStepNumber

const { treatmentData, filterAllTeeth /* ... */ } = useTreatmentState({
  initialDataRef: initialTreatmentData,
  getStep: () => backendStepNumber?.value,
})

// Now treatmentData exists — derive the backend step from it.
;({ backendStepNumber } = useTpStatus(treatmentData))

// ...

// Filter teeth whenever fresh data arrives.
// Registered AFTER `useTpStatus` so `backendStepNumber` is initialized and
// `getStep()` returns a meaningful value on the first (immediate) run.
watch(
  () => initialTreatmentData.value,
  (val) => {
    if (val) filterAllTeeth()
  },
  { immediate: true }
)
```

**Why this works**:

- JavaScript closures capture bindings (the variable slot), not values
- `getStep` is only called from `filterTeethForServe` → `filterAllTeeth` → the `watch` callback
- The `watch` is registered AFTER `;({ backendStepNumber } = ...)` runs
- By the time `filterAllTeeth()` first executes, `backendStepNumber` holds the real value

**Failure mode if invariant is broken**: The `?.` would silently swallow an `undefined` binding, causing `isToothStatusMatchingStep(toothData, undefined)` to hit its `default` switch case → return `true` → no filtering → all teeth shown. The NOTE comment in `use-treatment-state.js:102-108` documents this explicitly.

#### Verification

- Build green at every intermediate step
- All Symbol exports preserved (consumers unaffected)
- Watch ordering manually traced

---

## Phase P2 — Consistency & DX

### P2-4 — Add `name` + HMR support to TppProvider

**File**: `providers/TppProvider.js` **Severity**: P2 (DX, consistency) **Phase Status**: ✅ Shipped

```js
// BEFORE
export default {
  setup() { /* ... */ },
  render() { return this.$slots.default() },
}

// AFTER
export default {
  name: 'TppProvider',   // shows in Vue DevTools (was <Anonymous>)
  setup() { /* ... */ },
  render() { return this.$slots.default() },
}

// HMR support for Vite
if (import.meta.hot) {
  import.meta.hot.accept()
}
```

---

### P2-5 — Remove redundant `onBeforeRouteLeave` in TpProvider

**File**: `providers/TpProvider.js` **Severity**: P2 (dead code, double invalidation) **Phase Status**: ✅ Shipped

#### Problem

Both lifecycle hooks ran identical cleanup:

```js
// BEFORE — both hooks do the same thing
onBeforeRouteLeave(async () => {
  resetLocalState()
  await queryClient.invalidateQueries({ ... })
})

onUnmounted(async () => {
  resetLocalState()
  await queryClient.invalidateQueries({ ... })
})
```

When navigating between routes, Vue fires `onBeforeRouteLeave` first, then the component unmounts → `onUnmounted` fires → **the invalidation runs twice**, causing a redundant network request.

#### Fix

Retained `onUnmounted` (covers both route changes AND `v-if` removal); removed `onBeforeRouteLeave`:

```js
// AFTER
onUnmounted(async () => {
  resetLocalState()
  await queryClient.invalidateQueries({
    queryKey: ['new-treatment-plan', 'treatment', route.params?.id],
  })
})
```

#### Safety Verification

Inspected the deleted `onBeforeRouteLeave` callback: it does NOT call `next(false)`, return `false`, or use the `next` callback. It was purely a cleanup side-effect. Removal is provably safe.

---

### P2-6 — Fix misleading Symbol description

**File**: `providers/TppProvider.js` **Severity**: P2 (debuggability) **Phase Status**: ✅ Shipped

```js
// BEFORE
export const TreatmentSymbol = Symbol('patch') // misleading description

// AFTER
export const TreatmentSymbol = Symbol('treatment-preview')
```

The description string is what appears in the console when a Symbol is logged. `'patch'` was meaningless. Note: this changes only the description, NOT the Symbol identity — `inject()` calls remain unaffected.

---

### P2-7 — Align `NewCalculationDate` Symbol description (scope reduced)

**File**: `providers/TppProvider.js` **Severity**: P2 (debuggability) **Phase Status**: ✅ Shipped (reduced scope)

#### Original Plan

Rename the export `NewCalculationDateSymbolPreview` → `NewCalculationDateSymbol` for consistency with TpProvider.

#### Discovery

`use-tp-pricing.js:4-5` imports BOTH symbols side-by-side:

```js
import { NewCalculationDateSymbol } from '@/modules/TreatmentPlan/providers/TpProvider'
import { NewCalculationDateSymbolPreview } from '@/modules/TreatmentPlan/providers/TppProvider'
```

…and dispatches between them by mode (`use-tp-pricing.js:40-49`). The `Preview` suffix is **load-bearing** — without it, the two imports would collide and require aliasing.

#### Action Taken

Kept the export name; updated only the description string for debug clarity:

```js
// AFTER
export const NewCalculationDateSymbolPreview = Symbol('newCalculationDate-preview')
```

---

### P2-10 — Add `onUnmounted` cleanup to TppProvider

**File**: `providers/TppProvider.js` **Severity**: P2 (correctness) **Phase Status**: ✅ Shipped

#### Problem

TppProvider had **no cleanup at all**. If the user navigated away while local edits existed, those edits could leak into the next mount (the next patient's preview could briefly show stale `selectedServe` / `updatedTreatmentData`).

#### Fix

```js
// TppProvider.js (added)
import { onUnmounted } from 'vue'

onUnmounted(() => {
  resetLocalState()
})
```

---

### P2-11 — Attempted factory pattern for price setters (rejected)

**File**: `composables/use-treatment-state.js` **Severity**: P2 (refactor polish) **Phase Status**: ❌ Rejected with rationale

#### Attempted

```js
// TRIED THEN REVERTED
const clampRoundTo = (targetRef) => (value) => {
  targetRef.value = value >= 0 ? Math.round(value) : 0
}
const updateFinalPrice = clampRoundTo(finalPrice)
const updateNewFinalPrice = clampRoundTo(newFinalPrice)
```

#### Rejection Reason

ESLint flagged two legitimate violations:

1. `unicorn/consistent-function-scoping` — `clampRoundTo` uses no closure vars, should be at module scope
2. `no-param-reassign` — mutating `targetRef.value` is a parameter mutation

For two single-line functions, the factory added more complexity than it removed. Reverted to inline form with an explanatory comment.

---

## Phase P3 — Polish

### P3-12 — Stabilize `autoSelectServe` watcher (documentation pass)

**File**: `providers/TpProvider.js` **Severity**: P3 (clarity) **Phase Status**: ✅ Shipped

#### Decision

The existing pattern is correct but subtle — the computed returns `null` as a sentinel once a serve is selected, and the watch guards with `if (serve)`. Rewriting would risk regressions in edge cases (e.g., re-selection after `removeService`).

Kept the logic verbatim, added explicit comments documenting the sentinel pattern and re-selection behavior:

```js
// Auto-select first meaningful serve when the user has not picked one.
//
// `autoSelectServe` returns `null` once `selectedServe` is set. That `null`
// is intentional: it acts as a sentinel so the watcher does not overwrite a
// user's manual selection. When `selectedServe` later becomes `null` again
// (e.g. via `removeService`), the computed re-evaluates and the watcher
// re-selects on the next tick.
```

---

### P3-13 — Document provider boundaries

**Files**: `providers/TpProvider.js`, `providers/TppProvider.js` **Severity**: P3 (discoverability) **Phase Status**: ✅ Shipped

Per `CLAUDE.md` guidance ("NEVER proactively create documentation files"), chose **file-level header JSDoc comments** over a separate README. These are discoverable when reading the file and survive file moves.

#### TpProvider header

```js
/**
 * TpProvider — internal (authenticated) treatment-plan editing flow.
 *
 * - Fetches the plan by `route.params.id` (an internal numeric identifier).
 * - Provides the FULL editing surface: teeth, items, cheques, installments,
 *   remove-service, auto-select, plus pricing.
 * - Tooth filtering uses the dynamic `backendStepNumber` (DRAFT vs PROPOSED vs
 *   PERFORMED) derived from the current treatment data via `useTpStatus`.
 * - On unmount: clears local state and invalidates the TanStack Query cache
 *   so the next visit refetches.
 *
 * For patient-facing preview/print flows, see `TppProvider.js` instead.
 * Shared state and tooth-filtering logic live in `composables/use-treatment-state.js`.
 */
```

#### TppProvider header

```js
/**
 * TppProvider — patient-facing treatment-plan preview/print flow.
 *
 * - Fetches the plan by `route.params.key` (a shareable hash, no auth required).
 * - Read-mostly: exposes only price overrides and serve selection.
 *   No cheque/installment/item editing, no removeService, no auto-select.
 * - Tooth filtering is fixed to `TREATMENT_PLAN_STEP.PROPOSED` — preview only
 *   ever shows the originally proposed teeth.
 * - The `*SymbolPreview` export names (esp. `NewCalculationDateSymbolPreview`)
 *   are intentionally suffixed so that composables like `use-tp-pricing.js` can
 *   import the edit and preview symbols side-by-side without name collisions.
 *
 * For internal editing flows, see `TpProvider.js` instead.
 * Shared state and tooth-filtering logic live in `composables/use-treatment-state.js`.
 */
```

---

## Review-Driven Fixes

After a self-review pass (using the `code-review-expert` subagent), the following additional fixes were applied:

### B1 — Document `updateFinalPrice` unification rationale

**File**: `composables/use-treatment-state.js` **Severity**: Blocker (silent behavioral change)

The refactor silently widened `TppProvider.updateFinalPrice`'s contract from `>0` to `>=0`. Added a `NOTE:` block (at `composables/use-treatment-state.js:45-50`) justifying the unification:

> The original `TppProvider` used a stricter `if (value > 0)` guard that silently skipped 0 and negatives. We deliberately unify on the `>= 0` semantics here because (a) `useTpPricing` always returns `Math.max(0, ...)` upstream, so the value reaching this setter is never negative in practice, and (b) the old `> 0` guard meant a price legitimately computed as 0 could not overwrite a stale positive value — a real (silent) bug fixed in P0.

### C2 — Reword inaccurate "TDZ" terminology

**File**: `composables/use-treatment-state.js` (NOTE comment at lines 102-108)

The original comment said "avoid TDZ on cached queries", but TDZ throws a `ReferenceError`. The actual risk is "use-before-assignment" — the binding exists but holds `undefined`. Reworded:

> Registering inside the composable would risk a "use-before-assignment" (NOT a TDZ error — the binding exists, but holds `undefined` until assigned), which `?.` would silently swallow and produce unfiltered teeth.

### C4 — Remove stale `setupReturn` cargo-cult

**File**: `providers/TpProvider.js`

The `const setupReturn = {}` / `return setupReturn` pattern was inherited from an older codebase. In Vue 3, a component with a `render()` function does NOT need `setup()` to return anything. The misleading comment "This helps with HMR" was wrong — HMR is handled by `import.meta.hot.accept()` at file bottom.

Removed both the declaration and the return. Added a clarifying comment.

### N1 — Relocate analysis docs

Moved `PROVIDERS_ANALYSIS.md` and `OPTIMIZATION_TODO.md` from `providers/` (where they polluted the runtime code directory) to a new `docs/` subfolder at the module root.

---

## Verification Gates

Every phase passed these gates before proceeding to the next:

| Gate | Tool | Result |
| --- | --- | --- |
| Lint clean | `npx eslint <files>` | 0 errors, 0 warnings |
| Format applied | `npx prettier --write <files>` | All files conform |
| Production build | `npm run build` | Green at every phase (6 builds total) |
| Consumer contract preserved | Manual + grep verification | All 25 Symbol exports intact |

**Consumer verification** — files importing from these providers (none required edits):

- `TppPricing.vue`, `TppCheque.vue`, `TppServeItems.vue`, `TppPrepay.vue`, `TppTeeth.vue`, `TppUser.vue`
- `TpPricing.vue`, `TpUser.vue`, `TpTopStepper.vue`, `TpHint.vue`, `TpRecordingReminderModal.vue`, `TpServeOptions.vue`, `TpServeItems.vue`, `TpTeeth.vue`, `TpVoiceRecord.vue`, `TpPublicDescription.vue`, `TpVisitType.vue`, `TpdDisease.vue`, `TpuBookingsList.vue`, `TpuCheque.vue`, `TpuActivation.vue`, `TpuInstallment.vue`, `TpuPrepay.vue`, `TpuComparisonBtn.vue`, `TpuPrepayReturnBtn.vue`, `TpuServicesListEdit.vue`, `TpuActions.vue`, `TpuDiscount.vue`, `TpuCreditBalance.vue`, `TpuPerformBtn.vue`
- `composables/use-tp-pricing.js`, `composables/use-tp-perform.js`

---

## Deferred Decisions

### D-1 — Route param guard (#8 from original plan)

**Decision**: Not implemented. Would change behavior contract.

Original code uses `route?.params?.id` (optional chaining) throughout — tolerant of missing values by design. A hard `throw new Error('TpProvider requires route.params.id')` would change the contract and could break legitimate flows where the param is intentionally absent (e.g., during transitions).

**Recommendation**: Defer to a separate hardening pass that audits ALL route-dependent providers together.

### D-2 — Extract `filterAllTeeth` to pure utility (#9 from original plan)

**Decision**: Superseded by P1-3.

The original plan was to extract `filterAllTeeth` into a pure utility function in `utils/teeth.js`. This is now moot: the composable in `composables/use-treatment-state.js` IS the centralization. The function lives in one place and can be tested through the composable.

### D-3 — Other provider pairs in the codebase

**Decision**: Not investigated. Worth a separate audit.

If other pairs of "edit vs preview" providers exist elsewhere in the codebase, they could benefit from the same composable pattern. This refactor did not search for them.

---

## Migration Notes for Consumers

### No consumer file edits required

All exported Symbol identities and names are preserved. The refactor is **internally breaking but externally compatible**.

### The only API additions (purely additive)

1. `NEW_CALCULATION_CUTOVER_DATETIME` — new constant exported from `constants/enums.js`. Available for any code that wants to compare against the cutover date without hardcoding the literal.

2. `useTreatmentState({ initialDataRef, getStep })` — new composable in `composables/use-treatment-state.js`. Useful if any future code needs the same state shape (overlay-on-server-data + tooth filtering). Not required for existing consumers.

### Symbol descriptions changed (debug-only)

Two Symbol description strings changed. This does **NOT** affect `inject()` resolution (which is by reference, not description), but MAY appear in console output / DevTools:

| Symbol | Old Description | New Description |
| --- | --- | --- |
| `TreatmentSymbol` (TppProvider) | `'patch'` | `'treatment-preview'` |
| `NewCalculationDateSymbolPreview` (TppProvider) | `'newCalculationDate'` | `'newCalculationDate-preview'` |

### Behavioral change to be aware of

`updateFinalPrice(0)` and `updateFinalPrice(-5)` now set `finalPrice.value = 0` instead of being silently ignored. In practice, this is invisible because `useTpPricing` clamps values upstream with `Math.max(0, ...)`. Flagging for completeness.

---

## Manual Smoke Test Checklist

Before merging, verify in a browser:

- [ ] **TpProvider flow** — Open a treatment plan in edit mode. Verify:
  - [ ] Teeth load with correct filtering per backend step (DRAFT vs PROPOSED)
  - [ ] Selecting/deselecting serves updates the UI
  - [ ] Adding/removing services updates teeth + items
  - [ ] Cheque selection computes correct cheque array
  - [ ] Installment selection clears prepayment percent
  - [ ] Auto-select picks the most meaningful serve on first load
  - [ ] Navigating away invalidates the query (next visit refetches)
- [ ] **TppProvider flow** — Open a public preview link. Verify:
  - [ ] Plan loads via hashKey
  - [ ] Only PROPOSED teeth are shown (no DRAFT or PERFORMED leakage)
  - [ ] Price updates correctly when discounts change
  - [ ] Setting price to 0 works (was previously stuck at stale value)
  - [ ] Selecting a different serve updates UI
  - [ ] Navigating away and back does not show stale state

---

**Document Version**: 1.0 **Author**: Refactor documentation generated from session transcript **Last Updated**: 2026-07-08
