import { daysAgo, mockDelay, mockStorage } from '@/mocks/mock-storage'

/** Mocks for the ضمانتنامه tab — status toggles persist in localStorage */

const BASE_WARRANTIES = [
  {
    id: 6201,
    serve: { title: 'روکش زیرکونیا' },
    question: { title: 'ضمانت روکش' },
    serveItem: { id: 11, title: 'روکش تمام سرامیکی' },
    teeth: [{ position: 'فک بالا', number: 16 }],
    expiryDate: '1501-06-15T00:00:00.000Z',
    isActive: true,
    performedAt: daysAgo(300, 10, 0),
  },
  {
    id: 6202,
    serve: { title: 'ایمپلنت' },
    question: { title: 'ضمانت ایمپلنت' },
    serveItem: { id: 12, title: 'ایمپلنت کره‌ای' },
    teeth: [
      { position: 'فک پایین', number: 46 },
      { position: 'فک پایین', number: 47 },
    ],
    expiryDate: '1520-01-01T00:00:00.000Z', // مادام العمر (بعد از 1500)
    isActive: true,
    performedAt: daysAgo(120, 12, 0),
  },
  {
    id: 6203,
    serve: { title: 'ترمیم کامپوزیت' },
    question: { title: 'ضمانت ترمیم' },
    serveItem: { id: 13, title: 'کامپوزیت نوری' },
    teeth: [{ position: 'فک بالا', number: [11, 12, 21] }],
    expiryDate: '2026-08-01T00:00:00.000Z',
    isActive: false,
    performedAt: daysAgo(600, 9, 30),
  },
  {
    id: 6204,
    serve: { title: 'بلیچینگ' },
    question: { title: 'ضمانت بلیچینگ' },
    serveItem: { id: 14, title: 'بلیچینگ کامل' },
    teeth: [],
    expiryDate: '2026-05-20T00:00:00.000Z',
    isActive: false,
    performedAt: daysAgo(400, 14, 0),
  },
]

const getWarrantyStatusKey = (userId) => `warranty-status-${userId}`

const resolveActive = (warranty, overrides) =>
  overrides[warranty.id] === undefined ? warranty.isActive : overrides[warranty.id]

export const mockGetUserWarranties = async (userId) => {
  await mockDelay(400)
  const overrides = mockStorage.get(getWarrantyStatusKey(userId), {})
  return {
    data: {
      warranties: BASE_WARRANTIES.map((warranty) => ({
        ...warranty,
        isActive: resolveActive(warranty, overrides),
      })),
    },
  }
}

/** PATCH warranty status — flips the persisted active flag so the change survives reloads */
export const mockUpdateUserWarrantyStatus = async ({ warrantyId, userId } = {}) => {
  await mockDelay(500)
  const warranty = BASE_WARRANTIES.find((w) => w.id === warrantyId)
  if (!warranty) throw new Error('ضمانتنامه یافت نشد')

  const key = getWarrantyStatusKey(userId)
  const overrides = mockStorage.get(key, {})
  overrides[warrantyId] = !resolveActive(warranty, overrides)
  mockStorage.set(key, overrides)

  const message = overrides[warrantyId]
    ? 'ضمانتنامه با موفقیت فعال شد'
    : 'ضمانتنامه با موفقیت غیرفعال شد'
  return { success: true, message, data: { success: true, message } }
}
