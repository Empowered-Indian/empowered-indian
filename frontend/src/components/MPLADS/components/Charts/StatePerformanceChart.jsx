import { useEffect, useMemo, useRef } from 'react';
import echarts from '../../../../utils/echartsConfig';
import { FiTrendingUp, FiInfo } from 'react-icons/fi';
import LoadingState from '../Common/LoadingState';
import ErrorDisplay from '../Common/ErrorDisplay';
import InfoTooltip from '../Common/InfoTooltip';
import { useResponsive } from '../../../../hooks/useMediaQuery';

// Utility: convert rupees to crores
const toCrores = (amountInRupees) => (amountInRupees || 0) / 10000000;

// Build ECharts option from props and responsive flags
const buildChartOption = ({ seriesData, isMobile, isSmallMobile, isTouchDevice }) => {
  const { stateNames, utilizationSeries, allocationSeries, expenditureSeries } = seriesData;

  // More granular responsive padding for better mobile experience
  const leftPad = isSmallMobile ? 32 : isMobile ? 38 : isTouchDevice && !isMobile ? 64 : 68;
  const rightPad = isSmallMobile ? 32 : isMobile ? 38 : isTouchDevice && !isMobile ? 68 : 72;
  const topPad = isSmallMobile ? 40 : isMobile ? 44 : 52;
  const bottomPad = isSmallMobile ? 20 : isMobile ? 24 : 28;

  return {
    title: { show: false },
    tooltip: {
      trigger: 'axis',
      axisPointer: { 
        type: isMobile ? 'shadow' : 'cross', 
        crossStyle: { color: '#999' },
        shadowStyle: { color: 'rgba(150,150,150,0.3)' }
      },
      confine: true,
      order: 'seriesAsc',
      // Mobile-friendly tooltip positioning and styling
      position: isMobile ? 'top' : undefined,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#ddd',
      borderWidth: 1,
      textStyle: {
        fontSize: isSmallMobile ? 11 : isMobile ? 12 : 13
      },
      // Prevent tooltip from being too wide on mobile
      extraCssText: isMobile ? 'max-width: 200px; word-wrap: break-word;' : undefined
    },
    legend: {
      data: ['Utilization %', 'Allocated (₹Cr)', 'Spent (₹Cr)'],
      top: isSmallMobile ? 8 : isMobile ? 10 : 8,
      left: 'center',
      type: 'scroll',
      textStyle: { 
        fontSize: isSmallMobile ? 8 : isMobile ? 9 : 11, 
        color: '#333333' 
      },
      // Better mobile legend spacing
      itemGap: isSmallMobile ? 8 : isMobile ? 10 : 15,
      itemWidth: isSmallMobile ? 20 : isMobile ? 22 : 25,
      itemHeight: isSmallMobile ? 12 : isMobile ? 14 : 16
    },
    grid: { left: leftPad, right: rightPad, top: topPad, bottom: bottomPad, containLabel: true },
    xAxis: {
      type: 'category',
      data: stateNames,
      axisPointer: { type: 'shadow' },
      axisLabel: {
        fontSize: isSmallMobile ? 7 : isMobile ? 8 : 10,
        rotate: isSmallMobile ? 45 : isMobile ? 45 : 30,
        interval: 0,
        color: '#333333',
        margin: isSmallMobile ? 3 : isMobile ? 4 : 6,
        // Improve readability on small screens
        fontWeight: isSmallMobile ? '500' : '400'
      }
    },
    yAxis: [
      {
        type: 'value',
        name: 'Utilization %',
        position: 'left',
        max: 100,
        nameLocation: 'middle',
        nameGap: isMobile ? 36 : 48,
        axisLabel: { formatter: '{value}%', fontSize: isSmallMobile ? 8 : 10, color: '#333333' },
        nameTextStyle: { fontSize: isSmallMobile ? 9 : 11, color: '#333333' }
      },
      {
        type: 'value',
        name: 'Amount (₹ Crores)',
        position: 'right',
        nameLocation: 'middle',
        nameGap: isMobile ? 36 : 48,
        axisLabel: { formatter: '₹{value}Cr', fontSize: isSmallMobile ? 8 : 10, color: '#333333' },
        nameTextStyle: { fontSize: isSmallMobile ? 9 : 11, color: '#333333' }
      }
    ],
    series: [
      {
        name: 'Utilization %',
        type: 'bar',
        yAxisIndex: 0,
        data: utilizationSeries,
        barMaxWidth: isSmallMobile ? 12 : isMobile ? 16 : 22,
        itemStyle: { borderRadius: [2, 2, 0, 0] },
        emphasis: { focus: 'series' },
        z: 3
      },
      {
        name: 'Allocated (₹Cr)',
        type: 'line',
        yAxisIndex: 1,
        data: allocationSeries,
        smooth: true,
        symbol: 'circle',
        symbolSize: isSmallMobile ? 6 : isTouchDevice ? 8 : 6,
        lineStyle: { width: 2, color: '#3b82f6', type: 'dashed' },
        itemStyle: { color: '#3b82f6' }
      },
      {
        name: 'Spent (₹Cr)',
        type: 'line',
        yAxisIndex: 1,
        data: expenditureSeries,
        smooth: true,
        symbol: 'diamond',
        symbolSize: isSmallMobile ? 6 : isTouchDevice ? 8 : 6,
        lineStyle: { width: 3, color: '#8b5cf6' },
        itemStyle: { color: '#8b5cf6' }
      }
    ],
    animation: true,
    animationDuration: 800,
    animationEasing: 'cubicOut'
  };
};

