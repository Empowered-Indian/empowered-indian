import { lazy } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../../contexts/AuthContext'
import { FilterProvider } from '../../contexts/FilterContext'
import ProtectedRoute from '../common/ProtectedRoute'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'

const TrackArea = lazy(() => import('./pages/TrackArea'))
const Compare = lazy(() => import('./pages/Compare'))
const Report = lazy(() => import('./pages/Report'))
const SearchResults = lazy(() => import('./pages/SearchResults'))
const StateList = lazy(() => import('./pages/StateList'))
const StateDetail = lazy(() => import('./pages/StateDetail'))
const MPList = lazy(() => import('./pages/MPList'))
const MPDetail = lazy(() => import('./pages/MPDetail'))
const Admin = lazy(() => import('./pages/Admin'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const MPLADSApp = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FilterProvider>
        <Routes>
          <Route element={<Layout />}>
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
            <Route
              path="admin"
              element={
                <ProtectedRoute requireAdmin>
                  <Admin />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </FilterProvider>
    </AuthProvider>
  </QueryClientProvider>
)

export default MPLADSApp
