import AdvisorSelect from '@/components/Form/AdvisorSelect'
import PersianDateRange from '@/components/Form/PersianDateRange'

const tableColumns = [
  {
    name: 'userFullName',
    label: 'نام - موبایل',
    field: 'user',
    sortable: false,
    align: 'left',
    style: 'width: 180px',
  },

  {
    name: 'day',
    label: 'تاریخ',
    field: 'checkedInAt',
    sortable: true,
    align: 'center',
    style: 'width: 150px',
  },
  {
    name: 'room',
    label: 'اتاق',
    field: 'room',
    sortable: false,
    align: 'left',
    style: 'width: 200px',
  },
  {
    name: 'checkedInAt',
    label: 'ورود',
    field: 'checkedInAt',
    sortable: false,
    align: 'center',
    style: 'width: 150px',
  },
  {
    name: 'checkedOutAt',
    label: 'خروج',
    field: 'checkedOutAt',
    sortable: false,
    align: 'center',
    style: 'width: 150px',
  },
  {
    name: 'adminName',
    label: 'ثبت کننده',
    field: 'admin',
    sortable: false,
    align: 'left',
    style: 'width: 150px',
  },

  {
    name: 'empty',
    label: ' ',
    field: 'actions',
    sortable: false,
    align: 'center',
    style: 'width: 250px',
  },
  {
    name: 'checkoutAction',
    label: 'عملیات خروج',
    field: 'checkoutAction',
    sortable: false,
    align: 'center',
    style: 'width: 150px',
  },
  {
    name: 'actions',
    label: '',
    field: 'actions',
    sortable: false,
    align: 'center',
    style: 'width: 80px',
  },
]

const tableFilters = [
  {
    name: 'userFullName',
    title: 'نام و نام خانوادگی',
    type: 'text',
  },
  {
    name: 'mobile',
    title: 'موبایل',
    type: 'text',
  },
  {
    name: 'checkedIn',
    title: 'تاریخ ورود',
    type: 'component',
    component: PersianDateRange,
    fields: ['checkedInFrom', 'checkedInTo'],
  },
  {
    name: 'advisor',
    title: 'انتخاب ثبت کننده',
    type: 'component',
    component: AdvisorSelect,
    userRole: ['advisor', 'support', 'online_visit', 'advisor_and_online_visit'],
  },
]

export { tableColumns, tableFilters }
