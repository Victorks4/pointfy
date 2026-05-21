export type WebVitalMetric = {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  id: string
}

export function reportWebVital(metric: WebVitalMetric) {
  if (typeof window === 'undefined') return
  if (process.env.NODE_ENV !== 'development') return

  const label = `[Web Vitals] ${metric.name}`
  const detail = `${Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value)}${metric.name === 'CLS' ? ' (×1000)' : 'ms'} · ${metric.rating}`

  if (metric.rating === 'poor') {
    console.warn(label, detail, metric.id)
  } else {
    console.info(label, detail)
  }
}

export async function initWebVitalsReporting() {
  if (typeof window === 'undefined') return
  if (process.env.NODE_ENV !== 'development') return

  try {
    const { onCLS, onINP, onLCP } = await import('web-vitals')
    onLCP(reportWebVital)
    onINP(reportWebVital)
    onCLS(reportWebVital)
  } catch {
    // web-vitals opcional em dev
  }
}
