import ReactECharts from './OptimizedEChart'
import { useState } from 'react'
import { useResponsive } from '../../../../hooks/useMediaQuery'
import { getResponsiveChartOptions } from '../../../../utils/chartHelpers'

const MPPersonalityChart = ({ data, title = 'Fund Utilization Pattern Analysis' }) => {
  const [selectedType, setSelectedType] = useState(null)
  const responsive = useResponsive()

  // Categorize MPs based purely on fund utilization patterns
  const categorizeMP = utilization => {
    // High Utilizers: 85%+ fund utilization
    if (utilization >= 85) {
      return 'High Utilizers'
    }

    // Good Utilizers: 70-84% fund utilization
    if (utilization >= 70) {
      return 'Good Utilizers'
    }

    // Moderate Utilizers: 50-69% fund utilization
    if (utilization >= 50) {
      return 'Moderate Utilizers'
    }

    // Low Utilizers: <50% fund utilization
    return 'Low Utilizers'
  }

  // Process the data to count personality types
  const processData = rawData => {
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
      return []
    }

    const personalityCount = {
      'High Utilizers': 0,
      'Good Utilizers': 0,
      'Moderate Utilizers': 0,
      'Low Utilizers': 0,
    }

    const personalityDetails = {
      'High Utilizers': { total: 0, totalUtilization: 0, mps: [] },
      'Good Utilizers': { total: 0, totalUtilization: 0, mps: [] },
      'Moderate Utilizers': { total: 0, totalUtilization: 0, mps: [] },
      'Low Utilizers': { total: 0, totalUtilization: 0, mps: [] },
    }

    rawData.forEach(mp => {
      const utilization = mp.utilizationPercentage || 0
      const personality = categorizeMP(utilization)

      personalityCount[personality]++
      personalityDetails[personality].total++
      personalityDetails[personality].totalUtilization += utilization
      personalityDetails[personality].mps.push({
        name: mp.mpName || mp.name,
        utilization: utilization.toFixed(1),
        state: mp.state,
      })
    })

    // Create chart data with descriptions and averages
    const chartData = Object.entries(personalityCount)
      .filter(([, count]) => count > 0)
      .map(([personality, count]) => {
        const details = personalityDetails[personality]
        const avgUtilization =
          details.total > 0 ? (details.totalUtilization / details.total).toFixed(1) : 0

        return {
          name: personality,
          value: count,
          percentage: ((count / rawData.length) * 100).toFixed(1),
          avgUtilization,
          description: getPersonalityDescription(personality),
          mps: details.mps.slice(0, 5), // Top 5 examples
        }
      })

    return chartData
  }

  // Get utilization descriptions with neutral language
  const getPersonalityDescription = personality => {
    const descriptions = {
      'High Utilizers': 'Strong fund deployment (85%+ utilization)',
      'Good Utilizers': 'Effective fund deployment (70-84% utilization)',
      'Moderate Utilizers': 'Standard fund deployment (50-69% utilization)',
      'Low Utilizers': 'Limited fund deployment (<50% utilization)',
    }
    return descriptions[personality] || ''
  }

  // Get utilization colors (neutral, professional scheme)
  const getPersonalityColors = () => {
    return {
      'High Utilizers': '#2563EB', // Professional blue
      'Good Utilizers': '#059669', // Teal
      'Moderate Utilizers': '#D97706', // Amber
      'Low Utilizers': '#6B7280', // Neutral gray (not red!)
    }
  }

  const chartData = processData(data)
  const colors = getPersonalityColors()

  // On mobile switch to a horizontal bar layout: the four long category names
  // ("High Utilizers", ...) read fully and horizontally instead of being
  // rotated/truncated on a narrow screen. Value axis and label placement move
  // accordingly. Desktop keeps the original vertical bar chart.
  const isMobileLayout = responsive.isMobile

  const baseOption = {
    title: {
      text: isMobileLayout ? 'Fund Utilization Patterns' : title,
      subtext: `Total MPs Analyzed: ${data?.length || 0}`,
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: responsive.isSmallMobile ? 14 : responsive.isMobile ? 16 : 18,
        fontWeight: 'bold',
      },
      subtextStyle: {
        fontSize: responsive.isSmallMobile ? 11 : responsive.isMobile ? 12 : 13,
        color: '#666',
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: function (params) {
        const param = Array.isArray(params) ? params[0] : params
        const item = chartData.find(d => d.name === param.name)
        if (!item) return param?.name ? `<strong>${param.name}</strong>` : ''
        return `
          <div style="max-width: 300px;">
            <strong>${item.name}</strong><br/>
            <div style="margin: 8px 0; padding: 8px; background: #f5f5f5; border-radius: 4px;">
              ${item.description}
            </div>
            <div style="display: flex; justify-content: space-between; margin: 4px 0;">
              <span>MPs:</span><strong>${item.value} (${item.percentage}%)</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 4px 0;">
              <span>Avg Utilization:</span><strong>${item.avgUtilization}%</strong>
            </div>
            ${
              item.mps && item.mps.length > 0
                ? `<div style="margin-top: 8px; font-size: 11px;">
                <strong>Examples:</strong><br/>
                ${item.mps
                  .slice(0, 3)
                  .map(mp => `• ${mp.name} (${mp.state}): ${mp.utilization}% utilization`)
                  .join('<br/>')}
              </div>`
                : ''
            }
          </div>
        `
      },
    },
    grid: isMobileLayout
      ? {
          // Horizontal bars: leave room on the left for full category names and
          // on the right for the percentage data labels.
          left: '3%',
          right: '12%',
          bottom: '8%',
          top: '15%',
          containLabel: true,
        }
      : {
          left: '3%',
          right: '4%',
          bottom: responsive.isMobile ? '15%' : '12%',
          top: responsive.isMobile ? '15%' : '12%',
          containLabel: true,
        },
    xAxis: isMobileLayout
      ? {
          type: 'value',
          name: 'Percentage (%)',
          nameLocation: 'middle',
          nameGap: 30,
          nameTextStyle: { fontSize: responsive.isSmallMobile ? 10 : 11, fontWeight: 'bold' },
          axisLabel: {
            fontSize: responsive.isSmallMobile ? 9 : 10,
            color: '#333333',
            formatter: '{value}%',
          },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { color: '#f0f0f0' } },
        }
      : {
          type: 'category',
          data: chartData.map(item => item.name),
          axisLabel: {
            fontSize: responsive.isSmallMobile ? 9 : responsive.isMobile ? 10 : 11,
            rotate: responsive.isMobile ? 25 : 0,
            interval: 0,
            color: '#333333',
            formatter: function (value) {
              if (responsive.isMobile && value.length > 10) {
                return value.replace(' Utilizers', '').replace(' Performers', '')
              }
              return value
            },
          },
          axisLine: {
            lineStyle: {
              color: '#e0e6ed',
            },
          },
          axisTick: {
            alignWithLabel: true,
          },
        },
    yAxis: isMobileLayout
      ? {
          type: 'category',
          // Reverse so the first/strongest category ("High") appears on top.
          inverse: true,
          data: chartData.map(item => item.name),
          axisLabel: {
            fontSize: responsive.isSmallMobile ? 10 : 11,
            color: '#333333',
            // No rotation needed — names have the whole row width to breathe.
            formatter: function (value) {
              return value.replace(' Utilizers', '')
            },
          },
          axisLine: { lineStyle: { color: '#e0e6ed' } },
          axisTick: { alignWithLabel: true },
        }
      : {
          type: 'value',
          name: 'Percentage (%)',
          nameLocation: 'middle',
          nameGap: responsive.isMobile ? 35 : 40,
          nameTextStyle: {
            fontSize: responsive.isMobile ? 11 : 12,
            fontWeight: 'bold',
          },
          axisLabel: {
            fontSize: responsive.isMobile ? 10 : 12,
            color: '#333333',
            formatter: '{value}%',
          },
          axisLine: {
            show: false,
          },
          axisTick: {
            show: false,
          },
          splitLine: {
            lineStyle: {
              color: '#f0f0f0',
            },
          },
        },
    series: [
      {
        name: 'MP Distribution',
        type: 'bar',
        data: chartData.map(item => ({
          name: item.name,
          value: parseFloat(item.percentage),
          itemStyle: {
            color: colors[item.name] || '#94A3B8',
            borderRadius: isMobileLayout ? [0, 4, 4, 0] : [4, 4, 0, 0],
          },
        })),
        barWidth: isMobileLayout ? '55%' : responsive.isMobile ? '60%' : '50%',
        label: {
          show: true,
          // Horizontal bars: label inside the end of the bar; vertical bars: on
          // top. Keep the on-bar label to just the percentage on mobile to avoid
          // collisions; the (count) detail lives in the tooltip.
          position: isMobileLayout ? 'right' : 'top',
          fontSize: responsive.isSmallMobile ? 10 : responsive.isMobile ? 11 : 12,
          fontWeight: 'bold',
          color: '#333333',
          formatter: function (params) {
            const item = chartData.find(d => d.name === params.name)
            if (isMobileLayout) {
              return `${params.value}%`
            }
            return `${params.value}%\n(${item ? item.value : 0})`
          },
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.3)',
          },
        },
      },
    ],
  }

  const onChartClick = params => {
    if (params.componentType === 'series') {
      setSelectedType(params.name)
    }
  }

  const onEvents = {
    click: onChartClick,
  }

  // Show message when no data is available
  if (chartData.length === 0) {
    return (
      <div
        className="mp-personality-chart-container"
        style={{
          height: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '18px', fontWeight: 'bold' }}>{title}</h3>
        <div style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
          <p style={{ margin: '0 0 0.5rem 0' }}>MP personality data unavailable</p>
          <p style={{ margin: '0', fontSize: '12px' }}>
            MP fund utilization data needed for performance analysis
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mp-personality-chart-container">
      <ReactECharts
        option={getResponsiveChartOptions(baseOption, {
          // On mobile the option is already laid out specifically for small
          // screens (horizontal bars), so we don't run the generic mobile
          // transforms — only desktop gets them.
          isMobile: !isMobileLayout && responsive.isMobile,
          isSmallMobile: false,
          isTouchDevice: responsive.isTouchDevice,
        })}
        style={{
          height: responsive.isSmallMobile ? '320px' : responsive.isMobile ? '360px' : '400px',
          width: '100%',
          minHeight: '280px',
        }}
        opts={{
          renderer: 'canvas',
          devicePixelRatio: responsive.isMobile ? 2 : 1,
        }}
        onEvents={onEvents}
        notMerge={true}
        lazyUpdate={true}
      />

      {/* Performance Type Legends */}
      <div
        style={{
          marginTop: '15px',
          padding: responsive.isMobile ? '10px 12px' : '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          fontSize: responsive.isSmallMobile ? '11px' : '12px',
        }}
      >
        {responsive.isMobile ? (
          // Compact mobile legend: one tight line per category (color dot +
          // name + count + %), reclaiming vertical space for the plot. Full
          // descriptions remain available via the chart tooltip.
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {chartData.map(item => (
              <div
                key={item.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: responsive.isSmallMobile ? '11px' : '12px',
                }}
              >
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: colors[item.name],
                    borderRadius: '3px',
                    flexShrink: 0,
                  }}
                ></div>
                <strong>{item.name.replace(' Utilizers', '')}</strong>
                <span style={{ color: '#666', marginLeft: 'auto' }}>
                  {item.value} MPs · {item.percentage}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '8px',
            }}
          >
            {chartData.map(item => (
              <div
                key={item.name}
                style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}
              >
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: colors[item.name],
                    borderRadius: '3px',
                    marginTop: '2px',
                    flexShrink: 0,
                  }}
                ></div>
                <div style={{ color: '#333' }}>
                  <strong>{item.name}</strong>: {item.description}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedType && (
        <div style={{ textAlign: 'center', marginTop: '10px', color: '#666' }}>
          <small>
            Click on chart segments to explore personality types. Selected: {selectedType}
          </small>
        </div>
      )}
    </div>
  )
}

export default MPPersonalityChart
