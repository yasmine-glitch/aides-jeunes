<template>
  <div>
    <div>
      <label class="fr-px-2v" for="cp">
        <span class="fr-text--lead fr-text--bold">{{ codePostalLabel }}</span>
        <EnSavoirPlus />
        <span class="fr-hint-text fr-mt-1w"
          >À la saisie d'un code postal valide, la liste des communes associées
          sera affichée automatiquement.</span
        >
      </label>

      <div class="fr-container fr-px-0 fr-mt-2w">
        <div class="fr-grid-row">
          <div class="fr-col-12 fr-col-md-6 fr-col-lg-4">
            <input
              id="cp"
              v-model="codePostalValue"
              data-testid="postalCode"
              data-type="number"
              inputmode="numeric"
              pattern="[0-9]*"
              type="text"
              class="fr-input"
              autocomplete="postal-code"
            />
          </div>
        </div>
      </div>
    </div>

    <div v-if="retrievingCommunes" class="fr-mt-4w">
      <span
        class="fr-icon--xl fr-icon-refresh-line fr-icon-spin"
        aria-hidden="true"
      ></span>
    </div>
    <div v-show="communes?.length" class="fr-input-group fr-mb-2w fr-mt-4w">
      <label class="fr-label fr-pr-3w" for="commune"
        ><span class="fr-text--lead fr-text--bold"
          >Veuillez sélectionner la ville qui correspond</span
        >
      </label>
      <div class="fr-container fr-px-0 fr-mt-4w">
        <div class="fr-grid-row">
          <div class="fr-col-12 fr-col-md-6 fr-col-lg-4">
            <select
              id="commune"
              ref="commune"
              v-model="nomCommuneValue"
              class="fr-select"
            >
              <option
                v-for="(commune, index) in communes"
                :key="`commune_${index}`"
                :value="commune.nom"
              >
                {{ commune.nom }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Commune from "@/lib/commune.ts"
import EnSavoirPlus from "@/components/en-savoir-plus.vue"
import { useStore } from "@/stores/index.ts"

export default {
  name: "InputDepCom",
  components: {
    EnSavoirPlus,
  },
  props: {
    codePostal: String,
    codePostalLabel: String,
    nomCommune: String,
    matchingCommune: Object,
  },
  emits: ["update:nomCommune", "update:codePostal", "update:matchingCommune"],
  setup() {
    return {
      store: useStore(),
    }
  },
  data() {
    return {
      codePostalValue: this.codePostal,
      nomCommuneValue: this.nomCommune,
      retrievingCommunes: false,
      communes: [],
    }
  },
  watch: {
    codePostalValue: function (cp) {
      this.nomCommuneValue = null
      this.communes = []
      if (cp?.length == 5) {
        this.$emit("update:codePostal", cp)
        this.fetchCommune(true)
      }
    },
    nomCommuneValue: function (commune) {
      this.$emit("update:nomCommune", commune)
      this.updateMatchingCommune()
    },
    communes: function (communesList) {
      if (communesList?.length) {
        this.updateMatchingCommune()
      }
    },
  },
  beforeMount() {
    if (this.codePostalValue?.length == 5) {
      this.fetchCommune()
    }
  },
  methods: {
    updateMatchingCommune() {
      this.$emit(
        "update:matchingCommune",
        this.communes.find((c) => c.nom == this.nomCommuneValue)
      )
    },
    async fetchCommune(focusCommune) {
      if (
        !this.codePostalValue ||
        this.codePostalValue.toString().length !== 5
      ) {
        return []
      }
      this.retrievingCommunes = true
      return Commune.get(this.codePostalValue)
        .then((communes) => {
          if (communes.length <= 0) {
            this.$matomo?.trackEvent(
              "General",
              "Depcom introuvable",
              `Code postal : ${this.codePostalValue}`
            )
            this.store.updateError(
              "Le code postal est invalide. Le simulateur accepte uniquement les codes postaux français pour le moment."
            )
            return []
          }
          this.store.updateError(null)
          if (!communes.map((c) => c.nom).includes(this.nomCommuneValue)) {
            this.nomCommuneValue = Commune.getMostPopulated(communes).nom
          }
          this.communes = communes
          if (focusCommune) {
            this.$nextTick(() => this.$refs.commune.focus())
          }
          return communes
        })
        .catch(() => {
          return []
        })
        .finally(() => {
          this.retrievingCommunes = false
        })
    },
  },
}
</script>
