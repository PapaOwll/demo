<template>
  <QDialog :model-value="props.dialog.status" persistent>
    <QCard class="transactions-details-dialog">
      <QCardSection class="transactions-details-dialog__header">
        <p>جزئیات تراکنش</p>
        <QBtn
          :loading="props.loading"
          flat
          :ripple="false"
          class="q-pa-sm"
          @click="emit('closeDialog')"
        >
          <IconX stroke="2" />
        </QBtn>
      </QCardSection>
      <QCardSection class="transactions-details-dialog__file">
        <label class="transactions-details-dialog__file-label" for="imageInput">
          <div>
            <div class="transactions-details-dialog__file-icon">
              <IconUpload stroke="{2}" />
            </div>
            <div class="transactions-details-dialog__file-text">
              <div>
                <p>برای بارگذاری فایل</p>
                <p>کلیک کنید</p>
              </div>
              <p>JPG, (Max. 4 MB)</p>
            </div>
          </div>

          <!-- <input
            id="imageInput"
            type="file"
            multiple="false"
            accept="image/*"
            style="display: none"
            @input="handleSelectFile"
          /> -->
        </label>
        <!-- <QCardSection class="transactions-details-dialog__uploaded">
          <div class="transactions-details-dialog__uploaded-icon">
            <QBtn flat :ripple="false">
              <IconEye class="text-white" stroke="2" />
            </QBtn>
            <QBtn flat :ripple="false" @click="state.image = ''">
              <IconTrash class="text-white" stroke="2" />
            </QBtn>
          </div>
          <div class="transactions-details-dialog__uploaded-text">
            <p>نوع فایل</p>
            <p>۱۴۰۴٫۰۳٫۳۱ - ۱۴:۴۲</p>
          </div>
        </QCardSection> -->
      </QCardSection>
      <span class="transactions-details-dialog__line-one" />
      <QInput
        :model-value="description"
        placeholder="توضیحات"
        class="transactions-details-dialog__input-text"
        bg-color="white"
        type="textarea"
        filled
        @update:model-value="state.description = $event"
      />
      <span class="transactions-details-dialog__line-two" />
      <QCardSection class="transactions-details-dialog__bottom">
        <QBtn
          class="transactions-details-dialog__bottom-close"
          color="red-8"
          outline
          label="انصراف"
          :loading="props.loading"
          @click="emit('closeDialog')"
        />
        <QBtn
          class="transactions-details-dialog__bottom-save"
          color="primary"
          label="ذخیره"
          :loading="props.loading"
          @click="handleAcceptChange"
        />
      </QCardSection>
    </QCard>
  </QDialog>
</template>
<script setup>
import { IconX, IconUpload } from '@tabler/icons-vue'
import { computed, reactive } from 'vue'
import { QCardSection } from 'quasar'