const StatePerformanceChart = ({ data, isLoading, error, title = 'Top Performing States', height = 'auto', maxItems = 10 }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const responsive = useResponsive();

  // Prepare series data once per input change
  const seriesData = useMemo(() => {
    if (!Array.isArray(data)) return null;
    const top = data.slice(0, maxItems);
    // Responsive state name truncation
    const getStateName = (state) => {
      if (!state) return '';
      if (responsive.isSmallMobile && state.length > 8) return `${state.slice(0, 8)}...`;
      if (responsive.isMobile && state.length > 10) return `${state.slice(0, 10)}...`;
      if (state.length > 12) return `${state.slice(0, 12)}...`;
      return state;
    };
    
    const stateNames = top.map((s) => getStateName(s.state));
    const utilizationSeries = top.map((s) => ({
      value: s.utilizationPercentage,
      itemStyle: {
        color: s.utilizationPercentage > 60 ? '#10b981' : s.utilizationPercentage > 40 ? '#f59e0b' : s.utilizationPercentage > 25 ? '#f97316' : '#ef4444'
      }
    }));
    const allocationSeries = top.map((s) => toCrores(s.totalAllocated));
    const expenditureSeries = top.map((s) => toCrores(s.totalExpenditure));
    return { stateNames, utilizationSeries, allocationSeries, expenditureSeries, top };
  }, [data, maxItems, responsive.isMobile, responsive.isSmallMobile]);

  // Initialize chart when the container has a non-zero size (prevents random blank renders)
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const tryInitOrResize = () => {
      const node = containerRef.current;
      if (!node) return;
      const hasSize = node.offsetWidth > 0 && node.offsetHeight > 0;
      if (!chartRef.current && hasSize) {
        chartRef.current = echarts.init(canvasRef.current, undefined, { renderer: 'canvas' });
      }
      if (chartRef.current) {
        chartRef.current.resize();
      }
    };

    // Attempt immediately and on next frames (covers CSS transitions/opening sections)
    tryInitOrResize();
    const raf1 = requestAnimationFrame(tryInitOrResize);
    const raf2 = requestAnimationFrame(tryInitOrResize);

    if ('ResizeObserver' in window) {
      resizeObserverRef.current = new ResizeObserver(() => tryInitOrResize());
      resizeObserverRef.current.observe(containerRef.current);
    } else {
      // Fallback to window resize
      window.addEventListener('resize', tryInitOrResize);
    }

    document.addEventListener('visibilitychange', tryInitOrResize);

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      document.removeEventListener('visibilitychange', tryInitOrResize);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      } else {
        window.removeEventListener('resize', tryInitOrResize);
      }
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  // Dispose chart when it should be hidden (loading, error, or no data)
  useEffect(() => {
    const shouldHide = isLoading || !!error || !seriesData || (seriesData?.top?.length === 0);
    if (shouldHide && chartRef.current) {
      try { chartRef.current.dispose(); } catch {}
      chartRef.current = null;
    }
  }, [isLoading, error, seriesData]);

  // Update chart when inputs change
  useEffect(() => {
    if (!seriesData || isLoading || error) return;
    // Ensure chart instance is bound to current canvas
    if (canvasRef.current) {
      if (!chartRef.current) {
        chartRef.current = echarts.init(canvasRef.current, undefined, { renderer: 'canvas' });
      } else if (typeof chartRef.current.getDom === 'function' && chartRef.current.getDom() !== canvasRef.current) {
        try { chartRef.current.dispose(); } catch {}
        chartRef.current = echarts.init(canvasRef.current, undefined, { renderer: 'canvas' });
      }
    }
    if (!chartRef.current) return;
    const option = buildChartOption({
      seriesData,
      isMobile: responsive.isMobile,
      isSmallMobile: responsive.isSmallMobile,
      isTouchDevice: responsive.isTouchDevice
    });
    chartRef.current.setOption(option, true);
    chartRef.current.resize();
  }, [seriesData, isLoading, error, responsive.isMobile, responsive.isSmallMobile, responsive.isTouchDevice]);

  // Loading / error / empty states
  if (isLoading) return <LoadingState type="chart" message="Loading state performance data..." />;
  if (error) return <ErrorDisplay error={error} title="Failed to load state performance data" />;
  if (!seriesData || seriesData.top.length === 0)
    return (
      <div className="chart-placeholder">
        <FiInfo size={24} />
        <p>No state performance data available</p>
      </div>
    );

  const topState = seriesData.top[0];
  const avgUtilization = seriesData.top.length > 0
    ? seriesData.top.reduce((sum, s) => sum + (s.utilizationPercentage || 0), 0) / seriesData.top.length
    : 0;
  // Responsive height calculation that works with parent containers
  const getEffectiveHeight = () => {
    // If height is 'auto', use responsive defaults
    if (height === 'auto') {
      if (responsive.isSmallMobile) return 280;
      if (responsive.isMobile) return 300;
      if (responsive.isTablet) return 320;
      return 360;
    }
    
    // If numeric height provided, respect it but apply mobile constraints
    const numHeight = Number(height) || 320;
    if (responsive.isSmallMobile) return Math.min(280, numHeight);
    if (responsive.isMobile) return Math.min(300, numHeight);
    if (responsive.isTablet) return Math.min(320, numHeight);
    return numHeight;
  };
  
  const effectiveHeight = getEffectiveHeight();

  return (
    <div className="chart-container" ref={containerRef} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div className="chart-header">
        <div className="chart-title-section">
          <h3 className="chart-title">
            <FiTrendingUp className="chart-icon" />
            {title}
          </h3>
          <InfoTooltip content="Top utilization states; bars: utilization, lines: allocated vs spent." position="top" size="small" />
        </div>
      </div>

      <div style={{ position: 'relative', height: effectiveHeight }}>
        <div ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      </div>

      <div className="chart-footer" style={{ marginTop: responsive.isSmallMobile ? 4 : 8 }}>
        <div className="performance-highlights">
          <div className="highlight-item">
            <span className="highlight-label">Top Performer:</span>
            <span className="highlight-value">
              {responsive.isSmallMobile && topState.state.length > 12 ? 
                `${topState.state.slice(0, 12)}...` : topState.state} ({(topState.utilizationPercentage || 0).toFixed(1)}%)
            </span>
          </div>
          <div className="highlight-item">
            <span className="highlight-label">Avg Utilization:</span>
            <span className="highlight-value">{avgUtilization.toFixed(1)}%</span>
          </div>
          <div className="highlight-item">
            <span className="highlight-label">States:</span>
            <span className="highlight-value">Top {seriesData.top.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatePerformanceChart;
