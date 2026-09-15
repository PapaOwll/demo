import TextField from './index'
import { IconUser, IconMail, IconLock, IconPhone } from '@tabler/icons-vue'

const sizeOptions = ['sm', 'md', 'lg']
const variantOptions = ['filled', 'outline']
const typeOptions = ['text', 'email', 'password', 'number', 'tel', 'url']

export default {
  title: 'Base/TextField',
  component: TextField,
  argTypes: {
    modelValue: { control: 'text', description: 'Input value (v-model)' },
    label: { control: 'text' },
    placeholder: { control: 'text' },
    type: { control: 'select', options: typeOptions },

    size: { control: 'select', options: sizeOptions },
    variant: { control: 'select', options: variantOptions },

    disable: { control: 'boolean', description: 'Equivalent to disabled' },
    readonly: { control: 'boolean', description: 'Equivalent to readonly' },
    clearable: { control: 'boolean' },
    loading: { control: 'boolean', description: 'Shows loading spinner' },

    required: { control: 'boolean' },
    hint: { control: 'text' },
    error: { control: 'text', description: 'Error state or message string' },
    maxlength: { control: 'number' },
    showCharacterCount: { control: 'boolean' },

    mask: { control: 'text', description: 'Input mask (e.g. ###-###-####)' },
    debounce: { control: 'number', description: 'Debounce in ms' },
  },
  args: {
    modelValue: '',
    label: 'عنوان',
    placeholder: 'متن پیش‌فرض',
    hint: 'متن کمکی',
    error: undefined,
    required: false,
    clearable: false,
    disable: false,
    readonly: false,
    loading: false,
    size: 'md',
    variant: 'filled',
    maxlength: undefined,
    showCharacterCount: false,
    type: 'text',
    mask: undefined,
  },
}

const Template = (args) => ({
  components: { TextField },
  setup() {
    return { args }
  },
  template: '<TextField v-bind="args" />',
})

export const Default = Template.bind({})
Default.args = {}

export const Filled = Template.bind({})
Filled.args = {
  variant: 'filled',
}

export const Outline = Template.bind({})
Outline.args = {
  variant: 'outline',
}

export const Sizes = (args) => ({
  components: { TextField },
  setup() {
    return { args }
  },
  template: `
    <div style="display: flex; flex-direction: column; gap: 24px; width: 320px;">
      <TextField v-bind="args" size="sm" label="کوچک (sm)" />
      <TextField v-bind="args" size="md" label="متوسط (md)" />
      <TextField v-bind="args" size="lg" label="بزرگ (lg)" />
    </div>
  `,
})
Sizes.args = {
  label: undefined,
}

export const WithLabel = Template.bind({})
WithLabel.args = {
  label: 'نام و نام خانوادگی',
}

export const WithRequired = Template.bind({})
WithRequired.args = {
  label: 'ایمیل',
  required: true,
}

export const WithPlaceholder = Template.bind({})
WithPlaceholder.args = {
  placeholder: 'متن خود را وارد کنید',
  label: undefined,
}

export const WithHint = Template.bind({})
WithHint.args = {
  hint: 'متن راهنما و کمکی',
}

export const WithError = Template.bind({})
WithError.args = {
  label: 'ایمیل',
  error: 'فرمت ایمیل صحیح نیست',
}

export const Clearable = Template.bind({})
Clearable.args = {
  modelValue: 'متن قابل پاک کردن',
  clearable: true,
  label: undefined,
}

export const CharacterCount = Template.bind({})
CharacterCount.args = {
  label: 'توضیحات',
  maxlength: 100,
  showCharacterCount: true,
  modelValue: 'این یک متن نمونه است',
}

export const Disabled = Template.bind({})
Disabled.args = {
  label: 'نام کاربری',
  modelValue: 'mahdi_user',
  disable: true, // Updated from isDisabled
}

export const Readonly = Template.bind({})
Readonly.args = {
  label: 'شماره موبایل',
  modelValue: '09123456789',
  readonly: true, // Updated from isReadonly
}

