import { ref } from 'vue'
import Modal from './index'
import Button from '@/base/Button'
import Typography from '@/base/Typography'
import TextField from '@/base/TextField'

const WRAPPER_STYLE = 'display: flex; justify-content: center; min-width: 320px;'

export default {
  title: 'Base/Modal',
  component: Modal,
  argTypes: {
    modelValue: { control: 'boolean', description: 'باز/بسته بودن دیالوگ (v-model)' },
    title: { control: 'text' },
    subtitle: { control: 'text' },
    showHeader: { control: 'boolean' },
    showClose: { control: 'boolean' },
    persistent: { control: 'boolean' },
    loading: { control: 'boolean' },
    width: { control: 'number', description: 'عرض کارت دیالوگ به پیکسل' },
    minWidth: { control: 'number' },
    transitionShow: { control: 'text' },
    transitionHide: { control: 'text' },
  },
  args: {
    modelValue: false,
    title: 'عنوان دیالوگ',
    subtitle: undefined,
    showHeader: true,
    showClose: true,
    persistent: false,
    loading: false,
    width: 480,
    minWidth: undefined,
    transitionShow: 'scale',
    transitionHide: 'scale',
  },
}

export const Default = () => ({
  components: { Modal, Button, Typography },
  setup() {
    const open = ref(false)
    return { open }
  },
  template: `
    <div style="${WRAPPER_STYLE}">
      <Button text="باز کردن دیالوگ" color="light-blue" @click="open = true" />
      <Modal v-model="open" title="عنوان دیالوگ" :width="480">
        <Typography variant="body" size="3">
          این محتوای نمونه slot پیش‌فرض (body) است. عنوان، محتوا و آیکون بستن نمایش داده می‌شود.
        </Typography>
      </Modal>
    </div>
  `,
})

export const WithSubtitle = () => ({
  components: { Modal, Button, Typography },
  setup() {
    const open = ref(false)
    return { open }
  },
  template: `
    <div style="${WRAPPER_STYLE}">
      <Button text="باز کردن دیالوگ" color="light-blue" @click="open = true" />
      <Modal v-model="open" title="ویرایش کاربر" subtitle="اطلاعات کاربر را تکمیل کنید" :width="480">
        <Typography variant="body" size="3">
          عنوان همراه با زیرعنوان توصیفی در هدر نمایش داده می‌شود.
        </Typography>
      </Modal>
    </div>
  `,
})

export const WithFooter = () => ({
  components: { Modal, Button, Typography },
  setup() {
    const open = ref(false)
    return { open }
  },
  template: `
    <div style="${WRAPPER_STYLE}">
      <Button text="باز کردن دیالوگ" color="light-blue" @click="open = true" />
      <Modal v-model="open" title="ویرایش کاربر" subtitle="اطلاعات کاربر را تکمیل کنید" :width="480">
        <Typography variant="body" size="3">
          footer شامل دکمه‌های انصراف و ذخیره است. divider بالای footer کل عرض مودال را می‌پوشاند.
        </Typography>
        <template #footer>
          <Button variant="flat" color="grey" text="انصراف" @click="open = false" />
          <Button variant="filled" color="light-blue" text="ذخیره" @click="open = false" />
        </template>
      </Modal>
    </div>
  `,
})
WithFooter.parameters = {
  docs: {
    description: {
      story:
        'Footer با slot #footer اضافه می‌شود. خط جداکننده (border-top) کل عرض مودال را از لبه تا لبه می‌گیرد و دکمه‌ها با محتوای body تراز می‌مانند.',
    },
  },
}

export const FormContent = () => ({
  components: { Modal, Button, Typography, TextField },
  setup() {
    const open = ref(false)
    return { open }
  },
  template: `
    <div style="${WRAPPER_STYLE}">
      <Button text="باز کردن دیالوگ" color="light-blue" @click="open = true" />
      <Modal v-model="open" title="اطلاعات تماس" :width="520">
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <TextField label="نام" placeholder="مثلاً علی رضایی" />
          <TextField label="شماره تماس" mask="####-###-####" placeholder="0912-345-6789" />
        </div>
        <template #footer>
          <Button variant="flat" color="grey" text="انصراف" @click="open = false" />
          <Button variant="filled" color="light-blue" text="ذخیره" @click="open = false" />
        </template>
      </Modal>
    </div>
  `,
})

export const Confirm = () => ({
  components: { Modal, Button, Typography },
  setup() {
    const open = ref(false)
    return { open }
  },
  template: `
    <div style="${WRAPPER_STYLE}">
      <Button text="باز کردن دیالوگ" color="light-blue" @click="open = true" />
      <Modal v-model="open" title="حذف مورد" :width="420">
        <Typography variant="body" size="3">
          آیا از حذف این مورد مطمئن هستید؟ این عملیات قابل بازگشت نیست.
        </Typography>
        <template #footer>
          <Button variant="flat" color="grey" text="انصراف" @click="open = false" />
          <Button variant="filled" color="red" text="حذف" @click="open = false" />
        </template>
      </Modal>
    </div>
  `,
})

