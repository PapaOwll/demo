# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Quick Reference

**Project**: Dental clinic CRM system (Vue 3 + Quasar + Persian/RTL)
**Dev Server**: `npm run dev` → http://localhost:4000
**Docs**: See [README.md](./README.md), [UI_FRAMEWORKS_REFERENCE.md](./UI_FRAMEWORKS_REFERENCE.md)

## Essential Commands

```bash
npm run dev          # Dev server (localhost:4000)
npm run lint         # ESLint with auto-fix
npm run format       # Prettier formatting
npm run build        # Production build
npm run analyze      # Bundle analyzer
```

## Architecture

Feature-based modules in `/src/modules/` with consistent structure:
```
ModuleName/
├── api/         # API endpoints
├── components/  # Module components
├── pages/       # Route pages
├── query/       # TanStack Query hooks
├── router.js    # Routes
└── schema/      # Yup schemas (optional)
```

## Tech Stack Summary

| Category | Technology | Notes |
|----------|-----------|-------|
| **Framework** | Vue 3 Composition API | - |
| **UI** | Quasar 2.19 | Use this for ALL new code |
| **State** | Pinia 3.0 + TanStack Query 5.24 | Server state in TanStack Query |
| **Routing** | Vue Router 4.2 | - |
| **Validation** | Yup 1.2 + useYup composable | - |
| **HTTP** | Axios 1.4 | Auto camelCase/snake_case |
| **Dates** | date-utils ONLY (Pure JS) | NO external date libraries |
| **Icons** | @tabler/icons-vue | - |
| **Build** | Vite 5.4 | Vite 6 migration pending in TODO.md |

## Critical Rules

### 1. UI Components
- ✅ **USE**: Quasar components only (QBtn, QDialog, QForm, QTable, etc.)
- See [UI_FRAMEWORKS_REFERENCE.md](./UI_FRAMEWORKS_REFERENCE.md) for component details

### 2. CSS/Styling
- ✅ **USE**: BEM methodology (`block__element--modifier`)
- ✅ **USE**: Quasar color variables (`$primary`, `$secondary`, `$grey-6`)
- ❌ **NEVER**: Helper classes in `<style>` sections (no `q-mt-md`, `row`, `col-*`, `bo-*`)
- ✅ Helper classes OK in `<template>` for layout (row, col-*, q-gutter-*)

### 3. Date Handling
```javascript
// ✅ CORRECT - Use date-utils
import { convertToJalali, convertToGregorian, toJalaali, toGregorian } from '@/utils/date-utils'
const jalaliDate = convertToJalali(new Date())

// ❌ WRONG - Do not use these
import moment from 'moment'
import dayjs from 'dayjs'
import jalaliMoment from 'jalali-moment'
```

### 4. Form Validation
```javascript
// ✅ CORRECT - Use Yup with useYup
import { useYup } from '@/composables/use-yup'
import * as yup from 'yup'

const schema = yup.object({
  name: yup.string().required(),
})
const { validate, errors } = useYup(schema)
```

### 5. Date Pickers
- ✅ **USE**: QDate with PersianDate component wrapper
- ❌ **DO NOT USE**: PersianDatePickerField or third-party pickers

### 6. Code Quality
**ALWAYS run after changes**:
```bash
npm run lint -- <filename>
npm run format -- <filename>
```

**Important Notes**:
- ⚠️ **Do NOT run** `npm run lint` or `npm run format` on files in the `dev-dist/` folder
- These generated files should be excluded from linting and formatting
- Always specify exact file paths when running quality checks to avoid build artifacts

### 7. Typography
- ✅ **USE**: `Typography` component for ALL text rendering
- ❌ **NEVER**: Use raw HTML tags (`<h1>`, `<p>`, `<span>`) for text display

**Component Location**: `/src/base/Typography/index.vue`

```vue
<template>
  <!-- ✅ CORRECT - Use Typography -->
  <Typography variant="heading" size="h1">عنوان صفحه</Typography>
  <Typography variant="body" size="3">متن بدنه</Typography>
  <Typography variant="caption">توضیحات کوچک</Typography>

  <!-- ❌ WRONG - Do not use raw HTML -->
  <h1>عنوان صفحه</h1>
  <p>متن بدنه</p>
  <span>توضیحات کوچک</span>
</template>
```

