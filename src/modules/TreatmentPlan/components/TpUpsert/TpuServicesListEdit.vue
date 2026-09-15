<template>
  <div class="tps" :class="!showTitle ? 'bg-white' : 'bg-grey-1'">
    <QCardActions v-if="isExpandable" class="tps__top" @click.self="expanded = !expanded">
      <Typography
        v-if="showTitle"
        variant="body"
        size="4"
        weight="semibold"
        @click="expanded = !expanded"
      >
        خدمات درخواستی
      </Typography>
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

    <QSlideTransition v-if="isExpandable">
      <div v-show="expanded" class="tps__items-content">
        <template v-if="loading">
          <div class="tps__skeleton">
            <QList bordered class="tps__list">
              <QItem v-for="n in 1" :key="n" class="tps__list-item">
                <QItemSection>
                  <QItemLabel class="tps__item-header">
                    <div class="row">
                      <QSkeleton type="QRadio" class="q-mr-sm" width="20px" height="20px" />
                      <QSkeleton type="text" width="150px" />
                    </div>
                  </QItemLabel>
                  <QSeparator />
                  <div class="tps__item-content">
                    <QSkeleton type="text" width="100px" class="q-mb-sm" />
                    <QSkeleton type="text" width="200px" />
                    <QSkeleton type="text" width="150px" />
                  </div>
                </QItemSection>
              </QItem>
            </QList>
          </div>
        </template>
        <template v-else>
          <template v-if="isEdit">
            <div v-if="existingServices?.length" class="tps__items">
              <QList bordered class="tps__list">
                <QItem
                  v-for="item in existingServices"
                  :key="item.id"
                  tag="label"
                  :clickable="!newService"
                  flat
                  class="tps__list-item"
                  :class="{
                    'tps__list-item--selected': isItemSelected(item),
                    'tps__list-item--disabled': !!newService,
                  }"
                >
                  <QItemSection>
                    <QItemLabel class="tps__item-header">
                      <div>
                        <QRadio
                          v-model="selectedItemValue"
                          :val="item.serveId || item.id"
                          :disable="!!newService"
                          color="primary"
                          @update:model-value="handleRadioChange(item)"
                        />
                        <span>{{ item.title || item.serveTitle }}</span>
                      </div>
                      <div v-if="showPrice && mode !== TREATMENT_PLAN_MODE.DRAFT">
                        <AnimatedNumber :number="calculateItemPrice(item)" />
                        تومان
                      </div>
                    </QItemLabel>
                    <QSeparator />
                    <div class="tps__item-content">
                      <QItemLabel v-if="item.teeth?.length" caption class="tps__teeth">
                        <template v-for="section in item.convertedTeeth" :key="section.key">
                          <div v-if="section.teeth.length > 0" class="tps__teeth-item">
                            <div>{{ section.title }}</div>
                            <div class="tps__teeth-item-teeth">
                              <span
                                v-for="tooth in section.teeth"
                                :key="tooth"
                                class="teeth"
                                :class="section?.key ? `teeth__${section.key}` : ''"
                              >
                                {{ tooth }}
                              </span>
                            </div>
                          </div>
                        </template>
                      </QItemLabel>

                      <div v-if="item.questions?.length" class="tps__questions">
                        <template v-for="question in item.questions" :key="question.id">
                          <QItemLabel
                            v-if="getFilteredQuestionItems(question).length > 0"
                            caption
                            class="tps__item-question"
                          >
                            <div>
                              <div class="tps__item-question-title">
                                <Typography
                                  variant="body"
                                  size="4"
                                  weight="bold"
                                  class="tps__item-question-name"
                                >
                                  {{ getServeName(question, item) }}
                                </Typography>
                                <Typography
                                  v-if="getServeQuantity(question, item)"
                                  variant="caption"
                                  color="grey"
                                  class="tps__item-question-quantity"
                                >
                                  {{ getServeQuantity(question, item) }}
                                </Typography>
                              </div>
                            </div>
                            <div v-if="showPrice && mode !== TREATMENT_PLAN_MODE.DRAFT">
                              <AnimatedNumber
                                :number="Number(calculateServePrice(question, item))"
                              />
                              تومان
                            </div>
                          </QItemLabel>
                        </template>
                      </div>
                    </div>
                  </QItemSection>
                </QItem>
              </QList>
            </div>
          </template>
          <template v-else>
            <div v-if="itemList?.length" class="tps__items">
              <template v-for="item in itemList" :key="item.id">
                <div v-if="item.teeth?.length || item.questions?.length">
                  <QCard flat bordered>
                    <QCardSection>
                      <div>
                        <div class="tps__item-header">
                          <div>
                            {{ item.serveTitle || item.title }}
                          </div>
                          <div v-if="showPrice && mode !== TREATMENT_PLAN_MODE.DRAFT">
                            <AnimatedNumber :number="calculateItemPrice(item)" />
                            تومان
                          </div>
                        </div>
                        <QSeparator />

                        <div v-if="item.teeth?.length" class="q-my-sm">
                          <Typography variant="caption" color="grey" weight="semibold">
                            دندان ها
                          </Typography>
                        </div>
                        <div v-if="item.teeth?.length" class="tps__teeth">
                          <template v-for="section in item.convertedTeeth" :key="section.key">
                            <div v-if="section.teeth.length > 0" class="tps__teeth-item">
                              <div class="tps__teeth-item-teeth">
                                <span
                                  v-for="tooth in section.teeth"
                                  :key="tooth"
                                  class="teeth"
                                  :class="section?.key ? `teeth__${section.key}` : ''"
                                >
                                  {{ tooth }}
                                </span>
                              </div>
                              <QSeparator vertical />
                            </div>
                          </template>
                        </div>
                        <QSeparator v-if="item.questions?.length" class="q-mb-sm" />
                        <div v-if="item.questions?.length" class="q-my-sm">
                          <Typography variant="caption" color="blue-grey" weight="semibold">
                            خدمات اختصاصی
                          </Typography>
                        </div>

                        <template v-for="question in item.questions" :key="question.id">
                          <div
                            v-if="getFilteredQuestionItems(question).length > 0"
                            class="tps__item-question"
                          >
                            <div>
                              <span
                                v-if="isRemovedItem(question, item)"
                                class="tps__item-question-removed"
                              >
                                <IconAlertTriangle stroke="1.2" size="16" />
                              </span>
                              <div class="tps__item-question-title">
                                <Typography
                                  variant="body"
                                  size="4"
                                  weight="bold"
                                  class="tps__item-question-name"
                                >
                                  {{ getServeName(question, item) }}
                                </Typography>
                                <Typography
                                  v-if="getServeQuantity(question, item)"
                                  variant="caption"
                                  color="grey"
                                  class="tps__item-question-quantity"
                                >
                                  {{ getServeQuantity(question, item) }}
                                </Typography>
                              </div>
                            </div>
                            <div v-if="showPrice && mode !== TREATMENT_PLAN_MODE.DRAFT">
                              <AnimatedNumber
                                :number="Number(calculateServePrice(question, item))"
                              />
                              تومان
                            </div>
                          </div>
                        </template>
                      </div>
                    </QCardSection>
                  </QCard>
                </div>
              </template>
            </div>
          </template>
          <div v-if="!itemList?.length || (isEdit && !existingServices?.length)">
            <QCard flat bordered>
              <QCardSection>
                <div class="tps__no-items">
                  <div>
                    <IconDentalOff stroke="1.5" size="32" class="tps__no-items-icon" />
                  </div>
                  <div class="tps__no-items-text">
                    <div>هنوز خدمتی انتخاب نشده</div>

                    <span>خدمات انتخاب شده اینجا نمایش داده می‌شوند</span>
                  </div>
                </div>
              </QCardSection>
            </QCard>
          </div>
        </template>

        <template v-if="isEdit">
          <div v-if="newService" class="tps__new-service">
            <div class="tps__new-service-title">خدمت جدید اضافه شده:</div>
            <QCard bordered flat class="tps__new-service-card">
              <QCardSection
                class="tps__new-service-item"
                :class="{ 'tps__new-service-item--selected': isItemSelected(newService) }"
              >
                <QItemLabel class="tps__new-service-header">
                  <div>
                    <QRadio
                      v-model="selectedItemValue"
                      :val="newService.serveId || newService.id"
                      color="primary"
                      @update:model-value="handleRadioChange(newService)"
                    />
                    <span>{{ newService.title || newService.serveTitle }}</span>
                  </div>
                  <div v-if="showPrice && mode !== TREATMENT_PLAN_MODE.DRAFT">
                    <AnimatedNumber :number="calculateItemPrice(newService)" />
                    تومان
                  </div>
                </QItemLabel>
                <QSeparator />
                <div class="tps__new-service-content">
                  <QItemLabel v-if="newService.teeth?.length" caption class="tps__teeth">
                    <template v-for="section in newService.convertedTeeth" :key="section.key">
                      <div v-if="section.teeth.length > 0" class="tps__teeth-item">
                        <div>{{ section.title }}</div>
                        <div class="tps__teeth-item-teeth">
                          <span
                            v-for="tooth in section.teeth"
                            :key="tooth"
                            class="teeth"
                            :class="section?.key ? `teeth__${section.key}` : ''"
                          >
                            {{ tooth }}
                          </span>
                        </div>
                      </div>
                    </template>
                  </QItemLabel>

                  <div v-if="newService.questions?.length" class="tps__questions">
                    <template v-for="question in newService.questions" :key="question.id">
                      <QItemLabel
                        v-if="getFilteredQuestionItems(question).length > 0"
                        caption
                        class="tps__item-question"
                      >
                        <div>
                          <span
                            v-if="isRemovedItem(question, newService)"
                            class="tps__item-question-removed"
                          >
                            <IconAlertTriangle stroke="1.2" size="16" />
                          </span>
                          <div class="tps__item-question-title">
                            <Typography
                              variant="body"
                              size="4"
                              weight="bold"
                              class="tps__item-question-name"
                            >
                              {{ getServeName(question, newService) }}
                            </Typography>
                            <Typography
                              v-if="getServeQuantity(question, newService)"
                              variant="caption"
                              color="grey"
                              class="tps__item-question-quantity"
                            >
                              {{ getServeQuantity(question, newService) }}
                            </Typography>
                          </div>
                        </div>
                        <div v-if="showPrice && mode !== TREATMENT_PLAN_MODE.DRAFT">
                          <AnimatedNumber
                            :number="Number(calculateServePrice(question, newService))"
                          />
                          تومان
                        </div>
                      </QItemLabel>
                    </template>
                  </div>
                </div>
              </QCardSection>
            </QCard>
          </div>

          <div class="tps__add-service">
            <QBtn
              v-show="!showAddService && !newService"
              unelevated
              class="tps__add-service-btn"
              @click="showAddService = true"
            >
              <span class="tps__add-service-text">خدمت جدید</span>
              <QSpace />
              <IconSquareRoundedPlus size="18" />
            </QBtn>

            <QSlideTransition>
              <QCard v-show="showAddService" flat bordered class="tps__add-service-card">
                <QCardSection class="tps__add-service-content">
                  <div class="tps__service-select-label">خدمت جدید از انتخاب کنید:</div>
                  <QSelect
                    v-model="selectedService"
                    :options="availableServices"
                    :disable="!!newService"
                    option-label="title"
                    option-value="serveId"
                    placeholder="خدمت مورد نظر را انتخاب کنید"
                    outlined
                    dense
                    class="tps__service-dropdown"
                    emit-value
                    map-options
                    autocomplete="on"
                    @update:model-value="handleServiceSelect"
                  >
                    <template #no-option>
                      <QItem>
                        <QItemSection class="text-grey">همه خدمات انتخاب شده‌اند</QItemSection>
                      </QItem>
                    </template>
                  </QSelect>

                  <QBanner v-if="selectedService" class="tps__alert-banner" rounded dense dark>
                    <template #avatar>
                      <IconExclamationCircle size="24" />
                    </template>
                    <span class="text-subtitle2">
                      همه خدمات مورد نیاز بیمار در طول درمان را وارد کنید
                    </span>
                  </QBanner>

                  <div v-if="currentStepNumber === 3" class="tps__action-buttons">
                    <QBtn
                      flat
                      color="grey"
                      class="tps__cancel-btn"
                      @click="handleDeleteItem(selectedServe)"
                    >
                      انصراف
                    </QBtn>
                    <QBtn
                      color="primary"
                      class="tps__submit-btn"
                      :loading="isPerformPending"
                      @click="handleSubmit"
                    >
                      ثبت خدمت
                    </QBtn>
                  </div>
                </QCardSection>
              </QCard>
            </QSlideTransition>
          </div>
        </template>
      </div>
    </QSlideTransition>
    <div v-else class="tps__items-content">
      <template v-if="loading">
        <div class="tps__skeleton">
          <QList bordered class="tps__list">
            <QItem v-for="n in 1" :key="n" class="tps__list-item">
              <QItemSection>
                <QItemLabel class="tps__item-header">
                  <div class="row">
                    <QSkeleton type="QRadio" class="q-mr-sm" width="20px" height="20px" />
                    <QSkeleton type="text" width="150px" />
                  </div>
                </QItemLabel>
                <QSeparator />
                <div class="tps__item-content">
                  <QSkeleton type="text" width="100px" class="q-mb-sm" />
                  <QSkeleton type="text" width="200px" />
                  <QSkeleton type="text" width="150px" />
                </div>
              </QItemSection>
            </QItem>
          </QList>
        </div>
      </template>
      <template v-else>
        <template v-if="isEdit">
          <div v-if="existingServices?.length" class="tps__items">
            <QList bordered class="tps__list">
              <QItem
                v-for="item in existingServices"
                :key="item.id"
                tag="label"
                :clickable="!newService"
                flat
                class="tps__list-item"
                :class="{
                  'tps__list-item--selected': isItemSelected(item),
                  'tps__list-item--disabled': !!newService,
                }"
              >
                <QItemSection>
                  <QItemLabel class="tps__item-header">
                    <div>
                      <QRadio
                        v-model="selectedItemValue"
                        :val="item.serveId || item.id"
                        :disable="!!newService"
                        color="primary"
                        @update:model-value="handleRadioChange(item)"
                      />
                      <span>{{ item.title || item.serveTitle }}</span>
                    </div>
                    <div v-if="showPrice && mode !== TREATMENT_PLAN_MODE.DRAFT">
                      <AnimatedNumber :number="calculateItemPrice(item)" />
                      تومان
                    </div>
                  </QItemLabel>
                  <QSeparator />
                  <div class="tps__item-content">
                    <QItemLabel v-if="item.teeth?.length" caption class="tps__teeth">
                      <template v-for="section in item.convertedTeeth" :key="section.key">
                        <div v-if="section.teeth.length > 0" class="tps__teeth-item">
                          <div>{{ section.title }}</div>
                          <div class="tps__teeth-item-teeth">
                            <span
                              v-for="tooth in section.teeth"
                              :key="tooth"
                              class="teeth"
                              :class="section?.key ? `teeth__${section.key}` : ''"
                            >
                              {{ tooth }}
                            </span>
                          </div>
                        </div>
                      </template>
                    </QItemLabel>

                    <div v-if="item.questions?.length" class="tps__questions">
                      <template v-for="question in item.questions" :key="question.id">
                        <QItemLabel
                          v-if="getFilteredQuestionItems(question).length > 0"
                          caption
                          class="tps__item-question"
                        >
                          <div>
                            <span
                              v-if="isRemovedItem(question, item)"
                              class="tps__item-question-removed"
                            >
                              <IconAlertTriangle stroke="1.2" size="16" />
                            </span>
                            <div class="tps__item-question-title">
                              <Typography
                                variant="body"
                                size="4"
                                weight="bold"
                                class="tps__item-question-name"
                              >
                                {{ getServeName(question, item) }}
                              </Typography>
                              <Typography
                                v-if="getServeQuantity(question, item)"
                                variant="caption"
                                color="grey"
                                class="tps__item-question-quantity"
                              >
                                {{ getServeQuantity(question, item) }}
                              </Typography>
                            </div>
                          </div>
                          <div v-if="showPrice && mode !== TREATMENT_PLAN_MODE.DRAFT">
                            <AnimatedNumber :number="Number(calculateServePrice(question, item))" />
                            تومان
                          </div>
                        </QItemLabel>
                      </template>
                    </div>
                  </div>
                </QItemSection>
              </QItem>
            </QList>
          </div>
        </template>
        <template v-else>
          <div v-if="itemList?.length" class="tps__items">
            <template v-for="item in itemList" :key="item.id">
              <div v-if="item.teeth?.length || item.questions?.length">
                <QCard flat bordered>
                  <QCardSection>
                    <div>
                      <div class="tps__item-header">
                        <div>
                          {{ item.serveTitle || item.title }}
                        </div>
                        <div v-if="showPrice && mode !== TREATMENT_PLAN_MODE.DRAFT">
                          <AnimatedNumber :number="calculateItemPrice(item)" />
                          تومان
                        </div>
                      </div>
                      <QSeparator />

                      <div v-if="item.teeth?.length" class="q-my-sm">
                        <Typography variant="caption" color="grey" weight="semibold">
                          دندان ها
                        </Typography>
                      </div>
                      <div v-if="item.teeth?.length" class="tps__teeth">
                        <template v-for="section in item.convertedTeeth" :key="section.key">
                          <div v-if="section.teeth.length > 0" class="tps__teeth-item">
                            <div class="tps__teeth-item-teeth">
                              <span
                                v-for="tooth in section.teeth"
                                :key="tooth"
                                class="teeth"
                                :class="section?.key ? `teeth__${section.key}` : ''"
                              >
                                {{ tooth }}
                              </span>
                            </div>
                            <QSeparator vertical />
                          </div>
                        </template>
                      </div>
                      <QSeparator v-if="item.questions?.length" class="q-mb-sm" />
                      <div v-if="item.questions?.length" class="q-my-sm">
                        <Typography variant="caption" color="blue-grey" weight="semibold">
                          خدمات اختصاصی
                        </Typography>
                      </div>

                      <template v-for="question in item.questions" :key="question.id">
                        <div
                          v-if="getFilteredQuestionItems(question).length > 0"
                          class="tps__item-question"
                        >
                          <div>
                            <div class="tps__item-question-title">
                              <Typography
                                variant="body"
                                size="4"
                                weight="bold"
                                class="tps__item-question-name"
                              >
                                <span
                                  v-if="isRemovedItem(question, item)"
                                  class="tps__item-question-removed"
                                >
                                  <IconAlertTriangle stroke="1.2" size="16" />
                                </span>
                                {{ getServeName(question, item) }}
                              </Typography>
                              <Typography
                                v-if="getServeQuantity(question, item)"
                                variant="caption"
                                color="grey"
                                class="tps__item-question-quantity"
                              >
                                {{ getServeQuantity(question, item) }}
                              </Typography>
                            </div>
                          </div>
                          <div v-if="showPrice && mode !== TREATMENT_PLAN_MODE.DRAFT">
                            <AnimatedNumber :number="Number(calculateServePrice(question, item))" />
                            تومان
                          </div>
                        </div>
                      </template>
                    </div>
                  </QCardSection>
                </QCard>
              </div>
            </template>
          </div>
        </template>
        <div v-if="!itemList?.length || (isEdit && !existingServices?.length)">
          <QCard flat bordered>
            <QCardSection>
              <div class="tps__no-items">
                <div>
                  <IconDentalOff stroke="1.5" size="32" class="tps__no-items-icon" />
                </div>
                <div class="tps__no-items-text">
                  <div>هنوز خدمتی انتخاب نشده</div>

                  <span>خدمات انتخاب شده اینجا نمایش داده می‌شوند</span>
                </div>
              </div>
            </QCardSection>
          </QCard>
        </div>
      </template>

      <template v-if="isEdit">
        <div v-if="newService" class="tps__new-service">
          <div class="tps__new-service-title">خدمت جدید اضافه شده:</div>
          <QCard bordered flat class="tps__new-service-card">
            <QCardSection
              class="tps__new-service-item"
              :class="{ 'tps__new-service-item--selected': isItemSelected(newService) }"
            >
              <QItemLabel class="tps__new-service-header">
                <div>
                  <QRadio
                    v-model="selectedItemValue"
                    :val="newService.serveId || newService.id"
                    color="primary"
                    @update:model-value="handleRadioChange(newService)"
                  />
                  <span>{{ newService.title || newService.serveTitle }}</span>
                </div>
                <div v-if="showPrice && mode !== TREATMENT_PLAN_MODE.DRAFT">
                  <AnimatedNumber :number="calculateItemPrice(newService)" />
                  تومان
                </div>
              </QItemLabel>
              <QSeparator />
              <div class="tps__new-service-content">
                <QItemLabel v-if="newService.teeth?.length" caption class="tps__teeth">
                  <template v-for="section in newService.convertedTeeth" :key="section.key">
                    <div v-if="section.teeth.length > 0" class="tps__teeth-item">
                      <div>{{ section.title }}</div>
                      <div class="tps__teeth-item-teeth">
                        <span
                          v-for="tooth in section.teeth"
                          :key="tooth"
                          class="teeth"
                          :class="section?.key ? `teeth__${section.key}` : ''"
                        >
                          {{ tooth }}
                        </span>
                      </div>
                    </div>
                  </template>
                </QItemLabel>

                <div v-if="newService.questions?.length" class="tps__questions">
                  <template v-for="question in newService.questions" :key="question.id">
                    <QItemLabel
                      v-if="getFilteredQuestionItems(question).length > 0"
                      caption
                      class="tps__item-question"
                    >
                      <div>
                        <span
                          v-if="isRemovedItem(question, newService)"
                          class="tps__item-question-removed"
                        >
                          <IconAlertTriangle stroke="1.2" size="16" />
                        </span>
                        <div class="tps__item-question-title">
                          <Typography
                            variant="body"
                            size="4"
                            weight="bold"
                            class="tps__item-question-name"
                          >
                            {{ getServeName(question, newService) }}
                          </Typography>
                          <Typography
                            v-if="getServeQuantity(question, newService)"
                            variant="caption"
                            color="grey"
                            class="tps__item-question-quantity"
                          >
                            {{ getServeQuantity(question, newService) }}
                          </Typography>
                        </div>
                      </div>
                      <div v-if="showPrice && mode !== TREATMENT_PLAN_MODE.DRAFT">
                        <AnimatedNumber
                          :number="Number(calculateServePrice(question, newService))"
                        />
                        تومان
                      </div>
                    </QItemLabel>
                  </template>
                </div>
              </div>
            </QCardSection>
          </QCard>
        </div>

        <div class="tps__add-service">
          <QBtn
            v-show="!showAddService && !newService"
            unelevated
            class="tps__add-service-btn"
            @click="showAddService = true"
          >
            <span class="tps__add-service-text">خدمت جدید</span>
            <QSpace />
            <IconSquareRoundedPlus size="18" />
          </QBtn>

          <QSlideTransition>
            <QCard v-show="showAddService" flat bordered class="tps__add-service-card">
              <QCardSection class="tps__add-service-content">
                <div class="tps__service-select-label">خدمت جدید از انتخاب کنید:</div>
                <QSelect
                  v-model="selectedService"
                  :options="availableServices"
                  :disable="!!newService"
                  option-label="title"
                  option-value="serveId"
                  placeholder="خدمت مورد نظر را انتخاب کنید"
                  outlined
                  dense
                  class="tps__service-dropdown"
                  emit-value
                  map-options
                  autocomplete="on"
                  @update:model-value="handleServiceSelect"
                >
                  <template #no-option>
                    <QItem>
                      <QItemSection class="text-grey">همه خدمات انتخاب شده‌اند</QItemSection>
                    </QItem>
                  </template>
                </QSelect>

                <QBanner v-if="selectedService" class="tps__alert-banner" rounded dense dark>
                  <template #avatar>
                    <IconExclamationCircle size="24" />
                  </template>
                  <span class="text-subtitle2">
                    همه خدمات مورد نیاز بیمار در طول درمان را وارد کنید
                  </span>
                </QBanner>

                <div v-if="currentStepNumber === 3" class="tps__action-buttons">
                  <QBtn
                    flat
                    color="grey"
                    class="tps__cancel-btn"
                    @click="handleDeleteItem(selectedServe)"
                  >
                    انصراف
                  </QBtn>
                  <QBtn
                    color="primary"
                    class="tps__submit-btn"
                    :loading="isPerformPending"
                    @click="handleSubmit"
                  >
                    ثبت خدمت
                  </QBtn>
                </div>
              </QCardSection>
            </QCard>
          </QSlideTransition>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { watch, ref, computed } from 'vue'
