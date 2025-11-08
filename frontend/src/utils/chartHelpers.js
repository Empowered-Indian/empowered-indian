/**
 * Chart utility functions for responsive design and mobile optimization
 */

/**
 * Generate responsive chart options based on device type
 * @param {Object} baseOptions - Base ECharts options
 * @param {Object} responsive - Responsive configuration
 * @returns {Object} Responsive chart options
 */
export const getResponsiveChartOptions = (baseOptions, responsive = {}) => {
  const { isMobile = false, isSmallMobile = false, isTouchDevice = false } = responsive

  // Deep clone base options to avoid mutation
  const options = JSON.parse(JSON.stringify(baseOptions))

  if (isMobile) {
    // Mobile-specific adjustments

    // Title adjustments
    if (options.title) {
      options.title.textStyle = {
        ...options.title.textStyle,
        fontSize: isSmallMobile ? 14 : 16,
        fontWeight: 'bold',
      }

      if (options.title.subtext && options.title.subtextStyle) {
        options.title.subtextStyle.fontSize = isSmallMobile ? 10 : 11
      }
    }

    // Legend adjustments for mobile
    if (options.legend) {
      options.legend = {
        ...options.legend,
        type: 'scroll',
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        padding: [5, 0, 0, 0],
        textStyle: {
          fontSize: isSmallMobile ? 10 : 11,
        },
        pageButtonItemGap: 5,
        pageButtonGap: 10,
        pageIconSize: 12,
      }
    }

    // Grid adjustments for mobile
    if (options.grid) {
      options.grid = {
        ...options.grid,
        left: isSmallMobile ? '10%' : '15%',
        right: isSmallMobile ? '10%' : '15%',
        bottom: options.legend ? '15%' : '10%',
        top: options.title ? '20%' : '10%',
        containLabel: true,
      }
    }

    // Axis label adjustments
    if (options.xAxis) {
      const xAxisArray = Array.isArray(options.xAxis) ? options.xAxis : [options.xAxis]
      xAxisArray.forEach(axis => {
        if (axis.axisLabel) {
          axis.axisLabel = {
            ...axis.axisLabel,
            fontSize: isSmallMobile ? 9 : 10,
            rotate: axis.axisLabel.rotate || 45,
            interval: 0,
            margin: 8,
          }
        }
        if (axis.nameTextStyle) {
          axis.nameTextStyle.fontSize = isSmallMobile ? 9 : 10
        }
      })
      options.xAxis = xAxisArray.length === 1 ? xAxisArray[0] : xAxisArray
    }

    if (options.yAxis) {
      const yAxisArray = Array.isArray(options.yAxis) ? options.yAxis : [options.yAxis]
      yAxisArray.forEach(axis => {
        if (axis.axisLabel) {
          axis.axisLabel = {
            ...axis.axisLabel,
            fontSize: isSmallMobile ? 9 : 10,
            margin: 8,
          }
        }
        if (axis.nameTextStyle) {
          axis.nameTextStyle.fontSize = isSmallMobile ? 9 : 10
        }
      })
      options.yAxis = yAxisArray.length === 1 ? yAxisArray[0] : yAxisArray
    }

    // Tooltip adjustments for mobile
    if (options.tooltip) {
      options.tooltip = {
        ...options.tooltip,
        confine: true,
        position: 'top',
        textStyle: {
          fontSize: isSmallMobile ? 11 : 12,
        },
      }
    }

    // Toolbox adjustments for mobile (make it simpler)
    if (options.toolbox) {
      options.toolbox = {
        ...options.toolbox,
        right: 10,
        top: 10,
        iconStyle: {
          borderWidth: 1,
        },
        emphasis: {
          iconStyle: {
            borderWidth: 2,
          },
        },
        feature: {
          saveAsImage: {
            title: 'Save',
            pixelRatio: 2,
          },
        },
      }
    }
  }

  // Touch device specific adjustments
  if (isTouchDevice) {
    // Increase touch target sizes
    if (options.series) {
      options.series.forEach(series => {
        if (series.type === 'pie') {
          series.emphasis = {
            ...series.emphasis,
            scale: true,
            scaleSize: 5,
          }
        }

        if (series.type === 'line' && series.symbol) {
          series.symbolSize = Math.max(series.symbolSize || 4, 8)
        }

        if (series.type === 'bar') {
          series.barMinWidth = 20
        }
      })
    }

    // Make tooltip easier to trigger on touch
    if (options.tooltip) {
      options.tooltip = {
        ...options.tooltip,
        triggerOn: 'click',
        hideDelay: 3000,
      }
    }
  }

  return options
}

