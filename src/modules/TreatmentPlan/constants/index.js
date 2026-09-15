import AdvisorSelect from '@/components/Form/AdvisorSelect'
import EnumSelect from '@/components/Form/EnumSelect'
import BranchSelect from '@/components/Form/BranchSelect'
import PersianDateRange from '@/components/Form/PersianDateRange'
import InstallmentSelect from '@/components/Form/InstallmentSelect'

const defaultOpt = {
  align: 'left',
}

const tableColumns = [
  {
    ...defaultOpt,
    name: 'userFullName',
    label: 'نام - موبایل',
    sortable: true,
  },
  {
    ...defaultOpt,
    name: 'status',
    label: 'وضعیت',
    field: 'status',
  },
  {
    ...defaultOpt,
    name: 'createdAt',
    label: 'تاریخ ثبت',
    field: 'createdAt',
    sortable: true,
  },
  {
    ...defaultOpt,
    name: 'description',
    label: 'توضیحات',
    field: 'description',
  },
  {
    ...defaultOpt,
    name: 'creator',
    label: 'ایجاد کننده',
    field: 'creator',
  },
  {
    ...defaultOpt,
    name: 'prepayment',
    label: 'پیش پرداخت',
    field: 'prepayment',
    sortable: true,
  },
  {
    ...defaultOpt,
    name: 'installmentCount',
    label: 'تعداد اقساط',
    field: 'installmentCount',
  },
  {
    ...defaultOpt,
    name: 'installmentPrice',
    label: 'مبلغ اقساط',
    field: 'installmentPrice',
    sortable: true,
  },
  {
    ...defaultOpt,
    name: 'totalCost',
    label: 'مبلغ کل',
    field: 'totalCost',
    sortable: true,
  },
  {
    ...defaultOpt,
    name: 'actions',
    label: '',
    field: 'actions',
  },
]

const tableFilters = [
  {
    name: 'userFullName',
    type: 'text',
    title: 'نام و نام خانوادگی',
    icon: true,
  },
  {
    name: 'userMobile',
    type: 'text',
    title: 'جستجو در موبایل',
    icon: true,
  },
  {
    name: 'docNumber',
    type: 'text',
    title: 'شماره پرونده',
    icon: true,
  },
  {
    name: 'createdAt',
    type: 'component',
    component: PersianDateRange,
    title: 'تاریخ ثبت',
    fields: ['createdAtFrom', 'createdAtTo'],
  },
  {
    name: 'userAdvisor',
    type: 'component',
    component: AdvisorSelect,
    title: 'انتخاب مشاور',
    userRole: ['super_admin', 'advisor', 'admin'],
  },
  {
    name: 'createdBy',
    type: 'component',
    component: AdvisorSelect,
    title: 'انتخاب ایجاد کننده',
    userRole: ['super_admin', 'admin', 'presenter', 'online_visit', 'advisor_and_online_visit'],
  },
  {
    name: 'status',
    type: 'component',
    component: EnumSelect,
    title: 'وضعیت طرح درمان',
    enumKey: 'TreatmentPlanStatusEnum',
  },
  {
    name: 'hasFinancialFile',
    type: 'select',
    title: 'اسناد مالی',
    options: [
      {
        label: 'دارای اسناد مالی',
        value: '1',
      },
      {
        label: 'بدون اسناد مالی',
        value: '0',
      },
    ],
  },
  {
    name: 'hasVoice',
    type: 'select',
    title: 'فایل صوتی',
    options: [
      {
        label: 'دارای فایل صوتی',
        value: '1',
      },
      {
        label: 'بدون فایل صوتی',
        value: '0',
      },
    ],
  },
  {
    name: 'firstPrepay',
    type: 'component',
    component: PersianDateRange,
    title: 'تاریخ بیعانه اولیه',
    dateFormat: 'YYYY-MM-DD',
    fields: ['firstPrepayFrom', 'firstPrepayTo'],
  },
  {
    name: 'hasCredit',
    type: 'select',
    title: 'اعتبارسنجی',
    options: [
      {
        label: 'دارای اعتبارسنجی',
        value: '1',
      },
      {
        label: 'بدون اعتبارسنجی',
        value: '0',
      },
    ],
  },
  {
    name: 'creditStatus',
    type: 'component',
    component: EnumSelect,
    title: 'وضعیت اعتبارسنجی',
    enumKey: 'CreditLevelStatusEnum',
    typeof: 'number',
  },
  {
    name: 'prepayStatus',
    type: 'component',
    component: EnumSelect,
    title: 'وضعیت بیعانه',
    enumKey: 'BookingPayStatusEnum',
  },
  {
    name: 'branchId',
    type: 'component',
    component: BranchSelect,
    title: 'انتخاب شعبه',
  },
  {
    name: 'userVipType',
    type: 'component',
    component: EnumSelect,
    title: 'نوع کاربر',
    enumKey: 'UserVipTypeEnum',
  },
  {
    name: 'installments',
    type: 'component',
    component: InstallmentSelect,
    title: 'شیوه پرداخت',
    multiple: true,
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
]

const reviewTableFilters = [
  {
    name: 'id',
    type: 'text',
    title: 'جستجوی شناسه',
  },
  {
    name: 'statusId',
    type: 'component',
    component: EnumSelect,
    slug: 'doctor-review-status',
    title: 'وضعیت',
  },
  {
    name: 'createdAtTo',
    title: 'تاریخ ثبت نظر',
    type: 'date',
    dateFormat: 'YYYY-MM-DD 23:59:59',
  },
]

const reviewTableColumns = [
  {
    align: 'center',
    name: 'row',
    label: '#',
    sortable: false,
  },
  {
    ...defaultOpt,
    name: 'id',
    label: 'شناسه',
    field: 'id',
    classes: 'auto-width , text-grey-7',
  },
  {
    ...defaultOpt,
    name: 'doctorName',
    label: 'نام پزشک',
    classes: 'auto-width , text-grey-7',
    field: (row) => row?.doctor?.name,
  },
  {
    ...defaultOpt,
    name: 'createdAt',
    label: 'تاریخ ثبت نظر',
  },
  {
    ...defaultOpt,
    name: 'status',
    label: 'وضعیت',
  },
  {
    ...defaultOpt,
    name: 'review',
    label: '',
  },
  {
    name: 'actions',
    field: 'actions',
    label: '',
    sortable: false,
  },
]

export { tableColumns, tableFilters, reviewTableFilters, reviewTableColumns }
