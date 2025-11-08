import React, { useState } from 'react'
import RangeSlider from './RangeSlider'

/**
 * Example component demonstrating various RangeSlider configurations
 * This shows how to integrate the RangeSlider into MPLADS dashboard forms and filters
 */
const RangeSliderExample = () => {
  // State for different slider examples
  const [budgetRange, setBudgetRange] = useState([10000, 500000])
  const [yearRange, setYearRange] = useState([2014, 2024])
  const [singleValue, setSingleValue] = useState(75)
  const [performanceRange, setPerformanceRange] = useState([20, 80])

  // Format currency values
  const formatCurrency = value => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`
    }
    return `₹${value}`
  }

  // Format percentage
  const formatPercentage = value => `${value}%`

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2>RangeSlider Examples</h2>

      {/* Budget Range Slider */}
      <div style={{ marginBottom: '3rem' }}>
        <h3>Budget Allocation Range</h3>
        <RangeSlider
          label="Select budget range for MP allocation analysis"
          min={5000}
          max={1000000}
          step={5000}
          value={budgetRange}
          onChange={setBudgetRange}
          formatValue={formatCurrency}
          showTooltips={true}
          showTicks={true}
          tickValues={[5000, 50000, 100000, 250000, 500000, 1000000]}
        />
        <p>
          Selected range: {formatCurrency(budgetRange[0])} - {formatCurrency(budgetRange[1])}
        </p>
      </div>

      {/* Year Range Slider */}
      <div style={{ marginBottom: '3rem' }}>
        <h3>Financial Year Range</h3>
        <RangeSlider
          label="Select financial years for comparison"
          min={2009}
          max={2024}
          step={1}
          value={yearRange}
          onChange={setYearRange}
          showTooltips={true}
          showTicks={true}
          tickValues={[2009, 2012, 2015, 2018, 2021, 2024]}
        />
        <p>
          Selected years: {yearRange[0]} - {yearRange[1]}
        </p>
      </div>

      {/* Single Value Slider */}
      <div style={{ marginBottom: '3rem' }}>
        <h3>Fund Utilization Threshold</h3>
        <RangeSlider
          label="Set minimum utilization percentage"
          min={0}
          max={100}
          step={5}
          value={singleValue}
          onChange={setSingleValue}
          formatValue={formatPercentage}
          range={false}
          showTooltips={true}
          showTicks={true}
        />
        <p>Threshold: {formatPercentage(singleValue)}</p>
      </div>

      {/* Performance Range with Custom Styling */}
      <div style={{ marginBottom: '3rem' }}>
        <h3>Performance Score Range</h3>
        <RangeSlider
          label="Filter MPs by performance score range"
          min={0}
          max={100}
          step={1}
          value={performanceRange}
          onChange={setPerformanceRange}
          formatValue={formatPercentage}
          showTooltips={true}
          className="performance-slider"
        />
        <p>
          Performance range: {formatPercentage(performanceRange[0])} -{' '}
          {formatPercentage(performanceRange[1])}
        </p>
      </div>

      {/* Disabled State Example */}
      <div style={{ marginBottom: '3rem' }}>
        <h3>Disabled Slider</h3>
        <RangeSlider
          label="Disabled slider example"
          min={0}
          max={100}
          value={[30, 70]}
          disabled={true}
          formatValue={formatPercentage}
          showTooltips={true}
        />
        <p>This slider is disabled to show the disabled state styling.</p>
      </div>
    </div>
  )
}

export default RangeSliderExample
