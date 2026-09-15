export const tableColumns = [
  {
    name: 'name',
    label: 'نام تخفیف',
    align: 'left',
    field: 'name',
  },
  {
    name: 'branch',
    label: 'شعبه',
    align: 'left',
    field: (row) => row?.branch?.name || 'ثبت نشده',
    sortable: false,
  },
  {
    name: 'limit',
    label: 'تعداد استفاده',
    align: 'left',
    field: 'limit',
    sortable: false,
  },
  {
    name: 'expireDate',
    label: 'تاریخ انقضا',
    align: 'left',
    field: 'expiresAt',
  },
  {
    name: 'status',
    label: 'وضعیت',
    align: 'left',
    field: 'status',
  },
  {
    name: 'code',
    label: 'کد تخفیف',
    align: 'left',
    field: 'code',
  },
  {
    name: 'actions',
    label: '',
    align: 'right',
    sortable: false,
  },
]

export const tableFilters = [
  {
    name: 'name',
    type: 'text',
    title: 'جستجو در نام کد تخفیف',
  },
]
