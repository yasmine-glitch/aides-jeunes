import aidesVelo from "aides-velo"
import { generator } from "../dates.js"

const veloTypes = {
  velo_mecanique: "mécanique simple",
  velo_electrique: "électrique",
  velo_cargo: "cargo",
  velo_cargo_electrique: "cargo électrique",
  velo_pliant: "pliant",
  velo_motorisation: "motorisation",
}

function canComputeAidesVeloBenefits(situation) {
  return [
    situation.menage.depcom,
    situation.menage._departement,
    situation.menage._region,
  ].every((value) => Boolean(value))
}

export function computeAidesVeloBenefits(
  aidesVeloBenefitList,
  resultHolder,
  situation,
  openfiscaResponse
) {
  if (!canComputeAidesVeloBenefits(situation)) {
    return
  }
  const periods = generator(situation.dateDeValeur)

  const eligibleBenefitsMap = {}
  for (const type of situation.demandeur._interetsAidesVelo) {
    const inputs = {
      "vélo . type": veloTypes[type],
      "localisation . code insee": situation.menage.depcom,
      "localisation . epci": situation.menage._epci,
      "localisation . département": situation.menage._departement,
      "localisation . région": situation.menage._region,
      "revenu fiscal de référence":
        openfiscaResponse.foyers_fiscaux._.rfr[periods.fiscalYear.id],
    }

    Object.assign(
      eligibleBenefitsMap,
      aidesVelo(inputs).reduce((a, v) => {
        // @ts-ignore
        a[v.id] = {
          ...v,
          montant: v.amount,
          link: v.url,
        }
        return a
      }, {})
    )
  }

  aidesVeloBenefitList
    .filter((benefit) => eligibleBenefitsMap[benefit.external_id])
    .forEach((benefit) => {
      resultHolder.push({
        ...benefit,
        ...eligibleBenefitsMap[benefit.external_id],
        id: benefit.id,
      })
    })
}
