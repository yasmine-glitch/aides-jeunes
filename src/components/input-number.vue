<template>
  <input
    :id="id"
    ref="result"
    v-model.number="model"
    v-select-on-click
    :data-testid="id"
    :name="name"
    :data-type="dataType"
    type="text"
    class="fr-input"
    :class="dataType !== 'count' ? 'fr-text--right' : ''"
    inputmode="decimal"
    :aria-labelledby="ariaLabelledBy || null"
    @input="normalizeInput($event)"
  />
  <WarningMessage v-if="error" class="fr-mt-2w"
    >Ce champ n'est pas valide.</WarningMessage
  >
</template>

<script>
import WarningMessage from "@/components/warning-message.vue"
export default {
  name: "InputNumber",
  components: { WarningMessage },
  props: {
    id: String,
    name: String,
    ariaLabelledBy: String,
    min: { type: Number, default: null },
    max: { type: Number, default: null },
    dataType: { type: String, default: "amount" },
    value: { type: [Number, String] },
    modelValue: { type: [Number, String] },
    emit: { type: Boolean, default: true },
  },
  emits: ["input", "update:modelValue"],
  data: function () {
    return {
      result: this.result,
      error: false,
    }
  },
  computed: {
    model: {
      get() {
        return this.value || this.modelValue || ""
      },
      set(value) {
        if (typeof value === "string") {
          value = this.parseInputString(value)
        }
        value = value == "" ? 0 : value
        const valid = !isNaN(parseFloat(value))
        const floor = this.min == null || this.min <= parseFloat(value)
        const ceiling = this.max == null || this.max >= parseFloat(value)
        if (valid && floor && ceiling) {
          this.error = false
          this.$emit("update:modelValue", parseFloat(value))
        } else {
          this.error = true
          this.$emit("update:modelValue", value)
        }
      },
    },
  },
  methods: {
    normalizeInput(event) {
      event.target.value = this.parseInputString(event.target.value)
    },
    parseInputString(value) {
      return value.replace(/,/g, ".").replace(/[^\d-.]/g, "")
    },
  },
}
</script>
