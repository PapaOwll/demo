---
name: frontend-quality
description: "استانداردهای کیفی پیاده‌سازی فرانت‌اند: معماری، Design System، Quasar Patterns، Lint و هندلینگ حالت‌ها. پس از ساخت برنچ توسط skill git-automation اعمال می‌شود."
globs:
  - "**/*.vue"
  - "**/*.js"
  - "**/*.jsx"
  - "**/*.cjs"
  - "**/*.mjs"
alwaysApply: true
---

# Frontend Quality Standards

## Purpose

قوانین پیاده‌سازی فرانت‌اند. این skill **پس از** اینکه `git-automation` تسک را از Jira خواند و برنچ ساخت، اعمال می‌شود.

## Implementation Quality Rules

### 1. Backend Blocked Protocol

اگر API یا تسک بک‌اند (وابستگی‌های تسک Jira را ببین) ناتمام است، مسدود نشو. پیش‌گیرانه بساز:

- **Mock Data** با ساختار واقع‌بینانه مطابق پاسخ مورد انتظار API
- **Feature toggles** با local reactive state (`ref(true/false)`) تا هر دو مسیر mock و real قابل تست باشند
- ترجیحاً از truthiness check (`!!value`) به‌جای strict equality استفاده کن تا نبود فیلد backward compatible بماند

### 2. State & Architecture

- منطق **API/Business** را از **UI rendering** جدا کن با composables (`use*.js`)
- هر کامپوننت UI باید سه حالت را هندل کند:
  - **Loading** — skeleton، spinner یا placeholder
  - **Error** — پیام کاربرپسند با گزینه retry
  - **Empty** — حالت خالی مناسب
- state مشترک/سراسری در store (Pinia) باشد، نه در component local state

### 3. Design System

فقط این روش‌های استایل‌دهی مجاز است:
- **UI Kit** کامپوننت‌های موجود پروژه
- **Tailwind CSS** utility classes
- **Quasar Framework** کامپوننت‌ها

CSS سفارشی فقط برای animation، transition یا override که با موارد بالا ممکن نیست.

#### 3.1 No Inline Styles (الزامی)

- استفاده از ویژگی `style="..."` (inline style) در template **ممنوع** است.
- هر استایل را به‌صورت **class** در `<style scoped>` کامپوننت (یا SCSS module) تعریف کن و از طریق `class` اعمال کن.
- استثناها (فقط در صورت ضرورت مطلق): مقادیر **داینامیک** که به‌صورت runtime محاسبه می‌شوند (مثلاً `:style="{ width: dynamicWidth }"`). مقادیر ثابت هرگز نباید inline باشند.
- **چک‌لیست هر تغییر/تسک:** قبل از اتمام کار، در تمام فایل‌های دست‌خورده با `grep` به‌دنبال ` style="` و `:style="` بگرد؛ هر inline-style ثابتی را به class تبدیل کن. این بررسی در **هر تسک و هر ویرایش** الزامی است.

### 4. Quasar Patterns

- عناصر disabled (`disable`) ماوس‌ایونت نمی‌دهند → عنصر disabled را در یک `<div>` wrapper بگذار و `QTooltip` را به wrapper بچسبان.
- Auto-import با `@quasar/vite-plugin` — نیازی به `import` صریح نیست مگر اینکه جای دیگری import شده باشد.

### 5. Lint Validation

کد باید `npm run lint` را بدون خطا پاس کند. اگر PowerShell روی این ماشین npm را بلاک کرد:
```
cmd /c "npm run lint"
```

### 6. Component Conventions

- Single Responsibility: هر کامپوننت یک کار خوب انجام دهد
- Propها باید type و default داشته باشند
- برای ارتباط با parent از emit استفاده کن؛ از mutation مستقیم prop پرهیز کن
- از `<script setup>` composition API استفاده کن

## Delivery & Shadow Testing

پس از سبز شدن lint، skill `shadow-testing` را اجرا کن: Happy Path، Edge Cases و Side-Effects checklist تولید کن.
