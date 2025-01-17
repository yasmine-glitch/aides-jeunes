import ABTestingService from "@/plugins/ab-testing-service.js"

const uuid = `uid_${Math.random().toString(12).slice(2)}`

export default {
  methods: {
    sendStatistics: function (benefits, event, benefitId) {
      if (
        window.navigator.doNotTrack !== "1" &&
        document.cookie.indexOf("piwik_ignore") < 0 &&
        process.env.VITE_STATS_URL?.length &&
        process.env.VITE_STATS_VERSION &&
        benefits?.length
      ) {
        const id = this?.$matomo ? this.$matomo.getVisitorId() : uuid
        const abtesting = ABTestingService.getValues()
        const benefitsStats = []
        const totalResults = benefits.length
        benefits.forEach(function (benefit, i) {
          if (!benefitId || benefitId == benefit.id) {
            benefitsStats.push({
              benefit_id: benefit.id,
              hash_id: id,
              abtesting,
              benefit_index: i + 1,
              page_total: totalResults,
              event_type: event,
              version: process.env.VITE_STATS_VERSION,
            })
          }
        })
        fetch(process.env.VITE_STATS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(benefitsStats),
        }).catch((error) => console.error(error))
      }
    },
  },
}