import {
  QRadio,
  QList,
  QItem,
  QItemSection,
  QItemLabel,
  QCardActions,
  QSlideTransition,
  QBtn,
  QSpace,
  QSkeleton,
  QCard,
  QCardSection,
  QSeparator,
  QSelect,
  QBanner,
} from 'quasar'
import { useGetServeItemsQuery } from '../../query'
import { calculateServeTitle } from '../../utils/teeth'
import {
  IconAlertTriangle,
  IconDentalOff,
  IconSquareRoundedPlus,
  IconExclamationCircle,
} from '@tabler/icons-vue'
import { useTpProvider } from '../../composables/use-tp-provider'
import { useRoute } from 'vue-router'
import { useTpPerform } from '../../composables/use-tp-perform'
import AnimatedNumber from '@/components/AnimatedNumber'
import { calculateServePrice } from '../../utils/pricing'
import { useTpStatus } from '../../composables/use-tp-status'
import { QUESTION_TYPE, TREATMENT_PLAN_MODE } from '../../constants/enums'
import Typography from '@/base/Typography'

const props = defineProps({
  itemList: {
    type: Array,
    required: true,
  },
  calculateItemPrice: {
    type: Function,
    required: false,
    default: () => 0,
  },
  isEdit: {
    type: Boolean,
    default: true,
  },
  isExpandable: {
    type: Boolean,
    default: true,
  },
  showPrice: {
    type: Boolean,
    default: false,
  },
  showTitle: {
    type: Boolean,
    default: true,
  },
})

