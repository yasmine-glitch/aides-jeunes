import { createApp, h } from "vue"
import "@gouvfr/dsfr/dist/dsfr.min.css"
import "@gouvfr/dsfr/dist/utility/utility.min.css"
import "@gouvfr/dsfr/dist/dsfr.module.min.js"
import App from "./app.vue"

import router from "./router.js"

import StateService from "./plugins/state-service.js"

import * as Sentry from "@sentry/vue"
import VueMatomo from "vue-matomo"

import "@/styles/aides-jeunes.css"

import AnalyticsDirective from "./directives/analytics.js"
import MailDirective from "./directives/mail.js"
import SelectOnClickDirective from "./directives/select-on-click.js"

// @ts-ignore
import { iframeResizerContentWindow } from "iframe-resizer"

import "dayjs/locale/fr.js"
import customParseFormat from "dayjs/plugin/customParseFormat"
import dayjs from "dayjs"
import { createPinia } from "pinia"

const Resizer = {
  install: function () {
    iframeResizerContentWindow
  },
}
const pinia = createPinia()

const app = createApp({
  render: () => h(App),
})

app.directive("analytics", AnalyticsDirective)
app.directive("mail", MailDirective)
app.directive("selectOnClick", SelectOnClickDirective)

if (process.env.NODE_ENV === "production") {
  Sentry.init({
    app,
    dsn: "https://77f2520f2558451c80b1b95131135bcd@sentry.incubateur.net/18",
  })
}

app.use(Resizer)
app.use(StateService)

if (navigator.cookieEnabled) {
  app.use(VueMatomo, {
    host: "https://stats.data.gouv.fr",
    trackerFileName: "piwik",
    siteId: process.env.VITE_MATOMO_ID,
    router: router,
  })
}

app.config.globalProperties.$filters = {
  capitalize(value: string) {
    if (!value) return ""
    value = value.toString()
    return value.charAt(0).toUpperCase() + value.slice(1)
  },
}

dayjs.locale("fr")
dayjs.extend(customParseFormat)

app.use(pinia)
app.use(router)
app.mount(document.body)
