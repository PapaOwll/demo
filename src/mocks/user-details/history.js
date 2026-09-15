import { daysAgo, mockDelay } from '@/mocks/mock-storage'

/**
 * Mocks for the تاریخچه tab (user activity history) — several realistic records.
 * Item shape: { message, createdAt, advisor: {firstName, name}, branch: {name} }
 */

const advisorMaryam = { name: 'دکتر مریم احمدی' }
const advisorAli = { name: 'دکتر علی رضایی' }
const advisorNeda = { name: 'ندا کریمی' }
const branchSaadat = { name: 'شعبه سعادت‌آباد' }
const branchShahrak = { name: 'شعبه شهرک غرب' }

const h = (id, message, days, hour, minute, advisor, branch) => ({
  id,
  message,
  createdAt: daysAgo(days, hour, minute),
  advisor,
  branch,
})

const BASE_HISTORY = [
  h(
    8101,
    'کاربر توسط دکتر مریم احمدی ویزیت شد — تشخیص: پوسیدگی گسترده دندان ۳۶',
    0,
    10,
    45,
    advisorMaryam,
    branchSaadat
  ),
  h(
    8102,
    'یادآوری نوبت از طریق پیامک برای فردا ساعت ۱۶:۰۰ ارسال شد',
    0,
    9,
    15,
    advisorNeda,
    branchSaadat
  ),
  h(
    8103,
    'تماس موفق — کاربر تأیید کرد جلسه درمان را به هفته بعد موکول کند',
    1,
    14,
    20,
    advisorNeda,
    branchSaadat
  ),
  h(
    8104,
    'طرح درمان شماره ۷۱۰۱ (روت کانال + روکش زیرکونیا) برای کاربر فعال شد',
    2,
    12,
    0,
    advisorAli,
    branchShahrak
  ),
  h(
    8105,
    'بیعانه طرح درمان به مبلغ ۵٫۰۰۰٫۰۰۰ تومان دریافت و ثبت شد',
    2,
    12,
    30,
    advisorNeda,
    branchShahrak
  ),
  h(8106, 'عکس OPG کاربر در پرونده بارگذاری شد', 3, 11, 10, advisorMaryam, branchSaadat),
  h(
    8107,
    'وضعیت کاربر از «در حال پیگیری» به «نوبت داده شد» تغییر یافت',
    4,
    16,
    5,
    advisorNeda,
    branchSaadat
  ),
  h(
    8108,
    'نوبت ویزیت اولیه برای تاریخ ۱۴۰۵/۰۶/۲۲ ساعت ۱۰:۳۰ ثبت شد',
    5,
    13,
    40,
    advisorNeda,
    branchSaadat
  ),
  h(8109, 'کاربر از طریق معرفی دوستان به کلینیک اضافه شد', 6, 9, 50, advisorNeda, branchSaadat),
  h(
    8110,
    'مشاوره تلفنی اولیه انجام شد — بیمار درباره ایمپلنت و هزینه‌ها سؤال داشت',
    7,
    15,
    25,
    advisorAli,
    branchShahrak
  ),
  h(8111, 'برچسب «تمایل بالا» به کاربر اضافه شد', 8, 10, 5, advisorNeda, branchSaadat),
  h(
    8112,
    'درخواست عکس CBCT برای بررسی تراکم استخوان ناحیه ۴۶ ثبت شد',
    10,
    17,
    15,
    advisorAli,
    branchShahrak
  ),
]

/** queryFn mock for useGetUserHistoryInfinityQuery (single page — empty page terminates) */
export const mockGetUserHistory = async ({ page } = {}) => {
  await mockDelay(450)
  const pageNum = Number(page) || 1
  if (pageNum > 1) {
    return { data: { items: [] } }
  }
  return {
    data: {
      items: [...BASE_HISTORY].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    },
  }
}