const route = useRoute()
const { treatmentData, selectedServe, onSelectServe, removeService } = useTpProvider([
  'treatmentData',
  'selectedServe',
  'onSelectServe',
  'removeService',
])

const { currentStepNumber, mode } = useTpStatus(treatmentData)
const { performTpAction, isPerformPending } = useTpPerform()

const { data: serveItems } = useGetServeItemsQuery(
  { treatmentPlanId: route.params?.id },
  { enabled: computed(() => props.isEdit) }
)

const selectedItemValue = ref(null)
const loading = ref(props.isEdit)
const expanded = ref(!props.isExpandable)
const showAddService = ref(false)
const selectedService = ref(null)
const newlyAddedService = ref(null)

watch(
  serveItems,
  (val) => {
    if (props.isEdit) loading.value = !val
  },
  { immediate: true }
)

watch(
  selectedServe,
  (newValue) => {
    if (newValue) {
      selectedItemValue.value = newValue.serveId
    } else if (props.itemList?.length > 0) {
      const firstItem = props.itemList[0]
      selectedItemValue.value = firstItem.serveId || firstItem.id

      // Select the first serve if available and onSelectServe function exists
      if (onSelectServe && typeof onSelectServe === 'function') {
        const firstServe = serveItems?.value?.find(
          (s) => s.serveId === (firstItem.serveId || firstItem.id)
        )
        if (firstServe) {
          onSelectServe(firstServe)
        }
      }
    } else {
      selectedItemValue.value = null
    }
  },
  { immediate: true }
)

