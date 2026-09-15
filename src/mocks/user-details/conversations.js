import { daysAgo, mockDelay } from '@/mocks/mock-storage'

/**
 * Mock channels (پیام‌ها sidebar) + conversations for UserMessages.
 */

export const MOCK_CHANNELS = {
  data: {
    items: [
      { id: 1, title: 'پیامک', slug: 'sms', metadata: { icon: 'message-2' } },
      { id: 2, title: 'تلگرام', slug: 'telegram', metadata: { icon: 'brand-telegram' } },
      { id: 3, title: 'اینستاگرام', slug: 'instagram', metadata: { icon: 'brand-instagram' } },
      { id: 4, title: 'واتس اپ', slug: 'whatsapp', metadata: { icon: 'brand-whatsapp' } },
    ],
  },
}

const msg = (id, slug, message, isAdmin, days, h, m) => ({
  id,
  message,
  isAdmin,
  createdAt: daysAgo(days, h, m),
  source: { slug },
})

const MOCK_MESSAGES = [
  // SMS — 3 days ago
  msg(
    101,
    'sms',
    'کلینیک دندان‌پزشکی سیترا: نوبت شما فردا ساعت ۱۰:۳۰ ثبت شد. لطفا ۱۰ دقیقه زودتر حضور یابید.',
    true,
    3,
    9,
    12
  ),
  msg(102, 'sms', 'ممنون، حتما میام.', false, 3, 9, 40),
  msg(
    103,
    'sms',
    'کلینیک سیترا: یادآوری جلسه درمان روت کانال شما دو شنبه ساعت ۱۶:۰۰ می‌باشد.',
    true,
    2,
    12,
    5
  ),
  msg(104, 'sms', 'سلام، امکان تغییر ساعت به ۱۷ هست؟', false, 2, 12, 45),
  msg(105, 'sms', 'کلینیک سیترا: نوبت شما به ساعت ۱۷:۰۰ تغییر یافت. موفق باشید.', true, 2, 13, 2),
  // Telegram — 2 days ago
  msg(
    201,
    'telegram',
    'سلام خانم رضایی 🖐\nنتیجه بررسی OPG شما آماده شد. لطفا از طریق لینک زیر مشاهده کنید.',
    true,
    2,
    15,
    20
  ),
  msg(202, 'telegram', 'سلام، ممنون. لینک باز نمی‌شه برای من.', false, 2, 15, 55),
  msg(203, 'telegram', 'لطفا یکبار دیگر امتحان کنید، لینک اصلاح شد.', true, 2, 16, 10),
  msg(204, 'telegram', 'الان درست شد، متشکر 🙏', false, 2, 16, 22),
  msg(205, 'telegram', 'خواهش می‌کنم. پس منتظر شما در جلسه بعدی هستیم.', true, 2, 16, 30),
  // Telegram — today
  msg(206, 'telegram', 'سلام، بعد از درمان کمی حساسیت دارم روی دندان، طبیعیه؟', false, 0, 11, 5),
  msg(
    207,
    'telegram',
    'سلام، بله تا ۴۸ ساعت بعد از پرکردن طبیعی است. در صورت ادامه با ما تماس بگیرید.',
    true,
    0,
    11,
    35
  ),
  // Instagram — yesterday
  msg(301, 'instagram', 'سلام! برای قیمت ایمپلنت چطور مشاوره بگیرم؟', false, 1, 18, 40),
  msg(
    302,
    'instagram',
    'سلام و درود 🌸 لطفا شماره تماس خود را ارسال کنید تا همکاران ما با شما تماس بگیرند.',
    true,
    1,
    19,
    5
  ),
  msg(303, 'instagram', '۰۹۱۲۳۴۵۶۷۸۹', false, 1, 19, 12),
  msg(
    304,
    'instagram',
    'ثبت شد، به زودی با شما تماس می‌گیریم. سپاس از پیگیری شما ❤️',
    true,
    1,
    19,
    20
  ),
  // WhatsApp — 4 days ago
  msg(
    401,
    'whatsapp',
    'سلام، فاکتور جلسه قبل را برایتان ارسال کردم، لطفا بررسی کنید.',
    true,
    4,
    10,
    15
  ),
  msg(402, 'whatsapp', 'سلام، رسید 👌 ممنون.', false, 4, 12, 0),
  // WhatsApp — yesterday
  msg(
    403,
    'whatsapp',
    'سلام، بابت تسویه حساب مبلغ باقیمانده را واریز کردم. رسید پیوست است.',
    false,
    1,
    9,
    30
  ),
  msg(
    404,
    'whatsapp',
    'سلام، واریزی شما تایید شد 🙏 تسویه کامل انجام گرفت. سلامت باشید.',
    true,
    1,
    10,
    5
  ),
]

/**
 * queryFn mock for the conversations infinite query (respects source filter).
 * Returns `items` as a plain array — the component flattens `page.data.items`
 * directly, and the hook's getNextPageParam (which reads `items.data`) then
 * sees undefined and terminates after page 1.
 */
export const mockGetUserConversations = async ({ 'filter[source]': sourceSlug } = {}) => {
  await mockDelay(500)
  const items = sourceSlug
    ? MOCK_MESSAGES.filter((m) => m.source.slug === sourceSlug)
    : MOCK_MESSAGES
  return {
    data: {
      items,
    },
  }
}
