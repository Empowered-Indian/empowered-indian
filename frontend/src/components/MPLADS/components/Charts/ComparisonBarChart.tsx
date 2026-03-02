import ReactECharts from 'echarts-for-react'
import { memo } from 'react'
import { useResponsive } from '../../../../hooks/useMediaQuery'
import {
  getResponsiveChartOptions,
  getResponsiveChartDimensions,
} from '../../../../utils/chartHelpers'

const ComparisonBarChart = ({
  data = [],
  title = 'Constituency Performance Comparison',
  xAxisLabel = 'Constituencies',
  yAxisLabel = 'Utilization %',
}) => {
  const responsive = useResponsive()
  // Check if data has the correct structure
  const hasValidData = data && data.categories && data.series && data.categories.length > 0

  // Don't render chart if no valid data
  if (!hasValidData) {
    return (
      <div className="comparison-chart-container">
        <div
          style={{
            minHeight: '300px',
            maxHeight: '500px',
            height: 'clamp(300px, 40vh, 500px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            fontSize: '16px',
          }}
        >
          No data available for comparison
        </div>
      </div>
    )
  }

  const chartData = data

  const baseOption = {
    title: {
      text: title,
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold',
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: function (params) {
        let tooltip = params[0].name + '<br/>'
        params.forEach(item => {
          tooltip += `${item.marker} ${item.seriesName}: ${item.value}%<br/>`
        })
        return tooltip
      },
    },
    legend: {
      data: chartData.series.map(s => s.name),
      top: 40,
      type: 'scroll',
    },
    toolbox: {
      feature: {
        magicType: {
          type: ['line', 'bar'],
          title: {
            line: 'Line',
            bar: 'Bar',
          },
        },
        restore: {
          title: 'Restore',
        },
        saveAsImage: {
          title: 'Save',
          pixelRatio: 2,
        },
      },
      right: 20,
      top: 10,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '20%',
      containLabel: true,
    },
    xAxis: [
      {
        type: 'category',
        data: chartData.categories,
        axisTick: {
          alignWithLabel: true,
        },
        axisLabel: {
          rotate: responsive.isMobile ? 45 : 30,
          interval: 0,
          fontSize: responsive.isSmallMobile ? 9 : 11,
        },
        name: xAxisLabel,
        nameLocation: 'middle',
        nameGap: 60,
      },
    ],
    yAxis: [
      {
        type: 'value',
        name: yAxisLabel,
        nameLocation: 'middle',
        nameGap: 50,
        min: 0,
        max: 100,
        axisLabel: {
          formatter: '{value}%',
          fontSize: responsive.isSmallMobile ? 9 : 11,
        },
      },
    ],
    series: chartData.series.map((serie, index) => ({
      name: serie.name,
      type: 'bar',
      barGap: 0,
      emphasis: {
        focus: 'series',
      },
      itemStyle: {
        color: index === 0 ? '#5470c6' : index === 1 ? '#91cc75' : '#fac858',
      },
      data: serie.data,
      barMaxWidth: responsive.isMobile ? (responsive.isSmallMobile ? 15 : 20) : 30,
    })),
  }

  // Apply responsive optimizations
  const option = getResponsiveChartOptions(baseOption, {
    isMobile: responsive.isMobile,
    isSmallMobile: responsive.isSmallMobile,
    isTouchDevice: responsive.isTouchDevice,
  })

  // Get responsive dimensions
  const chartDimensions = getResponsiveChartDimensions({
    isMobile: responsive.isMobile,
    isSmallMobile: responsive.isSmallMobile,
    aspectRatio: 1.4,
  })

  return (
    <div
      className="comparison-chart-container"
      style={{
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <ReactECharts
        option={option}
        style={chartDimensions.style}
        opts={{
          renderer: responsive.isMobile ? 'svg' : 'canvas',
          devicePixelRatio: responsive.isMobile ? 2 : 1,
        }}
        notMerge={true}
        lazyUpdate={true}
      />

      {/* Mobile scroll hint */}
      {responsive.isMobile && chartData.categories && chartData.categories.length > 6 && (
        <div
          style={{
            textAlign: 'center',
            fontSize: '12px',
            color: 'var(--text-tertiary)',
            marginTop: '8px',
            padding: '4px',
          }}
        >
          Swipe or scroll to view more data points
        </div>
      )}
    </div>
  )
}

export default memo(ComparisonBarChart)
