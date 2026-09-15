import EnumSelect from '@/components/Form/EnumSelect'
import BranchSelect from '@/components/Form/BranchSelect'
import AdvisorSelect from '@/components/Form/AdvisorSelect'
import PersianDateRange from '@/components/Form/PersianDateRange'

const tableColumns = [
  {
    name: 'id',
    label: '#',
    field: 'id',
    align: 'left',
  },
  {
    name: 'userFullName',
    label: 'نام - موبایل',
    field: 'user',
    sortable: true,
    align: 'left',
  },
  {
    name: 'contactedAt',
    label: 'تاریخ تماس',
    field: 'contactedAt',
    sortable: true,
    align: 'center',
  },
  {
    name: 'result',
    label: 'نتیجه',
    field: 'result',
    sortable: true,
    align: 'center',
  },
  {
    name: 'callDuration',
    label: 'مدت تماس',
    field: 'callDuration',
    sortable: false,
    align: 'center',
    style: 'width: 60px',
  },
  {
    name: 'description',
    label: 'توضیحات',
    field: 'description',
    sortable: false,
    align: 'center',
    style: 'width: 100px',
  },
  {
    name: 'advisorName',
    label: 'مشاور',
    field: 'advisorName',
    sortable: false,
    align: 'center',
  },
  {
    name: 'createdBy',
    label: 'ایجاد کننده',
    field: 'createdBy',
    sortable: false,
    align: 'center',
  },
  {
    name: 'actions',
    label: '',
    field: 'actions',
    sortable: false,
    align: 'center',
    style: 'width: 150px',
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
    name: 'description',
    title: 'توضیحات',
    type: 'text',
  },
  {
    name: 'contactedAt',
    title: 'تاریخ تماس',
    type: 'component',
    component: PersianDateRange,
    fields: ['contactedAtFrom', 'contactedAtTo'],
  },
  {
    name: 'resultId',
    title: 'وضعیت تماس',
    type: 'component',
    component: EnumSelect,
    enumKey: 'ContactResultEnum',
  },
  {
    name: 'type',
    title: 'نوع تماس',
    type: 'component',
    component: EnumSelect,
    enumKey: 'ContactTypeEnum',
  },
  {
    name: 'branchId',
    title: 'انتخاب شعبه',
    type: 'component',
    component: BranchSelect,
  },
  {
    name: 'advisor',
    title: 'انتخاب مشاور',
    type: 'component',
    component: AdvisorSelect,
    userRole: ['advisor', 'advisor_and_online_visit'],
  },
  {
    name: 'createdBy',
    title: 'انتخاب ایجاد کننده',
    type: 'component',
    component: AdvisorSelect,
    userRole: ['advisor', 'support', 'online_visit', 'coordinator', 'advisor_and_online_visit'],
  },
  {
    name: 'hasVoice',
    title: 'فایل صوتی تماس',
    type: 'select',
    options: [
      { label: 'دارد', value: '1' },
      { label: 'ندارد', value: '0' },
    ],
  },
]
export { tableColumns, tableFilters }
