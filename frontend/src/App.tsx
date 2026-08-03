import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from './components/common/ErrorBoundary'
import Home from './components/Home'
import './App.css'

const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'))
const TermsOfService = lazy(() => import('./components/TermsOfService'))
const FAQ = lazy(() => import('./components/FAQ'))
const AboutUs = lazy(() => import('./components/AboutUs'))
const EmailVerification = lazy(() => import('./components/EmailVerification'))
const UnsubscribeSuccess = lazy(() => import('./components/UnsubscribeSuccess'))
const NotFound = lazy(() => import('./components/NotFound'))
const LoginRoute = lazy(() => import('./components/LoginRoute'))
const MPLADSApp = lazy(() => import('./components/MPLADS/MPLADSApp'))
const StickyFeedbackButton = lazy(() => import('./components/common/StickyFeedbackButton'))

const RouteFallback = () => (
  <main className="route-loading" aria-busy="true" aria-label="Loading page">
    <div className="route-loading__content">
      <span className="route-loading__eyebrow">Empowered Indian</span>
      <div className="route-loading__title" />
      <div className="route-loading__line" />
      <div className="route-loading__line route-loading__line--short" />
    </div>
  </main>
)

const DeferredFeedback = () => {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const enable = () => setIsReady(true)
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
      cancelIdleCallback?: (id: number) => void
    }

    if (typeof idleWindow.requestIdleCallback === 'function') {
      const idleId = idleWindow.requestIdleCallback(enable, { timeout: 2500 })
      return () => idleWindow.cancelIdleCallback?.(idleId)
    }

    const timeoutId = setTimeout(enable, 1500)
    return () => clearTimeout(timeoutId)
  }, [])

  return isReady ? (
    <Suspense fallback={null}>
      <StickyFeedbackButton />
    </Suspense>
  ) : null
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="app">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
          <DeferredFeedback />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/about-us" element={<AboutUs />} />
              <Route path="/verify-email" element={<EmailVerification />} />
              <Route path="/unsubscribe/:token" element={<UnsubscribeSuccess />} />
              <Route path="/unsubscribe-success" element={<UnsubscribeSuccess />} />
              <Route path="/login" element={<LoginRoute />} />
              <Route path="/mplads/*" element={<MPLADSApp />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </ErrorBoundary>
  )
}

export default App
