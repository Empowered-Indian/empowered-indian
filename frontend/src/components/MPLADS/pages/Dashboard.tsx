import { useOverview, useMPSummary, useStateSummary } from '../../../hooks/useApi'
import {
  FiTrendingUp,
  FiUsers,
  FiCheckCircle,
  FiClock,
  FiInfo,
  FiBarChart2,
  FiPieChart,
  FiActivity,
  FiAlertTriangle,
  FiFileText,
} from 'react-icons/fi'
import { BiHourglass } from 'react-icons/bi'
import { IndianRupee } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { lazy, Suspense, useEffect, useState } from 'react'
import ProjectStatusCards from '../components/Dashboard/ProjectStatusCards'
import SearchBar from '../components/Search/SearchBar'
import InfoTooltip from '../components/Common/InfoTooltip'
import ExportButton from '../components/Common/ExportButton'
import SkeletonLoader from '../components/Common/SkeletonLoader'
import LoadingState from '../components/Common/LoadingState'
import ErrorDisplay from '../components/Common/ErrorDisplay'
import CollapsibleSection from '../components/Common/CollapsibleSection'
import './Dashboard.css'
import { formatINRCompact } from '../../../utils/formatters'
import { useFilters } from '../../../contexts/FilterContext'
import { getPeriodLabel } from '../../../utils/lsTerm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const StatePerformanceChart = lazy(() => import('../components/Charts/StatePerformanceChart'))
const MPPersonalityChart = lazy(() => import('../components/Charts/MPPersonalityChart'))
const StateAllocationChart = lazy(() => import('../components/Charts/StateAllocationChart'))
const DASHBOARD_LOADING_TIMEOUT_MS = 15000

const ChartSkeleton = ({ size = 'default' }: { size?: 'default' | 'large' }) => (
  <div className={`chart-skeleton chart-skeleton--${size}`} aria-hidden="true">
    <SkeletonLoader type="chart" />
  </div>
)

const DashboardLoadingSkeleton = ({ progress }: { progress: number }) => (
  <div className="dashboard dashboard--loading-skeleton" aria-busy="true" aria-live="polite">
    <div className="dashboard-header">
      <div className="dashboard-title-section">
        <SkeletonLoader width="min(420px, 80vw)" height="3rem" />
        <SkeletonLoader width="min(620px, 92vw)" height="1.25rem" />
      </div>

      <div className="dashboard-controls">
        <div className="dashboard-search">
          <SkeletonLoader height="3rem" />
        </div>
        <div className="dashboard-actions">
          <SkeletonLoader width="9rem" height="2.75rem" />
        </div>
      </div>
      <div
        className="dashboard-loading-progress"
        aria-label={`Loading dashboard data ${Math.round(progress)}%`}
      >
        <span style={{ width: `${Math.max(12, progress)}%` }} />
      </div>
    </div>

    <div className="metrics-grid">
      {Array.from({ length: 7 }).map((_, index) => (
        <Card key={index} className="metric-card metric-card--skeleton">
          <SkeletonLoader width="40px" height="40px" />
          <CardContent className="metric-content">
            <SkeletonLoader width="55%" height="0.8rem" />
            <SkeletonLoader width="75%" height="1.55rem" />
            <SkeletonLoader width="90%" height="0.8rem" />
            <SkeletonLoader width="45%" height="0.7rem" />
          </CardContent>
        </Card>
      ))}
    </div>

    <div className="charts-section">
      <div className="dashboard-section dashboard-section--skeleton">
        <SkeletonLoader width="16rem" height="1.5rem" />
        <div className="chart-row">
          <div className="chart-container wip-chart">
            <ChartSkeleton />
          </div>
          <div className="chart-container pie-chart">
            <ChartSkeleton />
          </div>
        </div>
      </div>
      <div className="dashboard-section dashboard-section--skeleton">
        <SkeletonLoader width="12rem" height="1.5rem" />
        <div className="chart-container full-width">
          <SkeletonLoader type="card" count={3} />
        </div>
      </div>
      <div className="dashboard-section dashboard-section--skeleton">
        <SkeletonLoader width="14rem" height="1.5rem" />
        <div className="chart-container full-width">
          <ChartSkeleton size="large" />
        </div>
      </div>
    </div>

    <div className="dashboard-info">
      <Card className="info-card">
        <SkeletonLoader type="card" />
      </Card>
      <Card className="info-card">
        <SkeletonLoader type="card" />
      </Card>
    </div>
  </div>
)

