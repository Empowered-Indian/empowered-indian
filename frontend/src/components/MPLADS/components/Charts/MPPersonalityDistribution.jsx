import { useState, useEffect } from 'react'
import ReactECharts from 'echarts-for-react'

const MPPersonalityDistribution = ({ data, title = 'MP Personality Type Distribution' }) => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  // Process MP data to categorize by personality types based on performance patterns
  const processPersonalityData = mpsData => {
    if (!mpsData || !Array.isArray(mpsData)) {
      return []
    }

    const personalityTypes = {
      'High Achievers': {
        count: 0,
        color: '#28a745',
        description: 'MPs with >90% fund utilization',
      },
      Consistent: { count: 0, color: '#17a2b8', description: 'MPs with 70-90% fund utilization' },
      Moderate: { count: 0, color: '#ffc107', description: 'MPs with 50-70% fund utilization' },
      'Low Performers': {
        count: 0,
        color: '#dc3545',
        description: 'MPs with <50% fund utilization',
      },
      Inactive: { count: 0, color: '#6c757d', description: 'MPs with minimal or no activity' },
    }

    mpsData.forEach(mp => {
      const utilization = mp.utilizationPercentage || 0
      const expenditure = mp.totalExpenditure || 0

      if (expenditure === 0) {
        personalityTypes['Inactive'].count++
      } else if (utilization >= 90) {
        personalityTypes['High Achievers'].count++
      } else if (utilization >= 70) {
        personalityTypes['Consistent'].count++
      } else if (utilization >= 50) {
        personalityTypes['Moderate'].count++
      } else {
        personalityTypes['Low Performers'].count++
      }
    })

    return Object.entries(personalityTypes)
      .filter(([, data]) => data.count > 0)
      .map(([name, data]) => ({
        name,
        value: data.count,
        itemStyle: { color: data.color },
        description: data.description,
      }))
  }

  const chartData = processPersonalityData(data)
  const totalMPs = chartData.reduce((sum, item) => sum + item.value, 0)

  const option = {
    title: {
      text: title,
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: isMobile ? 14 : 16,
        fontWeight: 'bold',
      },
    },
    tooltip: {
      trigger: 'item',
      confine: true, // Keep tooltip within the chart area
      appendToBody: true, // Append to body to avoid overflow issues
      formatter: function (params) {
        const percentage = ((params.value / totalMPs) * 100).toFixed(1)
        const item = chartData.find(d => d.name === params.name)
        return `
          <div style="text-align: left; max-width: 200px;">
            <strong>${params.name}</strong><br/>
            Count: ${params.value} MPs<br/>
            Percentage: ${percentage}%<br/>
            <em style="font-size: 11px; color: #666;">${item?.description || ''}</em>
          </div>
        `
      },
    },
    legend: {
      orient: isMobile ? 'horizontal' : 'vertical',
      right: isMobile ? 'center' : 10,
      bottom: isMobile ? 15 : 'auto',
      top: isMobile ? 'auto' : 'middle',
      itemGap: isMobile ? 8 : 12,
      itemWidth: isMobile ? 14 : 16,
      itemHeight: isMobile ? 10 : 12,
      textStyle: {
        fontSize: isMobile ? 11 : 12,
        lineHeight: isMobile ? 14 : 16,
        width: isMobile ? 80 : 100,
      },
      formatter: function (name) {
        const item = chartData.find(d => d.name === name)
        const percentage = item ? ((item.value / totalMPs) * 100).toFixed(1) : '0'
        if (isMobile) {
          return `${name} (${percentage}%)`
        } else {
          return `${name}\n${percentage}%`
        }
      },
    },
    series: [
      {
        name: 'MP Distribution',
        type: 'pie',
        radius: isMobile ? ['25%', '55%'] : ['35%', '65%'],
        center: isMobile ? ['50%', '45%'] : ['40%', '55%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: isMobile ? 3 : 5,
          borderColor: '#fff',
          borderWidth: 1.5,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: isMobile ? 11 : 13,
            fontWeight: 'bold',
            formatter: function (params) {
              const percentage = ((params.value / totalMPs) * 100).toFixed(1)
              const shortName =
                params.name.length > 12 ? params.name.substring(0, 10) + '...' : params.name
              return `${shortName}\n${params.value} MPs\n${percentage}%`
            },
          },
          itemStyle: {
            shadowBlur: isMobile ? 5 : 7,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.3)',
          },
        },
        labelLine: {
          show: false,
        },
        data: chartData,
      },
    ],
  }

  // Show message when no data is available
  if (chartData.length === 0) {
    return (
      <div
        className="personality-distribution-container"
        style={{
          height: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '18px', fontWeight: 'bold' }}>{title}</h3>
        <div style={{ color: '#666', fontSize: '14px' }}>
          <p style={{ margin: '0 0 0.5rem 0' }}>No MP performance data available</p>
          <p style={{ margin: '0', fontSize: '12px' }}>
            MP utilization data needed for personality analysis
          </p>
        </div>
      </div>
    )
  }

  const chartHeight = isMobile ? '420px' : '480px' // Increased height to accommodate 5 readable legends

  return (
    <div
      className="personality-distribution-container"
      style={{
        position: 'relative',
        overflow: 'hidden', // Prevent overflow issues
      }}
    >
      <ReactECharts
        option={option}
        style={{ height: chartHeight, width: '100%' }}
        opts={{ renderer: 'svg' }}
        onEvents={{
          // Ensure tooltips don't overflow on click/hover
          mouseover: () => {
            // Handle tooltip positioning if needed
          },
        }}
      />
      <div
        style={{
          marginTop: isMobile ? '5px' : '10px',
          padding: isMobile ? '8px' : '10px',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
          fontSize: isMobile ? '10px' : '11px',
          color: '#666',
          textAlign: 'center',
          lineHeight: '1.4',
        }}
      >
        <strong>Total MPs Analyzed: {totalMPs}</strong>
        <br />
        <span style={{ fontSize: isMobile ? '9px' : '10px' }}>
          Performance categories based on MPLADS fund utilization rates
        </span>
      </div>
    </div>
  )
}

export default MPPersonalityDistribution