export const WithIcons = (args) => ({
  components: { TextField, IconUser, IconMail },
  setup() {
    return { args, IconUser, IconMail }
  },
  template: `
    <div style="display: flex; flex-direction: column; gap: 16px; width: 320px;">
      <TextField v-bind="args" label="نام کاربری">
        <template #startSection>
          <IconUser />
        </template>
      </TextField>
      
      <TextField v-bind="args" label="ایمیل">
        <template #endSection>
          <IconMail />
        </template>
      </TextField>
    </div>
  `,
})
WithIcons.args = {
  placeholder: undefined,
}

export const Types = (args) => ({
  components: { TextField, IconMail, IconLock, IconPhone },
  setup() {
    return { args, IconMail, IconLock, IconPhone }
  },
  template: `
    <div style="display: flex; flex-direction: column; gap: 16px; width: 320px;">
      <TextField v-bind="args" type="text" label="متن" placeholder="متن ساده" />
      
      <TextField v-bind="args" type="email" label="ایمیل" placeholder="email@example.com">
        <template #endSection>
          <IconMail />
        </template>
      </TextField>
      
      <TextField v-bind="args" type="password" label="رمز عبور" placeholder="******">
        <template #endSection>
          <IconLock />
        </template>
      </TextField>
      
      <TextField v-bind="args" type="tel" label="شماره تماس" placeholder="09123456789">
         <template #startSection>
          <IconPhone />
        </template>
      </TextField>
      
      <TextField v-bind="args" type="number" label="مبلغ" placeholder="0" />
    </div>
  `,
})
Types.args = {
  hint: undefined,
}

export const Complete = Template.bind({})
Complete.args = {
  label: 'نام کامل',
  placeholder: 'نام و نام خانوادگی خود را وارد کنید',
  hint: 'این فیلد الزامی است',
  required: true,
  clearable: true,
  maxlength: 50,
  showCharacterCount: true,
}

export const WithStartIcon = (args) => ({
  components: { TextField, IconUser },
  setup() {
    return { args, IconUser }
  },
  template: `
    <div style="width: 320px;">
      <TextField v-bind="args">
        <template #startSection>
          <IconUser :size="20" />
        </template>
      </TextField>
    </div>
  `,
})
WithStartIcon.args = {
  label: 'نام کاربری',
  placeholder: 'مثال: user123',
}

export const WithEndIcon = (args) => ({
  components: { TextField, IconMail },
  setup() {
    return { args, IconMail }
  },
  template: `
    <div style="width: 320px;">
      <TextField v-bind="args">
        <template #endSection>
          <IconMail :size="20" />
        </template>
      </TextField>
    </div>
  `,
})
WithEndIcon.args = {
  label: 'ایمیل',
  type: 'email',
  placeholder: 'email@example.com',
}

export const WithBothIcons = (args) => ({
  components: { TextField, IconPhone },
  setup() {
    return { args, IconPhone }
  },
  template: `
    <div style="width: 320px;">
      <TextField v-bind="args">
        <template #startSection>
          <IconPhone :size="20" />
        </template>
        <template #endSection>
          <IconPhone :size="20" />
        </template>
      </TextField>
    </div>
  `,
})
WithBothIcons.args = {
  label: 'شماره تماس',
  type: 'tel',
  placeholder: '09123456789',
}

export const WithStartIconClearable = (args) => ({
  components: { TextField, IconUser },
  setup() {
    return { args, IconUser }
  },
  template: `
    <div style="width: 320px;">
      <TextField v-bind="args">
        <template #startSection>
          <IconUser :size="20" />
        </template>
      </TextField>
    </div>
  `,
})
WithStartIconClearable.args = {
  label: 'جستجو',
  placeholder: 'عبارت می‌نویسید...',
  clearable: true,
  modelValue: 'متن برای جستجو',
}

