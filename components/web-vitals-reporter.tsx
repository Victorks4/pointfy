'use client'

import { useEffect } from 'react'
import { initWebVitalsReporting } from '@/lib/web-vitals'

export function WebVitalsReporter() {
  useEffect(() => {
    void initWebVitalsReporting()
  }, [])
  return null
}
