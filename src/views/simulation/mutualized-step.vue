<template>
  <form @submit.prevent="onSubmit">
    <fieldset class="fr-fieldset">
      <legend class="fr-fieldset__legend">
        <MutualizedStepTitle
          :for-title-wrapper="fieldName ? fieldName : null"
          :question="question"
          :show-more-info="showMoreInfo"
          :help="step.help"
        ></MutualizedStepTitle>
      </legend>
      <div class="fr-fieldset__content">
        <div class="fr-container fr-px-0">
          <div class="fr-grid-row">
            <div class="fr-col-12 fr-col-md-8 fr-col-lg-8">
              <div class="fr-form-group">
                <div v-if="questionType === 'enum'">
                  <div
                    v-for="(item, index) in step.getItems(propertyData)"
                    :key="`${item.value}`"
                    class="fr-radio-group fr-radio-rich fr-mt-1w"
                  >
                    <input
                      :id="`${item.value}`"
                      v-model="value"
                      type="radio"
                      :name="fieldName"
                      :value="item.value"
                      :autofocus="index === 0"
                    />
                    <label :for="`${item.value}`" class="fr-label">
                      <span
                        >{{ item.label }}
                        <i v-if="item.hint" class="fr-text--sm fr-ml-1w">{{
                          item.hint
                        }}</i></span
                      >
                    </label>
                  </div>
                </div>
                <div v-else-if="questionType === 'number'">
                  <InputNumber
                    :id="fieldName"
                    v-model="value"
                    :min="step.min"
                    :max="step.max"
                    :data-type="step.type"
                    ariaLabelledBy="step-question"
                  />
                </div>
                <InputDate
                  v-else-if="questionType === 'date'"
                  :id="fieldName"
                  v-model="value"
                />
                <MultipleAnswers
                  v-else-if="questionType === 'multiple'"
                  v-model="value"
                  :items="step.getItems(propertyData)"
                />
                <input
                  v-else-if="questionType === 'text'"
                  :id="fieldName"
                  v-model="value"
                  aria-labelledby="step-question"
                  :data-testid="fieldName"
                  type="text"
                  class="fr-input"
                />
                <YesNoQuestion v-else v-model="value"></YesNoQuestion>
              </div>
            </div>
          </div>
        </div>
      </div>
    </fieldset>

    <ActionButtons :on-submit="onSubmit" :disable-submit="!canSubmit(false)" />
  </form>
</template>

<script>
import ActionButtons from "@/components/action-buttons.vue"
import MultipleAnswers from "@/components/multiple-answers.vue"
import YesNoQuestion from "@/components/yes-no-question.vue"
import MutualizedStepTitle from "@/components/mutualized-step-title.vue"
import Hint from "@/lib/hint.ts"

import { executeFunctionOrReturnValue } from "@lib/utils.ts"
import InputNumber from "@/components/input-number.vue"
import InputDate from "@/components/input-date.vue"
import { ENTITIES_PROPERTIES } from "@lib/mutualized-steps"
import { getAnswer, nullifyUndefinedValue } from "@lib/answers.ts"
import { useIndividu } from "@/composables/individu.ts"
import { useStore } from "@/stores/index.ts"

export default {
  name: "MutualizedStep",
  components: {
    ActionButtons,
    InputNumber,
    InputDate,
    MultipleAnswers,
    YesNoQuestion,
    MutualizedStepTitle,
  },
  setup() {
    return {
      store: useStore(),
    }
  },
  data() {
    const entityName = this.$route.path.split("/")[2]
    const id = (this.params || this.$route.params).id
    const value = getAnswer(
      this.store.simulation.answers.all,
      entityName,
      this.$route.params.fieldName,
      id
    )

    return {
      id,
      value,
      entityName,
    }
  },
  computed: {
    entityProperties() {
      return ENTITIES_PROPERTIES[this.entityName]
    },
    fieldName() {
      return this.$route.params.fieldName
    },
    question() {
      return this.step.getQuestion(this.propertyData)
    },
    questionType() {
      return this.step?.questionType
    },
    showMoreInfo() {
      const showMoreInfo =
        this.step.showMoreInfo === undefined ||
        executeFunctionOrReturnValue(
          this.step,
          "showMoreInfo",
          this.propertyData
        )
      return Boolean(showMoreInfo && Hint.get(this.fieldName))
    },
    individu() {
      if (this.entityName === "individu") {
        return useIndividu(this.$route.params.id)
      } else {
        return useIndividu("demandeur")
      }
    },
    propertyData() {
      return {
        openFiscaParameters: this.store.openFiscaParameters,
        simulation: this.store.simulation,
        individu: this.individu,
        periods: this.store.dates,
      }
    },
    step() {
      return this.entityProperties[this.fieldName]
    },
  },
  methods: {
    onSubmit() {
      if (!this.canSubmit(true)) {
        return
      }
      this.store.answer({
        id: this.id,
        entityName: this.entityName,
        fieldName: this.fieldName,
        path: this.$route.path,
        value: nullifyUndefinedValue(this.value),
      })
      this.$push()
    },
    requiredValueMissing(submit) {
      const hasError =
        this.value === undefined ||
        (this.questionType === "text" && !this.value)

      if (submit) {
        this.store.updateError(hasError && "Ce champ est obligatoire.")
      }

      return hasError
    },
    canSubmit(submit) {
      return this.step.optional || !this.requiredValueMissing(submit)
    },
  },
}
</script>
