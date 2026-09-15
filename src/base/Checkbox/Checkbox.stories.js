import { ref, computed } from 'vue'
import Checkbox from './index'

export default {
  title: 'base/Checkbox',
  component: Checkbox,
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['sm', 'md'],
    },
    modelValue: {
      control: { type: 'boolean' },
    },
    indeterminate: {
      control: { type: 'boolean' },
    },
    disabled: {
      control: { type: 'boolean' },
    },
    flip: {
      control: { type: 'boolean' },
    },
  },
}

const Template = (args) => ({
  components: { Checkbox },
  setup() {
    return { args }
  },
  template: '<Checkbox v-bind="args" v-model="args.modelValue" />',
})

export const Default = Template.bind({})
Default.args = {
  modelValue: false,
  label: 'عنوان',
  description: 'توضیحات مورد نیاز',
  size: 'md',
  disabled: false,
  flip: false,
  indeterminate: false,
}

export const Checked = Template.bind({})
Checked.args = {
  ...Default.args,
  modelValue: true,
}

export const Indeterminate = Template.bind({})
Indeterminate.args = {
  ...Default.args,
  modelValue: false,
  indeterminate: true,
}

export const Small = Template.bind({})
Small.args = {
  ...Default.args,
  size: 'sm',
}

export const Medium = Template.bind({})
Medium.args = {
  ...Default.args,
  size: 'md',
}

export const Flip = Template.bind({})
Flip.args = {
  ...Default.args,
  flip: true,
}

export const Disabled = Template.bind({})
Disabled.args = {
  ...Default.args,
  disabled: true,
  modelValue: true,
}

export const Sizes = () => ({
  components: { Checkbox },
  setup() {
    const sm = ref(false)
    const md = ref(true)
    return { sm, md }
  },
  template: `
    <div style="display:flex; flex-direction:column; gap:16px;">
      <Checkbox v-model="sm" size="sm" label="سایز sm (20px)" description="اندیکاتور کوچک" />
      <Checkbox v-model="md" size="md" label="سایز md (24px)" description="اندیکاتور پیش‌فرض" />
    </div>
  `,
})

export const States = () => ({
  components: { Checkbox },
  setup() {
    const unchecked = ref(false)
    const checked = ref(true)
    const indeterminate = ref(false)
    return { unchecked, checked, indeterminate }
  },
  template: `
    <div style="display:flex; flex-direction:column; gap:16px;">
      <Checkbox v-model="unchecked" label="خاموش (Default)" />
      <Checkbox v-model="checked" label="روشن (Checked)" />
      <Checkbox v-model="indeterminate" indeterminate label="ناکامل (Indeterminate)" />
    </div>
  `,
})

export const Group = () => ({
  components: { Checkbox },
  setup() {
    const items = ref([
      { label: 'طراحی', description: 'توضیحات مورد نیاز', checked: true },
      { label: 'توسعه', description: 'توضیحات مورد نیاز', checked: false },
      { label: 'بررسی', description: 'توضیحات مورد نیاز', checked: true },
      { label: 'انتشار', description: 'توضیحات مورد نیاز', checked: false },
    ])

    const allChecked = computed(() => items.value.every((i) => i.checked))
    const someChecked = computed(() => items.value.some((i) => i.checked) && !allChecked.value)
    const selectedLabels = computed(() =>
      items.value
        .filter((i) => i.checked)
        .map((i) => i.label)
        .join(', ')
    )

    const toggleAll = (val) => {
      items.value = items.value.map((item) => ({ ...item, checked: val }))
    }

    return { items, allChecked, someChecked, selectedLabels, toggleAll }
  },
  template: `
    <div style="font-size:13px; color:#666; width: 350px">
      انتخاب شده: {{ selectedLabels || 'None' }}
    </div>
    <div style="display:flex; flex-direction:column; gap:16px; max-width:320px; margin-top:12px;">
      <Checkbox
        label="انتخاب همه"
        :indeterminate="someChecked"
        :model-value="allChecked"
        @update:model-value="toggleAll"
      />
      <div style="display:flex; flex-direction:column; gap:10px; padding-right:16px;">
        <Checkbox
          v-for="(item, index) in items"
          :key="index"
          v-model="item.checked"
          :label="item.label"
          :description="item.description"
        />
      </div>
    </div>
  `,
})
