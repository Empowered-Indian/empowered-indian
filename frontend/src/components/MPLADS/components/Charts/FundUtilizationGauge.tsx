import ReactECharts from 'echarts-for-react'
import { useMemo } from 'react'
import { useResponsive } from '../../../../hooks/useMediaQuery'

/**
 * Rewritten gauge with a simpler, robust layout:
 * - Uses half-gauge with fixed, proven geometry that avoids clipping
 * - Title rendered outside of the ECharts canvas to guarantee visibility
 * - Mobile responsive sizing via simple breakpoints
 */
const FundUtilizationGauge = ({ utilization = 0, title = 'Fund Utilization' }) => {
  const responsive = useResponsive()

  // Clamp and normalize
  const value = useMemo(() => {
    const n = Number.isFinite(utilization) ? utilization : 0
    return Math.max(0, Math.min(100, Number(n.toFixed(1))))
  }, [utilization])

  // Breakpoint-driven sizes (increase text sizes)
  const dims = useMemo(() => {
    if (responsive?.isSmallMobile) {
      return { height: 280, detailFont: 30, tickFont: 11, bandWidth: 16, pointerWidth: 6 }
    }
    if (responsive?.isMobile) {
      return { height: 330, detailFont: 36, tickFont: 12, bandWidth: 18, pointerWidth: 7 }
    }
    return { height: 400, detailFont: 42, tickFont: 13, bandWidth: 20, pointerWidth: 8 }
  }, [responsive])

  const option = useMemo(
    () => ({
      animation: true,
      animationDuration: 600,
      tooltip: { show: false },
      series: [
        // Background bands (darker, higher contrast)
        {
          type: 'gauge',
          startAngle: 180,
          endAngle: 0,
          min: 0,
          max: 100,
          radius: '95%',
          center: ['50%', '60%'],
          axisLine: {
            lineStyle: {
              width: dims.bandWidth,
              color: [
                [0.7, '#ef4444'], // darker red
                [0.9, '#f59e0b'], // darker amber
                [1, '#10b981'], // darker green
              ],
            },
          },
          splitLine: { show: false },
          axisTick: { show: false },
          axisLabel: {
            color: '#111827',
            distance: 24,
            fontSize: dims.tickFont,
            formatter: v => `${v}%`,
          },
          pointer: { show: false },
          detail: { show: false },
          title: { show: false },
        },
        // Pointer + numeric value (ensure visible text)
        {
          name: 'Utilization',
          type: 'gauge',
          startAngle: 180,
          endAngle: 0,
          min: 0,
          max: 100,
          radius: '92%',
          center: ['50%', '60%'],
          axisLine: { lineStyle: { width: 0 } },
          splitLine: { show: false },
          axisTick: { show: false },
          axisLabel: { show: false },
          pointer: {
            show: true,
            itemStyle: { color: '#111827' },
            width: dims.pointerWidth,
            length: '65%',
          },
          anchor: {
            show: true,
            showAbove: true,
            size: 10,
            itemStyle: { color: '#111827' },
          },
          detail: {
            show: true,
            valueAnimation: true,
            formatter: v => `${v.toFixed(1)}%`,
            color: '#111827',
            fontSize: dims.detailFont,
            fontWeight: 800,
            offsetCenter: [0, '30%'],
          },
          data: [{ value }],
        },
      ],
    }),
    [dims, value]
  )

  return (
    <div className="gauge-wrapper" style={{ width: '100%' }}>
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 8,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: responsive?.isSmallMobile ? 18 : responsive?.isMobile ? 20 : 22,
            fontWeight: 800,
            color: '#111827',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'visible',
          }}
        >
          {title}
        </h3>
      </div>

      <ReactECharts
        option={option}
        style={{
          width: '100%',
          height: `${dims.height}px`,
        }}
        opts={{ renderer: 'svg' }}
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  )
}

export default FundUtilizationGauge
