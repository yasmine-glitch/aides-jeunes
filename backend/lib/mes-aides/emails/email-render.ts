import fs from "fs"
import path from "path"
import consolidate from "consolidate"

const mustache = consolidate.mustache
import config from "../../../config/index.js"
import openfiscaController from "../../openfisca/parameters.js"
import { formatBenefits, basicBenefitText } from "./simulation-results.js"
import { mjml } from "./index.js"
import { EmailType } from "../../../enums/email.js"

const __dirname = new URL(".", import.meta.url).pathname

function readFile(filePath) {
  return fs.readFileSync(path.join(__dirname, filePath), "utf8")
}
const benefitActionTemplate = readFile("templates/benefit-action.mjml")
const emailTemplate = readFile("templates/email.mjml")
const footerTemplate = readFile("templates/footer.mjml")
const headerTemplate = readFile("templates/header.mjml")
const simulationResultsTemplate = readFile("templates/simulation-results.mjml")
const simulationUsefulnessTemplate = readFile(
  "templates/simulation-usefulness.mjml"
)
const emailTemplates = {
  [EmailType.simulationResults]: simulationResultsTemplate,
  [EmailType.benefitAction]: benefitActionTemplate,
  [EmailType.simulationUsefulness]: simulationUsefulnessTemplate,
}
const simulationResultsTextTemplate = readFile(
  "templates/simulation-results.txt"
)
const benefitActionTextTemplate = readFile("templates/benefit-action.txt")
const simulationUsefulnessTextTemplate = readFile(
  "templates/simulation-usefulness.txt"
)
const textTemplates = {
  [EmailType.simulationResults]: simulationResultsTextTemplate,
  [EmailType.benefitAction]: benefitActionTextTemplate,
  [EmailType.simulationUsefulness]: simulationUsefulnessTextTemplate,
}

const dataTemplateBuilder = (
  emailType,
  followup,
  formatedBenefits,
  benefitTexts
) => {
  return {
    benefitTexts,
    baseURL: config.baseURL,
    ctaLink: `${config.baseURL}${followup.surveyPathTracker}`,
    droits: formatedBenefits,
    returnURL: `${config.baseURL}${followup.returnPath}`,
    wasUsefulLinkYes: `${config.baseURL}${followup.wasUsefulPath}`,
    wasUsefulLinkNo: `${config.baseURL}${followup.wasNotUsefulPath}`,
    partials: {
      header: headerTemplate,
      content: emailTemplates[emailType],
      footer: footerTemplate,
    },
  }
}

function renderAsText(emailType, dataTemplate) {
  return mustache.render(textTemplates[emailType], dataTemplate)
}

function renderAsHtml(emailType, dataTemplate) {
  if (!(emailType in emailTemplates)) {
    throw new Error(`Unknown email type: ${emailType}`)
  }
  return mustache
    .render(emailTemplate, dataTemplate)
    .then(function (templateString) {
      const output = mjml(templateString)
      return {
        html: output.html,
      }
    })
}

export default async function emailRender(emailType, followup) {
  let benefits: any = null
  let parameters: any = null
  if (emailType === EmailType.simulationResults) {
    const populated = await (followup.populated("simulation")
      ? Promise.resolve(followup)
      : followup.populate("simulation"))

    parameters = await openfiscaController.getParameters(
      populated.simulation.dateDeValeur
    )

    const situationResults = await populated.simulation.compute()
    benefits = situationResults.droitsEligibles
    followup.benefits = benefits.map((benefit) => ({
      id: benefit.id,
      amount: benefit.montant,
      unit: benefit.unit,
    }))
    followup.save()
  }

  const formatedBenefits =
    emailType === EmailType.simulationResults
      ? formatBenefits(benefits, parameters)
      : {}

  const benefitTexts =
    emailType === EmailType.simulationResults
      ? benefits.map((benefit) => basicBenefitText(benefit, parameters))
      : {}

  const dataTemplate = dataTemplateBuilder(
    emailType,
    followup,
    formatedBenefits,
    benefitTexts
  )

  return Promise.all([
    renderAsText(emailType, dataTemplate),
    renderAsHtml(emailType, dataTemplate),
  ]).then((values) => {
    if (emailType === EmailType.simulationResults) {
      return {
        subject: `Récapitulatif de votre simulation sur 1jeune1solution.gouv.fr [${followup.simulation._id}]`,
        text: values[0],
        html: values[1].html,
        attachments: values[1].attachments,
      }
    } else if (
      emailType === EmailType.benefitAction ||
      emailType === EmailType.simulationUsefulness
    ) {
      return {
        subject: `Votre simulation sur 1jeune1solution.gouv.fr vous a-t-elle été utile ? [${
          followup.simulation?._id || followup.simulation
        }]`,
        text: values[0],
        html: values[1].html,
      }
    }
  })
}