export const WithEndIconClearable = (args) => ({
  components: { TextField, IconMail },
  setup() {
    return { args, IconMail }
  },
  template: `
    <div style="width: 320px;">
      <TextField v-bind="args">
        <template #endSection>
          <IconMail :size="20" />
        </template>
      </TextField>
    </div>
  `,
})
WithEndIconClearable.args = {
  label: 'فایل',
  placeholder: 'انتخاب فایل...',
  clearable: true,
  modelValue: 'document.pdf',
}

export const ClearableStates = (args) => ({
  components: { TextField },
  setup() {
    return { args }
  },
  template: `
    <div style="display: flex; flex-direction: column; gap: 24px; width: 320px;">
      <TextField v-bind="args" label="متن" placeholder="متن خالی" clearable modelValue="" />
      <TextField v-bind="args" label="متن" placeholder="متن خالی" clearable modelValue="متن با مقدار" />
      <TextField v-bind="args" label="متن" placeholder="متن خالی" clearable modelValue="متن طولانی" maxlength="50" showCharacterCount />
    </div>
  `,
})
ClearableStates.args = {}

export const FormExample = (args) => ({
  components: { TextField },
  setup() {
    const formData = {
      name: '',
      email: '',
      phone: '',
      description: '',
    }
    return { args, formData }
  },
  template: `
    <div style="display: flex; flex-direction: column; gap: 16px; width: 400px; padding: 24px; border: 1px solid #eee; border-radius: 8px;">
      <TextField v-model="formData.name" label="نام و نام خانوادگی" required hint="نام کامل شما" />
      <TextField v-model="formData.email" type="email" label="ایمیل" required hint="example@mail.com" placeholder="ایمیل خود را وارد کنید" />
      <TextField v-model="formData.phone" type="tel" label="شماره موبایل" hint="با پیش‌شماره 09" placeholder="09123456789" />
      <TextField v-model="formData.description" label="توضیحات" hint="اختیاری" />
      <div style="margin-top: 8px;">
        <pre style="background: #f5f5f5; padding: 12px; border-radius: 4px; font-size: 12px;">{{ JSON.stringify(formData, null, 2) }}</pre>
      </div>
    </div>
  `,
})
FormExample.args = {}

