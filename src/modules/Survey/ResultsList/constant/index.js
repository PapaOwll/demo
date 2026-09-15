import AdvisorSelect from '@/components/Form/AdvisorSelect'
import SurveySelect from '@/components/Form/SurveySelect'

const tableColumns = [
  {
    name: 'id',
    required: true,
    label: '#',
    align: 'left',
    field: 'id',
  },
  {
    name: 'user',
    label: 'کاربر',
    align: 'left',
    field: 'user',
    sortable: false,
  },
  {
    name: 'advisor',
    label: 'مشاور',
    align: 'left',
    field: 'advisor',
    sortable: false,
  },
  {
    name: 'question',
    label: 'سوال',
    align: 'left',
    field: 'question',
    sortable: false,
  },
  {
    name: 'response',
    label: 'پاسخ',
    align: 'left',
    field: 'response',
    sortable: false,
  },
]

const createTableFilters = () => [
  {
    name: 'userFullName',
    type: 'text',
    title: 'انتخاب کاربر',
  },
  {
    name: 'advisorId',
    type: 'component',
    component: AdvisorSelect,
    title: 'انتخاب مشاور',
    showUnknown: false,
    userRole: ['advisor', 'admin'],
  },
  {
    name: 'surveyId',
    type: 'component',
    component: SurveySelect,
    title: 'انتخاب نظرسنجی',
  },
]

export { tableColumns, createTableFilters }