export const NoHeader = () => ({
  components: { Modal, Button, Typography },
  setup() {
    const open = ref(false)
    return { open }
  },
  template: `
    <div style="${WRAPPER_STYLE}">
      <Button text="باز کردن دیالوگ" color="light-blue" @click="open = true" />
      <Modal v-model="open" :show-header="false" :width="440">
        <Typography variant="body" size="3">
          دیالوگ بدون هدر. آیکون بستن به‌صورت شناور در گوشه نمایش داده می‌شود.
        </Typography>
      </Modal>
    </div>
  `,
})

export const Loading = () => ({
  components: { Modal, Button, Typography, TextField },
  setup() {
    const open = ref(false)
    return { open }
  },
  template: `
    <div style="${WRAPPER_STYLE}">
      <Button text="باز کردن دیالوگ" color="light-blue" @click="open = true" />
      <Modal
        v-model="open"
        title="در حال ذخیره..."
        :width="480"
        :loading="true"
        :persistent="true"
      >
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <TextField label="نام" placeholder="مثلاً علی رضایی" />
          <TextField label="شماره تماس" mask="####-###-####" placeholder="0912-345-6789" />
        </div>
        <template #footer>
          <Button variant="flat" color="grey" text="انصراف" />
          <Button variant="filled" color="light-blue" text="ذخیره" />
        </template>
      </Modal>
    </div>
  `,
})
Loading.parameters = {
  docs: {
    description: {
      story:
        'با loading=true یک overlay اسپینر روی محتوا نمایش داده می‌شود. معمولاً همراه با persistent استفاده می‌شود.',
    },
  },
}

export const Persistent = () => ({
  components: { Modal, Button, Typography },
  setup() {
    const open = ref(false)
    return { open }
  },
  template: `
    <div style="${WRAPPER_STYLE}">
      <Button text="باز کردن دیالوگ" color="light-blue" @click="open = true" />
      <Modal
        v-model="open"
        title="عملیات حیاتی"
        subtitle="این دیالوگ فقط با دکمه بستن می‌شود"
        :width="480"
        :persistent="true"
      >
        <Typography variant="body" size="3">
          با persistent=true کلیک روی پس‌زمینه دیالوگ را نمی‌بندد.
        </Typography>
        <template #footer>
          <Button variant="flat" color="grey" text="انصراف" @click="open = false" />
          <Button variant="filled" color="light-blue" text="ذخیره" @click="open = false" />
        </template>
      </Modal>
    </div>
  `,
})

export const CustomStyle = () => ({
  components: { Modal, Button, Typography },
  setup() {
    const open = ref(false)
    return { open }
  },
  template: `
    <div style="${WRAPPER_STYLE}">
      <Button text="باز کردن دیالوگ سفارشی" color="light-blue" @click="open = true" />
      <Modal v-model="open" title="دیالوگ با استایل تزریقی" :width="480" card-class="demo-branded-modal">
        <Typography variant="body" size="3">
          استایل این دیالوگ از بیرون از کامپوننت تزریق شده است: توکن‌های
          --modal-radius، --modal-border-color و --modal-shadow از طریق کلاس
          demo-branded-modal بازنویسی شده‌اند.
        </Typography>
      </Modal>
    </div>
    <style>
      /* Demo only — <style> in a story template is global (not scoped, plain CSS). */
      .demo-branded-modal {
        --modal-radius: 24px;
        --modal-border-color: #90caf9;
        --modal-shadow: 0 12px 32px 0 rgba(33, 150, 243, 0.25);
      }
    </style>
  `,
})
CustomStyle.parameters = {
  docs: {
    description: {
      story:
        'پراپ cardClass روی ریشه‌ی کارت (.modal) اعمال می‌شود و به‌عنوان کلید تزریق استایل خارجی (CSS/SCSS) عمل می‌کند. توکن‌های قابل بازنویسی: --modal-padding، --modal-gap، --modal-radius، --modal-bg-color، --modal-border-color و --modal-shadow. برای المان‌های داخلی در استایل scoped از :deep() استفاده کنید.',
    },
  },
}

export const Sizes = () => ({
  components: { Modal, Button, Typography },
  setup() {
    const openSm = ref(false)
    const openMd = ref(false)
    const openLg = ref(false)
    return { openSm, openMd, openLg }
  },
  template: `
    <div style="display: flex; gap: 8px; justify-content: center; min-width: 320px;">
      <Button text="کوچک (320)" color="light-blue" @click="openSm = true" />
      <Button text="متوسط (480)" color="light-blue" @click="openMd = true" />
      <Button text="بزرگ (640)" color="light-blue" @click="openLg = true" />

      <Modal v-model="openSm" title="دیالوگ کوچک" :width="320">
        <Typography variant="body" size="3">عرض ۳۲۰ پیکسل.</Typography>
      </Modal>
      <Modal v-model="openMd" title="دیالوگ متوسط" :width="480">
        <Typography variant="body" size="3">عرض ۴۸۰ پیکسل.</Typography>
      </Modal>
      <Modal v-model="openLg" title="دیالوگ بزرگ" subtitle="برای محتوای گسترده‌تر" :width="640">
        <Typography variant="body" size="3">عرض ۶۴۰ پیکسل.</Typography>
      </Modal>
    </div>
  `,
})
