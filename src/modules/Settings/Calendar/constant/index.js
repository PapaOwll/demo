import PersianDateRange from '@/components/Form/PersianDateRange'

const tableColumns = [
  {
    name: 'date',
    required: true,
    label: 'تاریخ',
    align: 'left',
    field: 'date',
  },
  {
    name: 'start',
    label: 'شروع',
    align: 'left',
    field: 'start',
    sortable: false,
  },
  {
    name: 'end',
    label: 'پایان',
    align: 'left',
    field: 'end',
    sortable: false,
  },
  {
    name: 'holiday',
    label: 'وضعیت روز',
    align: 'left',
    field: 'holiday',
    sortable: false,
  },
]

const tableFilters = [
  {
    name: 'date',
    type: 'component',
    component: PersianDateRange,
    title: 'بازه تاریخ',
    fields: ['fromDate', 'toDate'],
  },
]
export { tableFilters, tableColumns }