export const OutlineAllStates = () => ({
  components: { TextField, IconUser },
  setup() {
    return { IconUser }
  },
  template: `
    <div style="padding: 24px; background: #f5f5f5;">
      <h2 style="margin-bottom: 24px; font-family: Arial;">TextField - Outline Variant States</h2>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;">
        <!-- Small -->
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <h4 style="margin: 0; font-family: Arial; font-size: 12px; text-align: center;">Small (sm)</h4>
          <TextField size="sm" variant="outline" label="عنوان" placeholder="متن پیش‌فرض" hint="متن کمکی" required>
            <template #startSection><IconUser :size="20" /></template>
            <template #endSection><IconUser :size="20" /></template>
          </TextField>
          <TextField size="sm" variant="outline" label="عنوان" placeholder="متن پیش‌فرض" hint="متن کمکی" modelValue="متن نوشته شده" required clearable>
            <template #startSection><IconUser :size="20" /></template>
            <template #endSection><IconUser :size="20" /></template>
          </TextField>
          <TextField size="sm" variant="outline" label="عنوان" placeholder="متن پیش‌فرض" error="متن خطا" required>
            <template #startSection><IconUser :size="20" /></template>
            <template #endSection><IconUser :size="20" /></template>
          </TextField>
          <TextField size="sm" variant="outline" label="عنوان" placeholder="متن پیش‌فرض" hint="متن کمکی" disable required>
            <template #startSection><IconUser :size="20" /></template>
            <template #endSection><IconUser :size="20" /></template>
          </TextField>
        </div>

        <!-- Medium -->
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <h4 style="margin: 0; font-family: Arial; font-size: 12px; text-align: center;">Medium (md)</h4>
          <TextField size="md" variant="outline" label="عنوان" placeholder="متن پیش‌فرض" hint="متن کمکی" required>
            <template #startSection><IconUser :size="20" /></template>
            <template #endSection><IconUser :size="20" /></template>
          </TextField>
          <TextField size="md" variant="outline" label="عنوان" placeholder="متن پیش‌فرض" hint="متن کمکی" modelValue="متن نوشته شده" required clearable>
            <template #startSection><IconUser :size="20" /></template>
            <template #endSection><IconUser :size="20" /></template>
          </TextField>
          <TextField size="md" variant="outline" label="عنوان" placeholder="متن پیش‌فرض" error="متن خطا" required>
            <template #startSection><IconUser :size="20" /></template>
            <template #endSection><IconUser :size="20" /></template>
          </TextField>
          <TextField size="md" variant="outline" label="عنوان" placeholder="متن پیش‌فرض" hint="متن کمکی" disable required>
            <template #startSection><IconUser :size="20" /></template>
            <template #endSection><IconUser :size="20" /></template>
          </TextField>
        </div>

        <!-- Large -->
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <h4 style="margin: 0; font-family: Arial; font-size: 12px; text-align: center;">Large (lg)</h4>
          <TextField size="lg" variant="outline" label="عنوان" placeholder="متن پیش‌فرض" hint="متن کمکی" required>
            <template #startSection><IconUser :size="20" /></template>
            <template #endSection><IconUser :size="20" /></template>
          </TextField>
          <TextField size="lg" variant="outline" label="عنوان" placeholder="متن پیش‌فرض" hint="متن کمکی" modelValue="متن نوشته شده" required clearable>
            <template #startSection><IconUser :size="20" /></template>
            <template #endSection><IconUser :size="20" /></template>
          </TextField>
          <TextField size="lg" variant="outline" label="عنوان" placeholder="متن پیش‌فرض" error="متن خطا" required>
            <template #startSection><IconUser :size="20" /></template>
            <template #endSection><IconUser :size="20" /></template>
          </TextField>
          <TextField size="lg" variant="outline" label="عنوان" placeholder="متن پیش‌فرض" hint="متن کمکی" disable required>
            <template #startSection><IconUser :size="20" /></template>
            <template #endSection><IconUser :size="20" /></template>
          </TextField>
        </div>
      </div>
    </div>
  `,
})

