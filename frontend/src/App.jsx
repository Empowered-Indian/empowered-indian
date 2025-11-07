import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { FilterProvider } from './contexts/FilterContext'
import { AuthProvider } from './contexts/AuthContext'
import ErrorBoundary from './components/common/ErrorBoundary'
import ProtectedRoute from './components/common/ProtectedRoute'
import Home from './components/Home'
import PrivacyPolicy from './components/PrivacyPolicy'
import TermsOfService from './components/TermsOfService'
import FAQ from './components/FAQ'
import AboutUs from './components/AboutUs'
import Layout from './components/MPLADS/components/Layout/Layout'
import Dashboard from './components/MPLADS/pages/Dashboard'
import TrackArea from './components/MPLADS/pages/TrackArea'
import Compare from './components/MPLADS/pages/Compare'
import Report from './components/MPLADS/pages/Report'
import SearchResults from './components/MPLADS/pages/SearchResults'
import StateList from './components/MPLADS/pages/StateList'
import StateDetail from './components/MPLADS/pages/StateDetail'
import MPList from './components/MPLADS/pages/MPList'
import MPDetail from './components/MPLADS/pages/MPDetail'
import Admin from './components/MPLADS/pages/Admin'
import Login from './components/MPLADS/pages/Login'
import EmailVerification from './components/EmailVerification'
import UnsubscribeSuccess from './components/UnsubscribeSuccess'
import NotFound from './components/NotFound'
import './App.css'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
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
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/about-us" element={<AboutUs />} />
              <Route path="/verify-email" element={<EmailVerification />} />
              <Route path="/unsubscribe/:token" element={<UnsubscribeSuccess />} />
              <Route path="/unsubscribe-success" element={<UnsubscribeSuccess />} />
              <Route path="/login" element={<Login />} />
              
              {/* MPLADS Routes */}
              <Route path="/mplads" element={
                <FilterProvider>
                  <Layout />
                </FilterProvider>
              }>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="track-area" element={<TrackArea />} />
                <Route path="compare" element={<Compare />} />
                <Route path="report" element={<Report />} />
                <Route path="search" element={<SearchResults />} />
                <Route path="states" element={<StateList />} />
                <Route path="states/:stateId" element={<StateDetail />} />
                <Route path="mps" element={<MPList />} />
                <Route path="mps/:mpId" element={<MPDetail />} />
                <Route path="admin" element={
                  <ProtectedRoute requireAdmin={true}>
                    <Admin />
                  </ProtectedRoute>
                } />
              </Route>
              
              {/* All other routes show Not Found */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
