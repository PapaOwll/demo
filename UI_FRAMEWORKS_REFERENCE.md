# UI Frameworks Reference — Quasar & `src/base/` Components

This document is the single source of truth for UI component usage in this project. Quasar is the **only** UI framework in the codebase. On top of Quasar, the project maintains a set of design-system wrappers in [`src/base/`](../src/base/) that MUST be preferred over raw Quasar components wherever a wrapper exists.

**Last Updated**: 2026-08-01

---

## Table of Contents

1. [Component Priority Rule](#component-priority-rule)
2. [Refactoring & Code-Review Guidelines](#refactoring--code-review-guidelines)
3. [Base Components (`src/base/`)](#base-components-srcbase)

- [Typography](#typography)
- [Button](#button)
- [TextField](#textfield)
- [SelectField](#selectfield)
- [TimeField](#timefield)
- [Checkbox](#checkbox)
- [Radio](#radio)
- [Toggle](#toggle)
- [Chip](#chip)
- [Badge](#badge)
- [Banner](#banner)
- [Avatar](#avatar)
- [Tag](#tag)
- [Modal](#modal)
- [TabItem](#tabitem)
- [ItemTable](#itemtable)
- [Notif & confirmDialog](#notif--confirmDialog)

4. [Quasar Components (when no `base/` wrapper exists)](#quasar-components-when-no-base-wrapper-exists)
5. [Quasar Directives](#quasar-directives)
6. [Quasar Plugins](#quasar-plugins)
7. [Quasar Utilities](#quasar-utilities)
8. [CSS / Styling Rules](#css--styling-rules)
9. [Color Palette](#color-palette)
10. [Legacy Migration Reference](#legacy-migration-reference)

---

## Component Priority Rule

When building or editing UI, component selection follows a **strict two-tier priority**:

| Priority | Source | When to use |
| --- | --- | --- |
| **1 (always first)** | [`src/base/`](../src/base/) | A wrapper exists for the component you need. |
| **2 (fallback)** | `quasar` (`Q*` components) | No `base/` wrapper covers the use case. |

**Examples:**

```vue
<!-- ✅ CORRECT — prefer base/ wrappers -->
<Button :left-icon="IconUser" text="Save" />
<TextField v-model="name" label="Name" />
<Badge label="New" color="green" />
<Modal v-model="open" title="Edit User"> ...</Modal>

<!-- ❌ WRONG — raw Quasar used while a base/ wrapper exists -->
<QBtn label="Save" />
<QInput v-model="name" label="Name" />
<QBadge>New</QBadge>
<QDialog> ...</QDialog>
```

### Quick Mapping: base/ → Quasar it Replaces

| `base/` wrapper | Replaces                           | Location                               |
| --------------- | ---------------------------------- | -------------------------------------- |
| `Typography`    | raw `<h1>`/`<p>`/`<span>`          | `@/base/Typography`                    |
| `Button`        | `QBtn`                             | `@/base/Button`                        |
| `TextField`     | `QInput`                           | `@/base/TextField`                     |
| `SelectField`   | `QSelect`                          | `@/base/SelectField`                   |
| `TimeField`     | `QInput` + `QTime` + `QPopupProxy` | `@/base/TimeField`                     |
| `Checkbox`      | `QCheckbox`                        | `@/base/Checkbox`                      |
| `Radio`         | `QRadio`                           | `@/base/Radio`                         |
| `Toggle`        | `QToggle`                          | `@/base/Toggle`                        |
| `Chip`          | `QChip`                            | `@/base/Chip`                          |
| `Badge`         | `QBadge`                           | `@/base/Badge`                         |
| `Banner`        | `QBanner`                          | `@/base/Banner`                        |
| `Avatar`        | `QAvatar`                          | `@/base/Avatar`                        |
| `Tag`           | `QChip` (multi-select tag list)    | `@/base/Tag`                           |
| `Modal`         | `QDialog` + `QCard`                | `@/base/Modal`                         |
| `TabItem`       | `QTabs` / `QTab`                   | `@/base/TabItem`                       |
| `ItemTable`     | (custom table cell/header)         | `@/base/ItemTable`                     |
| `Notif`         | `Notify.create` / `$q.notify`      | `@/data/services/notification-service` |
| `confirmDialog` | `Dialog.create` / `$q.dialog`      | `@/data/services/notification-service` |

### Components with NO `base/` wrapper (use Quasar directly)

`QTable`, `QCard`/`QCardSection`/`QCardActions` (outside Modal), `QList`/`QItem`/`QItemSection`, `QExpansionItem`, `QSplitter`, `QSeparator`, `QTooltip`, `QMenu`, `QPopupProxy`, `QStepper`, `QStep`, `QBreadcrumbs`, `QPagination`, `QTree`, `QVirtualScroll`, `QInfiniteScroll`, `QDate`, `QFile`, `QSlider`, `QRange`, `QSpinner*`, `QInnerLoading`, `QSkeleton`, `QImg`, `QBtnGroup`, `QBtnToggle`, `QSpace`, `QBadge` (use `Badge` instead).

---

## Refactoring & Code-Review Guidelines

These rules apply **whenever you touch a component**, whether adding a feature, fixing a bug, or reviewing a PR.

### Rule 1 — Replace raw Quasar with `base/` wrappers on contact

If you are editing a file that still uses raw `QBtn`, `QInput`, `QSelect`, `QDialog`, `QBadge`, `QChip`, `QCheckbox`, `QRadio`, `QToggle`, `QBanner`, or `QAvatar`, **migrate those usages to the corresponding `base/` wrapper** as part of the same change. Leaving them as-is is technical debt.

```diff
- <QBtn color="primary" label="Save" @click="save" />
+ <Button color="light-blue" text="Save" @click="save" />

- <QInput v-model="form.name" label="Name" outlined />
+ <TextField v-model="form.name" label="Name" variant="outline" />

- <QBadge color="green">Active</QBadge>
+ <Badge label="Active" color="green" />
```

### Rule 2 — Only fall back to raw Quasar when no wrapper fits

If you need a Quasar component that has no `base/` equivalent (e.g. `QTable`, `QExpansionItem`, `QMenu`, `QTooltip`), use the Quasar component directly. Do **not** invent a one-off wrapper — propose adding it to `src/base/` instead if the pattern recurs across the app.

### Rule 3 — Do not import `QBtn`/`QInput` inside a `base/` wrapper

The wrappers own the Quasar imports. Consumers import the wrapper only:

```vue
<!-- ✅ CORRECT -->
<script setup>
import Button from '@/base/Button'
</script>

<!-- ❌ WRONG — bypasses the design system -->
<script setup>
import { QBtn } from 'quasar'
</script>
```

### Rule 4 — Prop names differ; check the wrapper's API

The `base/` wrappers intentionally diverge from Quasar's prop names to enforce consistency. Before migrating, check the wrapper's prop table below:

| Quasar prop            | `base/` equivalent                         |
| ---------------------- | ------------------------------------------ |
| `label` (QBtn)         | `text` (Button)                            |
| `icon` (QBtn)          | `leftIcon` / `rightIcon` (Button)          |
| `color="primary"`      | `color="light-blue"` (Button)              |
| `loading`              | `isLoading`                                |
| `disable` / `disabled` | `isDisabled` (Button) / `disable` (fields) |
| `rounded`              | `isRounded`                                |
| `outline` (boolean)    | `variant="outline"`                        |
| `filled` (boolean)     | `variant="filled"`                         |

### Rule 5 — Code-review checklist

When reviewing a PR, flag any of these:

- [ ] Raw `Q*` component used where a `base/` wrapper exists.
- [ ] Raw `<h1>`/`<p>`/`<span>` used for text instead of `Typography`.
- [ ] `QBtn` used directly instead of `Button`.
- [ ] `QDialog` + `QCard` combo used instead of `Modal`.
- [ ] `$q.notify` / `Notify.create` used instead of `Notif.*`.
- [ ] `$q.dialog` used instead of `confirmDialog`.
- [ ] Hardcoded color hex values instead of `QUASAR_COLORS`.
- [ ] New wrapper added outside `src/base/` that duplicates an existing one.

---

## Base Components (`src/base/`)

All base components are imported by path alias: `@/base/<Name>`.

### Typography

**Location**: `@/base/Typography` **Replaces**: All raw HTML text tags (`<h1>`, `<h2>`, `<p>`, `<span>`, etc.)

> **Mandatory**: Use `Typography` for ALL text rendering. Never use raw HTML tags for displayable text.

| Prop      | Type   | Required | Values                                  | Default         |
| --------- | ------ | -------- | --------------------------------------- | --------------- |
| `variant` | String | ✅       | `heading`, `body`, `caption`            | —               |
| `size`    | String | ❌       | Heading: `h1`–`h6`, Body: `1`–`4`       | Auto by variant |
| `weight`  | String | ❌       | `bold`, `semibold`, `medium`, `regular` | Auto by variant |
| `color`   | String | ❌       | `QUASAR_COLORS`                         | `currentColor`  |
| `tag`     | String | ❌       | Any HTML tag                            | Auto by variant |

**Size reference**:

| Variant | Size | Font size |
| ------- | ---- | --------- |
| heading | h1   | 32px      |
| heading | h2   | 28px      |
| heading | h3   | 24px      |
| heading | h4   | 22px      |
| heading | h5   | 20px      |
| heading | h6   | 18px      |
| body    | 1    | 20px      |
| body    | 2    | 18px      |
| body    | 3    | 16px      |
| body    | 4    | 14px      |
| caption | —    | 12px      |

```vue
<Typography variant="heading" size="h2">عنوان صفحه</Typography>
<Typography variant="body" size="3" color="grey">توضیحات</Typography>
<Typography variant="body" size="4" weight="bold">متن مهم</Typography>
<Typography variant="caption" color="red">خطا: فیلد الزامی است</Typography>
```

---

### Button

**Location**: `@/base/Button` **Replaces**: `QBtn`

> **Mandatory**: Use `Button` for ALL buttons. Never use `QBtn` directly.

| Prop          | Type             | Values                                     | Default      |
| ------------- | ---------------- | ------------------------------------------ | ------------ |
| `text`        | String           | —                                          | `undefined`  |
| `variant`     | String           | `filled`, `outline`, `flat`                | `filled`     |
| `size`        | String           | `sm`, `md`, `lg`, `xl`                     | `md`         |
| `color`       | String           | see below                                  | `light-blue` |
| `type`        | String           | `button`, `submit`, `reset`                | `submit`     |
| `leftIcon`    | Component        | `@tabler/icons-vue` component              | `undefined`  |
| `rightIcon`   | Component        | `@tabler/icons-vue` component              | `undefined`  |
| `isIconOnly`  | Boolean          | —                                          | `false`      |
| `isRounded`   | Boolean          | —                                          | `false`      |
| `isLoading`   | Boolean          | —                                          | `false`      |
| `isDisabled`  | Boolean          | —                                          | `false`      |
| `isFullWidth` | Boolean          | —                                          | `false`      |
| `isLink`      | Boolean          | —                                          | `true`       |
| `to`          | String \| Object | router-link target                         | `undefined`  |
| `href`        | String           | external link                              | `undefined`  |
| `target`      | String           | `_blank` \| `_self` \| `_parent` \| `_top` | `undefined`  |
| `ariaLabel`   | String           | —                                          | `undefined`  |

**Colors**: `primary`, `pink`, `purple`, `deep-purple`, `indigo`, `blue`, `light-blue`, `cyan`, `teal`, `amber`, `red`, `green`, `grey`, `blue-grey`, `dark`.

**Events**: `click`, `mouseenter`, `mouseleave`, `focus`, `blur`.

> Icons MUST be passed as components, not strings: `<Button :left-icon="IconUser" />` ✅ &nbsp; vs &nbsp; `<Button left-icon="user" />` ❌

```vue
<Button :left-icon="IconUser" text="Save" />
<Button variant="outline" color="red" text="Delete" />
<Button :is-loading="true" text="Loading" />
<Button color="dark" text="Dark Button" />
<Button is-icon-only is-rounded :left-icon="IconEdit" aria-label="Edit" />
<Button :to="{ name: 'users' }" text="Users" />
```

---

### TextField

**Location**: `@/base/TextField` **Replaces**: `QInput`

| Prop                 | Type              | Default     | Notes                           |
| -------------------- | ----------------- | ----------- | ------------------------------- |
| `modelValue`         | String \| Number  | `undefined` | v-model                         |
| `defaultValue`       | String \| Number  | `''`        | uncontrolled fallback           |
| `label`              | String            | `''`        |                                 |
| `required`           | Boolean           | `false`     | shows `*`                       |
| `hint`               | String            | `undefined` |                                 |
| `hintColor`          | String            | `undefined` |                                 |
| `showCharacterCount` | Boolean           | `false`     | requires `maxlength`            |
| `size`               | String            | `md`        | `sm`, `md`, `lg`                |
| `variant`            | String            | `filled`    | `filled`, `outline`, `outlined` |
| `type`               | String            | `text`      |                                 |
| `placeholder`        | String            | `undefined` |                                 |
| `disable`            | Boolean           | `false`     |                                 |
| `readonly`           | Boolean           | `false`     |                                 |
| `clearable`          | Boolean           | `false`     |                                 |
| `error`              | Boolean \| String | `undefined` | string = inline message         |
| `errorMessage`       | String            | `undefined` |                                 |
| `maxlength`          | String \| Number  | `undefined` |                                 |
| `mask`               | String            | `undefined` |                                 |
| `fillMask`           | Boolean \| String | `undefined` |                                 |
| `reverseFillMask`    | Boolean           | `false`     |                                 |
| `unmaskedValue`      | Boolean           | `false`     |                                 |
| `debounce`           | String \| Number  | `undefined` |                                 |
| `autogrow`           | Boolean           | `false`     | textarea mode                   |
| `suffix`             | String            | `undefined` |                                 |
| `bgColor`            | String            | `undefined` |                                 |

**Slots**: `startSection` (prepend), `endSection` (append), `clearIcon`, default. **Events**: `update:modelValue`, `focus`, `blur`, `clear`. **Exposed methods**: `focus()`, `blur()`, `select()`.

```vue
<TextField v-model="form.name" label="نام" required placeholder="..." />
<TextField v-model="form.phone" label="تلفن" mask="####-###-####" />
<TextField v-model="form.note" variant="outline" autogrow show-character-count :maxlength="200" />
```

---

### SelectField

**Location**: `@/base/SelectField` **Replaces**: `QSelect`

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `modelValue` | String\|Number\|Object\|Array | `undefined` |  |
| `defaultValue` | same | `null` |  |
| `options` | Array | `[]` |  |
| `label` | String | `''` |  |
| `required` | Boolean | `false` |  |
| `hint` | String | `undefined` |  |
| `hintColor` | String | `undefined` |  |
| `size` | String | `md` | `sm`, `md`, `lg` |
| `variant` | String | `filled` | `filled`, `outline`, `outlined` |
| `useInput` | Boolean | `false` | searchable |
| `searchFn` | Function | `null` | custom filter |
| `multiple` | Boolean | `false` |  |
| `clearable` | Boolean | `false` |  |
| `disable` | Boolean | `false` |  |
| `readonly` | Boolean | `false` |  |
| `loading` | Boolean | `false` |  |
| `hasError` | Boolean | `false` | shows retry UI |
| `error` | Boolean \| String | `undefined` |  |
| `errorMessage` | String | `undefined` |  |
| `optionLabel` | String \| Function | `undefined` |  |
| `optionValue` | String \| Function | `undefined` |  |
| `optionDisable` | String \| Function | `undefined` |  |
| `emitValue` | Boolean | `false` |  |
| `mapOptions` | Boolean | `false` |  |
| `inputDebounce` | String \| Number | `undefined` |  |
| `useChips` | Boolean | `false` |  |
| `hideDropdownIcon` | Boolean | `false` |  |
| `chipColor` | String | `undefined` |  |
| `placeholder` | String | `undefined` |  |

**Slots**: `startSection`, `endSection`, `no-option`. **Events**: `update:modelValue`, `clear`, `popup-show`, `popup-hide`, `retry`. **Exposed methods**: `focus()`, `blur()`.

```vue
<SelectField
  v-model="form.role"
  :options="roles"
  option-label="name"
  option-value="id"
  label="نقش"
  required
/>
```

---

### TimeField

**Location**: `@/base/TimeField` **Replaces**: `QInput` + `QTime` + `QPopupProxy` combo

| Prop           | Type              | Default     |
| -------------- | ----------------- | ----------- |
| `modelValue`   | String            | `''`        |
| `label`        | String            | `''`        |
| `variant`      | String            | `outline`   |
| `placeholder`  | String            | `00:00`     |
| `mask`         | String            | `HH:mm`     |
| `disable`      | Boolean           | `false`     |
| `error`        | Boolean \| String | `undefined` |
| `errorMessage` | String            | `undefined` |
| `stackLabel`   | Boolean           | `false`     |

```vue
<TimeField v-model="form.startTime" label="ساعت شروع" />
```

---

### Checkbox

**Location**: `@/base/Checkbox` **Replaces**: `QCheckbox`

| Prop            | Type    | Default           |
| --------------- | ------- | ----------------- |
| `modelValue`    | Boolean | `undefined`       |
| `defaultValue`  | Boolean | `false`           |
| `indeterminate` | Boolean | `false`           |
| `label`         | String  | `''`              |
| `description`   | String  | `''`              |
| `size`          | String  | `md` (`sm`, `md`) |
| `disabled`      | Boolean | `false`           |
| `flip`          | Boolean | `false`           |

```vue
<Checkbox v-model="form.agree" label="موافقت با قوانین" description="الزامی است" />
```

---

### Radio

**Location**: `@/base/Radio` **Replaces**: `QRadio`

| Prop           | Type                            | Default                   |
| -------------- | ------------------------------- | ------------------------- |
| `modelValue`   | String\|Number\|Boolean\|Object | `undefined`               |
| `defaultValue` | same                            | `undefined`               |
| `val`          | String\|Number\|Boolean\|Object | `undefined`               |
| `label`        | String                          | `undefined`               |
| `description`  | String                          | `undefined`               |
| `disable`      | Boolean                         | `false`                   |
| `size`         | String                          | `md` (`sm`, `md`)         |
| `flip`         | Boolean                         | `false`                   |
| `color`        | String                          | `blue` (`blue`, `orange`) |

```vue
<Radio v-model="form.gender" val="male" label="مرد" />
<Radio v-model="form.gender" val="female" label="زن" />
```

---

### Toggle

**Location**: `@/base/Toggle` **Replaces**: `QToggle`

| Prop           | Type    | Default           |
| -------------- | ------- | ----------------- |
| `modelValue`   | Boolean | `undefined`       |
| `defaultValue` | Boolean | `false`           |
| `label`        | String  | `''`              |
| `description`  | String  | `''`              |
| `size`         | String  | `md` (`sm`, `md`) |
| `disabled`     | Boolean | `false`           |
| `dense`        | Boolean | `false`           |
| `flip`         | Boolean | `false`           |

```vue
<Toggle v-model="settings.notifications" label="اعلان‌ها" />
```

---

### Chip

**Location**: `@/base/Chip` **Replaces**: `QChip`

| Prop         | Type      | Default                                |
| ------------ | --------- | -------------------------------------- |
| `text`       | String    | `undefined`                            |
| `variant`    | String    | `filled` (`filled`, `outline`, `flat`) |
| `size`       | String    | `md` (`sm`, `md`, `lg`)                |
| `color`      | String    | `light-blue`                           |
| `leftIcon`   | Component | `undefined`                            |
| `rightIcon`  | Component | `undefined`                            |
| `removable`  | Boolean   | `true`                                 |
| `isDisabled` | Boolean   | `false`                                |
| `isRounded`  | Boolean   | `false`                                |
| `avatar`     | Object    | `undefined`                            |

**Events**: `remove`, `right-click`.

```vue
<Chip text="فعال" color="green" />
<Chip :left-icon="IconStar" text="ویژه" variant="outline" />
```

---

### Badge

**Location**: `@/base/Badge` **Replaces**: `QBadge`

| Prop        | Type      | Default                                 |
| ----------- | --------- | --------------------------------------- |
| `label`     | String    | `undefined`                             |
| `variant`   | String    | `filled` (`filled`, `light`, `outline`) |
| `color`     | String    | `light-blue` (`QUASAR_COLORS`)          |
| `isRounded` | Boolean   | `false`                                 |
| `isDot`     | Boolean   | `false`                                 |
| `floating`  | Boolean   | `false`                                 |
| `leftIcon`  | Component | `undefined`                             |
| `rightIcon` | Component | `undefined`                             |

**Slot**: default (used when `label` is not set).

```vue
<Badge label="New" color="green" />
<Badge is-dot floating color="red" />
<Badge variant="light" color="amber">
  <IconClock size="12" />
  Pending
</Badge>
```

---

### Banner

**Location**: `@/base/Banner` **Replaces**: `QBanner`

| Prop          | Type                | Default                                   |
| ------------- | ------------------- | ----------------------------------------- |
| `title`       | String              | **required**                              |
| `description` | String              | `undefined`                               |
| `type`        | String              | `neutral` (`error`, `warning`, `neutral`) |
| `size`        | String              | `md` (`sm`, `md`, `lg`, `xl`)             |
| `icon`        | Component \| String | `undefined`                               |
| `showClose`   | Boolean             | `false`                                   |
| `actionLabel` | String              | `undefined`                               |

**Events**: `close`, `action`.

```vue
<Banner type="warning" title="اشتراک رو به اتمام" description="۳ روز دیگر" :show-close="true" />
<Banner type="error" title="خطا" action-label="تلاش مجدد" @action="retry" />
```

---

### Avatar

**Location**: `@/base/Avatar` **Replaces**: `QAvatar`

| Prop         | Type      | Default                            |
| ------------ | --------- | ---------------------------------- |
| `type`       | String    | `label` (`label`, `icon`, `image`) |
| `size`       | String    | `md` (`sm`, `md`, `lg`, `xl`)      |
| `color`      | String    | `light-blue`                       |
| `rounded`    | Boolean   | `true`                             |
| `label`      | String    | `''`                               |
| `userName`   | String    | `''`                               |
| `isShowIcon` | Boolean   | `false`                            |
| `icon`       | Component | `null` (defaults to `IconUser`)    |
| `src`        | String    | `''`                               |

```vue
<Avatar label="علی" />
<Avatar type="image" src="/users/1.jpg" />
<Avatar type="icon" :icon="IconUser" color="amber" />
```

---

### Tag

**Location**: `@/base/Tag` **Replaces**: multi-select `QChip` list

A tag-list component: renders selected items as removable chips and exposes a `+` button with a dropdown checklist to toggle options.

| Prop         | Type   | Default                                          |
| ------------ | ------ | ------------------------------------------------ |
| `modelValue` | Array  | `[]`                                             |
| `options`    | Array  | `[]`                                             |
| `itemLabel`  | String | `label`                                          |
| `itemValue`  | String | `value`                                          |
| `color`      | String | `blue` (`blue`, `green`, `red`, `amber`, `grey`) |

```vue
<Tag v-model="form.tags" :options="allTags" item-label="name" item-value="id" color="green" />
```

---

### Modal

**Location**: `@/base/Modal` **Replaces**: `QDialog` + `QCard` combo

| Prop                 | Type                      | Default     |
| -------------------- | ------------------------- | ----------- |
| `modelValue`         | Boolean                   | `false`     |
| `title`              | String                    | `undefined` |
| `subtitle`           | String                    | `undefined` |
| `persistent`         | Boolean                   | `false`     |
| `position`           | String                    | `undefined` |
| `seamless`           | Boolean                   | `false`     |
| `showClose`          | Boolean                   | `true`      |
| `showHeader`         | Boolean                   | `true`      |
| `minWidth`           | String \| Number          | `undefined` |
| `width`              | String \| Number          | `undefined` |
| `height`             | String \| Number          | `undefined` |
| `loading`            | Boolean                   | `false`     |
| `transitionShow`     | String                    | `scale`     |
| `transitionHide`     | String                    | `scale`     |
| `transitionDuration` | String \| Number          | `undefined` |
| `backdropFilter`     | String                    | `undefined` |
| `backgroundColor`    | String                    | `undefined` |
| `contentClass`       | String                    | `undefined` |
| `cardClass`          | String \| Array \| Object | `undefined` |

**Slots**: `header`, default (body), `footer`. **Events**: `update:modelValue`, `close`, `beforeShow`, `beforeHide`. **Exposed methods**: `show()`, `hide()`.

```vue
<Modal v-model="open" title="ویرایش کاربر" subtitle="اطلاعات را تکمیل کنید" :width="500">
  <UserForm />
  <template #footer>
    <Button text="لغو" variant="flat" @click="open = false" />
    <Button text="ذخیره" color="green" @click="save" />
  </template>
</Modal>
```

#### Drawer mode

`position` and `seamless` are forwarded to `QDialog`. Passing `position="left"` / `position="right"` switches the card to **drawer mode**: a side panel anchored to that edge of the screen (logical inline side — in RTL `left` anchors to the physical right edge and vice versa, matching Quasar). `seamless` removes the backdrop so the page behind stays visible, scrollable and interactive. Drawer chrome: padding is removed (`--modal-padding: 0`), and the header gets its own padding + bottom border. Set the panel width with `width` (side drawers are capped at `92vw`); give the card height via a `cardClass` rule.

> Side anchoring is enforced by the base styles with **logical auto inline margins** on the card (`margin-inline-start/end`): `left` pins to the inline-start edge, `right` to the inline-end edge. This app loads `quasar.rtl.css` _and_ the non-RTL core sass together, so Quasar's `.fixed-left/.fixed-right` utilities pin the QDialog container on **both** sides (full-width rail) and Quasar's position classes carry no `justify-*` rule — without these margins every side drawer would stack on the same edge in RTL. Consequence: **do not set horizontal (`margin-left/right` or `margin-inline-*`) margins on side-drawer cards** — vertical centering comes from Quasar's `align-items: center`, and the anchor-side gap (`$spacing-2xl`) is owned by the base. `position: top/bottom` sheets are unaffected.

Passing `position="top"` / `position="bottom"` switches to **horizontal sheet mode**: a full-viewport-width panel anchored to the top/bottom edge (same drawer chrome). Set the sheet height via `height` or a `cardClass` rule — useful for mobile top/bottom sheets that replace side drawers on small screens.

> Drawer/sheet cards are rendered **in flow** inside the QDialog positioned container on purpose: the slide transitions translate that container by its own size, and an absolutely-positioned card would leave it with zero size (no visible animation). Size the card with `width`/`height` props or `cardClass` CSS — never with `position: absolute`.

```vue
<Modal
  v-model="open"
  title="جزییات طرح درمان"
  seamless
  position="left"
  transition-show="slide-right"
  transition-hide="slide-left"
  :transition-duration="700"
  width="24rem"
>
  <QScrollArea class="my-drawer__body">
    <!-- scrollable content, e.g. wrapped in a padded .my-drawer__content -->
  </QScrollArea>
</Modal>
```

> Body scroll: the default slot is a plain flex column — for long content wrap it in a `QScrollArea` with `flex: 1; min-height: 0` so it fills the remaining drawer height.

#### Custom styling (external CSS/SCSS injection)

`cardClass` is **the** injection key for styling a modal differently from the base look: the class is applied to the `.modal` card root, next to the internal `modal--*` modifier classes. Note the difference from `contentClass`, which lands on the `QDialog` wrapper (`.q-dialog__inner`) — use `cardClass` when you want to restyle the card itself.

```vue
<!-- consumer -->
<Modal v-model="open" title="..." card-class="tpd-modal"> ... </Modal>
```

> **Rules for the card class must live in a GLOBAL (unscoped) style block** — e.g. a second `<style lang="scss">` without `scoped`, or a global stylesheet. Reason: `cardClass` lands on the card _inside_ base Modal, and QDialog portals that card to `<body>`, outside the consumer's DOM subtree. Scoped selectors never match it (the card keeps Modal's `data-v`, not yours), and `:deep()` can't reach it either (no scoped ancestor exists in the portal DOM). Elements you render yourself in the slots (e.g. a `QScrollArea class="my-modal__body"`) DO keep your scope id and can be styled scoped normally. BEM naming keeps the global class collision-free.

```scss
// consumer — <style lang="scss"> (unscoped)
.tpd-modal {
  --modal-radius: 24px; // token override
  border-width: 2px; // card-level rule

  .modal__header {
    background: $grey-1; // inner elements reachable — same global context
  }
}
```

Theming tokens (CSS custom properties read on the card, overridable via `cardClass` or from any ancestor element; `backgroundColor` sets `--modal-bg-color` directly):

| Token | Controls | Default |
| --- | --- | --- |
| `--modal-padding` | card + footer horizontal padding | `$spacing-xl` (24px) |
| `--modal-gap` | gap between header/body/footer | `$spacing-xl` (24px) |
| `--modal-radius` | corner radius | `$radius-lg` (16px) |
| `--modal-bg-color` | background color | `$white` (or `backgroundColor` prop) |
| `--modal-border-color` | card outline + header/footer separators | `$default-border` (`$grey-4`) |
| `--modal-shadow` | card box shadow | `0 4px 12px 0 rgba(105,117,134,.1)` |

> Drawer mode resets `--modal-padding` / `--modal-gap` to `0`. The base token rules are scoped (`class + [data-v]` attribute), so if a global `cardClass` token override seems ignored, you are in a specificity/order tie — bump the selector (`.modal.my-class`) or use `!important`.

---

### TabItem

**Location**: `@/base/TabItem` **Replaces**: `QTabs` / `QTab`

Can be used in **group mode** (pass `group` array) or as a container for slotted `QTab` children.

| Prop          | Type                        | Default      |
| ------------- | --------------------------- | ------------ |
| `modelValue`  | String \| Number \| Boolean | `undefined`  |
| `value`       | String \| Number \| Boolean | `undefined`  |
| `group`       | Array                       | `undefined`  |
| `labelKey`    | String                      | `label`      |
| `size`        | String                      | `md`         |
| `styleType`   | String                      | `default`    |
| `orientation` | String                      | `horizontal` |

**Group item shape**: `{ value, label, icon?, badge?, class? }`.

```vue
<TabItem
  v-model="tab"
  :group="[
    { value: 'a', label: 'نمودار' },
    { value: 'b', label: 'جدول' },
  ]"
/>
```

---

### ItemTable

**Location**: `@/base/ItemTable` **Replaces**: custom table cell/header rendering

A single-cell component used inside `QTable` column slots for consistent header and cell styling (with optional sort icon, swap icon, or action slot).

| Prop          | Type      | Default                   |
| ------------- | --------- | ------------------------- |
| `type`        | String    | `cell` (`header`, `cell`) |
| `variant`     | String    | `text` (`text`, `swap`)   |
| `title`       | String    | `undefined`               |
| `description` | String    | `''`                      |
| `icon`        | Component | `null`                    |
| `sortable`    | Boolean   | `false`                   |
| `active`      | Boolean   | `false`                   |

**Slot**: `action`. **Events**: `sort-change` (emits `'asc'`, `'desc'`, or `null`).

---

### Notif & confirmDialog

**Location**: `@/data/services/notification-service` **Replaces**: `Notify.create` / `$q.notify` (toasts) and `Dialog.create` / `$q.dialog` (confirm dialogs).

> **Mandatory**: Use `Notif` for ALL toast messages and `confirmDialog` for ALL confirm dialogs. Never call`$q.notify` / `Notify.create` / `$q.dialog` directly.

These wrappers own the Quasar `Notify`/`Dialog` imports. Consumers import the wrapper only.

#### `Notif` — toasts

Renders a real Vue component — `src/components/NotifCard.vue` — mounted inside Quasar's `Notify` shell (the shell still owns positioning, stacking, timers, and the auto-dismiss progress bar). Card theming lives in `NotifCard.vue` as scoped BEM styles (`app-notify`, `app-notify__main`, `app-notify__icon`, `app-notify__content`, `app-notify__header`, `app-notify__title`, `app-notify__body`, `app-notify__caption`, `app-notify__actions`, `app-notify--<type>`) using project color tokens (e.g. success = `$green-1` background, `$green-8` border + header + icon). The X close button and any action buttons reuse the design-system `base/Button` directly, so they inherit the full variant/color palette for free. Global overrides that target Quasar's own DOM (`.q-notification__wrapper`, `.q-notification__content`, `.q-notification__progress`) live in `src/assets/styles/notification-service.scss` because those elements are outside the component's scope. Implementation lives in `@/composables/use-notif`; `@/data/services/notification-service` is a thin re-export kept for import-path stability.

```js
import { Notif } from '@/data/services/notification-service'

Notif.success('ذخیره با موفقیت انجام شد')
Notif.error('خطا در ارتباط با سرور', { position: 'bottom-center' })
Notif.warning('این نوبت لغو شده است')
Notif.info('به‌روزرسانی جدید موجود است')
Notif.success('انجام شد', { title: 'تکمیل' }) // custom header
Notif.success('انجام شد', { title: false, timeout: 3000 }) // header hidden (no X) — set timeout so it auto-dismisses
Notif.success('ذخیره شد', {
  caption: 'در دیتابیس ثبت شد',
  actions: [{ label: 'مشاهده', variant: 'filled', color: 'green', handler: goToDetail }],
}) // filled (default variant) + green (custom color) action under the caption; toast dismisses after handler
Notif.warning('جلسه در حال انقضاست', {
  actions: [
    { label: 'تمدید', variant: 'outline', color: 'primary', handler: extend, noDismiss: true },
    {
      label: 'بعداً',
      variant: 'flat',
      color: 'grey',
      handler: () => {},
    },
  ],
}) // outline + flat variants with explicit colors; "تمدید" keeps the toast open
```

| Member          | Signature             |
| --------------- | --------------------- |
| `Notif.success` | `(message, options?)` |
| `Notif.error`   | `(message, options?)` |
| `Notif.warning` | `(message, options?)` |
| `Notif.info`    | `(message, options?)` |

`options`:

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `title` | String \| `false` \| `null` | Persian type label (`موفق`/`خطا`/`هشدار`/`اطلاع`) | Header label. Falsy/empty hides the header and shows the message alone. |
| `caption` | String | — | Secondary text rendered directly under the message in the content column (smaller, grey). Omit to render message-only. |
| `position` | String | `top` | `top-left`, `top-right`, `top-center`, `bottom-left`, `bottom-right`, `bottom-center` (also accepts raw Quasar `top`/`bottom`). |
| `timeout` | Number | `3000` | Auto-dismiss ms (`0` = stays until the header X is clicked). |
| `classes` | String \| String[] | — | Extra classes appended to the card. |
| `actions` | Array | `undefined` | Functional buttons rendered under the caption. Each item: `{ label?, variant?, color?, handler?, noDismiss? }`. `variant`: `'filled'` (default), `'outline'`, `'flat'` — mirrors the `base/Button` variants. `color`: `'primary'` (default) or any of `primary`, `red`, `green`, `amber`, `blue`, `light-blue`, `cyan`, `teal`, `pink`, `purple`, `deep-purple`, `indigo`, `grey`, `blue-grey`, `dark` — reuses the same SCSS tokens as `base/Button` so each variant matches its sibling design-system button. `handler` runs on click; `noDismiss: true` keeps the toast open (otherwise the toast dismisses after the handler). |

> The header carries a close (**X**) button that dismisses the toast; that is the default close affordance (there is no longer a default `«متوجه شدم»` action). Action buttons passed via `actions` render directly under the caption (or the message when no caption is set) and mirror the `base/Button` variants (`filled` default, `outline`, `flat`) and color palette (`primary` default; `red`/`green`/`amber`/`dark`/…). Set `noDismiss: true` on an action so it runs its `handler` without closing the toast. With the default `timeout: 0` the toast stays until the X is clicked, so if you pass `title: false` (no header/X) you must set a `timeout` or provide dismissible `actions`. The composable protects `type`/ `message`/`html`/`caption`/`group` from being overridden so the component props stay intact.

**Grouping behavior:** toasts with identical content (same `type` + `message` + `title` + `caption` + action labels) stack into one shell with a Quasar badge counter instead of piling up as separate cards; toasts with any differing content always render separately. The group key is derived from the real card content, not Quasar's `message` prop ( which is always the same mount placeholder).

#### `confirmDialog` — confirm dialog

```js
import { confirmDialog } from '@/data/services/notification-service'

confirmDialog('حذف نوبت', 'این مورد حذف شود؟', () => {
  deleteBooking(booking.id, {
    onSuccess: () => Notif.success('حذف شد'),
  })
})
```

| Parameter | Type | Notes |
| --- | --- | --- |
| `title` | String | Dialog title. |
| `message` | String | Dialog body. |
| `callbackFn` | Function | Runs on confirm (OK). |
| `options` | Object \| `undefined` | Passed through to Quasar `Dialog`. `cancel` defaults to `{ label: 'انصراف', color: 'primary', flat: true }`; provide `options.ok` to customise the confirm button (label/color). |

---

## Quasar Components (when no `base/` wrapper exists)

Use these directly from `quasar` only when no `base/` wrapper covers the case.

### Layout

- **QLayout**: 3×3 matrix layout system for app structure
- **QHeader / QFooter**: Navigation containers with reveal behavior
- **QDrawer**: Sidebar with normal / mini / overlay modes, touch gestures
- **QPageContainer / QPage**: Content area management
- **QCard / QCardSection / QCardActions**: Content container (outside `Modal`)
- **QExpansionItem**: Collapsible content panels
- **QSplitter**: Resizable split panes
- **QSeparator**: Visual divider component

### Data Display

- **QTable**: Advanced table — use `columns` array + `rows`, virtual-scroll for >100 rows
- **QList / QItem / QItemSection / QItemLabel**: List display with router integration
- **QVirtualScroll**: Performance-optimized scrolling for large datasets
- **QInfiniteScroll**: Lazy loading content on scroll
- **QTree**: Hierarchical data display with lazy loading
- **QImg**: Image with lazy load, preview, error state
- **QSkeleton**: Loading placeholders

### Navigation

- **QStepper / QStep / QStepperNavigation**: Multi-step processes
- **QBreadcrumbs / QBreadcrumbsEl**: Navigation path display
- **QPagination**: Page navigation
- **QRouteTab**: Router-aware tabs (use `TabItem` wrapper where possible)

### Overlays (no `base/` wrapper)

- **QMenu**: Dropdown menus with positioning
- **QTooltip**: Hover information
- **QPopupProxy**: Context menus / inline pickers
- **QDate**: Date picker — use with `PersianDate` wrapper component

### Form Helpers (no `base/` wrapper)

- **QFile**: File picker with drag-and-drop support
- **QSlider / QRange**: Value selection with markers and labels
- **QBtnToggle / QBtnGroup**: Button groups

### Feedback

- **QInnerLoading**: In-card loading overlay (already used inside `Modal`)
- **QSpinner / QSpinnerTail / QSpinnerDots …**: Loading spinners
- **QBanner**: Page-wide messages (prefer `Banner` wrapper)

---

## Quasar Directives

- **v-ripple**: Material ripple effects
- **v-intersection**: Visibility detection (lazy loading)
- **v-touch-hold / v-touch-pan / v-touch-swipe**: Touch gestures
- **v-close-popup**: Close overlay components (`QDialog`, `QMenu`, …)
- **v-scroll**: Scroll position observation
- **v-model-hold**: Model hold behavior

---

## Quasar Plugins

Accessed via the `$q` global (inside components) or `useQuasar()` composable.

- **Dialog**: `$q.dialog({ ... })` — programmatic dialogs with promises
- **Notify**: `$q.notify({ message, type })` — toast notifications (use instead of any legacy `ElMessage`)
- **Loading**: `$q.loading.show()` / `.hide()` — global loading state
- **LoadingBar**: `$q.loadingBar.start()` / `.stop()` — top loading indicator
- **BottomSheet**: `$q.bottomSheet({ ... })` — mobile-style bottom sheets
- **Dark**: `$q.dark.set(true)` — dark mode toggle

---

## Quasar Utilities

- **date**: Date manipulation (prefer `@/utils/date-utils` for Jalali support)
- **colors**: Color conversion and manipulation
- **dom**: DOM manipulation helpers
- **format**: Text formatting utilities (`capitalize`, `truncate`, …)
- **scroll**: Scroll position management
- **eventBus**: Global event bus

---

## CSS / Styling Rules

### Methodology

- ✅ **BEM**: `block__element--modifier` naming in `<style>` sections
- ✅ **Quasar color variables**: `$primary`, `$secondary`, `$grey-6`, …
- ❌ **No helper classes inside `<style>`** (no `q-mt-md`, `row`, `col-*`, `bo-*`)
- ✅ Helper classes OK **in `<template>`** for layout (`row`, `col-*`, `q-gutter-*`)

---

## Color Palette

Imported from [`@/constants/colors`](../src/constants/colors.js):

```
red, pink, purple, deep-purple, indigo, blue, light-blue, cyan, teal, green,
light-green, lime, yellow, amber, orange, deep-orange, brown, grey, blue-grey,
dark, dark-2, white, warning, textSecondary, currentColor
```

```js
import { QUASAR_COLORS } from '@/constants/colors'
```
