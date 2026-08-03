import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from './components/common/ErrorBoundary'
import RouteAnalytics from './components/common/RouteAnalytics'
import Home from './components/Home'
import './App.css'

const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'))
const TermsOfService = lazy(() => import('./components/TermsOfService'))
const FAQ = lazy(() => import('./components/FAQ'))
const AboutUs = lazy(() => import('./components/AboutUs'))
const EmailVerification = lazy(() => import('./components/EmailVerification'))
const UnsubscribeSuccess = lazy(() => import('./components/UnsubscribeSuccess'))
const LoginRoute = lazy(() => import('./components/LoginRoute'))
const MPLADSApp = lazy(() => import('./components/MPLADS/MPLADSApp'))
const NotFound = lazy(() => import('./components/NotFound'))

const RouteFallback = ({ className = '' }: { className?: string }) => (
  <div className={`route-fallback ${className}`.trim()} aria-busy="true" aria-label="Loading">
    <div className="route-fallback__bar" />
    <div className="route-fallback__block route-fallback__block--wide" />
    <div className="route-fallback__block" />
    <div className="route-fallback__grid">
      <div />
      <div />
      <div />
    </div>
  </div>
)

const withRouteFallback = (element: ReactNode, className?: string) => (
  <Suspense fallback={<RouteFallback className={className} />}>{element}</Suspense>
)

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="app">
          <RouteAnalytics />
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
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/privacy-policy" element={withRouteFallback(<PrivacyPolicy />)} />
            <Route path="/terms-of-service" element={withRouteFallback(<TermsOfService />)} />
            <Route path="/faq" element={withRouteFallback(<FAQ />)} />
            <Route path="/about-us" element={withRouteFallback(<AboutUs />)} />
            <Route path="/verify-email" element={withRouteFallback(<EmailVerification />)} />
            <Route path="/unsubscribe/:token" element={withRouteFallback(<UnsubscribeSuccess />)} />
            <Route
              path="/unsubscribe-success"
              element={withRouteFallback(<UnsubscribeSuccess />)}
            />
            <Route path="/login" element={withRouteFallback(<LoginRoute />)} />
            <Route
              path="/mplads/*"
              element={withRouteFallback(<MPLADSApp />, 'route-fallback--mplads')}
            />
            <Route path="*" element={withRouteFallback(<NotFound />)} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  )
}

export default App
