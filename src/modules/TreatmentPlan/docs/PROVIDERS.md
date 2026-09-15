# TreatmentPlan Provider — Reference

> Current-state documentation for the unified `TpProvider`, the `useTpProvider()` composable hook, and the shared `useTreatmentState` composable. For the history of how we got here, see [`CHANGES.md`](./CHANGES.md).

**Last Updated**: 2026-07-11 **Files documented**:

- `src/modules/TreatmentPlan/providers/TpProvider.js` — the provider (wiring layer)
- `src/modules/TreatmentPlan/composables/use-tp-provider.js` — the consumer hook
- `src/modules/TreatmentPlan/composables/use-treatment-state.js` — the state machine

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Mental Model: Kitchen vs Waiter](#mental-model-kitchen-vs-waiter)
3. [The Provider — `TpProvider`](#the-provider--tpprovider)
4. [The Hook — `useTpProvider()`](#the-hook--usetpprovider)
5. [The State Machine — `useTreatmentState`](#the-state-machine--usetreatmentstate)
6. [Edit vs Preview Surface](#edit-vs-preview-surface)
7. [Consumer Usage Pattern](#consumer-usage-pattern)
8. [Adding a New Piece of State or Action](#adding-a-new-piece-of-state-or-action)
9. [Common Pitfalls](#common-pitfalls)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    TreatmentPlan Module                         │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  providers/TpProvider.js   (the "waiter")                │   │
│  │                                                          │   │
│  │  • ONE component, mode="edit" | mode="preview"           │   │
│  │  • Owns route, queries (by-id / by-key / serve-items),   │   │
│  │    step resolution, watcher registration, cleanup        │   │
│  │  • Provides a single TpStoreSymbol store                 │   │
│  │  • Contains NO state logic — pure wiring                 │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │ provide(TpStoreSymbol, store)       │
│                           ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  composables/use-tp-provider.js   (the hook)             │   │
│  │                                                          │   │
│  │  • inject(TpStoreSymbol) + flatten to { ...state,        │   │
│  │    ...actions, isPreview }                               │   │
│  │  • Dev-mode Proxy warns on edit-only access in preview   │   │
│  │  • Throws if used outside <TpProvider>                   │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │ useTpProvider()                     │
│                           ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Consumer components (30 total)                          │   │
│  │  const { treatmentData, updateTeeth, ... } =             │   │
│  │    useTpProvider()                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  composables/use-treatment-state.js   (the "kitchen")    │   │
│  │                                                          │   │
│  │  • Owns ALL reactive state + ALL mutations               │   │
│  │  • State: updatedTreatmentData, finalPrice,              │   │
│  │           newFinalPrice, selectedServe, selectedCheque    │   │
│  │  • Computed: treatmentData, isNewCalculationDate,        │   │
│  │              autoSelectServe                              │   │
│  │  • Actions: updateTreatment, updateTeeth, updateItems,   │   │
│  │    removeService, onSelectServe, updateSelectedInstall-  │   │
│  │    ment, updateSelectedCheque, updateFinalPrice,         │   │
│  │    updateNewFinalPrice, filterTeethForServe,             │   │
│  │    filterAllTeeth, resetLocalState                        │   │
│  │  • Mode-aware via isPreview flag                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Constants: NEW_CALCULATION_CUTOVER_DATETIME                    │
│             (in constants/enums.js)                             │
└─────────────────────────────────────────────────────────────────┘
```

`TpProvider` is a **renderless** component (`render()` returns `this.$slots.default()`). It uses Vue's `provide` API to publish a single store object to descendants, who consume it via the `useTpProvider()` composable hook (which wraps `inject`).

---

## Mental Model: Kitchen vs Waiter

| Layer | File | Role |
| --- | --- | --- |
| **Kitchen** | `use-treatment-state.js` | Cooks the food — owns ALL state refs and ALL mutations. Knows nothing about routes, queries, or provide/inject. |
| **Waiter** | `TpProvider.js` | Takes orders and delivers food — owns the route, the queries, the step resolution, and the provide/inject contract. Contains NO state logic. |
| **Menu** | `use-tp-provider.js` | How customers (components) order — a flat destructurable hook. Throws if used outside the restaurant. |

State mutations (`updateTeeth`, `onSelectServe`, `removeService`, etc.) are **kitchen logic** — they belong in the composable, not the provider. The provider only wires data sources to the kitchen and publishes the result.

---

## The Provider — `TpProvider`

**File**: `src/modules/TreatmentPlan/providers/TpProvider.js` **Component name**: `TpProvider` **Props**: `mode` — `'edit'` (default) or `'preview'`

### What It Does

1. **Resolves the route** — `route.params.id` (edit) or `route.params.key` (preview).
2. **Registers queries** (all unconditional, gated by `enabled` for TanStack Query):
   - `useGetTreatmentPlanByIdQuery(editId)` — edit mode, requires auth
   - `useGetTreatmentPlanByKeyQuery(previewKey)` — preview mode, public
   - `useGetServeItemsQuery(...)` — edit mode only
3. **Resolves the step** — dynamic `backendStepNumber` (edit) via `useTpStatus`, or static `TREATMENT_PLAN_STEP.PROPOSED` (preview).
4. **Calls `useTreatmentState(...)`** — gets all state + actions back.
5. **Builds a mode-aware store shape** (see [Edit vs Preview Surface](#edit-vs-preview-surface)).
6. **`provide(TpStoreSymbol, store)`** — publishes to descendants.
7. **Registers watchers** — `filterAllTeeth` on data arrival, `autoSelectServe` (edit only).
8. **Cleans up on unmount** — `resetLocalState()` + query invalidation (edit only).

### The `backendStepNumber` Lazy Binding (edit mode)

`useTpStatus(treatmentData)` needs `treatmentData` from the composable, but the composable's `getStep` needs `backendStepNumber` from `useTpStatus`. To break the cycle:

```js
let backendStepNumber
const getStep = () => (isPreview ? TREATMENT_PLAN_STEP.PROPOSED : backendStepNumber?.value)

const { treatmentData, filterAllTeeth /* ... */ } = useTreatmentState({
  initialDataRef,
  getStep /* ... */,
})

if (!isPreview) {
  ;({ backendStepNumber } = useTpStatus(treatmentData))
}

// Watchers registered AFTER useTpStatus so backendStepNumber is initialized
watch(
  () => initialTreatmentData.value,
  (val) => {
    if (val) filterAllTeeth()
  },
  { immediate: true }
)
```

JavaScript closures capture bindings (the variable slot), not values. `getStep` is only called from `filterTeethForServe` → `filterAllTeeth` → the watcher callback, which runs AFTER `backendStepNumber` is assigned.

---

## The Hook — `useTpProvider()`

**File**: `src/modules/TreatmentPlan/composables/use-tp-provider.js`

### API

```js
import { useTpProvider } from '@/modules/TreatmentPlan/composables/use-tp-provider'

const {
  // State (readonly refs)
  treatmentData, // Readonly<Ref<Object>>  — merged server + local overlay
  serveData, // Readonly<Ref<Array>>   — available serve items (edit only)
  finalPrice, // Readonly<Ref<Number>>
  newFinalPrice, // Readonly<Ref<Number>>
  isNewCalculationDate, // Readonly<Ref<Boolean>> — created after cutover date?
  selectedServe, // Readonly<Ref<Object|null>>
  selectedCheque, // Readonly<Ref<Object|null>>  (edit only)

  // Actions (functions)
  updateTreatment, // (updates) => void
  updateTeeth, // (newTeeth) => void          (edit only)
  updateItems, // (item) => void              (edit only)
  removeService, // (serve) => void             (edit only)
  onSelectServe, // (serve) => void
  updateSelectedInstallment, // (installment) => void       (edit only)
  updateSelectedCheque, // (cheque) => void            (edit only)
  updateFinalPrice, // (value) => void — clamps >= 0, rounds
  updateNewFinalPrice, // (value) => void — clamps >= 0, rounds
  resetLocalState, // () => void                  (edit only)

  // Mode flag
  isPreview, // Boolean — true when inside <TpProvider mode="preview">
} = useTpProvider()
```

### Behavior

- **Throws** if called outside a `<TpProvider>` subtree.
- **Flattens** the store's `{ state, actions, mode }` into a single destructurable object.
- **Dev-mode Proxy guard**: in preview mode, accessing an edit-only key logs a `console.warn` so contributors catch the mistake immediately. (No-op in production builds.)

```js
// Dev-only: warn when a preview consumer reaches for an edit-only key.
if (import.meta.env.DEV && store.mode === 'preview') {
  return new Proxy(flat, {
    get(target, key) {
      if (typeof key === 'string' && EDIT_ONLY_KEYS.has(key)) {
        console.warn(`[useTpProvider] "${key}" is edit-only and is not exposed in preview mode.`)
      }
      return target[key]
    },
  })
}
```

### Selector Overloads

The hook accepts an optional selector for ergonomic narrow access. All three forms preserve reactivity (they return the same `readonly(ref)` references as the no-arg form).

```js
// 1) No selector — returns the full flat surface (established pattern)
const { finalPrice, treatmentData } = useTpProvider()

// 2) Single string — returns that field's value directly (no destructuring needed)
const finalPrice = useTpProvider('finalPrice')

// 3) Array of keys — returns a picked object with only those keys
const { finalPrice, treatmentData } = useTpProvider(['finalPrice', 'treatmentData'])
```

| Selector form | Returns | Example |
| --- | --- | --- |
| `useTpProvider()` | Full flat object (`{ ...state, ...actions, isPreview }`) | Most existing consumers |
| `useTpProvider('key')` | The value at `key` (a `readonly(ref)` or a function) | Single-field composable |
| `useTpProvider(['k1', 'k2'])` | `{ k1, k2 }` — only the picked keys | Narrow multi-field access |

**Dev-only assertions** (no-op in production):

- Unknown key in string/array mode → `console.warn("[useTpProvider] unknown key ...")` — catches typos like `finalPrize`.
- Edit-only key accessed in preview mode → `console.warn("[useTpProvider] ... is edit-only ...")` — same guard as the no-arg Proxy, applied to the picked keys.

> **When to use which form**: The selector form (string or array) is the **recommended default** — it makes each consumer's dependencies explicit at the call site and lets the dev-only assertions catch typos. The no-arg form is still supported (mainly for the Proxy-based edit-only warning in preview mode) but is no longer the common pattern.

---

## The State Machine — `useTreatmentState`

**File**: `src/modules/TreatmentPlan/composables/use-treatment-state.js`

Owns ALL reactive state and ALL mutations for a treatment-plan session. Mode-aware via the `isPreview` flag.

### API

```js
import { useTreatmentState } from '../composables/use-treatment-state'

const {
  // State refs
  finalPrice,
  newFinalPrice,
  selectedServe,
  selectedCheque,

  // Computed
  treatmentData, // merged server + local overlay
  isNewCalculationDate, // created after NEW_CALCULATION_CUTOVER_DATETIME?
  autoSelectServe, // picks most meaningful serve when none selected (edit only)

  // Actions
  updateTreatment,
  updateTeeth,
  updateItems,
  removeService,
  onSelectServe,
  updateSelectedInstallment,
  updateSelectedCheque,
  updateFinalPrice,
  updateNewFinalPrice,

  // Tooth helpers (step-aware)
  filterTeethForServe,
  filterAllTeeth,

  // Cleanup
  resetLocalState,
} = useTreatmentState({
  initialDataRef, // Ref — the query's `data` ref (edit by-id or preview by-key)
  getStep, // () => number|string — step source for tooth filtering
  isPreview, // boolean — when true, onSelectServe skips tooth filtering
  serveDataRef, // Ref — serve-items query (edit only, for autoSelectServe)
})
```

### Why `getStep` Is a Callback (Not a Ref)

Each mode has a different source of truth for the step:

- **Preview**: a static constant — `() => TREATMENT_PLAN_STEP.PROPOSED`
- **Edit**: a computed value — `() => backendStepNumber.value`

A callback thunk lets the provider choose its source without forcing the composable to own the step's reactivity. The thunk is read **lazily** (only when `filterTeethForServe` runs), which is critical for edit mode because `backendStepNumber` is not yet assigned at composable-construction time.

### Why the Watcher Lives in the Caller

The composable does **not** register `watch(initialDataRef, filterAllTeeth)`. The caller registers it, because edit mode must defer registration until **after** `useTpStatus(treatmentData)` has produced `backendStepNumber`. Registering inside the composable would risk a "use-before-assignment" on the immediate run (when TanStack Query returns cached data synchronously).

---

## Edit vs Preview Surface

The provider builds a **mode-aware store shape**. Preview exposes a reduced subset (read-mostly); edit exposes the full editing surface.

### Edit Mode (`mode="edit"`)

| Category | Keys |
| --- | --- |
| **State** | `treatmentData`, `serveData`, `finalPrice`, `newFinalPrice`, `isNewCalculationDate`, `selectedServe`, `selectedCheque` |
| **Actions** | `updateFinalPrice`, `updateNewFinalPrice`, `onSelectServe`, `updateTeeth`, `updateItems`, `updateSelectedInstallment`, `updateSelectedCheque`, `updateTreatment`, `removeService`, `resetLocalState` |

### Preview Mode (`mode="preview"`)

| Category | Keys |
| --- | --- |
| **State** | `treatmentData`, `finalPrice`, `newFinalPrice`, `isNewCalculationDate`, `selectedServe` |
| **Actions** | `updateFinalPrice`, `updateNewFinalPrice`, `onSelectServe` |

### What Preview Does NOT Expose

- `serveData` — preview doesn't show the serve picker
- `selectedCheque` — preview doesn't track cheque state
- `updateTeeth`, `updateItems` — preview can't edit
- `updateSelectedInstallment`, `updateSelectedCheque` — preview can't change payment
- `removeService` — preview can't remove
- `updateTreatment` — preview can't write directly
- `resetLocalState` — internal cleanup only

Destructuring an edit-only key in preview mode silently yields `undefined`. The dev-mode Proxy guard turns that into a loud `console.warn` during development.

---

## Consumer Usage Pattern

A typical consumer names exactly what it needs via the array selector:

```vue
<script setup>
import { computed } from 'vue'
import { useTpProvider } from '@/modules/TreatmentPlan/composables/use-tp-provider'

const { treatmentData, finalPrice, updateFinalPrice, isNewCalculationDate } = useTpProvider([
  'treatmentData',
  'finalPrice',
  'updateFinalPrice',
  'isNewCalculationDate',
])

const displayPrice = computed(() => finalPrice.value.toLocaleString('fa-IR'))
function onPriceChange(value) {
  updateFinalPrice(value)
}
</script>

<template>
  <!-- render UI based on treatmentData, finalPrice, etc. -->
</template>
```

For a single field, use the string form (no destructuring needed):

```js
const treatmentData = useTpProvider('treatmentData')
```

### Aliasing When Local Names Differ

The array contains **source keys** (what's in the store); aliases stay on the left-hand destructure. This keeps the selector aligned with the store surface while preserving local naming:

```js
const {
  serveData: serveItems, // local name was already serveItems
  finalPrice: cashPrice, // pricing context uses "cash price"
  isNewCalculationDate: isNewDate, // shorter alias
  updateSelectedInstallment: updateInstallment,
} = useTpProvider([
  'serveData', // ✅ source key (not serveItems)
  'finalPrice', // ✅ source key (not cashPrice)
  'isNewCalculationDate', // ✅ source key (not isNewDate)
  'updateSelectedInstallment', // ✅ source key (not updateInstallment)
])
```

### Cross-mode Composables

Composables like `use-tp-pricing.js` call `useTpProvider('isNewCalculationDate')` once — the unified hook returns the correct value regardless of which mode wraps the component. No more dual-symbol dispatch.

> **Important (Vue Rules-of-Hooks)**: `useTpProvider()` calls `inject()` under the hood, so it must be called **unconditionally** at the top of `setup` — never after an early-return guard.

---

## Adding a New Piece of State or Action

1. **Add it to `useTreatmentState`** — this is where ALL state and mutations live:

   ```js
   // composables/use-treatment-state.js
   const myNewState = ref(null)

   const updateMyNewState = (val) => {
     myNewState.value = val
   }

   return {
     // ...existing returns
     myNewState,
     updateMyNewState,
   }
   ```

2. **Destructure it in `TpProvider.setup()`** and add it to the appropriate store shape (edit, preview, or both):

   ```js
   // providers/TpProvider.js
   const { /* ..., */ myNewState, updateMyNewState } = useTreatmentState({/* ... */})

   const store = isPreview
     ? {
         state: {/* ..., myNewState: readonly(myNewState) */},
         actions: {/* ... */},
         mode: props.mode,
       }
     : {
         state: {/* ..., myNewState: readonly(myNewState) */},
         actions: {/* ..., updateMyNewState */},
         mode: props.mode,
       }
   ```

3. **If the key is edit-only**, add it to `EDIT_ONLY_KEYS` in `use-tp-provider.js` so the dev-mode Proxy guard catches preview consumers that try to access it.

4. **Consumers** can now destructure it: `const { myNewState, updateMyNewState } = useTpProvider()`.

---

## Common Pitfalls

### 1. Calling `useTpProvider()` after an early-return guard

`useTpProvider()` calls `inject()`, which must run unconditionally in `setup`. Placing it after a guard like `if (!itemList?.value) return {...}` violates Vue's Rules-of-Hooks and will crash in production. Always call `useTpProvider()` at the top of your setup/composable, before any guards.

### 2. Registering a watcher before `useTpStatus` in edit mode

If you add a new `watch(..., { immediate: true })` in `TpProvider` that calls `filterAllTeeth()` (or anything that calls `getStep()`), **register it after** `;({ backendStepNumber } = useTpStatus(treatmentData))`. Otherwise the immediate run will call `getStep()` while `backendStepNumber` is still `undefined`, and `?.` will silently return `undefined` — causing `isToothStatusMatchingStep` to fall through to its `default` case and show ALL teeth instead of filtered teeth.

### 3. Mutating `treatmentData.value` directly

`treatmentData` is provided as `readonly(...)`. Direct mutation will throw in dev mode. Always go through `updateTreatment(updates)` or the specific update action (`updateTeeth`, `updateItems`, etc.).

### 4. Forgetting to invalidate queries after mutations

`TpProvider` invalidates `['new-treatment-plan', 'treatment', route.params.id]` on unmount (edit mode only). If you add a new query key for treatment-related data, make sure it's also invalidated, or stale data will persist across navigations.

### 5. Destructuring an edit-only key in a preview component

This silently yields `undefined` in production. In development, the dev-mode Proxy guard logs a `console.warn`. If a preview component genuinely needs a value, either add it to the preview store shape in `TpProvider`, or pass it down via props instead.

### 6. Using `TpProvider` without a `mode` prop

The `mode` prop defaults to `'edit'`. If you mount `<TpProvider>` (no prop) on a preview route, it will try to read `route.params.id` (which is absent on preview routes) and the by-id query will never enable. Always pass `mode="preview"` explicitly on patient-facing routes.

---

## Related Documentation

- [`CHANGES.md`](./CHANGES.md) — Phase-by-phase refactor changelog
- [`../../constants/enums.js`](../constants/enums.js) — `TREATMENT_PLAN_STEP`, `NEW_CALCULATION_CUTOVER_DATETIME`, etc.
- [`../../composables/use-tp-status.js`](../composables/use-tp-status.js) — Step derivation logic
- [`../../composables/use-tp-pricing.js`](../composables/use-tp-pricing.js) — Pricing composable (consumes `useTpProvider()`)

---

**Document Version**: 2.0 **Last Updated**: 2026-06-05
