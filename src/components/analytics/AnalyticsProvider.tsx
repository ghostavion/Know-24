"use client"

import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"

const AnalyticsProvider = () => {
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  )
}

export { AnalyticsProvider }
