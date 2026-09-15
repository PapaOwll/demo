---
name: git-automation
description: "نقطه ورود هر تسک: ابتدا توضیحات را از Jira (MCP) می‌خواند، سپس برنچ SPD-* می‌سازد. وقتی کاربر فقط شماره تسک SPD-xxxx را می‌دهد، این skill اول از همه اجرا می‌شود."
alwaysApply: true
---

# Task Kickoff: Jira Intake + Git Branch

## CRITICAL: Execution Order

وقتی کاربر شماره تسک با فرمت `SPD-[Number]` می‌دهد (مثلاً فقط `SPD-3482`):

🔴 **اول Jira، آخر Git.** تا زمانی که توضیحات تسک از Jira خوانده نشده، **هیچ دستور git اجرا نکن**.

### Step 1: Fetch Jira Ticket (FIRST — before any git command)

ابزار MCP **`jira_get_issue`** را با کلید تسک صدا بزن:

```
jira_get_issue({ "issue_key": "SPD-3482" })
```

از پاسخ استخراج کن:
- **summary** — عنوان یک‌خطی
- **description** — شرح کامل (کارها، وابستگی‌ها، معیارهای پذیرش)

اگر ابزار `jira_get_issue` در دسترس **نیست** (MCP لود نشده):
1. به کاربر بگو: «ابزار Jira MCP در دسترس نیست. لطفاً `/mcps` را چک کنید یا توضیحات تسک را دستی بدهید.»
2. مسدود نشو — اگر کاربر توضیحات دستی داد، ادامه بده.

### Step 2: Check Task Status (CRITICAL GATE)

از پاسخ Jira فیلد `status` را چک کن:

- ✅ **`Ready To Start`** → ادامه بده (Step 3)
- 🚫 **هر وضعیت دیگری** (`Done`، `Ready for Demo`، `In Progress`، `Pending`، `Closed` و غیره) → متوقف شو:

  ```
  ⚠️ وضعیت تسک SPD-xxxx: [status]
  این تسک در وضعیت Ready To Start نیست. ادامه نمی‌دهم.
  اگر مطمئن هستی، تایید کن تا ادامه بدهم.
  ```

  بدون تأیید صریح کاربر، **هیچ تغییری نده** و به Step بعدی نرو.

### Step 3: Print Brief

خلاصهٔ ساختاریافته در چت چاپ کن:

```
## 📋 SPD-xxxx — [summary]
🎯 Goal: ...
🛠 Tasks:
  1. ...
🔗 Dependencies: ...
✅ Acceptance: ...
```

### Step 4: Sync with Remote (NOW git is allowed)

```bash
git checkout master
git pull
```

### Step 5: Generate Branch Name from Summary

از فیلد `summary` تسک Jira یک slug کوتاه kebab-case بساز (حداکثر ۴ کلمه).

**مثال‌ها:**
- Summary "[Frontend] مرحله ورود کد OTP در دیالوگ تهاتر" → slug `otp-barter-dialog`
- Summary "Add user profile page" → slug `user-profile-page`

### Step 6: Create & Switch Branch

الگوی استاندارد تیم (با `{}` دور slug):

```bash
git checkout -b SPD-[taskNumber]-{[slug]}
```

**مثال:** `git checkout -b SPD-3482-{otp-barter-dialog}`

### Step 7: Confirm + Hand Off

```
🔄 Switched to new branch: [branch_name]
```

ابزار ویرایش فایل تا این پیام قفل است. بعد از آن، skill `frontend-quality` قوانین پیاده‌سازی را اعمال می‌کند.
