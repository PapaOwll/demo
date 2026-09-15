import CampaignSelect from '@/components/Form/CampaignSelect'

const tableColumns = [
  {
    name: 'id',
    required: true,
    label: '#',
    align: 'left',
    field: 'id',
  },
  {
    name: 'campaign',
    label: 'کمپین',
    align: 'left',
    field: 'campaign',
    sortable: false,
  },
  {
    name: 'createdAt',
    label: 'تاریخ ثبت',
    align: 'left',
    field: 'createdAt',
  },
  {
    name: 'allNumbers',
    label: 'کل شماره ها',
    align: 'left',
    field: 'allNumbers',
    sortable: false,
  },
  {
    name: 'incorrectNumbers',
    label: 'اشتباه',
    align: 'left',
    field: 'incorrectNumbers',
    sortable: false,
  },
  {
    name: 'importedNumbers',
    label: 'ثبت شده',
    align: 'left',
    field: 'importedNumbers',
    sortable: false,
  },
  {
    name: 'user',
    label: 'ثبت کننده',
    align: 'left',
    field: 'user',
    sortable: false,
  },
]

const tableFilters = [
  {
    name: 'campaignId',
    type: 'component',
    component: CampaignSelect,
    title: 'نام کمپین',
  },
]

export { tableFilters, tableColumns }
