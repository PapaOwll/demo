import EnumSelect from '@/components/Form/EnumSelect'
import AdvisorSelect from '@/components/Form/AdvisorSelect'
import ServeSelect from '@/components/Form/ServeSelect'
import BranchSelect from '@/components/Form/BranchSelect'
import PersianDateRange from '@/components/Form/PersianDateRange'

const defaultOpt = {
  align: 'left',
}

const tableColumns = [
  {
    ...defaultOpt,
    name: 'id',
    label: '#',
    field: 'id',
  },
  {
    ...defaultOpt,
    name: 'name',
    label: 'نام - موبایل',
  },
  {
    ...defaultOpt,
    name: 'status',
    label: '',
  },
  {
    ...defaultOpt,
    name: 'serves',
    label: 'خدمات',
  },
  {
    ...defaultOpt,
    name: 'bookingAt',
    label: 'تاریخ ویزیت',
    sortable: true,
  },
  {
    ...defaultOpt,
    name: 'docNumber',
    label: 'شماره پرونده',
    field: 'docNumber',
  },
  {
    ...defaultOpt,
    label: 'مشاور',
    name: 'advisorName',
    field: 'advisorName',
  },
  {
    ...defaultOpt,
    label: 'مشاور نوبت',
    name: 'bookingAdvisor',
    field: 'bookingAdvisor',
  },
  {
    ...defaultOpt,
    label: 'ایجاد کننده',
    name: 'bookingCreator',
    field: 'bookingCreator',
    classes: 'visit-serves',
  },
  {
    ...defaultOpt,
    label: '',
    name: 'visitBtn',
  },
  {
    ...defaultOpt,
    label: '',
    name: 'actions',
  },
]

const tableFilters = [
  {
    name: 'userFullName',
    type: 'text',
    title: 'نام و نام خانوادگی',
  },
  {
    name: 'user.mobile',
    type: 'text',
    title: 'موبایل',
  },
  {
    name: 'docNumber',
    type: 'number',
    title: 'شماره پرونده',
  },
  {
    name: 'status',
    type: 'component',
    component: EnumSelect,
    enumKey: 'BookingStatusEnum',
    title: 'وضعیت',
    multiple: true,
  },
  {
    name: 'visitType',
    type: 'component',
    component: EnumSelect,
    title: 'نوع ویزیت',
    enumKey: 'BookingVisitTypeEnum',
  },
  {
    name: 'bookingAt',
    type: 'component',
    component: PersianDateRange,
    title: 'تاریخ ویزیت',
    fields: ['bookingAtAfter', 'bookingAtBefore'],
  },
  {
    name: 'user.advisor_id',
    type: 'component',
    component: AdvisorSelect,
    title: 'مشاور',
  },
  {
    name: 'visit.description',
    type: 'text',
    title: 'توضیحات ویزیت',
  },
  {
    name: 'hasVisit',
    type: 'select',
    title: 'ثبت مراجعه',
    remoteFilterAble: false,
    options: [
      {
        label: 'دارد',
        value: '1',
      },
      {
        label: 'ندارد',
        value: '0',
      },
    ],
  },
  {
    name: 'serves',
    type: 'component',
    component: ServeSelect,
    multiple: true,
    title: 'انتخاب خدمات',
  },
  {
    name: 'payStatus',
    type: 'component',
    component: EnumSelect,
    title: 'وضعیت بیعانه',
    enumKey: 'BookingPayStatusEnum',
  },
  {
    name: 'hasTreatmentPlan',
    type: 'select',
    title: 'طرح درمان',
    options: [
      { label: 'دارد', value: '1' },
      { label: 'ندارد', value: '0' },
    ],
  },
  {
    name: 'branchId',
    type: 'component',
    component: BranchSelect,
    title: 'انتخاب شعبه',
  },
  {
    name: 'createdBy',
    type: 'component',
    component: AdvisorSelect,
    title: 'مشاور ایجاد کننده',
  },
  {
    name: 'cbctStatus',
    type: 'select',
    title: 'وضعیت CBCT',
    multiple: false,
    options: [
      {
        label: 'دارد',
        value: 'has',
      },
      {
        label: 'ندارد',
        value: 'hasnot',
      },
      {
        label: 'تایید شده',
        value: 'accepted',
      },
      {
        label: 'بدون تایید',
        value: 'notaccepted',
      },
    ],
  },

  {
    name: 'hasDocNumber',
    type: 'checkbox',
    title: 'بدون شماره پرونده',
  },
]

export { tableColumns, tableFilters }
