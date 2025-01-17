import subject from "@root/backend/lib/openfisca/mapping"
import expect from "expect"

describe("openfisca dispatchIndividuals", function () {
  function buildSituation(props) {
    return {
      famille: {},
      menage: {},
      ...props,
    }
  }

  describe("single adult", function () {
    const situation = buildSituation({
      demandeur: { id: "demandeur" },
    })
    const result = subject.dispatchIndividuals(situation)

    it("sets a single parent", function () {
      expect(result.familles._.parents).toEqual(["demandeur"])
    })
  })

  describe("single parent with one kid", function () {
    const situation = buildSituation({
      demandeur: { id: "demandeur" },
      enfants: [{ id: "e1" }],
    })
    const result = subject.dispatchIndividuals(situation)

    it("sets a single parent", function () {
      expect(result.familles._.parents).toEqual([situation.demandeur.id])
    })

    it("sets a single item array for the kid", function () {
      expect(result.familles._.enfants).toEqual([situation.enfants[0].id])
    })
  })

  describe("single adult within parental fiscal unit", function () {
    const situation = buildSituation({
      demandeur: {
        id: "demandeur",
        enfant_a_charge: { 2013: true },
      },
    })
    const result = subject.dispatchIndividuals(situation)

    it("adds a parent without", function () {
      expect(result.individus.parent1).toEqual({})
    })
    it("sets a fake declarant", function () {
      expect(result.foyers_fiscaux._.declarants).toEqual(["parent1"])
    })
    it("sets one personne a charge", function () {
      expect(result.foyers_fiscaux._.personnes_a_charge).toEqual([
        situation.demandeur.id,
      ])
    })
  })

  describe("young adult in a couple fiscal unit", function () {
    const situation = buildSituation({
      demandeur: {
        id: "demandeur",
        enfant_a_charge: { 2013: true },
      },
      conjoint: {
        id: "conjoint",
      },
    })
    const result = subject.dispatchIndividuals(situation)

    it("sets a fake declarant", function () {
      expect(result.foyers_fiscaux._.declarants).toEqual(["parent1"])
    })
    it("sets one persone a charge", function () {
      expect(result.foyers_fiscaux._.personnes_a_charge).toEqual([
        situation.demandeur.id,
      ])
    })
    it("creates a separate foyer_fiscal for the conjoint one persone a charge", function () {
      expect(result.foyers_fiscaux.conjoint.declarants).toEqual([
        situation.conjoint.id,
      ])
    })
  })
})
