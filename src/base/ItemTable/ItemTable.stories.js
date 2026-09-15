import ItemTable from './index'
import { IconUser, IconStethoscope } from '@tabler/icons-vue'

const typeOptions = ['header', 'cell']
const variantOptions = ['text', 'swap']

export default {
  title: 'Base/ItemTable',
  component: ItemTable,
  argTypes: {
    type: { control: 'select', options: typeOptions },
    variant: { control: 'select', options: variantOptions },
    title: { control: 'text' },
    description: { control: 'text' },
    icon: {
      control: 'select',
      options: ['none', 'IconUser', 'IconStethoscope'],
      mapping: { none: undefined, IconUser, IconStethoscope },
    },
    sortable: { control: 'boolean' },
    active: { control: 'boolean' },
  },
  args: {
    type: 'cell',
    variant: 'text',
    title: 'عنوان سطر جدول',
    description: 'توضیحات سطر',
    icon: undefined,
    sortable: false,
    active: false,
  },
}

const Template = (args) => ({
  components: { ItemTable },
  setup() {
    return { args }
  },
  template: `
    <div style="width: 320px; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <ItemTable v-bind="args" />
    </div>
  `,
})

export const Cell = Template.bind({})
Cell.args = {
  type: 'cell',
  title: 'ایمپلنت',
  description: 'چارت دندان',
}

export const CellWithIcon = Template.bind({})
CellWithIcon.args = {
  type: 'cell',
  title: 'ایمپلنت',
  description: 'چارت دندان',
  icon: IconStethoscope,
}

export const CellActive = Template.bind({})
CellActive.args = {
  type: 'cell',
  title: 'ایمپلنت',
  description: 'چارت دندان',
  active: true,
}

export const Header = Template.bind({})
Header.args = {
  type: 'header',
  title: 'ستون عنوان',
  sortable: false,
}

export const HeaderSortable = Template.bind({})
HeaderSortable.args = {
  type: 'header',
  title: 'تاریخ / کد درمان',
  sortable: true,
}

export const Swap = Template.bind({})
Swap.args = {
  type: 'cell',
  variant: 'swap',
  title: undefined,
}

export const SwapWithLabel = Template.bind({})
SwapWithLabel.args = {
  type: 'cell',
  variant: 'swap',
  title: '۱۵۰,۰۰۰ تومان',
}

export const FullTable = () => ({
  components: { ItemTable },
  setup() {
    return { IconStethoscope }
  },
  template: `
    <div style="width: 480px; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="display: flex; background-color: #f5f5f5;">
        <div style="flex: 2;">
          <ItemTable type="header" title="تاریخ / کد درمان" :sortable="true" />
        </div>
        <div style="flex: 2;">
          <ItemTable type="header" title="وضعیت" />
        </div>
        <div style="flex: 2;">
          <ItemTable type="header" title="نوع / ناحیه خدمت" />
        </div>
        <div style="flex: 1;">
          <ItemTable type="header" variant="swap" />
        </div>
      </div>

      <div style="display: flex; background-color: #fff;">
        <div style="flex: 2;">
          <ItemTable type="cell" title="۱۳۷۹/۱۲/۳۱" description="۱۰۲۳۷۴۶" />
        </div>
        <div style="flex: 2;">
          <ItemTable type="cell" title="در انتظار" description="پرداخت نشده" />
        </div>
        <div style="flex: 2;">
          <ItemTable type="cell" title="ایمپلنت" description="چارت دندان" :icon="IconStethoscope" />
        </div>
        <div style="flex: 1;">
          <ItemTable type="cell" variant="swap" />
        </div>
      </div>

      <div style="display: flex; background-color: #fff;">
        <div style="flex: 2;">
          <ItemTable type="cell" title="۱۴۰۳/۰۱/۱۵" description="۱۰۲۳۷۴۷" :active="true" />
        </div>
        <div style="flex: 2;">
          <ItemTable type="cell" title="تکمیل شده" description="پرداخت شده" />
        </div>
        <div style="flex: 2;">
          <ItemTable type="cell" title="جراحی" description="فک بالا" :icon="IconStethoscope" />
        </div>
        <div style="flex: 1;">
          <ItemTable type="cell" variant="swap" />
        </div>
      </div>
    </div>
  `,
})

export const WithActionSlot = (args) => ({
  components: { ItemTable },
  setup() {
    return { args }
  },
  template: `
    <div style="width: 320px; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <ItemTable v-bind="args">
        <template #action>
          <span style="padding: 4px 12px; border-radius: 6px; background-color: rgba(0,85,255,0.1); color: #0055ff; font-size: 12px; cursor: pointer;">
            مشاهده
          </span>
        </template>
      </ItemTable>
    </div>
  `,
})
WithActionSlot.args = {
  type: 'cell',
  title: 'ایمپلنت',
  description: 'چارت دندان',
}
