import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navigation from './NavigationSimple'
import './Layout.css'
import SiteFooter from '../../../common/SiteFooter'
import { API_BASE_URL } from '../../../../utils/constants/api'

const Layout = () => {
  const [syncInfo, setSyncInfo] = useState({
    lastUpdated: '8/10/2025',
    nextUpdate: 'in 3 hours',
  })

  useEffect(() => {
    let isMounted = true

    const fetchSyncInfo = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/metadata/sync-info`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
        const data = await response.json()
        if (!isMounted) return
        if (data && data.success && data.data) {
          setSyncInfo({
            lastUpdated: data.data.lastUpdated || syncInfo.lastUpdated,
            nextUpdate: data.data.nextUpdate || '',
          })
        }
      } catch {
        // Silent fallback to existing state
      }
    }

    fetchSyncInfo()
    const interval = setInterval(fetchSyncInfo, 5 * 60 * 1000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [syncInfo.lastUpdated])

  return (
    <div className="mplads-layout">
      <Navigation />
      <main className="mplads-main">
        <div className="mplads-container">
          <Outlet />
        </div>
      </main>
      <SiteFooter
        className="mplads-footer"
        extraInfo={`Data sourced from official MPLADS portal • Last updated: ${syncInfo.lastUpdated}${syncInfo.nextUpdate ? ` • Next update: ${syncInfo.nextUpdate}` : ''}`}
      />
    </div>
  )
}

export default Layout
