const tableColumns = [
  {
    name: 'id',
    required: true,
    label: '#',
    align: 'left',
    field: 'id',
  },
  {
    name: 'surveyId',
    label: 'کد نظر سنجی',
    align: 'left',
    field: 'surveyId',
    sortable: false,
  },
  {
    name: 'title',
    label: 'عنوان',
    align: 'left',
    field: 'title',
  },
  {
    name: 'status',
    label: 'وضعیت',
    align: 'left',
    field: 'status',
    sortable: false,
  },
  {
    name: 'createdDate',
    label: 'تاریخ ثبت',
    align: 'left',
    field: 'createdDate',
  },
  {
    name: 'responses',
    label: 'پاسخ ها',
    align: 'left',
    field: 'responses',
    sortable: false,
  },
  {
    name: 'viewCount',
    label: 'بازدید',
    align: 'left',
    field: 'viewCount',
    sortable: false,
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
    title: 'عنوان',
  },
  {
    name: 'isActive',
    type: 'select',
    title: 'وضعیت',
    options: [
      {
        label: 'فعال',
        value: '1',
      },
      {
        label: 'غیرفعال',
        value: '0',
      },
    ],
  },
]

export { tableFilters, tableColumns }