const Dashboard = () => {
  const navigate = useNavigate()
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false)
  const [chartsReady, setChartsReady] = useState(false)
  const [loadingTimedOut, setLoadingTimedOut] = useState(false)

  const { data, isLoading, error, refetch } = useOverview()
  const { data: mpData, isLoading: mpLoading } = useMPSummary({ limit: 800 })
  const {
    data: stateData,
    isLoading: stateLoading,
    error: stateError,
  } = useStateSummary({ limit: 50 })
  const { filters } = useFilters()
  const periodLabel =
    (filters?.house || 'Lok Sabha') === 'Lok Sabha'
      ? getPeriodLabel(filters?.lsTerm || 18)
      : filters?.house === 'Rajya Sabha'
        ? 'Rajya Sabha'
        : `Both Houses • ${getPeriodLabel(filters?.lsTerm || 18)}`

  // Progressive loading simulation
  useEffect(() => {
    if (isLoading || mpLoading || stateLoading) {
      const totalQueries = 3
      let completed = 0
      if (!isLoading) completed++
      if (!mpLoading) completed++
      if (!stateLoading) completed++

      const progress = (completed / totalQueries) * 100
      setLoadingProgress(progress)
    } else if (!isLoading && !mpLoading && !stateLoading) {
      setLoadingProgress(100)
      setHasInitiallyLoaded(true)
    }
  }, [isLoading, mpLoading, stateLoading])

  useEffect(() => {
    const timer = window.setTimeout(() => setChartsReady(true), 350)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!isLoading || hasInitiallyLoaded) {
      setLoadingTimedOut(false)
      return undefined
    }

    setLoadingTimedOut(false)
    const timer = window.setTimeout(() => setLoadingTimedOut(true), DASHBOARD_LOADING_TIMEOUT_MS)
    return () => window.clearTimeout(timer)
  }, [isLoading, hasInitiallyLoaded])

  // Progressive loading state
  if (isLoading && !hasInitiallyLoaded) {
    if (loadingTimedOut) {
      return (
        <div className="dashboard">
          <LoadingState
            type="default"
            message="Loading dashboard data"
            showProgress={true}
            progressValue={loadingProgress}
            size="large"
            timeout={0}
            forceTimeout
          />
        </div>
      )
    }

    return <DashboardLoadingSkeleton progress={loadingProgress} />
  }

  if (error) {
    return (
      <div className="dashboard">
        <ErrorDisplay error={error} onRetry={refetch} title="Unable to load dashboard data" />
      </div>
    )
  }

  const overview = data?.data || {}

  // Removed unused formatCurrency function

  const formatNumber = num => {
    return new Intl.NumberFormat('en-IN').format(num || 0)
  }

  const metrics = [
    {
      title: 'Total Allocated',
      value: formatINRCompact(overview.totalAllocated),
      icon: <IndianRupee size={20} />,
      color: 'blue',
      description: 'Total funds allocated to MPs',
    },
    {
      title: 'Total Expenditure',
      value: formatINRCompact(overview.totalExpenditure),
      icon: <FiFileText />,
      color: 'green',
      description: 'Total funds spent',
    },
    {
      title: 'Fund Utilization',
      value: `${overview.utilizationPercentage?.toFixed(1) || 0}%`,
      icon: <FiPieChart />,
      color:
        overview.utilizationPercentage > 70
          ? 'green'
          : overview.utilizationPercentage > 40
            ? 'yellow'
            : 'red',
      description: 'Overall fund utilization rate',
      tooltip:
        'Fund Utilization: Percentage of allocated MPLADS funds that have been disbursed (Total Expenditure / Total Allocation × 100). This matches official MPLADS reporting standards.',
    },
    {
      title: 'Total MPs',
      value: formatNumber(overview.totalMPs),
      icon: <FiUsers />,
      color: 'blue',
      description: 'Number of MPs in the system',
      tooltip:
        'Includes current and recent MPs with active MPLADS projects. Count may exceed current parliamentary seats due to ongoing multi-year projects from previous terms.',
    },
    {
      title: 'Works Completed',
      value: `${formatNumber(overview.totalWorksCompleted)} (₹${formatINRCompact(overview.completedWorksValue)})`,
      icon: <FiCheckCircle />,
      color: 'green',
      description: 'Total completed projects and their value',
    },
    {
      title: 'Works Pending',
      value: formatNumber(overview.pendingWorks),
      icon: <BiHourglass />,
      color: 'orange',
      description: 'Projects yet to be completed',
    },
    {
      title: 'INCOMPLETE WORKS',
      value: formatINRCompact(overview.inProgressPayments || overview.totalInProgressPayments || 0),
      icon: <FiAlertTriangle />,
      color: 'red',
      description: 'Payments made but works not completed',
      tooltip:
        'Amount paid to vendors/contractors for works that are not yet marked as completed. This represents funds that need accountability tracking.',
      warning: true,
    },
  ]

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title-section">
          <h1>MPLADS Dashboard</h1>
          <p>Overview of Member of Parliament Local Area Development Scheme</p>
        </div>

        <div className="dashboard-controls">
          <div className="dashboard-search">
            <SearchBar placeholder="Search MPs or Constituencies..." />
          </div>
          <div className="dashboard-actions">
            <ExportButton variant="dropdown" label="Export Data" data={data} />
          </div>
        </div>
      </div>

      <div className="metrics-grid">
        {metrics.map((metric, index) => (
          <Card key={index} className={`metric-card metric-${metric.color}`}>
            <div className="metric-icon">{metric.icon}</div>
            <CardContent className="metric-content">
              <div className="metric-title-row">
                <h2
                  className={`metric-title ${metric.title === 'Total MPs' ? 'preserve-case' : ''}`}
                  style={{ fontSize: '1rem' }}
                >
                  {metric.title}
                </h2>
                {metric.tooltip && (
                  <InfoTooltip content={metric.tooltip} position="top" size="small" />
                )}
              </div>
              <p className="metric-value">{metric.value}</p>
              <p className="metric-description">{metric.description}</p>
              <p className="metric-period">{periodLabel}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Visualization Charts Section with Progressive Disclosure */}
      <div className="charts-section">
        <CollapsibleSection
          title="Key Metrics Overview"
          subtitle="Visual representation of MPLADS performance metrics"
          icon={<FiBarChart2 />}
          defaultOpen={true}
          className="dashboard-section"
        >
          <div className="chart-row">
            <div className="chart-container wip-chart">
              {chartsReady ? (
                <Suspense fallback={<ChartSkeleton />}>
                  <StatePerformanceChart
                    data={stateData?.data}
                    isLoading={stateLoading}
                    error={stateError}
                    title="States by Fund Utilization"
                  />
                </Suspense>
              ) : (
                <ChartSkeleton />
              )}
            </div>
            <div className="chart-container pie-chart">
              {!chartsReady ? (
                <ChartSkeleton />
              ) : mpLoading ? (
                <LoadingState type="chart" message="Loading MP data..." />
              ) : (
                <Suspense fallback={<ChartSkeleton />}>
                  <MPPersonalityChart data={mpData?.data || []} />
                </Suspense>
              )}
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Project Status"
          subtitle="Track the progress of MPLADS projects across different stages"
          icon={<FiActivity />}
          defaultOpen={true}
          className="dashboard-section"
        >
          <div className="chart-container full-width">
            <ProjectStatusCards
              data={{
                totalRecommended: overview.totalWorksRecommended || 0,
                totalInProgress: overview.pendingWorks || 0,
                totalCompleted: overview.totalWorksCompleted || 0,
              }}
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="State-wise Allocation"
          subtitle="Distribution of MPLADS funds across states and union territories"
          icon={<FiPieChart />}
          defaultOpen={false}
          className="dashboard-section"
        >
          <div className="chart-container full-width">
            {stateLoading ? (
              <LoadingState type="chart" message="Loading state allocation data..." size="large" />
            ) : !chartsReady ? (
              <ChartSkeleton size="large" />
            ) : (
              <Suspense fallback={<ChartSkeleton size="large" />}>
                <StateAllocationChart data={stateData?.data} />
              </Suspense>
            )}
          </div>
        </CollapsibleSection>
      </div>

      <div className="dashboard-info">
        <Card className="info-card">
          <CardHeader>
            <CardTitle>About MPLADS</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              The Member of Parliament Local Area Development Scheme (MPLADS) enables MPs to
              recommend development projects worth ₹5 crores annually in their constituencies. This
              dashboard provides transparency into how these funds are being utilized across India.
            </p>
          </CardContent>
        </Card>

        <Card className="info-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="quick-actions">
              <Button
                className="action-btn bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => navigate('/mplads/states')}
                variant="default"
              >
                View All States
              </Button>
              <Button
                className="action-btn bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => navigate('/mplads/search')}
                variant="default"
              >
                Search MPs
              </Button>
              <div className="action-btn-wrapper">
                <Button
                  className="action-btn"
                  disabled
                  aria-describedby="top-performers-disabled-tooltip"
                  variant="outline"
                >
                  View Top Performers
                </Button>
                <InfoTooltip
                  content="Top Performers feature is being worked on with very high priority and will be live soon!"
                  position="top"
                  className="tooltip"
                  size="small"
                />
              </div>
              <div className="action-btn-wrapper">
                <Button
                  className="action-btn"
                  disabled
                  aria-describedby="report-disabled-tooltip"
                  variant="outline"
                >
                  Download Report
                </Button>
                <InfoTooltip
                  content="Report generation is coming soon. You'll be able to download comprehensive MPLADS reports in PDF format."
                  position="top"
                  className="tooltip"
                  size="small"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
