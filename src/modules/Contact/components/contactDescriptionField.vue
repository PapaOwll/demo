<template>
  <div class="cdf">
    <div class="cdf__text">
      <QTooltip class="text-body1">
        {{ props.contact?.description }}
      </QTooltip>
      <p>
        {{ props.contact?.description }}
      </p>
    </div>
    <QPopupEdit ref="popupEdit" :model-value="props.contact?.description" autofocus auto-save>
      <QInput v-model="newText" outlined class="cdf__input" @keyup.enter="saveText">
        <template #prepend>
          <QBtn
            :loading="isPending"
            icon="check"
            size="small"
            class="cdf__button"
            @click="saveText"
          />
        </template>
      </QInput>
    </QPopupEdit>
  </div>
</template>

<script setup>
import { Notif } from '@/data/services/notification-service'
import { ref, watch } from 'vue'
import { handleError } from '@/utils/error-handler'
import { useQueryClient } from '@tanstack/vue-query'
import { useApiUpdateContact } from '@/modules/Contact/query'

const props = defineProps({
  contact: {
    type: Object,
    default: () => ({}),
  },
})
const queryClient = useQueryClient()
const newText = ref(props.contact?.description)
const popupEdit = ref(null)

watch(
  () => props.contact?.description,
  (newDescription) => {
    newText.value = newDescription
  }
)

const { mutate: updateContact, isPending } = useApiUpdateContact()
const closeEditing = () => {
  popupEdit.value?.hide()
  queryClient.invalidateQueries({ queryKey: ['contact'] })
}
const hidePopover = () => {
  newText.value = props.contact?.description
}
const saveText = () => {
  if (newText.value === props.contact?.description) {
    Notif.warning('توضیحات قبلی و جدید یکسان هستند')
    closeEditing()
    hidePopover()
    return
  }
  const payload = {
    type: props.contact?.type,
    result_id: props.contact?.resultId,
    user_id: props.contact?.user?.id,
    branch_id: props.contact?.branch?.id,
    description: newText.value,
  }
  updateContact(
    { ...payload, id: props.contact?.id },
    {
      onSuccess: async (response) => {
        const liveQueriesOnScreen = queryClient
          .getQueryCache()
          .findAll({ type: 'active', stale: false, queryKey: ['contact', 'all-contacts'] })
        liveQueriesOnScreen.forEach((query) => {
          queryClient.setQueryData(query.queryKey, (oldData) => {
            if (!oldData || !oldData.pages) return oldData

            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                data: {
                  ...page.data,
                  data: {
                    items: page?.data?.items.map((item) =>
                      item.id === props.contact?.id ? { ...item, description: newText.value } : item
                    ),
                  },
                },
              })),
            }
          })
        })
        Notif.success(response.message || 'توضیحات با موفقیت ثبت شد')
        closeEditing()
        hidePopover()
      },
      onError: (error) => {
        handleError(error)
        newText.value = props.contact?.description
      },
    }
  )
}
</script>

<style scoped lang="scss">
.cdf {
  max-width: 50px;
  height: 20px;

  &__text {
    height: 100%;
    width: 100%;
    max-width: 200px;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__input {
    direction: ltr;

    :deep(input) {
      padding-right: 10px;
      direction: rtl;
    }
  }
}
</style>
