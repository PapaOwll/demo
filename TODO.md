# 📋 TODO - Package Updates & Migration Plan

**Created:** 2025-11-27
**Last Verified:** 2026-06-18
**Current Locked Status:** Vue 3.5.34 | Quasar 2.19.3 | Pinia 3.0.4 | Sentry 10.51.0 | Vite 5.4.21 | Node.js 20.19.5

---

## ✅ Completed

### Vue 3.5.x + Quasar 2.x

**Completed:** 2025-12-18
**Current locked versions:** Vue 3.5.34, Quasar 2.19.3

- Upgraded Vue 3.4.27 → 3.5.x
- Upgraded Quasar 2.18.0 → 2.x
- Fixed 28 files for Vue 3.5 compatibility (optional chaining + array fallbacks)

### Pinia 3.0.4 ✅

**Completed:** 2025-12-18

- Upgraded Pinia 2.2.2 → 3.0.4
- No code changes needed (already using modern syntax)

### Sentry 10.x

**Completed:** 2025-12-18
**Current locked version:** 10.51.0

- Upgraded @sentry/vue 8.55.0 → 10.x
- No code changes needed (using stable APIs)

---

## 📦 Updatable Packages

| # | Package | Current locked | Target | Status | Risk |
|---|---------|----------------|--------|--------|------|
| 1 | `vite` | 5.4.21 | 6.4.1 | Pending | Medium |
| 2 | `@vitejs/plugin-vue` | 5.2.4 | 6.x | Pending | Medium |
| 3 | `@quasar/vite-plugin` | 1.11.0 | 1.10.0+ | Done | Low |
| 4 | `eslint` | 8.57.1 | 9.39.1 | Pending | Very High |
| 5 | `husky` | 8.0.3 | 9.1.7 | Pending | Low |

---

## 🔧 Phase 2: Vite 6 Update

```bash
npm install -D vite@6.4.1 @vitejs/plugin-vue@latest
```

**Breaking Changes:**
- Node.js 20.19+ required ✅
- `splitVendorChunkPlugin` removed
- Sass Legacy API removed

---

## 🔍 Phase 3: ESLint 9 Update

```bash
npm install -D eslint@9.39.1 eslint-plugin-vue@10.6.1
npx @eslint/migrate-config .eslintrc.js
```

**Breaking Changes:**
- `.eslintrc.js` → `eslint.config.js` (flat config)
- `vue/component-tags-order` → `vue/block-order`

---

## 🛠️ Phase 4: Husky 9 Update

```bash
npm install -D husky@9.1.7
```

**Breaking Changes:**
- `"postinstall": "husky install"` → `"prepare": "husky"`

---

## 📊 Priority

| Phase | Packages | Risk | Priority | Status |
|-------|----------|------|----------|--------|
| 2 | Vite 6 + Vue plugin 6 | Medium | High | Pending |
| 3 | ESLint 9 | Very High | Low | Pending |
| 4 | Husky 9 | Low | Medium | Pending |

---

## 🚨 Notes

- **rollup-plugin-visualizer v6:** Requires Node.js 22+ (skip for now)
- **Vite 7:** Too new, use Vite 6
- **ESLint 9:** Most complex, lowest priority

---

**Last Updated:** 2026-06-18
**Status:** Runtime package upgrades completed; Vite 6, ESLint 9, and Husky 9 remain pending
