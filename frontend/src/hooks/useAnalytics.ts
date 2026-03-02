import { useContext } from 'react'
import { AnalyticsContext } from '../contexts/AnalyticsContext'

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext)
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider')
  }
  return context
}
