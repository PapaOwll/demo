import Typography from './index'
import { QUASAR_COLORS } from '@/constants/colors'

const variantOptions = ['heading', 'body', 'caption']
const sizeOptions = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', '1', '2', '3', '4']
const weightOptions = ['bold', 'semibold', 'medium', 'regular']

export default {
  title: 'Base/Typography',
  component: Typography,
  argTypes: {
    variant: { control: 'select', options: variantOptions },
    size: { control: 'select', options: sizeOptions },
    weight: { control: 'select', options: weightOptions },
    color: { control: 'select', options: QUASAR_COLORS },
    tag: { control: 'text' },
  },
  args: {
    variant: 'body',
    size: '3',
    weight: 'regular',
    color: 'dark',
  },
}

const Template = (args) => ({
  components: { Typography },
  setup() {
    return { args }
  },
  template: '<Typography v-bind="args">متن نمونه تایپوگرافی</Typography>',
})

export const Body = Template.bind({})
Body.args = {
  variant: 'body',
  size: '3',
  weight: 'regular',
}

export const Heading = Template.bind({})
Heading.args = {
  variant: 'heading',
  size: 'h2',
  weight: 'bold',
}

export const Caption = Template.bind({})
Caption.args = {
  variant: 'caption',
  weight: 'medium',
}

export const Sizes = (args) => ({
  components: { Typography },
  setup() {
    return { args }
  },
  template: `
    <div style="display: flex; flex-direction: column; gap: 8px; width: 320px;">
      <Typography variant="heading" size="h1">Heading h1</Typography>
      <Typography variant="heading" size="h2">Heading h2</Typography>
      <Typography variant="heading" size="h3">Heading h3</Typography>
      <Typography variant="heading" size="h4">Heading h4</Typography>
      <Typography variant="heading" size="h5">Heading h5</Typography>
      <Typography variant="heading" size="h6">Heading h6</Typography>
      <Typography variant="body" size="1">متن بدنه 1</Typography>
      <Typography variant="body" size="2">متن بدنه 2</Typography>
      <Typography variant="body" size="3">متن بدنه 3</Typography>
      <Typography variant="body" size="4">متن بدنه 4</Typography>
      <Typography variant="caption">توضیحات کوچک</Typography>
    </div>
  `,
})
Sizes.args = {}

export const Colors = () => ({
  components: { Typography },
  setup() {
    return { palette: QUASAR_COLORS }
  },
  template: `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 8px;">
      <Typography
        v-for="color in palette"
        :key="color"
        variant="body"
        size="3"
        :color="color"
        weight="medium"
      >
        {{ color }}
      </Typography>
    </div>
  `,
})
