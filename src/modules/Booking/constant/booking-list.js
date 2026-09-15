import EnumSelect from '@/components/Form/EnumSelect'
import ServeSelect from '@/components/Form/ServeSelect'
import StatusSelect from '@/components/Form/StatusSelect'
import BranchSelect from '@/components/Form/BranchSelect'
import AdvisorSelect from '@/components/Form/AdvisorSelect'
import PersianDateRange from '@/components/Form/PersianDateRange'
import { useRoleManager } from '@/composables/use-role-manager'

function getTableColumns() {
  const { hasRole } = useRoleManager()
  const isDoctor = hasRole('doctor')
  const staffOnlyColumns = new Set([
    'status',
    'coordinator',
    'TpDetailsStatus',
    'doctor',
    'assistant',
    'visitBtn',
  ])
  const doctorOnlyColumns = new Set(['TpDetails'])

  return [
    {
      name: 'id',
      field: 'id',
    },
    {
      name: 'userFullName',
      label: 'نام - موبایل',
      sortable: true,
      align: 'left',
      classes: 'fixed-column--user',
      headerClasses: 'fixed-header--user',
    },
    {
      name: 'status',
      label: '',
      field: 'status',
      sortable: false,
      align: 'left',
    },
    {
      name: 'docNumber',
      label: 'شماره پرونده',
      field: 'docNumber',
      sortable: false,
      align: 'left',
    },
    {
      name: 'serves',
      label: 'خدمات',
      field: 'serves',
      sortable: false,
      align: 'left',
    },
    {
      name: 'bookingAt',
      label: 'تاریخ نوبت',
      field: 'bookingAt',
      sortable: true,
      align: 'left',
    },
    {
      name: 'bookingStatus',
      label: 'وضعیت نوبت',
      field: 'bookingStatus',
      sortable: false,
      align: 'left',
    },
    {
      name: 'coordinator',
      label: 'مشاور نوبت دهی',
      field: 'coordinator',
      sortable: false,
      align: 'left',
    },
    {
      name: 'TpDetailsStatus',
      label: 'وضعیت شرح درمان',
      field: (row) => row?.tpStatus?.title,
      sortable: false,
      align: 'left',
    },
    {
      name: 'doctor',
      label: 'پزشک',
      field: (row) => `${row?.assignTo?.firstName || ''} ${row?.assignTo?.name || ''} `,
      sortable: false,
      align: 'left',
    },
    {
      name: 'assistant',
      label: 'دستیار پزشک',
      field: (row) => `${row?.assistant?.firstName || ''} ${row?.assistant?.name || ''} `,
      sortable: false,
      align: 'left',
    },
    {
      name: 'visitBtn',
      label: '',
      field: 'visitBtn',
      sortable: false,
      align: 'right',
    },
    {
      name: 'TpDetails',
      label: '',
      field: 'TpDetails',
      sortable: false,
      align: 'right',
    },
    {
      name: 'actions',
      label: '',
      field: 'actions',
      sortable: false,
      align: 'right',
      classes: 'fixed-column--tp',
      headerClasses: 'fixed-header--actions',
    },
  ].filter((col) => {
    if (staffOnlyColumns.has(col.name)) return !isDoctor
    if (doctorOnlyColumns.has(col.name)) return isDoctor
    return true
  })
}

const tableFilters = [
  {
    name: 'userFullName',
    type: 'text',
    title: 'نام و نام خانوادگی',
    icon: true,
  },
  {
    name: 'user.mobile',
    type: 'text',
    title: 'موبایل',
    icon: true,
  },
  {
    name: 'docNumber',
    type: 'number',
    title: 'شماره پرونده',
    icon: true,
  },
  {
    name: 'status',
    type: 'component',
    component: EnumSelect,
    title: 'وضعیت',
    enumKey: 'BookingStatusEnum',
  },
  {
    name: 'userLastStatus',
    type: 'component',
    component: StatusSelect,
    title: 'وضعیت کاربر',
    multiple: true,
  },
  {
    name: 'bookingAt',
    type: 'component',
    component: PersianDateRange,
    title: 'تاریخ نوبت',
    fields: ['bookingAtAfter', 'bookingAtBefore'],
  },
  {
    name: 'performedAt',
    type: 'component',
    component: PersianDateRange,
    title: 'تاریخ انجام کار (شرح درمان)',
    fields: ['performedAtAfter', 'performedAtBefore'],
    format: true,
  },
  {
    title: 'مشاور نوبت دهی',
    name: 'userOwner',
    type: 'component',
    component: AdvisorSelect,
    userRole: ['coordinator'],
  },
  {
    title: 'دکتر',
    name: 'assignTo',
    type: 'component',
    component: AdvisorSelect,
    userRole: ['doctor'],
  },
  {
    name: 'visit.description',
    type: 'textField',
    title: 'توضیحات مراجعه',
  },
  {
    name: 'hasVisit',
    type: 'select',
    title: 'مراجعه',
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
    title: 'انتخاب خدمات',
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
    value: 0,
  },
]

export { getTableColumns, tableFilters }
