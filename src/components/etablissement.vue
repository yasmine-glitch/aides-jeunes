<template>
  <div class="fr-tile fr-tile--horizontal fr-mb-6w">
    <div v-if="etablissement" class="fr-container fr-p-4w">
      <h2 class="fr-tile__title fr-mb-3w">
        {{ etablissement.nom }}
      </h2>
      <address v-if="etablissement.adresse" class="fr-hint-text fr-mb-3w">
        <span
          class="fr-icon--sm fr-icon-home-4-line fr-mr-1w"
          aria-hidden="true"
        ></span>
        Adresse :
        <span
          >{{ etablissement.adresse.lignes.join(", ") }}
          {{ etablissement.adresse.codePostal }}
          {{ etablissement.adresse.commune }}</span
        >
      </address>
      <div
        v-if="etablissement.telephone"
        class="fr-hidden fr-unhidden-sm fr-mb-3w"
      >
        <span
          class="fr-icon--sm fr-icon-phone-fill fr-mr-1w"
          aria-hidden="true"
        ></span>
        {{ etablissement.telephone }}
      </div>
      <div v-if="etablissement.horaires" class="fr-mb-3w">
        <div class="fr-mb-2w">
          <span
            class="fr-icon--sm fr-icon-time-line fr-mr-1w"
            aria-hidden="true"
          ></span>
          Horaires :
        </div>
        <div class="fr-container fr-container--fluid fr-px-0">
          <div class="fr-grid-row fr-grid-row--gutters">
            <div
              v-for="plage_jour in etablissement.horaires"
              :key="plage_jour.du"
              class="fr-col-6 fr-col-lg-4"
            >
              <div v-if="plage_jour.du === plage_jour.au" class="fr-text--bold">
                Les {{ plage_jour.du }}s
              </div>
              <div v-if="plage_jour.du !== plage_jour.au" class="fr-text--bold">
                Du {{ plage_jour.du }} au {{ plage_jour.au }}
              </div>
              <ul class="fr-raw-list">
                <li
                  v-for="plage_heure in plage_jour.heures"
                  :key="plage_heure.de"
                >
                  de {{ extractHHMM(plage_heure.de) }} à
                  {{ extractHHMM(plage_heure.a) }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div class="fr-container">
        <ul
          v-if="hasContact"
          class="fr-btns-group fr-btns-group--inline-sm fr-btns-group--right"
        >
          <li v-if="etablissement.url">
            <a
              v-analytics="{
                name: etablissement.id,
                action: 'Site internet',
                category: 'Partenaire',
              }"
              :aria-label="`Site internet : ${etablissement.nom} - Nouvelle fenêtre`"
              :href="etablissement.url"
              class="fr-btn"
              rel="noopener"
              target="_blank"
            >
              Site internet
            </a>
          </li>
          <li v-if="etablissement.telephone">
            <a
              v-analytics="{
                name: etablissement.id,
                action: 'Téléphone',
                category: 'Partenaire',
              }"
              :href="`tel:${etablissement.telephone}`"
              class="fr-btn fr-hidden-sm"
              rel="noopener"
              target="_blank"
            >
              {{ etablissement.telephone }}
            </a>
          </li>
        </ul>
      </div>
    </div>
    <p v-else> Aucune information disponible sur cette agence </p>
  </div>
</template>

<script>
export default {
  name: "Etablissement",
  props: {
    etablissement: Object,
  },
  computed: {
    hasContact: function () {
      return this.etablissement?.url || this.etablissement?.telephone
    },
  },
  methods: {
    extractHHMM: function (dateString) {
      return dateString.slice(0, 5)
    },
  },
}
</script>