/**
 * Get responsive chart dimensions
 * @param {Object} responsive - Responsive configuration
 * @returns {Object} Chart dimensions and container styles
 */
export const getResponsiveChartDimensions = (responsive = {}) => {
  const {
    isMobile = false,
    isSmallMobile = false,
    containerWidth = 800,
    aspectRatio = 1.6, // width/height ratio
  } = responsive

  let height
  let width = '100%'

  if (isSmallMobile) {
    height = Math.min(300, Math.round(containerWidth / 1.2))
  } else if (isMobile) {
    height = Math.min(350, Math.round(containerWidth / 1.4))
  } else {
    height = Math.min(400, Math.round(containerWidth / aspectRatio))
  }

  return {
    width,
    height,
    style: {
      width,
      height: `${height}px`,
      minHeight: isMobile ? '280px' : '350px',
    },
  }
}

/**
 * Generate color palette optimized for accessibility
 * @param {number} count - Number of colors needed
 * @param {boolean} isHighContrast - Whether to use high contrast colors
 * @returns {Array} Array of color values
 */
export const getAccessibleColorPalette = (count, isHighContrast = false) => {
  const highContrastColors = [
    '#1f2937', // Dark gray
    '#dc2626', // Red
    '#059669', // Green
    '#2563eb', // Blue
    '#7c3aed', // Purple
    '#ea580c', // Orange
    '#0891b2', // Cyan
    '#be123c', // Pink
  ]

  const normalColors = [
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Violet
    '#06b6d4', // Cyan
    '#84cc16', // Lime
    '#f97316', // Orange
  ]

  const palette = isHighContrast ? highContrastColors : normalColors

  if (count <= palette.length) {
    return palette.slice(0, count)
  }

  // Generate additional colors if needed
  const result = [...palette]
  while (result.length < count) {
    result.push(`hsl(${(result.length * 137.5) % 360}, 65%, 50%)`)
  }

  return result.slice(0, count)
}

/**
 * Generate mobile-optimized series configurations
 * @param {Array} series - Base series configuration
 * @param {Object} responsive - Responsive configuration
 * @returns {Array} Optimized series configuration
 */
export const getResponsiveSeries = (series, responsive = {}) => {
  const { isMobile = false, isSmallMobile = false, isTouchDevice = false } = responsive

  return series.map(s => {
    const optimizedSeries = { ...s }

    if (isMobile) {
      // Adjust bar chart properties
      if (s.type === 'bar') {
        optimizedSeries.barMaxWidth = isSmallMobile ? 15 : 20
        optimizedSeries.barMinHeight = 8

        if (s.itemStyle) {
          optimizedSeries.itemStyle = {
            ...s.itemStyle,
            borderRadius: isSmallMobile ? [1, 1, 0, 0] : [2, 2, 0, 0],
          }
        }
      }

      // Adjust line chart properties
      if (s.type === 'line') {
        optimizedSeries.lineStyle = {
          ...s.lineStyle,
          width: Math.max(s.lineStyle?.width || 2, 2),
        }
        optimizedSeries.symbolSize = Math.max(s.symbolSize || 4, isTouchDevice ? 8 : 6)
      }

      // Adjust pie chart properties
      if (s.type === 'pie') {
        optimizedSeries.radius = isSmallMobile ? ['35%', '65%'] : ['40%', '70%']
        optimizedSeries.label = {
          ...s.label,
          fontSize: isSmallMobile ? 10 : 11,
        }

        if (s.labelLine) {
          optimizedSeries.labelLine = {
            ...s.labelLine,
            length: isSmallMobile ? 8 : 10,
            length2: isSmallMobile ? 5 : 8,
          }
        }
      }
    }

    return optimizedSeries
  })
}

export default {
  getResponsiveChartOptions,
  getResponsiveChartDimensions,
  getAccessibleColorPalette,
  getResponsiveSeries,
}