const emit = defineEmits(['closeDialog', 'acceptChange'])
const props = defineProps({
  dialog: {
    type: Object,
    default: () => ({}),
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const state = reactive({
  image: '',
  description: null,
})

const description = computed(() => {
  return state.description ?? props.dialog.data.description
})

const handleAcceptChange = () => {
  emit('acceptChange', state.description)
}
</script>
<style lang="scss" scoped>
.transactions-details-dialog {
  border-radius: $generic-border-radius;
  background-color: $white;
  min-width: 600px;
}

.transactions-details-dialog__header {
  justify-content: space-between;
  padding: map-get($space-md, x);
  display: flex;
  width: 100%;
}

.transactions-details-dialog__header > p {
  font-weight: map-get($h6, weight);
  font-size: map-get($h6, size);
  color: $grey-10;
  margin: 0px;
}

.transactions-details-dialog__file {
  justify-content: space-between;
  padding: map-get($space-md, x);
  gap: map-get($space-md, x);
  align-items: center;
  flex-wrap: noWrap;
  padding-top: 0;
  display: flex;
}

.transactions-details-dialog__file-text {
  flex-direction: column;
  display: flex;
}

.transactions-details-dialog__file-text > div {
  display: flex;
}

.transactions-details-dialog__file-text > div > p:first-of-type {
  font-weight: map-get($subtitle2, weight);
  font-size: map-get($subtitle2, size);
  white-space: noWrap;
  color: $grey-10;
  margin: 0px;
}

.transactions-details-dialog__file-text > div > p:last-of-type {
  font-weight: map-get($subtitle2, weight);
  font-size: map-get($subtitle2, size);
  margin: 0;
  white-space: noWrap;
  margin-right: map-get($space-xs, x);
  color: $primary;
}

.transactions-details-dialog__file-text > p {
  margin: 0px;
  color: $grey-7;
}

.transactions-details-dialog__file-label {
  border-radius: $generic-border-radius;
  padding: map-get($space-md, x);
  border: 1px dashed black;
  background-color: $grey-1;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  height: 103px;
  display: flex;
  width: 100%;
}

.transactions-details-dialog__file-label > div {
  align-items: center;
  flex-wrap: noWrap;
  display: flex;
}

.transactions-details-dialog__file-icon {
  border-radius: $generic-border-radius;
  margin-left: map-get($space-sm, x);
  padding: map-get($space-sm, x);
  background-color: $white;
  box-shadow: $shadow-1;
  margin-right: 0;
}

.transactions-details-dialog__uploaded {
  background-image: url('@/assets/images/fileUploaded.svg');
  border-radius: $generic-border-radius;
  padding: map-get($space-sm, x);
  background-repeat: no-repeat;
  flex-direction: column;
  background-size: cover;
  overflow: hidden;
  min-width: 276px;
  display: flex;
  height: 100%;
}

.transactions-details-dialog__uploaded-icon {
  margin-top: map-get($space-xs, x);
  justify-content: flex-end;
  display: flex;
  width: 100%;
}

.transactions-details-dialog__uploaded-icon :first-child {
  padding: 0px;
}

.transactions-details-dialog__uploaded-icon :last-child {
  margin-left: map-get($space-xs, x);
  padding: 0px;
}

.transactions-details-dialog__uploaded-text {
  margin-right: map-get($space-md, x);
  margin-top: map-get($space-xs, x);
  flex-direction: column;
  justify-content: start;
  color: white;
  display: flex;
  width: 100%;
  z-index: 1;
}

.transactions-details-dialog__uploaded-text p:first-of-type {
  font-weight: map-get($subtitle2, weight);
  font-size: map-get($subtitle2, size);
  margin: 0px;
}

.transactions-details-dialog__uploaded-text p:last-of-type {
  margin: 0px;
  font-weight: map-get($subtitle1, weight);
  font-size: map-get($subtitle2, size);
}

.transactions-details-dialog__line-one {
  margin: 0 auto map-get($space-md, x) auto;
  background-color: $grey-4;
  position: relative;
  display: block;
  height: 1px;
  width: 95%;
}

.transactions-details-dialog__input-text {
  border-radius: $generic-border-radius;
  border: 1.8px solid #6666665b;
  margin: map-get($space-md, x);
  overflow: hidden;
}

.transactions-details-dialog-close {
  width: 88px;
}

.transactions-details-dialog-save {
  width: 129px;
}

.transactions-details-dialog__line-two {
  margin: 0 auto map-get($space-md, x) auto;
  background-color: $grey-4;
  position: relative;
  padding: 0px 10px;
  display: block;
  width: 100%;
  height: 1px;
}

.transactions-details-dialog__bottom {
  padding: 0;
  padding: map-get($space-md, x);
  justify-content: flex-end;
  align-items: center;
  padding-top: 0px;
  display: flex;
  width: 100%;
}

.transactions-details-dialog__bottom-close {
  margin-left: 10px;
}

.transactions-details-dialog__bottom-save {
  width: 129px;
}
</style>
