const tableColumns = [
  {
    name: 'id',
    required: true,
    label: '#',
    align: 'left',
    field: 'id',
  },
  {
    name: 'title',
    label: 'نام کمپین',
    align: 'left',
    field: 'title',
  },
  {
    name: 'slug',
    label: 'شناسه',
    align: 'left',
    field: 'slug',
    sortable: false,
  },
  {
    name: 'description',
    label: 'توضیحات',
    align: 'left',
    field: 'description',
    sortable: false,
  },
  {
    name: 'startedAt',
    label: 'تاریخ شروع',
    align: 'left',
    field: 'startedAt',
    sortable: true,
  },
  {
    name: 'endedAt',
    label: 'تاریخ پایان',
    align: 'left',
    field: 'endedAt',
    sortable: true,
  },
  {
    name: 'actions',
    label: '',
    align: 'right',
    field: 'actions',
    sortable: false,
  },
]

const tableFilters = [
  {
    name: 'title',
    type: 'text',
    title: 'نام کمپین',
  },
  {
    name: 'slug',
    type: 'text',
    title: 'شناسه',
  },
]

export { tableColumns, tableFilters }
