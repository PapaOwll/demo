import StatusSelect from '@/components/Form/StatusSelect'
import ServeSelect from '@/components/Form/ServeSelect'
import IntroductionMethodSelect from '@/components/Form/IntroductionMethodSelect'
import ProvinceSelect from '@/components/Form/ProvinceSelect'
import EnumSelect from '@/components/Form/EnumSelect'
import CampaignSelect from '@/components/Form/CampaignSelect'
import RoleSelect from '@/components/Form/RoleSelect'
import AdvisorSelect from '@/components/Form/AdvisorSelect'
import BranchSelect from '@/components/Form/BranchSelect'
import TagSelect from '@/components/Form/TagSelect'
import PersianDateRange from '@/components/Form/PersianDateRange'
import { useRoleManager } from '@/composables/use-role-manager'

const defaultOpt = {
  align: 'left',
}

/**
 * Get table columns with user role-based visibility
 * @returns {Array} Table columns configuration
 */
export function getTableColumns() {
  const { hasRole } = useRoleManager()

  return [
    {
      ...defaultOpt,
      name: 'name',
      label: 'نام - موبایل',
    },
    {
      ...defaultOpt,
      name: 'lastStatus',
      label: 'وضعیت',
      field: 'lastStatus',
    },
    {
      ...defaultOpt,
      name: 'documentNumber',
      label: 'شماره پرونده',
      field: 'documentNumber',
    },
    {
      ...defaultOpt,
      name: 'advisor',
      label: 'مشاور',
      field: (row) => `${row?.advisor?.name || ''}`,
    },
    {
      ...defaultOpt,
      name: 'lastContactAt',
      label: 'آخرین تماس',
      field: (row) => row?.lastContact?.lastContactAt || '',
      sortable: true,
    },
    {
      ...defaultOpt,
      label: 'تاریخ ثبت',
      name: 'createdAt',
      field: 'creationDate',
      sortable: true,
    },
    {
      ...defaultOpt,
      label: '',
      name: 'userStats',
    },
    {
      ...defaultOpt,
      label: 'شیوه آشنایی ',
      name: 'introductionMethod',
      classes: hasRole('advisor') ? 'hidden' : '',
      headerClasses: hasRole('advisor') ? 'hidden' : '',
    },
  ]
}

const createTableFilters = () => [
  {
    name: 'name',
    type: 'text',
    title: 'نام و نام خانوادگی',
    icon: true,
    multiple: false,
  },
  {
    name: 'mobile',
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
    name: 'createdAt',
    type: 'component',
    component: PersianDateRange,
    title: 'تاریخ ثبت نام',
    fields: ['createdAtFrom', 'createdAtTo'],
  },
  {
    name: 'lastUpdate',
    type: 'component',
    component: PersianDateRange,
    title: 'تاریخ وضعیت',
    fields: ['lastUpdateFrom', 'lastUpdateTo'],
  },
  {
    name: 'lastStatus',
    type: 'component',
    component: StatusSelect,
    title: 'وضعیت کاربر',
    multiple: true,
  },
  {
    name: 'userTags',
    type: 'component',
    component: TagSelect,
    title: 'برچسب ها',
    multiple: true,
  },
  {
    name: 'gender',
    type: 'select',
    title: 'جنسیت',
    options: [
      {
        label: 'آقا',
        value: 'male',
      },
      {
        label: 'خانم',
        value: 'female',
      },
      {
        label: 'نامشخص',
        value: 'unknown',
      },
    ],
  },
  {
    name: 'serves',
    type: 'component',
    component: ServeSelect,
    title: 'خدمات',
    multiple: true,
  },
  {
    name: 'introductionMethod',
    type: 'component',
    component: IntroductionMethodSelect,
    title: 'شیوه آشنایی',
    multiple: true,
  },
  {
    name: 'provinces',
    type: 'component',
    component: ProvinceSelect,
    title: 'استان',
    multiple: true,
  },
  {
    name: 'nationalCode',
    type: 'number',
    title: 'کد ملی',
    icon: true,
  },
  {
    name: 'branchId',
    type: 'component',
    component: BranchSelect,
    title: 'شعبه',
  },
  {
    name: 'hasTreatmentPlan',
    type: 'select',
    title: 'طرح درمان',
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
    name: 'receptionStatus',
    type: 'select',
    title: 'وضعیت پذیرش',
    options: [
      {
        label: 'نوبت دارد',
        value: 'has_booking',
      },
      {
        label: 'ویزیت دارد',
        value: 'has_visit',
      },
      {
        label: 'بیعانه دارد',
        value: 'has_prepay',
      },
      {
        label: 'عودت داده شد',
        value: 'has_extradition',
      },
      { label: 'نوبت دارد-ویزیت ندارد', value: 'has_booking_without_visit' },
    ],
  },
  {
    name: 'taskStatus',
    type: 'select',
    multiple: true,
    title: 'وظیفه',
    options: [
      {
        label: 'دارای وظیفه فعال',
        value: 'having_active_task',
      },
      {
        label: 'بدون وظیفه',
        value: 'without_task',
      },
      {
        label: 'بدون وظیفه فعال',
        value: 'without_active_task',
      },
    ],
  },
  {
    name: 'hasContact',
    type: 'select',
    multiple: false,
    title: 'تماس',
    options: [
      {
        label: 'دارد',
        value: 1,
      },
      {
        label: 'ندارد',
        value: 0,
      },
    ],
  },
  {
    title: 'وضعیت بیعانه',
    name: 'prepayStatus',
    type: 'component',
    component: EnumSelect,
    enumKey: 'BookingPayStatusEnum',
  },
  {
    name: 'campaignId',
    type: 'component',
    component: CampaignSelect,
    title: 'کمپین',
    multiple: true,
  },
  {
    name: 'description',
    type: 'text',
    title: 'توضیحات',
    icon: true,
  },
  {
    name: 'rolesFilter',
    type: 'component',
    component: RoleSelect,
    title: 'نقش',
  },
  {
    name: 'advisor',
    type: 'component',
    component: AdvisorSelect,
    title: 'مشاور',
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
    name: 'betaUserBranch',
    type: 'select',
    title: 'بتا',
    options: [
      {
        label: 'بتا فرانچایز',
        value: 'other',
      },
      {
        label: 'بتا تهران',
        value: 'tehran',
      },
      {
        label: 'همه شعب',
        value: 'all',
      },
    ],
  },
  {
    name: 'incompleteForm',
    type: 'checkbox',
    title: 'نقص در پرونده',
  },

  {
    name: 'followUpNeeded',
    type: 'checkbox',
    title: 'نیاز به پیگیری',
  },
]

export { createTableFilters }
