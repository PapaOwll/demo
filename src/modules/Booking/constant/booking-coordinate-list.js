import { convertToJalaliWithTime } from '@/utils/date-utils'
import BranchSelect from '@/components/Form/BranchSelect'
import EnumSelect from '@/components/Form/EnumSelect'
import ServeSelect from '@/components/Form/ServeSelect'
import StatusSelect from '@/components/Form/StatusSelect'
import AdvisorSelect from '@/components/Form/AdvisorSelect'
import PersianDateRange from '@/components/Form/PersianDateRange'

export const tableColumns = [
  {
    name: 'name',
    label: 'نام - موبایل',
    field: 'name',
    sortable: true,
    align: 'center',
  },
  {
    name: 'status',
    label: '',
    field: 'activeTreatmentPlan',
    sortable: false,
    align: 'center',
  },
  {
    name: 'documentNumber',
    label: 'شماره پرونده',
    field: 'documentNumber',
    sortable: false,
    align: 'center',
  },
  {
    name: 'serves',
    label: 'خدمات',
    field: 'activeTreatmentPlanServes',
    sortable: false,
    align: 'center',
  },
  {
    name: 'bookingDate',
    label: 'تاریخ نوبت دهی',
    field: 'bookingDate',
    sortable: true,
    align: 'center',
  },
  {
    name: 'coordinator',
    label: 'کارشناس نوبت دهی',
    field: 'coordinator',
    sortable: false,
    align: 'center',
  },
  {
    name: 'confirmedDate',
    label: 'تاریخ تایید نهایی مالی',
    field: 'treatmentPlanFinancialConfirmationAt',
    sortable: true,
    align: 'center',
    format: (val) => (val ? convertToJalaliWithTime(val) : 'ثبت نشده'),
  },
  {
    name: 'actions',
    label: '',
    field: 'actions',
    sortable: false,
    align: 'center',
  },
]

export const tableFilters = [
  {
    name: 'name',
    type: 'text',
    title: 'نام و نام خانوادگی',
  },
  {
    name: 'mobile',
    type: 'text',
    title: 'موبایل',
  },
  {
    name: 'docNumber',
    type: 'number',
    title: 'شماره پرونده',
    icon: true,
  },
  {
    name: 'lastBookingDate',
    type: 'component',
    component: PersianDateRange,
    title: 'تاریخ نوبت دهی',
    fields: ['lastBookingDateFrom', 'lastBookingDateTo'],
  },
  {
    name: 'activeTreatmentPlanCreatedAt',
    type: 'component',
    component: PersianDateRange,
    title: 'تاریخ ثبت طرح درمان',
    fields: ['activeTreatmentPlanCreatedAtFrom', 'activeTreatmentPlanCreatedAtFo'],
  },
  {
    name: 'branch',
    type: 'component',
    component: BranchSelect,
    title: 'انتخاب شعبه',
  },
  {
    name: 'bookingNeeded',
    title: 'نیازمند نوبت دهی',
    type: 'select',
    options: [
      { label: 'می باشد', value: '1' },
      { label: 'نمی باشد', value: '0' },
    ],
  },
  {
    name: 'hasActiveTreatmentPlan',
    type: 'select',
    title: 'طرح درمان فعال',
    options: [
      { label: 'دارد', value: '1' },
      { label: 'ندارد', value: '0' },
    ],
  },
  {
    name: 'creditStatus',
    type: 'component',
    component: EnumSelect,
    title: 'وضعیت اعتبارسنجی',
    enumKey: 'CreditLevelStatusEnum',
    typeof: 'number',
  },
  {
    name: 'serves',
    type: 'component',
    component: ServeSelect,
    title: 'خدمات',
  },
  {
    name: 'hasConfirmedTreatmentPlanFinancial',
    title: 'مدارک مالی',
    type: 'select',
    options: [
      { label: 'دارد', value: '1' },
      { label: 'ندارد', value: '0' },
    ],
  },
  {
    name: 'prepayStatus',
    type: 'component',
    component: EnumSelect,
    title: 'وضعیت بیعانه',
    enumKey: 'BookingPayStatusEnum',
  },
  {
    name: 'userOwner',
    showUnknown: true,
    type: 'component',
    component: AdvisorSelect,
    userRole: ['coordinator'],
    title: 'کارشناس نوبت دهی',
  },
  {
    name: 'lastStatus',
    type: 'component',
    component: StatusSelect,
    title: 'وضعیت کاربر',
    multiple: true,
  },
]