const isItemSelected = (item) => {
  if (!selectedServe?.value) return false
  return selectedServe.value.serveId === (item.serveId || item.id)
}

const isNewService = (item) => {
  const serveId = item.serveId || item.id
  return newlyAddedService.value === serveId
}

const handleRadioChange = (item) => {
  if (!onSelectServe || typeof onSelectServe !== 'function') return

  const serve = serveItems?.value?.find((s) => s.serveId === (item.serveId || item.id))
  if (serve) {
    onSelectServe(serve)
  }
}

const isRemovedItem = (question, item) => {
  if (question.type === QUESTION_TYPE.PER_TEETH) return false
  const updatedQuestion = serveItems?.value
    ?.find((serve) => serve.serveId === item.serveId)
    ?.questions?.find((_q) => _q.id === question.id)
  const selectedItemId = question?.items?.[0]?.id
  return !!selectedItemId && !updatedQuestion?.items?.find((_item) => _item.id === selectedItemId)
}

const getFilteredQuestionItems = (question) => {
  if (!question?.items || question.type !== 1) {
    return question?.items || []
  }

  return question.items
}

const handleCancel = () => {
  if (!props.isEdit) return
  // If there's a new service, remove it from the service list
  if (newlyAddedService.value && removeService && typeof removeService === 'function') {
    const service = serveItems?.value?.find((s) => s.serveId === newlyAddedService.value)
    if (service) {
      removeService(service)
    }
  }

  selectedService.value = null
  showAddService.value = false
  newlyAddedService.value = null
}

