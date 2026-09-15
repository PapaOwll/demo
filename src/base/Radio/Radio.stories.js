import Radio from './index'
import { ref } from 'vue'
import { QUASAR_COLORS } from '@/constants/colors'

export default {
  title: 'Base/Radio',
  component: Radio,
  argTypes: {
    modelValue: { control: 'text' },
    defaultValue: { control: 'text' },
    val: { control: 'text' },
    size: { control: 'select', options: ['sm', 'md'] },
    color: { control: 'select', options: QUASAR_COLORS },
    disable: { control: 'boolean' },
    flip: { control: 'boolean' },
    'update:modelValue': { action: 'update:modelValue' },
  },
  args: {
    size: 'md',
    color: 'blue',
    disable: false,
    flip: false,
    label: 'Radio Label',
    val: 'option1',
  },
}

export const Controlled = () => ({
  components: { Radio },
  setup() {
    const pick = ref('1')
    return { pick }
  },
  template: `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="font-size: 12px; color: #888; margin-bottom: 8px;"> Value(v-model): {{ pick }}</div>
      <Radio v-model="pick" label="Option 1" val="1" />
      <Radio v-model="pick" label="Option 2" val="2" />
      <Radio v-model="pick" label="Option 3" val="3" />
    </div>
  `,
})
export const Small = () => ({
  components: { Radio },
  setup() {
    const pick = ref('a')
    return { pick }
  },
  template: `
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <Radio v-model="pick" size="sm" label="کوچک ۱" val="a" />
      <Radio v-model="pick" size="sm" label="کوچک ۲" val="b" />
    </div>
  `,
})

export const WithDescription = () => ({
  components: { Radio },
  setup() {
    const pick = ref('a')
    return { pick }
  },
  template: `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <Radio v-model="pick" label="گزینه اول" description="توضیحات گزینه اول" val="a" />
      <Radio v-model="pick" label="گزینه دوم" description="توضیحات گزینه دوم" val="b" />
    </div>
  `,
})

export const Flip = () => ({
  components: { Radio },
  setup() {
    const pick = ref('a')
    return { pick }
  },
  template: `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <Radio v-model="pick" flip label="ایندیکاتور سمت چپ" val="a" />
      <Radio v-model="pick" flip label="ایندیکاتور سمت چپ" val="b" />
    </div>
  `,
})

export const ColorVariants = () => ({
  components: { Radio },
  setup() {
    const pick = ref('blue')
    return { pick }
  },
  template: `
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <Radio v-model="pick" label="Blue" val="blue" color="blue" />
      <Radio v-model="pick" label="Orange" val="orange" color="orange" />
    </div>
  `,
})

export const WithBadge = () => ({
  components: { Radio },
  setup() {
    const pick = ref('1')
    return { pick }
  },
  template: `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="font-size: 12px; color: #888; margin-bottom: 8px;">Selected: {{ pick }}</div>
      <Radio v-model="pick" label="Badge 1" val="1" />
      <Radio v-model="pick" label="Badge 2 (Disabled)" val="2" disable />
      <Radio v-model="pick" label="Badge 3" val="3" />
    </div>
  `,
})
