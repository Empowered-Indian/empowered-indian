import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { FilterProvider } from './contexts/FilterContext'
import { AuthProvider } from './contexts/AuthContext'
import ErrorBoundary from './components/common/ErrorBoundary'
import ProtectedRoute from './components/common/ProtectedRoute'
import RouteAnalytics from './components/common/RouteAnalytics'
import Layout from './components/MPLADS/components/Layout/Layout'
import './App.css'

const Home = lazy(() => import('./components/Home'))
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'))
const TermsOfService = lazy(() => import('./components/TermsOfService'))
const FAQ = lazy(() => import('./components/FAQ'))
const AboutUs = lazy(() => import('./components/AboutUs'))
const Dashboard = lazy(() => import('./components/MPLADS/pages/Dashboard'))
const TrackArea = lazy(() => import('./components/MPLADS/pages/TrackArea'))
const Compare = lazy(() => import('./components/MPLADS/pages/Compare'))
const Report = lazy(() => import('./components/MPLADS/pages/Report'))
const SearchResults = lazy(() => import('./components/MPLADS/pages/SearchResults'))
const StateList = lazy(() => import('./components/MPLADS/pages/StateList'))
const StateDetail = lazy(() => import('./components/MPLADS/pages/StateDetail'))
const MPList = lazy(() => import('./components/MPLADS/pages/MPList'))
const MPDetail = lazy(() => import('./components/MPLADS/pages/MPDetail'))
const Admin = lazy(() => import('./components/MPLADS/pages/Admin'))
const Login = lazy(() => import('./components/MPLADS/pages/Login'))
const EmailVerification = lazy(() => import('./components/EmailVerification'))
const UnsubscribeSuccess = lazy(() => import('./components/UnsubscribeSuccess'))
const NotFound = lazy(() => import('./components/NotFound'))

const RouteFallback = ({ className = '' }: { className?: string }) => (
  <div className={`route-fallback ${className}`.trim()} aria-busy="true" aria-live="polite">
    <div className="route-fallback__bar" />
    <div className="route-fallback__block route-fallback__block--wide" />
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
      <AuthProvider>
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
              <Route path="/" element={withRouteFallback(<Home />)} />
              <Route path="/privacy-policy" element={withRouteFallback(<PrivacyPolicy />)} />
              <Route path="/terms-of-service" element={withRouteFallback(<TermsOfService />)} />
              <Route path="/faq" element={withRouteFallback(<FAQ />)} />
              <Route path="/about-us" element={withRouteFallback(<AboutUs />)} />
              <Route path="/verify-email" element={withRouteFallback(<EmailVerification />)} />
              <Route
                path="/unsubscribe/:token"
                element={withRouteFallback(<UnsubscribeSuccess />)}
              />
              <Route
                path="/unsubscribe-success"
                element={withRouteFallback(<UnsubscribeSuccess />)}
              />
              <Route path="/login" element={withRouteFallback(<Login />)} />

              {/* MPLADS Routes */}
              <Route
                path="/mplads"
                element={
                  <FilterProvider>
                    <Layout />
                  </FilterProvider>
                }
              >
                <Route index element={withRouteFallback(<Dashboard />, 'route-fallback--mplads')} />
                <Route
                  path="dashboard"
                  element={withRouteFallback(<Dashboard />, 'route-fallback--mplads')}
                />
                <Route
                  path="track-area"
                  element={withRouteFallback(<TrackArea />, 'route-fallback--mplads')}
                />
                <Route
                  path="compare"
                  element={withRouteFallback(<Compare />, 'route-fallback--mplads')}
                />
                <Route
                  path="report"
                  element={withRouteFallback(<Report />, 'route-fallback--mplads')}
                />
                <Route
                  path="search"
                  element={withRouteFallback(<SearchResults />, 'route-fallback--mplads')}
                />
                <Route
                  path="states"
                  element={withRouteFallback(<StateList />, 'route-fallback--mplads')}
                />
                <Route
                  path="states/:stateId"
                  element={withRouteFallback(<StateDetail />, 'route-fallback--mplads')}
                />
                <Route
                  path="mps"
                  element={withRouteFallback(<MPList />, 'route-fallback--mplads')}
                />
                <Route
                  path="mps/:mpId"
                  element={withRouteFallback(<MPDetail />, 'route-fallback--mplads')}
                />
                <Route
                  path="admin"
                  element={withRouteFallback(
                    <ProtectedRoute requireAdmin={true}>
                      <Admin />
                    </ProtectedRoute>,
                    'route-fallback--mplads'
                  )}
                />
              </Route>

              {/* All other routes show Not Found */}
              <Route path="*" element={withRouteFallback(<NotFound />)} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