const handleDeleteItem = (item) => {
  if (!props.isEdit) return
  const service = serveItems?.value?.find((s) => s.serveId === (item.serveId || item.id))
  if (service && isNewService(service) && removeService && typeof removeService === 'function') {
    removeService(service)
    newlyAddedService.value = null

    if (showAddService.value) {
      handleCancel()
    }
  } else {
    handleCancel()
  }
}

const selectedServeIds = computed(() => {
  return new Set(props.itemList?.map((item) => item.serveId || item.id) || [])
})

const availableServices = computed(() => {
  if (!serveItems?.value) return []

  return serveItems.value.filter(
    (service) => service?.questions?.length > 0 && !selectedServeIds.value.has(service.serveId)
  )
})

const existingServices = computed(() => {
  return props.itemList?.filter((item) => !isNewService(item)) || []
})

const newService = computed(() => {
  return props.itemList?.find((item) => isNewService(item)) || null
})

const handleServiceSelect = (serviceId) => {
  if (!serviceId || !onSelectServe || typeof onSelectServe !== 'function') return

  const service = availableServices.value.find((s) => s.serveId === serviceId)
  if (service) {
    newlyAddedService.value = serviceId
    onSelectServe(service)
  }
}

const handleSubmit = () => {
  performTpAction(props.itemList, {
    onSuccess: () => {
      newlyAddedService.value = null
      showAddService.value = false
      selectedService.value = null
    },
  })
}

