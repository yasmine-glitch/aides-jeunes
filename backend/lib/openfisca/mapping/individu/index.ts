import dayjs from "dayjs"
import { cloneDeep, forEach, isNaN, isUndefined } from "lodash-es"

import { formatDate } from "../utils.js"
import individuRessource from "./ressources.js"
import pastResourcesProxy from "./past-resources-proxy.js"
import { estActif } from "../../../../../lib/activite.js"

import {
  computeDistanceCommunes,
  findCommuneByInseeCode,
} from "../../../mes-aides/distance.js"

import { ActiviteType } from "../../../../../lib/enums/activite.js"
import { individuGeneratorLayout } from "../../../../../lib/types/individu.js"

const individuSchema: individuGeneratorLayout = {
  activite: {
    src: "activite",
    fn: function (activite) {
      return estActif(activite) ? "actif" : activite
    },
  },
  apprenti: {
    src: "_contrat_alternant",
    fn: function (contratAlternant) {
      return contratAlternant === ActiviteType.apprenti
    },
  },
  date_naissance: {
    src: "date_naissance",
    fn: formatDate,
  },
  age: {
    src: "date_naissance",
    fn: function (dateDeNaissance, individu, situation) {
      return (
        dateDeNaissance &&
        dayjs(situation.dateDeValeur).diff(dayjs(dateDeNaissance), "year")
      )
    },
  },
  age_en_mois: {
    src: "date_naissance",
    fn: function (dateDeNaissance, individu, situation) {
      return (
        dateDeNaissance &&
        dayjs(situation.dateDeValeur).diff(dayjs(dateDeNaissance), "month")
      )
    },
  },
  bourse_criteres_sociaux_distance_domicile_familial: {
    fn: function (individu, situation) {
      if (individu.habite_chez_parents) {
        return 0
      }

      if (situation.parents && !situation.parents._en_france) {
        return 260
      }

      const jeuneCommune = findCommuneByInseeCode(situation.menage.depcom)
      const parentCommune = findCommuneByInseeCode(
        individu._bourseCriteresSociauxCommuneDomicileFamilial
      )
      return computeDistanceCommunes(jeuneCommune, parentCommune)
    },
  },
  contrat_de_travail_debut: {
    src: "_nombreMoisDebutContratDeTravail",
    fn: function (_nombreMoisDebutContratDeTravail, _, situation) {
      return dayjs(situation.dateDeValeur)
        .subtract(_nombreMoisDebutContratDeTravail || 0, "month")
        .format("YYYY-MM-DD")
    },
  },
  date_debut_chomage: {
    src: "date_debut_chomage",
    fn: formatDate,
  },
  debut_etudes_etranger: {
    fn: function (_, situation) {
      return dayjs(situation.dateDeValeur).format("YYYY-MM-DD")
    },
  },
  enceinte: {
    src: "enceinte",
    fn: function (enceinte) {
      return enceinte === "enceinte"
    },
  },
  fin_etudes_etranger: {
    src: "_dureeMoisEtudesEtranger",
    fn: function (_dureeMoisEtudesEtranger, _, situation) {
      return dayjs(situation.dateDeValeur)
        .add(_dureeMoisEtudesEtranger || 0, "month")
        .add(1, "day")
        .format("YYYY-MM-DD")
    },
  },
  peec_employeur: {
    fn: function () {
      return true
    },
  },
  professionnalisation: {
    src: "_contrat_alternant",
    fn: function (contratAlternant) {
      return contratAlternant === ActiviteType.professionnalisation
    },
  },
  regime_securite_sociale: {
    src: "regime_securite_sociale",
    fn: function (regime_securite_sociale) {
      return regime_securite_sociale !== "inconnu"
        ? regime_securite_sociale
        : "regime_general"
    },
  },
  secteur_activite_employeur: {
    src: "regime_securite_sociale",
    fn: function (regime_securite_sociale) {
      return regime_securite_sociale === "regime_agricole"
        ? "agricole"
        : "non_agricole"
    },
  },
}

function isNotValidValue(value) {
  return (
    isNaN(value) ||
    isUndefined(value) ||
    value === null ||
    value === "Invalid date"
  )
}

export default function buildOpenFiscaIndividu(mesAidesIndividu, situation) {
  const openFiscaIndividu = cloneDeep(mesAidesIndividu)
  forEach(individuSchema, function (definition, openfiscaKey) {
    openFiscaIndividu[openfiscaKey] = definition.src
      ? definition.fn(
          mesAidesIndividu[definition.src],
          mesAidesIndividu,
          situation
        )
      : definition.fn(mesAidesIndividu, situation)

    // Remove null as OpenFisca do not handle them correctly
    if (isNotValidValue(openFiscaIndividu[openfiscaKey])) {
      delete openFiscaIndividu[openfiscaKey]
    }
  })

  individuRessource.computeRessources(mesAidesIndividu, openFiscaIndividu)
  pastResourcesProxy(openFiscaIndividu, situation)
  return openFiscaIndividu
}

export const additionalProps = individuSchema
