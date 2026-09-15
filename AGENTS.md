# AGENTS.md

## CRITICAL: Task Workflow (SPD-xxxx)

وقتی کاربر فقط شماره تسک داد (مثلاً `SPD-3482` بدون توضیح):

🔴 **اول از همه ابزار `jira_get_issue` را با `issue_key` صدا بزن تا توضیحات تسک از Jira خوانده شود. هیچ کاری نکن تا این ابزار اجرا شود.**

```
jira_get_issue({ "issue_key": "SPD-3482" })
```

سپس این ترتیب را دنبال کن:

1. **Jira fetch** — `jira_get_issue` را صدا بزن، summary و description را استخراج کن، brief چاپ کن
2. **وضعیت تسک (CRITICAL)** — فیلد `status` را از پاسخ Jira چک کن:
   - ✅ **فقط اگر `Ready To Start` است ادامه بده**
   - 🚫 اگر هر وضعیت دیگری است (مثل `Done`، `Ready for Demo`، `In Progress`، `Pending`، `Closed`) → متوقف شو و به کاربر اخطار بده:
     ```
     ⚠️ وضعیت تسک SPD-xxxx: [status]
     این تسک در وضعیت Ready To Start نیست. ادامه نمی‌دهم.
     اگر مطمئن هستی، تایید کن تا ادامه بدهم.
     ```
   - بدون تأیید صریح کاربر، هیچ تغییری نده
3. **Git branch** — `git checkout master && git pull`، سپس `git checkout -b SPD-xxxx-{slug}` (slug از summary)
4. **Implement** — قوانین `frontend-quality` skill را اعمال کن
5. **Lint** — `cmd /c "npm run lint"`
6. **Shadow testing** — طرح تست ارائه بده

اگر ابزار `jira_get_issue` در دسترس نیست (MCP لود نشده):
- به کاربر بگو: «ابزار Jira MCP موجود نیست. `/mcps` را چک کنید.»
- مسدود نشو، از کاربر توضیحات دستی بخواه

## Frontend Quality Rules

> 🔴 **قبل از کدنویسی** این قوانین را رعایت کن.

- **منبع کامل UI (single source of truth):** نحوه‌ی استفاده از کامپوننت‌های `src/base/` و Quasar،
  قوانین BEM، پالت رنگ و توکن‌های spacing/radius همگی در **`UI_FRAMEWORKS_REFERENCE.md`** آمده‌اند.
  قبل از ساخت یا تغییر UI آن فایل را بخوان و قوانینش را اعمال کن — کامپوننت‌ها را اینجا توضیح نده.
- **Component priority:** همیشه اول `src/base/`، بعد Quasar خام.
- **Backend not ready?** مسدود نشو — Mock Data + feature toggle بساز
- **States:** هر کامپوننت باید Loading / Error / Empty را هندل کند
- **Disabled elements:** قبل از `QTooltip` در `<div>` wrapper بگذار
- **Lint:** `cmd /c "npm run lint"` باید بدون خطا پاس شود

## Setup (برای توسعه‌دهندگان جدید)

```powershell
.\.kilo\setup-jira-mcp.ps1 -JiraUrl "https://jira.signaldev.ir" -JiraToken "YOUR_PAT"
```

جزئیات بیشتر: `.kilo/skills/` و `.kilo/setup-jira-mcp.ps1`