**Props Reference**:

| Prop | Type | Required | Values | Default |
|------|------|----------|--------|---------|
| `variant` | String | ✅ | `heading`, `body`, `caption` | - |
| `size` | String | ❌ | Heading: `h1`-`h6`, Body: `1`-`4` | Auto |
| `weight` | String | ❌ | `bold`, `semibold`, `medium`, `regular` | Auto |
| `color` | String | ❌ | `dark`, `grey`, `red`, `green`, `blue`, etc. | `dark` |
| `tag` | String | ❌ | Any HTML tag | Auto |

**Size Reference**:

| Variant | Size | Font Size |
|---------|------|-----------|
| heading | h1 | 32px |
| heading | h2 | 28px |
| heading | h3 | 24px |
| heading | h4 | 22px |
| heading | h5 | 20px |
| heading | h6 | 18px |
| body | 1 | 20px |
| body | 2 | 18px |
| body | 3 | 16px |
| body | 4 | 14px |
| caption | - | 12px |

**Usage Examples**:
```vue
<!-- Page title -->
<Typography variant="heading" size="h2">مدیریت کاربران</Typography>

<!-- Body text with color -->
<Typography variant="body" size="3" color="grey">توضیحات</Typography>

<!-- Bold body text -->
<Typography variant="body" size="4" weight="bold">متن مهم</Typography>

<!-- Caption -->
<Typography variant="caption" color="red">خطا: فیلد الزامی است</Typography>
```

## Common Patterns

### API Integration
```javascript
// api/index.js
export const getItems = (params) => http.get('/api/v1/items', { params })

// query/index.js
export const useItems = (params) => {
  return useQuery({
    queryKey: ['items', params],
    queryFn: () => getItems(params),
  })
}
```

### Routing
- Routes in `module/router.js`
- Layouts: `meta.layout` (AppLayout, AuthLayout, PureLayout, PriceCalculatorLayout)
- Public routes: `meta.isPublic: true`

### State Management
- **User/Auth**: `/src/store/user.js`
- **Offline**: `/src/store/offline.js`
- **Server Data**: TanStack Query (5min stale time)

## Key Modules

| Module | Path | Purpose |
|--------|------|---------|
| Auth | `/src/modules/Auth` | Multi-method auth (password, OTP, miss call) |
| User | `/src/modules/User` | Patient management, payments, profiles |
| Contact | `/src/modules/Contact` | Communication tracking |
| Booking | `/src/modules/Booking` | Appointments & scheduling |
| TreatmentPlan | `/src/modules/TreatmentPlan` | Dental treatment planning |
| Attendance | `/src/modules/Attendance` | Staff attendance, check-in/out, room selection |
| Task | `/src/modules/Task` | Task management |
| Settings | `/src/modules/Settings` | System config (SMS, roles, etc.) |
| Ads | `/src/modules/Ads` | Campaign management |
| Survey | `/src/modules/Survey` | Patient feedback (routes under `Survey/Feedback`) |
| Dashboard | `/src/modules/Dashboard` | Main dashboard |
| misc | `/src/modules/misc` | Miscellaneous utilities |
| Reports | `/src/modules/Reports` | ⚠️ Disabled — routes commented out in `router/index.js` (api/query stubs only, no pages) |

## Persian/RTL Support

- **Fonts**: Shabnam, Vazirmatn
- **Calendar**: Jalali (via date-utils)
- **Layout**: Use `start/end` not `left/right`
- **Numbers**: Auto Persian/Arabic conversion

## Special Integrations

### Payment (POS)
- Component: `/src/modules/User/components/UserDetails/UserDetailsComponents/UserPaymentDialog.vue`
- Endpoints: `v1/financial/payment/pos/*`

### SMS
- Panel: `/src/modules/Settings/GeneralSettings/components/SmsPanel.vue`
- Send: `/src/modules/User/components/SendSmsPreviewModal.vue`
- Endpoint: `v1/user/send-sms`

