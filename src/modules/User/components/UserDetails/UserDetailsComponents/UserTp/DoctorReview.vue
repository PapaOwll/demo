<template>
  <div>
    <QInnerLoading :showing="isLoading">
      <QSpinnerDots size="40px" color="primary" />
    </QInnerLoading>
    <div v-if="doctorReviews.length > 0" class="drr">
      <div v-for="review in doctorReviews" :key="review.id" class="drr__container">
        <div class="drr__header">
          <QAvatar square class="rounded-borders" color="grey-2" text-color="secondary">
            <IconUser />
          </QAvatar>
          <div class="drr__header-user">
            <span>{{ review.doctor.name }}</span>
            <span class="text-secondary text-caption">
              {{ convertToJalaliWithTime(review.createdAt, 'HH:mm - jYYYY٫jMM٫jDD') }}
            </span>
          </div>
        </div>
        <div>
          <QChip :label="review?.status?.faTitle" square :class="statusColor(review?.status)" />
        </div>
        <div class="drr__description">
          <div class="drr__description-header">
            <span class="text-caption text-secondary">توضیحات</span>
            <span class="text-caption text-secondary">شناسه - {{ review?.id }}</span>
          </div>
          <p class="text-weight-regular text-subtitle2">{{ review?.review }}</p>
        </div>
      </div>
    </div>
    <div v-else class="no-comment">
      <span>هیچ پزشکی نظر نداده!</span>
    </div>
  </div>
</template>

<script setup>
import { useGetDoctorReviewQuery } from '@/modules/User/query/index'
import { computed, ref } from 'vue'

import { IconUser } from '@tabler/icons-vue'
import { convertToJalaliWithTime } from '@/utils/date-utils'
import { ENABLE_USER_DETAIL_MOCKS } from '@/mocks/config'
import { mockGetDoctorReviews } from '@/mocks/user-details/treatment-plan'

const props = defineProps({
  plan: {
    type: Object,
    required: true,
  },
})

const userId = computed(() => props.plan?.user?.id || '')
const treatmentId = computed(() => props.plan?.id || '')
const filters = ref({
  'filter[user_id]': userId.value,
  'filter[treatmentplan_id]': treatmentId.value,
})

const { data: reviews, isLoading } = useGetDoctorReviewQuery(filters, {
  enabled: !!userId.value && !!treatmentId.value,
  ...(ENABLE_USER_DETAIL_MOCKS ? { queryFn: () => mockGetDoctorReviews() } : {}),
})
const doctorReviews = computed(() => reviews.value?.items || [])

const statusColor = (st) => {
  return st.slug === 'approve'
    ? 'chips-success'
    : st.slug === 'reject'
      ? 'chips-error'
      : 'chips-info'
}
</script>

<style scoped lang="scss">
.drr {
  background-color: white;
  padding: 1rem;
  border-radius: 12px;

  &__container {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
  }
  &__header {
    display: flex;
    align-items: center;
    padding: map-get($space-sm, x);
    gap: 10px;
    &-user {
      display: flex;
      flex-direction: column;
    }
  }
  &__description {
    width: 100%;
    margin: 5px auto;
    background-color: $grey-1;
    border-radius: 4px;
    padding: 12px;
    &-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
}
.no-comment {
  padding: 4rem;
  display: flex;
  justify-content: center;
  align-items: center;

  span {
    font-size: map-get($subtitle1, size);
    color: $grey-8;
    font-weight: bold;
  }
}
</style>
