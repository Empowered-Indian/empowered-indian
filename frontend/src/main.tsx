import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AnalyticsProvider } from './contexts/AnalyticsContext'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AnalyticsProvider>
      <App />
    </AnalyticsProvider>
  </StrictMode>
)
