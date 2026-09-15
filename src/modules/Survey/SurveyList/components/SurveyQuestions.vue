<template>
  <QDialog :model-value="visible" @update:model-value="closeForm" @close="closeForm">
    <QCard class="q-pa-md">
      <div class="form-header">
        <h5>سوالات نظرسنجی</h5>
        <QBtn round flat @click="closeForm">
          <IconSquareRoundedLetterX />
        </QBtn>
      </div>
      <QSeparator spaced="md" color="secondary" />
      <div class="row q-pa-md">
        <ul>
          <li v-for="item in questions" :key="item.id" class="q-my-sm">
            {{ item.title }}
          </li>
        </ul>
      </div>
    </QCard>
  </QDialog>
</template>

<script setup>
import { ref, toRefs, watch } from 'vue'
import { IconSquareRoundedLetterX } from '@tabler/icons-vue'

const emits = defineEmits(['close'])
const props = defineProps({
  visible: Boolean,
  editValue: {},
})

const { visible, editValue } = toRefs(props)
const questions = ref(null)
const closeForm = () => {
  emits('close', false)
}
watch(
  () => visible.value,
  (value) => {
    if (value) {
      questions.value = JSON.parse(editValue?.value)
    }
  }
)
</script>

<style scoped></style>
