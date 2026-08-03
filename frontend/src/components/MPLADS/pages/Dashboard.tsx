import { useOverview, useMPSummary, useStateSummary } from '../../../hooks/useApi'
import {
  FiUsers,
  FiCheckCircle,
  FiBarChart2,
  FiPieChart,
  FiActivity,
  FiAlertTriangle,
  FiFileText,
} from 'react-icons/fi'
import { BiHourglass } from 'react-icons/bi'
import { IndianRupee } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const StatePerformanceChart = lazy(() => import('../components/Charts/StatePerformanceChart'))
const MPPersonalityChart = lazy(() => import('../components/Charts/MPPersonalityChart'))
const StateAllocationChart = lazy(() => import('../components/Charts/StateAllocationChart'))

const ChartSkeleton = ({ size = 'default' }: { size?: 'default' | 'large' }) => (
  <div className={`chart-skeleton chart-skeleton--${size}`} aria-hidden="true">
    <SkeletonLoader type="chart" />
  </div>
)

const ProjectStatusSkeleton = () => (
  <div className="project-status-skeleton" aria-hidden="true">
    <SkeletonLoader width="min(16rem, 60%)" height="1.5rem" />
    <div className="project-status-skeleton__grid">
      {[1, 2, 3].map(item => (
        <div className="project-status-skeleton__card" key={item}>
          <div className="project-status-skeleton__header">
            <SkeletonLoader width="4rem" height="4rem" />
            <SkeletonLoader width="4rem" height="1.5rem" />
          </div>
          <SkeletonLoader width="45%" height="1rem" />
          <SkeletonLoader width="55%" height="2rem" />
          <SkeletonLoader width="70%" height="1rem" />
        </div>
      ))}
    </div>
  </div>
)

const Dashboard = () => {
  const navigate = useNavigate()
  const [chartsReady, setChartsReady] = useState(false)
  const chartsSectionRef = useRef<HTMLDivElement | null>(null)

  const { data, isLoading, error, refetch } = useOverview()
  const { data: mpData, isLoading: mpLoading } = useMPSummary(
    { limit: 800 },
    { enabled: chartsReady }
  )
  const {
    data: stateData,
    isLoading: stateLoading,
    error: stateError,
  } = useStateSummary({ limit: 50 }, { enabled: chartsReady })
  const { filters } = useFilters()
  const periodLabel =
    (filters?.house || 'Lok Sabha') === 'Lok Sabha'
      ? getPeriodLabel(filters?.lsTerm || 18)
      : filters?.house === 'Rajya Sabha'
        ? 'Rajya Sabha'
        : `Both Houses • ${getPeriodLabel(filters?.lsTerm || 18)}`

  useEffect(() => {
    if (chartsReady) return undefined

    let idleId: number | undefined
    let fallbackTimer: number | undefined
    let observer: IntersectionObserver | undefined

    const revealCharts = () => setChartsReady(true)
    const onUserIntent = () => revealCharts()

    if ('IntersectionObserver' in window && chartsSectionRef.current) {
      observer = new IntersectionObserver(
        entries => {
          if (entries.some(entry => entry.isIntersecting)) {
            revealCharts()
          }
        },
        { rootMargin: '300px 0px' }
      )
      observer.observe(chartsSectionRef.current)
    }

    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(revealCharts, { timeout: 5000 })
    } else {
      fallbackTimer = window.setTimeout(revealCharts, 4500)
    }

    window.addEventListener('scroll', onUserIntent, { passive: true, once: true })
    window.addEventListener('pointerdown', onUserIntent, { passive: true, once: true })

    return () => {
      observer?.disconnect()
      window.removeEventListener('scroll', onUserIntent)
      window.removeEventListener('pointerdown', onUserIntent)
      if (idleId !== undefined && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId)
      }
      if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer)
    }
  }, [chartsReady])

  const overview = data?.data || {}
  const isInitialOverviewLoading = isLoading && !data

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

      {error && !data ? (
        <ErrorDisplay error={error} onRetry={refetch} title="Unable to load dashboard data" />
      ) : (
        <>
          <div className="metrics-grid" aria-busy={isInitialOverviewLoading}>
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
                  {isInitialOverviewLoading ? (
                    <SkeletonLoader
                      className="metric-value-skeleton"
                      width="min(12rem, 80%)"
                      height="1.7rem"
                    />
                  ) : (
                    <p className="metric-value">{metric.value}</p>
                  )}
                  <p className="metric-description">{metric.description}</p>
                  <p className="metric-period">{periodLabel}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Visualization Charts Section with Progressive Disclosure */}
          <div className="charts-section" ref={chartsSectionRef}>
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
                {isInitialOverviewLoading ? (
                  <ProjectStatusSkeleton />
                ) : (
                  <ProjectStatusCards
                    data={{
                      totalRecommended: overview.totalWorksRecommended || 0,
                      totalInProgress: overview.pendingWorks || 0,
                      totalCompleted: overview.totalWorksCompleted || 0,
                    }}
                  />
                )}
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
                  <LoadingState
                    type="chart"
                    message="Loading state allocation data..."
                    size="large"
                  />
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
                  recommend development projects worth ₹5 crores annually in their constituencies.
                  This dashboard provides transparency into how these funds are being utilized
                  across India.
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
        </>
      )}
    </div>
  )
}

export default Dashboard