/**
 * Parse service title into name and quantity components
 * @param {Object} question - Question object containing title and type
 * @param {Object} item - Item object containing selection details
 * @returns {{ name: string, quantity: string }} Object with parsed name and quantity
 *
 * @example
 * parseServeTitle(question, item) // { name: "بلیچینگ", quantity: "۲ واحد" }
 */
const parseServeTitle = (question, item) => {
  try {
    // Validate inputs
    if (!question || typeof question !== 'object') {
      return { name: '', quantity: '' }
    }
    if (!item || typeof item !== 'object') {
      return { name: '', quantity: '' }
    }

    const title = calculateServeTitle(question, item)
    if (!title) return { name: '', quantity: '' }

    // Special handling for PER_TEETH type which returns "5 دندان" (no colon)
    if (question.type === QUESTION_TYPE.PER_TEETH) {
      return {
        name: question.title || 'دندان',
        quantity: title, // "5 دندان"
      }
    }

    // Split on first colon only for more robust parsing
    const firstColonIndex = title.indexOf(' : ')
    if (firstColonIndex === -1) {
      return { name: title, quantity: '' }
    }

    return {
      name: title.slice(0, Math.max(0, firstColonIndex)).trim(),
      quantity: title.slice(Math.max(0, firstColonIndex + 3)).trim(),
    }
  } catch (error) {
    console.error('Error parsing serve title:', error)
    return { name: '', quantity: '' }
  }
}

