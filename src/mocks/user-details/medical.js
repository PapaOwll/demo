import { daysAgo, mockDelay } from '@/mocks/mock-storage'
import { coll } from '@/mock/db'

/**
 * Mocks for the پرونده پزشکی tab:
 * - اطلاعات کلی (medical info + diseases list)
 * - مدارک پزشکی (radiology files + file statuses)
 * - نسخه‌های پزشک (OPG prescription requests)
 */

export const MOCK_DISEASES = {
  data: [
    { id: 1, name: 'دیابت' },
    { id: 2, name: 'فشار خون' },
    { id: 3, name: 'بیماری قلبی' },
    { id: 4, name: 'حساسیت دارویی' },
    { id: 5, name: 'اختلال انعقاد خون' },
    { id: 6, name: 'بیماری تیروئید' },
    { id: 7, name: 'آسم' },
    { id: 8, name: 'بیماری صرع' },
  ],
}

export const mockGetMedicalInfo = async () => {
  await mockDelay(400)
  return {
    data: {
      diseases: [
        { id: 1, name: 'دیابت' },
        { id: 4, name: 'حساسیت دارویی' },
      ],
      info: {
        otherDisease: 'حساسیت فصلی',
        medicationHistory: true,
        tobaccoAlcoholUse: true,
        consumedMedications: 'متفرمین ۵۰۰ - روزی یکبار',
        consumedMedicationsAmount: 'سیگار: حدود ۵ نخ در روز',
      },
    },
  }
}

export const MOCK_FILE_STATUSES = {
  data: [
    { id: 14, title: 'در انتظار بررسی' },
    { id: 15, title: 'تایید شده' },
    { id: 16, title: 'رد شده' },
  ],
}

const placeholderImage = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><rect width="240" height="240" fill="#e3f2fd"/><text x="50%" y="45%" text-anchor="middle" font-size="18" fill="#1565c0" font-family="sans-serif">X-Ray</text><text x="50%" y="60%" text-anchor="middle" font-size="14" fill="#546e7a" font-family="sans-serif">Mock</text></svg>`
)}`

export const mockGetMedicalFiles = async () => {
  await mockDelay(500)
  return {
    data: {
      items: [
        {
          id: 501,
          path: placeholderImage,
          type: 'user.opg',
          createdAt: daysAgo(12, 9, 20),
          status: { id: 15, title: 'تایید شده' },
        },
        {
          id: 502,
          path: placeholderImage,
          type: 'user.cbct',
          createdAt: daysAgo(8, 14, 45),
          status: { id: 14, title: 'در انتظار بررسی' },
        },
        {
          id: 503,
          path: placeholderImage,
          type: 'user.docs',
          createdAt: daysAgo(30, 11, 10),
          status: { id: 16, title: 'رد شده' },
        },
        {
          id: 504,
          path: placeholderImage,
          type: 'treatment-plan.consent',
          createdAt: daysAgo(5, 16, 30),
          status: { id: 15, title: 'تایید شده' },
        },
      ],
    },
  }
}

const BASE_OPG_REQUESTS = [
  {
    id: 9012,
    registrationDate: daysAgo(20, 10, 0),
    expireDate: daysAgo(-10, 23, 59),
    trackingCode: 'OPG-8F3K2Q',
    doctorName: 'دکتر مریم احمدی',
    services: JSON.stringify([
      { detail_id: 1, service_name: 'عکس OPG کامل فک' },
      { detail_id: 2, service_name: 'بررسی سینوس' },
    ]),
  },
  {
    id: 8741,
    registrationDate: daysAgo(75, 12, 30),
    expireDate: daysAgo(45, 23, 59),
    trackingCode: 'OPG-2M9X7D',
    doctorName: 'دکتر علی رضایی',
    services: JSON.stringify([{ detail_id: 3, service_name: 'عکس OPG کنترل پس از درمان' }]),
  },
  {
    id: 8302,
    registrationDate: daysAgo(140, 15, 15),
    expireDate: daysAgo(110, 23, 59),
    trackingCode: 'OPG-5T1N4B',
    doctorName: 'دکتر مریم احمدی',
    services: JSON.stringify([
      { detail_id: 4, service_name: 'عکس OPG اولیه' },
      { detail_id: 5, service_name: 'ارزیابی دندان عقل' },
    ]),
  },
]

export const mockGetOpgRequests = async (userId) => {
  await mockDelay(450)
  // merge prescriptions submitted through the UserPrescription dialog (imaging
  // + drug kinds) for THIS user so newly registered requests show up on the
  // OPG timeline without leaking other patients' prescriptions
  const submitted = coll('prescriptions')
    .filter((p) => !userId || String(p.user_id) === String(userId))
    .map((p) => ({
      id: p.id,
      registrationDate: p.registrationDate,
      expireDate: p.expireDate,
      trackingCode: p.trackingCode,
      doctorName: p.doctorName,
      services: p.services,
    }))
  return {
    data: [...submitted, ...BASE_OPG_REQUESTS],
  }
}