## Migration Status

**Progress**: 100% UI/date/icon migrations completed
- Total Vue files: 310
- Element Plus fully removed from codebase
- No external date libraries (pure JS implementation in date-utils)
- @iconify/vue fully removed - using @tabler/icons-vue exclusively
- Bootstrap classes fully removed
- Error tracking migrated from Sentry to self-hosted GlitchTip (SDK stays `@sentry/vue`)
- Runtime package upgrades completed: Vue 3.5.x, Quasar 2.19.x, Pinia 3.0.x, `@sentry/vue` 10.x
- Tooling upgrades pending in TODO.md: Vite 6, ESLint 9, Husky 9

## Component Migration Reference

| Element Plus | Quasar | Notes |
|-------------|---------|-------|
| ElButton | QBtn | - |
| ElForm | QForm | - |
| ElInput | QInput | - |
| ElSelect | QSelect | - |
| ElTable | QTable | Use virtual-scroll for >100 rows |
| ElDialog | QDialog | - |
| ElRow/ElCol | row/col-* classes | Template only |
| ElSpace | q-gutter-* | Template only |
| ElPopover | QPopupProxy | - |
| ElCard | QCard | - |
| ElTabs/ElTabPane | QTabs/QTabPanel | - |
| ElMessage | $q.notify() | Plugin |
| ElTag | QChip | - |
| ElSwitch | QToggle | - |
| ElDatePicker | QDate | Use PersianDate wrapper |

## File Locations

| Type | Path |
|------|------|
| Main Entry | `/src/main.js` |
| Router | `/src/router/index.js` |
| API Config | `/src/data/services/instance.js` |
| Layouts | `/src/layout/` |
| Components | `/src/components/` |
| Utils | `/src/utils/` |
| Composables | `/src/composables/` |
| Stores | `/src/store/` |

## Git Commit Guidelines

### Commit Message Format

Use conventional commit format with emoji:

```
<emoji> <type>: <description>
```

### Commit Types & Emojis

| Type | Emoji | Description |
|------|-------|-------------|
| `feat` | ✨ | New feature |
| `fix` | 🐛 | Bug fix |
| `docs` | 📝 | Documentation |
| `style` | 💄 | Code formatting |
| `refactor` | ♻️ | Code refactoring |
| `perf` | ⚡️ | Performance |
| `test` | ✅ | Tests |
| `chore` | 🔧 | Tooling/config |
| `ci` | 🚀 | CI/CD |

### Examples

```bash
✨ feat: add user authentication system
🐛 fix: resolve memory leak in rendering
📝 docs: update API documentation
♻️ refactor: simplify error handling
🔧 chore: update dependencies
```

### Commit Rules

1. **Present tense, imperative**: "add feature" not "added feature"
2. **First line < 72 chars**: Keep it concise
3. **Atomic commits**: One logical change per commit
4. **Run quality checks**: Always lint and format before committing

### Pre-Commit Checklist

Before committing:
- [ ] Quasar components only (no third-party UI libraries)
- [ ] No external date libraries (use date-utils only)
- [ ] No Bootstrap classes (`bo-*`)
- [ ] BEM methodology applied
- [ ] Quasar color variables used
- [ ] date-utils for all dates
- [ ] `npm run lint -- <file>` passes
- [ ] `npm run format -- <file>` applied
- [ ] Functionality tested
- [ ] Persian/RTL verified

## Error Handling

- **Handler**: `/src/utils/error-handler.js`
- **Monitoring**: GlitchTip integration (`@sentry/vue` SDK pointed at GlitchTip; helpers in `/src/utils/glitchtip-context.js`)
- **Notifications**: Quasar Notify (Persian messages)
- **API Errors**: Axios interceptors (auto 401/403 redirect)

## Authentication

1. **Methods**: Password, OTP, Miss Call
2. **Token**: `sitra-crm-access-token` in localStorage
3. **Injection**: Axios interceptor adds Bearer token
4. **Guards**: Router checks `hasAccessToken()`
5. **Permissions**: `userData.role.modules`

## Performance Tips

