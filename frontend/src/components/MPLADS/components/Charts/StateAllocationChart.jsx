import ReactECharts from 'echarts-for-react';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';

const StateAllocationChart = ({ data, title = 'State-wise Allocation vs Expenditure' }) => {
  const [selectedState, setSelectedState] = useState(null);
  const [selectedStates, setSelectedStates] = useState([]);
  const [showStateSelector, setShowStateSelector] = useState(false);

  // Get all available states for the selector
  const allStates = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return data
      .filter(item => item.totalAllocated > 0 && item.state && item.state.trim())
      .map(item => item.state.trim())
      .sort();
  }, [data]);

  // Process the data to ensure it's in the right format
  const processData = (rawData, stateFilter = []) => {
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
      return { states: [], allocated: [], expenditure: [], utilization: [] };
    }

    // Filter out entries with empty/whitespace state names and keep only valid states
    let filteredData = rawData.filter(item => 
      item.totalAllocated > 0 && 
      item.state && 
      item.state.trim()
    );
    
    if (stateFilter.length > 0) {
      filteredData = filteredData.filter(item => stateFilter.includes(item.state.trim()));
    }

    // Sort by utilization percentage to show interesting patterns
    const sortedData = filteredData.sort((a, b) => b.utilizationPercentage - a.utilizationPercentage);

    const states = sortedData.map(item => item.state?.trim() || 'Unknown');
    const allocated = sortedData.map(item => Math.round((item.totalAllocated || 0) / 10000000)); // Convert to crores
    const expenditure = sortedData.map(item => Math.round((item.totalExpenditure || 0) / 10000000)); // Convert to crores
    const utilization = sortedData.map(item => parseFloat((item.utilizationPercentage || 0).toFixed(1)));

    return { states, allocated, expenditure, utilization };
  };

  const chartData = processData(data, selectedStates);

  // State selection handlers
  const handleStateToggle = (state) => {
    setSelectedStates(prev => 
      prev.includes(state) 
        ? prev.filter(s => s !== state)
        : [...prev, state]
    );
  };

  const handleSelectAll = () => {
    setSelectedStates([...allStates]);
  };

  const handleReset = () => {
    setSelectedStates([]);
    setShowStateSelector(false);
  };

  const handleQuickSelect = (type) => {
    if (type === 'top10') {
      const top10 = data
        ?.filter(item => item.totalAllocated > 0 && item.state && item.state.trim())
        .sort((a, b) => b.utilizationPercentage - a.utilizationPercentage)
        .slice(0, 10)
        .map(item => item.state.trim()) || [];
      setSelectedStates(top10);
    } else if (type === 'bottom10') {
      const bottom10 = data
        ?.filter(item => item.totalAllocated > 0 && item.state && item.state.trim())
        .sort((a, b) => a.utilizationPercentage - b.utilizationPercentage)
        .slice(0, 10)
        .map(item => item.state.trim()) || [];
      setSelectedStates(bottom10);
    }
  };

  const option = {
    title: {
      text: title,
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999'
        }
      },
      formatter: function (params) {
        const stateIndex = params[0].dataIndex;
        const state = chartData.states[stateIndex];
        const allocated = chartData.allocated[stateIndex];
        const expenditure = chartData.expenditure[stateIndex];
        const utilization = chartData.utilization[stateIndex];
        
        return `
          <strong>${state}</strong><br/>
          Allocated: ₹${allocated} Cr<br/>
          Expenditure: ₹${expenditure} Cr<br/>
          Utilization: ${utilization}%
        `;
      }
    },
    toolbox: {
      feature: {
        dataView: { show: true, readOnly: false, title: 'Data View' },
        magicType: { show: true, type: ['line', 'bar'], title: { line: 'Line', bar: 'Bar' } },
        restore: { show: true, title: 'Restore' },
        saveAsImage: { show: true, title: 'Save' }
      },
      right: 20,
      top: 40
    },
    legend: {
      data: ['Allocated Amount', 'Expenditure', 'Utilization %'],
      top: 40,
      left: 'center'
    },
    xAxis: [
      {
        type: 'category',
        data: chartData.states,
        axisPointer: {
          type: 'shadow'
        },
        axisLabel: {
          rotate: 45,
          interval: 0,
          fontSize: 9,
          margin: 8
        }
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: 'Amount (₹ Crores)',
        position: 'left',
        axisLabel: {
          formatter: '₹{value}'
        }
      },
      {
        type: 'value',
        name: 'Utilization %',
        position: 'right',
        axisLabel: {
          formatter: '{value}%'
        },
        max: 100
      }
    ],
    series: [
      {
        name: 'Allocated Amount',
        type: 'bar',
        barWidth: '25%',
        itemStyle: {
          color: '#5470c6',
          borderRadius: [4, 4, 0, 0]
        },
        data: chartData.allocated,
        emphasis: {
          focus: 'series'
        }
      },
      {
        name: 'Expenditure',
        type: 'bar',
        barWidth: '25%',
        itemStyle: {
          color: '#91cc75',
          borderRadius: [4, 4, 0, 0]
        },
        data: chartData.expenditure,
        emphasis: {
          focus: 'series'
        }
      },
      {
        name: 'Utilization %',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          color: '#fac858',
          width: 3
        },
        itemStyle: {
          color: '#fac858'
        },
        data: chartData.utilization,
        emphasis: {
          focus: 'series'
        }
      }
    ],
    grid: {
      left: '8%',
      right: '8%',
      bottom: '20%',
      top: '25%'
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        start: 0,
        end: 40, // Show about 40% of states initially, user can scroll to see more
        height: 25,
        bottom: 5,
        textStyle: {
          fontSize: 10
        }
      }
    ]
  };

  const onChartClick = (params) => {
    if (params.componentType === 'series') {
      const stateName = chartData.states[params.dataIndex];
      setSelectedState(stateName);
    }
  };

  const onEvents = {
    click: onChartClick
  };

  // Show message when no data is available
  if (chartData.states.length === 0) {
    return (
      <div className="state-allocation-chart-container" style={{ 
        minHeight: '350px',
        maxHeight: '500px',
        height: 'clamp(350px, 40vh, 500px)', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '18px', fontWeight: 'bold' }}>{title}</h3>
        <div style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
          <p style={{ margin: '0 0 0.5rem 0' }}>State allocation data unavailable</p>
          <p style={{ margin: '0', fontSize: '12px' }}>Unable to load state-wise allocation and expenditure data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="state-allocation-chart-container">
      {/* State Filter Controls */}
      <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <Button
            variant={showStateSelector ? "default" : "outline"}
            onClick={() => setShowStateSelector(!showStateSelector)}
            style={{
              padding: '6px 12px',
              fontSize: '12px'
            }}
          >
            {showStateSelector ? 'Hide' : 'Select'} States
          </Button>
          
          <Button
            variant="default"
            onClick={() => handleQuickSelect('top10')}
            style={{
              padding: '6px 12px',
              backgroundColor: '#28a745',
              fontSize: '12px'
            }}
          >
            Top 10
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleQuickSelect('bottom10')}
            style={{
              padding: '6px 12px',
              backgroundColor: '#ffc107',
              color: 'black',
              fontSize: '12px'
            }}
          >
            Bottom 10
          </Button>
          
          <Button
            variant="destructive"
            onClick={handleReset}
            style={{
              padding: '6px 12px',
              fontSize: '12px'
            }}
          >
            Reset ({selectedStates.length === 0 ? 'All' : selectedStates.length})
          </Button>

          {selectedStates.length > 0 && (
            <span style={{ fontSize: '12px', color: '#666', marginLeft: '10px' }}>
              Showing {selectedStates.length} of {allStates.length} states
            </span>
          )}
        </div>

        {showStateSelector && (
          <div>
            <div style={{ marginBottom: '8px', display: 'flex', gap: '8px' }}>
              <Button
                variant="default"
                onClick={handleSelectAll}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#17a2b8',
                  fontSize: '11px'
                }}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedStates([])}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px'
                }}
              >
                Clear All
              </Button>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
              gap: '5px',
              maxHeight: '200px',
              overflowY: 'auto',
              padding: '5px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: 'white'
            }}>
              {allStates.map(state => (
                <label 
                  key={state}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '5px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    padding: '2px 4px',
                    borderRadius: '2px',
                    backgroundColor: selectedStates.includes(state) ? '#e3f2fd' : 'transparent'
                  }}
                >
                  <input 
                    type="checkbox"
                    checked={selectedStates.includes(state)}
                    onChange={() => handleStateToggle(state)}
                    style={{ margin: 0 }}
                  />
                  <span>{state}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <ReactECharts 
        option={option} 
        style={{ 
          minHeight: '400px',
          maxHeight: '600px',
          height: 'clamp(400px, 50vh, 600px)', 
          width: '100%' 
        }}
        opts={{ renderer: 'svg' }}
        onEvents={onEvents}
      />
      {selectedState && (
        <div style={{ textAlign: 'center', marginTop: '10px', color: '#666' }}>
          <small>Click on chart to explore state data. Selected: {selectedState}</small>
        </div>
      )}
    </div>
  );
};

export default StateAllocationChart;