<template>
  <div class="disease-box">
    <QCardActions class="disease-box__top" @click.self="expanded = !expanded">
      <span @click="expanded = !expanded">سوابق پزشکی بیمار</span>
      <QSpace />
      <QBtn
        color="grey"
        round
        flat
        dense
        :icon="expanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'"
        @click="expanded = !expanded"
      />
    </QCardActions>
    <QSlideTransition>
      <div v-if="expanded">
        <div class="disease-box__content">
          <div class="disease-box__checkbox-wrapper">
            <QCheckbox
              v-for="(ds, index) in formData.diseases"
              :key="index"
              v-model="ds.value"
              dense
              :label="ds.name"
              :disable="mode === 'edit' || !props.isEditMode"
              class="disease-box__checkbox"
            />
            <QInnerLoading :showing="isLoading" class="q-mx-auto q-my-auto">
              <QSpinnerTail color="primary" />
            </QInnerLoading>
          </div>
          <div v-if="mode === TREATMENT_PLAN_MODE.CREATE" class="disease-box__button-wrapper">
            <QBtn
              :loading="isPending"
              color="primary"
              unelevated
              class="disease-box__button"
              :disabled="!props.isEditMode"
              @click="submitPreTp"
            >
              ذخیره پیش‌نویس
            </QBtn>
          </div>
        </div>
      </div>
    </QSlideTransition>
  </div>
</template>

<script setup>
import { useTpProvider } from '../../composables/use-tp-provider'
import { computed, ref, watch } from 'vue'
import { Notif, confirmDialog } from '@/data/services/notification-service'
import { useGetDiseasesQuery } from '@/data/services/dr-serita/query'
import { useCreatePreTpMutation } from '../../query'
import { convertTeethToShowableTeeth } from '../../utils/teeth'
import { useRoute, useRouter } from 'vue-router'
import { useGetMedicalInfoQuery } from '@/modules/User/query'
import { useTpStatus } from '../../composables/use-tp-status'
import { useTpVoice } from '../../composables/use-tp-voice'
import { TREATMENT_PLAN_MODE } from '@/modules/TreatmentPlan/constants/enums'
import {
  BASE_COUNT_REQUIRED_MESSAGE,
  getBaseCountAnswers,
  hasUnsetBaseCount,
} from '../../constants/service-question-types'
import { useBranchTpPerform } from '../../composables/use-branch-tp-perform'

const props = defineProps({
  isEditMode: {
    type: Boolean,
    default: true,
  },
})

const { mode } = useTpStatus()
const { isBranchHasTpPerform } = useBranchTpPerform()
const treatmentData = useTpProvider('treatmentData')
const expanded = ref(true)
const route = useRoute()
const router = useRouter()
const { data: diseases, isLoading } = useGetDiseasesQuery()
const diseaseList = computed(() => diseases.value || [])
const publicDescription = computed(() => treatmentData?.value?.publicDescription)
const description = computed(() => treatmentData?.value?.description)

const savedVoices = computed(() => treatmentData?.value?.voices || [])
const { getCombinedVoiceRecordings } = useTpVoice()
const allVoiceRecordings = getCombinedVoiceRecordings(savedVoices)

const initialFormData = {
  diseases: [],
  publicDescription,
  description,
}

const formData = ref({ ...initialFormData })

const userId = computed(() => route?.query?.['user-id'] || treatmentData?.value?.user?.id)
const routeUserId = computed(() => route?.query?.['user-id'])

const { data: medicalInfo } = useGetMedicalInfoQuery(userId, {
  enabled: computed(() => !!userId.value && !!route?.query?.['user-id']),
})

const userDiseaseIds = computed(() => {
  if (routeUserId.value) {
    return medicalInfo.value?.diseases?.map((d) => d.id) || []
  }
  return treatmentData?.value?.user?.diseases?.map((d) => d.id) || []
})