- Use QTable virtual-scroll for large lists
- TanStack Query handles caching (5min stale)
- Code splitting via lazy routes
- Quasar components are optimized
- Bundle analyzer: `npm run analyze`

## Bootstrap Class Migration

When migrating old code:
```
bo-row → row
bo-col-* → col-*
bo-mt-* → q-mt-* (template only)
bo-text-danger → text-negative
bo-d-flex → flex
bo-w-100 → full-width
```

## Base Components

### Typography Component

**IMPORTANT**: Use ONLY this Typography component for all text rendering. Do NOT use raw HTML tags (`<h1>`, `<p>`, `<span>`).

**Location**: `/src/base/Typography/index.vue`

**Usage**:
```vue
<script setup>
import Typography from '@/base/Typography/index.vue'
</script>

<template>
  <Typography variant="heading" size="h1">Page Title</Typography>
  <Typography variant="body" size="3">Body text</Typography>
  <Typography variant="caption">Small text</Typography>
</template>
```

**Props**:
- `variant` (required): 'heading' | 'body' | 'caption'
- `size`: Heading: 'h1'-'h6', Body: '1'-'4' (auto by variant)
- `weight`: 'bold' | 'semibold' | 'medium' | 'regular'
- `color`: Quasar palette colors + 'dark' (default: 'dark')
- `tag`: Any HTML tag (auto by variant)

**Colors available**: `QUASAR_COLORS` from `/src/constants/colors.js`:
- red, pink, purple, deep-purple, indigo, blue, light-blue
- cyan, teal, green, light-green, lime, yellow, amber, orange
- deep-orange, brown, grey, blue-grey, **dark**

### Button Component

**IMPORTANT**: Use ONLY this Button component for all buttons. Do NOT use Quasar's QBtn directly.

**Location**: `/src/base/Button/index.vue`

**Usage**:
```vue
<script setup>
import Button from '@/base/Button/index.vue'
import { IconUser } from '@tabler/icons-vue'
</script>

<template>
  <Button :left-icon="IconUser"  text="Save" />
  <Button variant="outline" color="red" text="Delete" />
  <Button :is-loading="true" text="Loading" />
  <Button color="dark" text="Dark Button" />
</template>
```

**Props**:
- `variant`: 'filled' | 'outline' | 'flat' (default: 'filled')
- `size`: 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
- `color`: Quasar palette colors + 'dark' (default: 'light-blue')
- `isRounded`: boolean (100px border-radius)
- `isLoading`: boolean (shows QSpinner overlay)
- `isDisabled`: boolean
- `leftIcon`: Component (from @tabler/icons-vue)
- `rightIcon`: Component
- `isIconOnly`: boolean
- `isFullWidth`: boolean (width: 100%)
- `isLink`: boolean (default: true)
- `to`: string | object (router-link)
- `href`: string (external link)
- `target`: '_blank' | '_self' | '_parent' | '_top'

**Important**: Icons must be passed as components, NOT strings:
```vue
<!-- ✅ Correct -->
<Button :left-icon="IconUser" />

<!-- ❌ Wrong -->
<Button left-icon="user" />
```

**Common color examples**:
```vue
<Button color="light-blue">Default</Button>
<Button color="dark">Dark</Button>
<Button color="red">Error</Button>
<Button color="green">Success</Button>
```

## Additional Resources

- **README.md**: Comprehensive project overview
- **UI_FRAMEWORKS_REFERENCE.md**: Complete component docs

---

**Version**: 2.8.0
**Last Updated**: 2026-06-18
- always in any task consider the @UI_FRAMEWORKS_REFERENCE.md too
- always remember to provide mock data for show and save data in local for each section that i address
- همیشه به یاد داشته باش که هر بخشی رو که شامل فرم ها و تغییرات در کارت و هرگونه تغییرات در دیتا هست رو دیتا اپدیت بشه و اپدیت بمونه تا زمانی که کاربر تغییرش نداده و داده های جدیدی که ذخیره میکنه ، ذخیره بمونن
- هرجا اگر مشکلی داشتی یا موردی رو درک نکردی سوال بپرس