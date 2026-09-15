import EnumSelect from '@/components/Form/EnumSelect'
import AdvisorSelect from '@/components/Form/AdvisorSelect'
import StatusSelect from '@/components/Form/StatusSelect'
import PersianDateRange from '@/components/Form/PersianDateRange'
import TaskTypeSelect from '@/components/Form/TaskTypeSelect'
import TaskTimeRangeSelect from '@/components/Form/TaskTimeRangeSelect'
import BranchSelect from '@/components/Form/BranchSelect'

const tableColumns = [
  {
    name: 'id',
    label: '#',
    field: 'id',
    align: 'center',
  },
  {
    name: 'userFullName',
    label: 'نام - موبایل',
    field: 'user',
    sortable: true,
    align: 'right',
  },
  {
    name: 'statusTitle',
    label: 'وضعیت',
    field: 'statusTitle',
    sortable: false,
    align: 'center',
  },
  {
    name: 'dueDate',
    label: 'تاریخ سر رسید',
    field: 'dueDate',
    sortable: true,
    align: 'center',
  },
  {
    name: 'doneAt',
    label: 'تاریخ انجام',
    field: 'doneAt',
    sortable: true,
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
    name: 'assigneeName',
    label: 'مسئول',
    field: 'assigneeName',
    sortable: false,
    align: 'center',
  },
  {
    name: 'type',
    label: 'نوع پیگیری',
    field: 'type',
    sortable: false,
    align: 'center',
    style: 'width: 90px',
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
    name: 'status',
    title: 'وضعیت',
    type: 'component',
    component: EnumSelect,
    enumKey: 'TaskStatusEnum',
  },
  {
    name: 'userLastStatus',
    type: 'component',
    component: StatusSelect,
    title: 'وضعیت کاربر',
    multiple: true,
  },
  {
    name: 'priority',
    title: 'اولویت',
    type: 'component',
    component: EnumSelect,
    enumKey: 'TaskPriorityEnum',
  },
  {
    name: 'dueDate',
    title: 'تاریخ سررسید',
    type: 'component',
    component: PersianDateRange,
    fields: ['dueDateFrom', 'dueDateTo'],
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
    userRole: ['advisor', 'support', 'online_visit', 'advisor_and_online_visit'],
  },
  {
    name: 'assignTo',
    title: 'انتخاب مسئول',
    type: 'component',
    component: AdvisorSelect,
    userRole: ['advisor', 'support', 'online_visit', 'advisor_and_online_visit'],
  },
  {
    name: 'dueTimeRange',
    title: 'زمان',
    type: 'component',
    component: TaskTimeRangeSelect,
  },
  {
    name: 'typeId',
    title: 'نوع پیگیری',
    type: 'component',
    component: TaskTypeSelect,
  },
  {
    name: 'branchId',
    title: 'شعبه',
    type: 'component',
    component: BranchSelect,
  },
]

export { tableColumns, tableFilters }