export const AllStates = () => ({
  components: { TextField, IconUser, IconMail, IconPhone },
  setup() {
    return { IconUser, IconMail, IconPhone }
  },
  template: `
    <div style="padding: 24px; background: #f5f5f5;">
      <h2 style="margin-bottom: 24px; font-family: Arial;">TextField - All States (Design Spec)</h2>

      <!-- Filled Variant -->
      <div style="margin-bottom: 48px;">
        <h3 style="margin-bottom: 16px; font-family: Arial;">Filled Variant</h3>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;">
          <!-- Small -->
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <h4 style="margin: 0; font-family: Arial; font-size: 12px;">Small (sm)</h4>
            <TextField size="sm" variant="filled" label="عنوان" placeholder="متن پیش‌فرض" hint="متن کمکی" required>
              <template #startSection><IconUser :size="20" /></template>
              <template #endSection><IconUser :size="20" /></template>
            </TextField>
            <TextField size="sm" variant="filled" label="عنوان" placeholder="متن پیش‌فرض" hint="متن کمکی" modelValue="متن نوشته شده" required clearable>
              <template #startSection><IconUser :size="20" /></template>
              <template #endSection><IconUser :size="20" /></template>
            </TextField>
            <TextField size="sm" variant="filled" label="عنوان" placeholder="متن پیش‌فرض" error="متن خطا" required>
              <template #startSection><IconUser :size="20" /></template>
              <template #endSection><IconUser :size="20" /></template>
            </TextField>
            <TextField size="sm" variant="filled" label="عنوان" placeholder="متن پیش‌فرض" hint="متن کمکی" disable required>
              <template #startSection><IconUser :size="20" /></template>
              <template #endSection><IconUser :size="20" /></template>
            </TextField>
          </div>

          <!-- Medium -->
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <h4 style="margin: 0; font-family: Arial; font-size: 12px;">Medium (md)</h4>
            <TextField size="md" variant="filled" label="عنوان" placeholder="متن پیش‌فرض" hint="متن کمکی" required>
              <template #startSection><IconUser :size="20" /></template>
              <template #endSection><IconUser :size="20" /></template>
            </TextField>
            <TextField size="md" variant="filled" label="عنوان" placeholder="متن پیش‌فرض" hint="متن کمکی" modelValue="متن نوشته شده" required clearable>
              <template #startSection><IconUser :size="20" /></template>
              <template #endSection><IconUser :size="20" /></template>
            </TextField>
            <TextField size="md" variant="filled" label="عنوان" placeholder="متن پیش‌فرض" error="متن خطا" required>
              <template #startSection><IconUser :size="20" /></template>
              <template #endSection><IconUser :size="20" /></template>
            </TextField>
            <TextField size="md" variant="filled" label="عنوان" placeholder="متن پیش‌فرض" hint="متن کمکی" disable required>
              <template #startSection><IconUser :size="20" /></template>
              <template #endSection><IconUser :size="20" /></template>
            </TextField>
          </div>

          <!-- Large -->
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <h4 style="margin: 0; font-family: Arial; font-size: 12px;">Large (lg)</h4>
            <TextField size="lg" variant="filled" label="عنوان" placeholder="متن پیش‌فرض" hint="متن کمکی" required>
              <template #startSection><IconUser :size="20" /></template>
              <template #endSection><IconUser :size="20" /></template>
            </TextField>
            <TextField size="lg" variant="filled" label="عنوان" placeholder="متن پیش‌فرض" hint="متن کمکی" modelValue="متن نوشته شده" required clearable>
              <template #startSection><IconUser :size="20" /></template>
              <template #endSection><IconUser :size="20" /></template>
            </TextField>
            <TextField size="lg" variant="filled" label="عنوان" placeholder="متن پیش‌فرض" error="متن خطا" required>
              <template #startSection><IconUser :size="20" /></template>
              <template #endSection><IconUser :size="20" /></template>
            </TextField>
            <TextField size="lg" variant="filled" label="عنوان" placeholder="متن پیش‌فرض" hint="متن کمکی" disable required>
              <template #startSection><IconUser :size="20" /></template>
              <template #endSection><IconUser :size="20" /></template>
            </TextField>
          </div>
        </div>
      </div>

      <!-- Icon Variations Section -->
      <div style="margin-bottom: 48px;">
        <h3 style="margin-bottom: 16px; font-family: Arial;">Icon Variations (Medium Size)</h3>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;">
          <!-- No Icons -->
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <h4 style="margin: 0; font-family: Arial; font-size: 12px;">No Icons</h4>
            <TextField size="md" variant="filled" label="عنوان" placeholder="متن پیش‌فرض" hint="متن کمکی" required />
            <TextField size="md" variant="filled" label="عنوان" placeholder="متن پیش‌فرض" hint="متن کمکی" modelValue="متن نوشته شده" required clearable />
            <TextField size="md" variant="outline" label="عنوان" placeholder="متن پیش‌فرض" hint="متن کمکی" required />
            <TextField size="md" variant="outline" label="عنوان" placeholder="متن پیش‌فرض" hint="متن کمکی" modelValue="متن نوشته شده" required clearable />
          </div>

          <!-- Start Icon Only -->
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <h4 style="margin: 0; font-family: Arial; font-size: 12px;">Start Icon Only</h4>
            <TextField size="md" variant="filled" label="نام کاربری" placeholder="مثال: user123" required>
              <template #startSection><IconUser :size="20" /></template>
            </TextField>
            <TextField size="md" variant="filled" label="جستجو" placeholder="عبارت می‌نویسید..." modelValue="متن برای جستجو" required clearable>
              <template #startSection><IconUser :size="20" /></template>
            </TextField>
            <TextField size="md" variant="outline" label="نام کاربری" placeholder="مثال: user123" required>
              <template #startSection><IconUser :size="20" /></template>
            </TextField>
            <TextField size="md" variant="outline" label="جستجو" placeholder="عبارت می‌نویسید..." modelValue="متن برای جستجو" required clearable>
              <template #startSection><IconUser :size="20" /></template>
            </TextField>
          </div>

          <!-- End Icon Only -->
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <h4 style="margin: 0; font-family: Arial; font-size: 12px;">End Icon Only</h4>
            <TextField size="md" variant="filled" label="ایمیل" type="email" placeholder="email@example.com" required>
              <template #endSection><IconMail :size="20" /></template>
            </TextField>
            <TextField size="md" variant="filled" label="فایل" placeholder="انتخاب فایل..." modelValue="document.pdf" required clearable>
              <template #endSection><IconMail :size="20" /></template>
            </TextField>
            <TextField size="md" variant="outline" label="ایمیل" type="email" placeholder="email@example.com" required>
              <template #endSection><IconMail :size="20" /></template>
            </TextField>
            <TextField size="md" variant="outline" label="فایل" placeholder="انتخاب فایل..." modelValue="document.pdf" required clearable>
              <template #endSection><IconMail :size="20" /></template>
            </TextField>
          </div>

          <!-- Both Icons -->
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <h4 style="margin: 0; font-family: Arial; font-size: 12px;">Both Icons</h4>
            <TextField size="md" variant="filled" label="شماره تماس" type="tel" placeholder="09123456789" required>
              <template #startSection><IconPhone :size="20" /></template>
              <template #endSection><IconPhone :size="20" /></template>
            </TextField>
            <TextField size="md" variant="filled" label="شماره تماس" type="tel" placeholder="09123456789" modelValue="09123456789" required clearable>
              <template #startSection><IconPhone :size="20" /></template>
              <template #endSection><IconPhone :size="20" /></template>
            </TextField>
            <TextField size="md" variant="outline" label="شماره تماس" type="tel" placeholder="09123456789" required>
              <template #startSection><IconPhone :size="20" /></template>
              <template #endSection><IconPhone :size="20" /></template>
            </TextField>
            <TextField size="md" variant="outline" label="شماره تماس" type="tel" placeholder="09123456789" modelValue="09123456789" required clearable>
              <template #startSection><IconPhone :size="20" /></template>
              <template #endSection><IconPhone :size="20" /></template>
            </TextField>
          </div>

          <!-- Start Icon + Clearable (Focus Behavior) -->
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <h4 style="margin: 0; font-family: Arial; font-size: 12px;">Start Icon + Clearable</h4>
            <TextField size="md" variant="filled" label="جستجو" placeholder="متن خالی" clearable modelValue="">
              <template #startSection><IconUser :size="20" /></template>
            </TextField>
            <TextField size="md" variant="filled" label="جستجو" placeholder="متن خالی" clearable modelValue="متن با مقدار">
              <template #startSection><IconUser :size="20" /></template>
            </TextField>
            <TextField size="md" variant="outline" label="جستجو" placeholder="متن خالی" clearable modelValue="">
              <template #startSection><IconUser :size="20" /></template>
            </TextField>
            <TextField size="md" variant="outline" label="جستجو" placeholder="متن خالی" clearable modelValue="متن با مقدار">
              <template #startSection><IconUser :size="20" /></template>
            </TextField>
          </div>

          <!-- End Icon + Clearable (Focus Behavior) -->
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <h4 style="margin: 0; font-family: Arial; font-size: 12px;">End Icon + Clearable</h4>
            <TextField size="md" variant="filled" label="فایل" placeholder="متن خالی" clearable modelValue="">
              <template #endSection><IconMail :size="20" /></template>
            </TextField>
            <TextField size="md" variant="filled" label="فایل" placeholder="متن خالی" clearable modelValue="document.pdf">
              <template #endSection><IconMail :size="20" /></template>
            </TextField>
            <TextField size="md" variant="outline" label="فایل" placeholder="متن خالی" clearable modelValue="">
              <template #endSection><IconMail :size="20" /></template>
            </TextField>
            <TextField size="md" variant="outline" label="فایل" placeholder="متن خالی" clearable modelValue="document.pdf">
              <template #endSection><IconMail :size="20" /></template>
            </TextField>
          </div>
        </div>
      </div>
      </div>

      <!-- Outline Variant -->
      <div>
        <h3 style="margin-bottom: 16px; font-family: Arial;">Outline Variant</h3>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;">
          <!-- Small -->
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <h4 style="margin: 0; font-family: Arial; font-size: 12px;">Small (sm)</h4>
            <TextField size="sm" variant="outline" label="عنوان" placeholder="متن پیش‌فرض" hint="متن کمکی" required>
              <template #startSection><IconUser :size="20" /></template>
              <template #endSection><IconUser :size="20" /></template>
            </TextField>
            <TextField size="sm" variant="outline" label="عنوان" placeholder="متن پیش‌فرض" hint="متن کمکی" modelValue="متن نوشته شده" required clearable>
              <template #startSection><IconUser :size="20" /></template>
              <template #endSection><IconUser :size="20" /></template>
            </TextField>
            <TextField size="sm" variant="outline" label="عنوان" placeholder="متن پیش‌فرض" error="متن خطا" required>
              <template #startSection><IconUser :size="20" /></template>
              <template #endSection><IconUser :size="20" /></template>
            </TextField>
            <TextField size="sm" variant="outline" label="عنوان" placeholder="متن پیش‌فرض" hint="متن کمکی" disable required>
              <template #startSection><IconUser :size="20" /></template>
              <template #endSection><IconUser :size="20" /></template>
            </TextField>
          </div>

          <!-- Medium -->
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <h4 style="margin: 0; font-family: Arial; font-size: 12px;">Medium (md)</h4>
            <TextField size="md" variant="outline" label="عنوان" placeholder="متن پیش‌فرض" hint="متن کمکی" required>
              <template #startSection><IconUser :size="20" /></template>
              <template #endSection><IconUser :size="20" /></template>
            </TextField>
            <TextField size="md" variant="outline" label="عنوان" placeholder="متن پیش‌فرض" hint="متن کمکی" modelValue="متن نوشته شده" required clearable>
              <template #startSection><IconUser :size="20" /></template>
              <template #endSection><IconUser :size="20" /></template>
            </TextField>
            <TextField size="md" variant="outline" label="عنوان" placeholder="متن پیش‌فرض" error="متن خطا" required>
              <template #startSection><IconUser :size="20" /></template>
              <template #endSection><IconUser :size="20" /></template>
            </TextField>
            <TextField size="md" variant="outline" label="عنوان" placeholder="متن پیش‌فرض" hint="متن کمکی" disable required>
              <template #startSection><IconUser :size="20" /></template>
              <template #endSection><IconUser :size="20" /></template>
            </TextField>
          </div>

          <!-- Large -->
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <h4 style="margin: 0; font-family: Arial; font-size: 12px;">Large (lg)</h4>
            <TextField size="lg" variant="outline" label="عنوان" placeholder="متن پیش‌فرض" hint="متن کمکی" required>
              <template #startSection><IconUser :size="20" /></template>
              <template #endSection><IconUser :size="20" /></template>
            </TextField>
            <TextField size="lg" variant="outline" label="عنوان" placeholder="متن پیش‌فرض" hint="متن کمکی" modelValue="متن نوشته شده" required clearable>
              <template #startSection><IconUser :size="20" /></template>
              <template #endSection><IconUser :size="20" /></template>
            </TextField>
            <TextField size="lg" variant="outline" label="عنوان" placeholder="متن پیش‌فرض" error="متن خطا" required>
              <template #startSection><IconUser :size="20" /></template>
              <template #endSection><IconUser :size="20" /></template>
            </TextField>
            <TextField size="lg" variant="outline" label="عنوان" placeholder="متن پیش‌فرض" hint="متن کمکی" disable required>
              <template #startSection><IconUser :size="20" /></template>
              <template #endSection><IconUser :size="20" /></template>
            </TextField>
          </div>
        </div>
      </div>
    </div>
  `,
})