/**
 * Get service name from full title string
 * @param {Object} question - Question object containing title and type
 * @param {Object} item - Item object containing selection details
 * @returns {string} Service name without quantity
 */
const getServeName = (question, item) => parseServeTitle(question, item).name

/**
 * Get service quantity from full title string
 * @param {Object} question - Question object containing title and type
 * @param {Object} item - Item object containing selection details
 * @returns {string} Service quantity with units
 */
const getServeQuantity = (question, item) => parseServeTitle(question, item).quantity
</script>

<style lang="scss" scoped>
.tps {
  border: 1px solid $grey-3;
  border-radius: 0.5rem;

  &__pricing-title {
    font-weight: bold;
    margin: 0.5rem 0;
  }

  &__items-content {
    padding: 1rem;
  }

  &__top {
    cursor: pointer;
  }

  &__item-content {
    padding: 0.5rem;
  }

  &__list {
    border-radius: 0.5rem;
    overflow: hidden;
    border: none;

    .q-item {
      &:hover {
        background-color: $grey-1;
      }
    }
  }

  &__list-item {
    border: 1px solid $grey-4;
    border-radius: 12px;
    margin-bottom: 0.5rem;
    padding: 0;
    background: white;
  }

  &__list-item--selected {
    border: 1px solid $blue-2;
  }

  &__list-item--disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  &__item-header {
    font-size: 0.875rem;
    font-weight: bold;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    padding: 0.5rem;
  }

  &__item-price {
    color: $primary;
    font-weight: bold;
  }

  &__questions {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid $grey-4;
  }

  &__teeth {
    display: flex;
    align-items: center;
    width: 100%;
    flex-wrap: wrap;
    gap: $spacing-md;
  }
  &__teeth-item {
    font-size: 0.75rem;
    color: $blue-gray;
    display: flex;
    margin: 0.5rem 0;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  &__teeth-item-teeth {
    display: flex;
    gap: $spacing-sm;
  }

  &__item-question {
    color: $blue-gray;
    font-size: 0.75rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: $spacing-lg 0;
  }

  &__item-question-title {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  &__item-question-name {
    line-height: 1.2;
    display: flex;
    align-items: center;
    gap: $spacing-xs;
  }

  &__item-question-quantity {
    line-height: 1.2;
  }

  &__item-question-removed {
    color: $danger;
  }

  &__skeleton {
    .q-item {
      pointer-events: none;
    }
  }

  &__add-service {
    margin-top: 1rem;
  }

  &__add-service-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    border: 1px solid $grey-4;
    border-radius: 8px;
    background-color: $white;
    color: $grey-8;

    &:hover {
      border-color: $primary;
      background-color: $white;
    }

    :deep(.q-btn__content) {
      justify-content: space-between;
      width: 100%;
    }
  }

  &__add-service-text {
    flex: 1;
    text-align: right;
    margin: 0 0.5rem;
  }

  &__add-service-card {
    margin-top: 0.5rem;
    border: 1px solid $grey-4;
    background-color: $white;
  }

  &__add-service-content {
    padding: 1rem;
  }

  &__service-select-label {
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
    color: $grey-8;
  }

  &__service-dropdown {
    width: 100%;
  }

  &__alert-banner {
    margin-top: 0.5rem;
    background-color: $yellow-9;

    .text-subtitle2 {
      font-size: 0.8rem;
    }
  }

  &__action-buttons {
    display: flex;
    gap: 0.75rem;
    margin-top: 1rem;
    justify-content: flex-end;
  }

  &__cancel-btn {
    min-width: 80px;
  }

  &__submit-btn {
    min-width: 180px;
  }

  &__new-service {
    margin-top: 1rem;
  }

  &__new-service-title {
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
    color: $grey-8;
  }

  &__new-service-card {
    border-radius: 0.5rem;
    border: 1px solid $grey-4;
    background-color: $white;
  }

  &__new-service-item {
    padding: 0;
    border-radius: 12px;
  }

  &__new-service-item--selected {
    border: 1px solid $blue-2;
  }

  &__new-service-header {
    font-size: 0.875rem;
    font-weight: bold;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    padding: 0.5rem;
  }

  &__new-service-content {
    padding: 0.5rem;
  }

  // Read-only mode styles from TpServicesList
  &__no-items {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: map-get($space-md, x);
  }

  &__no-items-icon {
    color: $grey-8;
  }

  &__no-items-text {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    gap: 0.25rem;

    & > div:first-child {
      font-size: 1rem;
      font-weight: 600;
      color: $grey-8;
      margin-bottom: 0.25rem;
    }

    & > span:nth-child(2) {
      font-size: 0.875rem;
      color: $grey-6;
      line-height: 1.4;
    }
  }

  &__items {
    color: $gray-900;
    margin-top: 1rem;

    & > div {
      margin-bottom: 1rem;
    }
  }
}
</style>
