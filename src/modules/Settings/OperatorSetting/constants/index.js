const phoneTabsColumns = [
  {
    name: 'id',
    label: '#',
    field: 'id',
    align: 'left',
    style: 'width: 50px',
  },
  {
    name: 'user',
    label: 'مشاور',
    field: 'user',
    align: 'left',
  },
  {
    name: 'number',
    label: 'شماره داخلی',
    field: 'number',
    align: 'left',
  },
  {
    name: 'actions',
    label: '',
    field: 'actions',
    align: 'right',
    sortable: false,
  },
]

const phoneTabsFilters = [
  {
    name: 'userFullName',
    type: 'text',
    title: 'جستجو در نام',
    icon: true,
  },
]

export { phoneTabsFilters, phoneTabsColumns }