const { mutate: submitPreTreatmentPlan, isPending } = useCreatePreTpMutation()
const submitPreTp = () => {
  // Validation
  if (!userId.value) {
    Notif.error('لطفا ابتدا بیمار را انتخاب کنید')
    return
  }

  const draftQuestions =
    treatmentData?.value?.items?.flatMap(({ questions }) => questions || []) || []

  if (hasUnsetBaseCount(draftQuestions, getBaseCountAnswers(draftQuestions))) {
    Notif.error(BASE_COUNT_REQUIRED_MESSAGE, {
      caption: 'لطفاً تعداد پایه را انتخاب کنید',
    })
    return
  }

  const serveIndustryItems =
    treatmentData?.value?.items?.flatMap(({ questions }) =>
      questions?.flatMap((q) => q.items?.map((i) => i.id))
    ) || []

  const serveIndustries =
    treatmentData?.value?.teeth
      ?.map((t) => {
        const teeth = convertTeethToShowableTeeth(t.teeth)
          .map((ts) => ({
            position: ts.key,
            number: ts.teeth.map((_tooth) => +_tooth),
          }))
          .filter((_item) => _item.number.length > 0)

        return {
          serve_industry_id: t.serve?.id,
          teeth,
        }
      })
      .filter((item) => item.teeth.length > 0) || []

  if (serveIndustries.length === 0 && serveIndustryItems.length === 0) {
    Notif.error('لطفا حداقل یک خدمت را انتخاب کنید')
    return
  }

  confirmDialog(
    'ثبت پیش نویس طرح درمان',
    'از ثبت پیش نویس اطمینان دارید؟',
    () => {
      const payload = {
        ...formData.value,
        userId: userId.value ?? undefined,
        diseases:
          formData.value?.diseases?.filter((item) => item.value).map((item) => item.id) || [],
        serveIndustryItems,
        serveIndustries,
        publicDescription: publicDescription.value,
        description: description.value,
        voices: allVoiceRecordings.value,
        visitType: treatmentData?.value?.visitType || null,
      }
      submitPreTreatmentPlan(payload, {
        onSuccess: (res) => {
          Notif.success('پیش نویس طرح درمان با موفقیت ثبت شد')

          if (isBranchHasTpPerform.value) {
            router.push({
              path: `/treatment-plan/draft/view/${res.data.id}`,
            })
          } else {
            router.push({
              path: `/treatment-plan/edit/${res.data.id}`,
            })
          }
        },
      })
    },
    {
      ok: { label: 'تایید', color: 'primary', flat: true },
      cancel: { label: 'انصراف', color: 'negative', flat: true },
    }
  )
}

watch(
  [diseaseList, userDiseaseIds],
  () => {
    if (diseaseList.value.length > 0) {
      formData.value.diseases = diseaseList.value.map((item) => ({
        ...item,
        value: userDiseaseIds.value.length > 0 ? !!userDiseaseIds.value.includes(item.id) : false,
      }))
    }
  },
  { immediate: true }
)

watch(
  [routeUserId, diseaseList],
  ([newRouteUserId], [oldRouteUserId]) => {
    if (oldRouteUserId && !newRouteUserId && diseaseList.value.length > 0) {
      formData.value.diseases = diseaseList.value.map((item) => ({
        ...item,
        value: false,
      }))
    }

    if (!newRouteUserId && diseaseList.value.length > 0) {
      formData.value.diseases = diseaseList.value.map((item) => ({
        ...item,
        value: false,
      }))
    }
  },
  { immediate: false }
)
</script>

<style scoped lang="scss">
.disease-box {
  background-color: $grey-1;
  border: 1px solid $grey-3;
  padding: map-get($space-sm, x);
  border-radius: 8px !important;

  &__top {
    cursor: pointer;
    padding: 0 !important;
  }

  &__content {
    margin-top: 0.5rem;
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  &__input-wrapper {
    width: 100%;
  }

  &__input {
    border-radius: 16px !important;
    background-color: white !important;
  }

  &__checkbox-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    align-items: flex-start;
  }

  &__checkbox {
    flex: 0 0 calc(50% - 0.4rem);
    min-height: 32px;
    display: flex;
    align-items: center;
    padding: 0.5rem;
    border-radius: 8px;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: rgba($primary, 0.05);
    }

    @media (max-width: 480px) {
      flex: 0 0 100%;
      min-height: 40px;
      padding: 0.5rem 0.25rem;
    }

    @media (min-width: 481px) and (max-width: 768px) {
      flex: 0 0 calc(50% - 0.4rem);
    }
  }

  &__button-wrapper {
    width: 100%;
  }

  &__button {
    border-radius: 16px;
    width: 100%;
  }
}
</style>
