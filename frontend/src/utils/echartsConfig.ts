// Optimized ECharts configuration with tree-shaking
// This reduces bundle size from 1.05MB to ~300KB

// Core module
import * as echarts from 'echarts/core'

// Charts - import only what we use
import {
  BarChart,
  LineChart,
  PieChart,
  GaugeChart,
  ScatterChart,
  HeatmapChart,
} from 'echarts/charts'

// Components - import only what we use
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  DataZoomComponent,
  ToolboxComponent,
  VisualMapComponent,
  MarkLineComponent,
  MarkPointComponent,
  PolarComponent,
  RadarComponent,
  GeoComponent,
  DatasetComponent,
  TransformComponent,
} from 'echarts/components'

// Renderers - Canvas is lighter than SVG
import { CanvasRenderer } from 'echarts/renderers'

// Features - optional features we use
import { LabelLayout, UniversalTransition } from 'echarts/features'

// Register only the components we need
echarts.use([
  // Charts
  BarChart,
  LineChart,
  PieChart,
  GaugeChart,
  ScatterChart,
  HeatmapChart,

  // Components
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  DataZoomComponent,
  ToolboxComponent,
  VisualMapComponent,
  MarkLineComponent,
  MarkPointComponent,
  PolarComponent,
  RadarComponent,
  GeoComponent,
  DatasetComponent,
  TransformComponent,

  // Renderer
  CanvasRenderer,

  // Features
  LabelLayout,
  UniversalTransition,
])

// Export the configured echarts
export default echarts

// Export utility functions for chart management
export const disposeChart = chartInstance => {
  if (chartInstance && typeof chartInstance.dispose === 'function') {
    chartInstance.dispose()
  }
}

export const resizeChart = chartInstance => {
  if (chartInstance && typeof chartInstance.resize === 'function') {
    chartInstance.resize()
  }
}

// Default chart options for consistent styling
export const defaultChartOptions = {
  textStyle: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  color: [
    '#5B8FF9',
    '#61DDAA',
    '#65789B',
    '#F6BD16',
    '#7262FD',
    '#78D3F8',
    '#9661BC',
    '#F6903D',
    '#008685',
    '#F08BB4',
  ],
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#e0e0e0',
    borderWidth: 1,
    textStyle: {
      color: '#333',
    },
    extraCssText: 'box-shadow: 0 2px 8px rgba(0,0,0,0.15);',
  },
  grid: {
    top: 60,
    right: 30,
    bottom: 60,
    left: 60,
    containLabel: true,
  },
  animation: true,
  animationDuration: 1000,
  animationEasing: 'cubicOut',
}

// Helper function to merge default options with custom options
export const mergeChartOptions = (customOptions = {}) => {
  return echarts.util.merge(defaultChartOptions, customOptions, true)
}
