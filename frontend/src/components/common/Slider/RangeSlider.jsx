import React, { useState, useRef, useCallback, useEffect } from 'react'
import './RangeSlider.css'

// Custom hook for debouncing
const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null)

  return useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  )
}

const RangeSlider = ({
  min = 0,
  max = 100,
  step = 1,
  value = [min, max],
  onChange,
  onChangeComplete,
  disabled = false,
  formatValue = val => val,
  label,
  id,
  className = '',
  showTooltips = true,
  showTicks = false,
  tickValues = [],
  range = true,
  debounceMs = 0,
  ...props
}) => {
  const [localValue, setLocalValue] = useState(value)
  const [isDragging, setIsDragging] = useState(null)
  const [showTooltip, setShowTooltip] = useState({ min: false, max: false })
  const sliderRef = useRef(null)

  // Debounced onChange handler
  const debouncedOnChange = useDebounce(newValue => {
    onChange?.(newValue)
  }, debounceMs)

  // Ensure we have valid values
  const minValue = range ? localValue[0] : min
  const maxValue = range ? localValue[1] : localValue

  // Clamp values to min/max bounds
  const clampValue = useCallback(
    val => {
      return Math.min(Math.max(val, min), max)
    },
    [min, max]
  )

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Calculate position percentage
  const getPositionFromValue = useCallback(
    val => {
      return ((val - min) / (max - min)) * 100
    },
    [min, max]
  )

  // Calculate value from position
  const getValueFromPosition = useCallback(
    clientX => {
      if (!sliderRef.current) return min

      const rect = sliderRef.current.getBoundingClientRect()
      const percentage = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
      const rawValue = min + percentage * (max - min)

      // Snap to step
      const steppedValue = Math.round(rawValue / step) * step
      return clampValue(steppedValue)
    },
    [min, max, step, clampValue]
  )

  // Handle mouse/touch events
  const handlePointerDown = useCallback(
    (e, handle) => {
      if (disabled) return

      e.preventDefault()
      e.stopPropagation() // Prevent event bubbling that could trigger form submissions
      setIsDragging(handle)
      setShowTooltip({ min: handle === 'min', max: handle === 'max' })

      const moveHandler = e => {
        e.preventDefault()
        e.stopPropagation()
        const clientX = e.touches ? e.touches[0].clientX : e.clientX
        const newValue = getValueFromPosition(clientX)

        let newValues
        if (range) {
          if (handle === 'min') {
            newValues = [Math.min(newValue, localValue[1]), localValue[1]]
          } else {
            newValues = [localValue[0], Math.max(newValue, localValue[0])]
          }
        } else {
          newValues = newValue
        }

        setLocalValue(newValues)
        if (debounceMs > 0) {
          debouncedOnChange(newValues)
        } else {
          onChange?.(newValues)
        }
      }

      const upHandler = e => {
        e?.preventDefault?.()
        e?.stopPropagation?.()
        setIsDragging(null)
        setShowTooltip({ min: false, max: false })
        onChangeComplete?.(localValue)
        document.removeEventListener('mousemove', moveHandler)
        document.removeEventListener('mouseup', upHandler)
        document.removeEventListener('touchmove', moveHandler)
        document.removeEventListener('touchend', upHandler)
      }

      document.addEventListener('mousemove', moveHandler)
      document.addEventListener('mouseup', upHandler)
      document.addEventListener('touchmove', moveHandler)
      document.addEventListener('touchend', upHandler)
    },
    [
      disabled,
      localValue,
      getValueFromPosition,
      onChange,
      onChangeComplete,
      range,
      debounceMs,
      debouncedOnChange,
    ]
  )

  // Handle track click
  const handleTrackClick = useCallback(
    e => {
      if (disabled || isDragging) return

      e.preventDefault()
      e.stopPropagation()
      const newValue = getValueFromPosition(e.clientX)

      let newValues
      if (range) {
        // Find closest handle
        const distanceToMin = Math.abs(newValue - minValue)
        const distanceToMax = Math.abs(newValue - maxValue)

        if (distanceToMin < distanceToMax) {
          newValues = [newValue, maxValue]
        } else {
          newValues = [minValue, newValue]
        }
      } else {
        newValues = newValue
      }

      setLocalValue(newValues)
      if (debounceMs > 0) {
        debouncedOnChange(newValues)
      } else {
        onChange?.(newValues)
      }
      onChangeComplete?.(newValues)
    },
    [
      disabled,
      isDragging,
      getValueFromPosition,
      minValue,
      maxValue,
      onChange,
      onChangeComplete,
      range,
      debounceMs,
      debouncedOnChange,
    ]
  )

  // Generate tick marks
  const generateTicks = () => {
    if (!showTicks) return []

    if (tickValues.length > 0) {
      return tickValues.filter(val => val >= min && val <= max)
    }

    const tickCount = 5
    const ticks = []
    for (let i = 0; i <= tickCount; i++) {
      ticks.push(min + (i * (max - min)) / tickCount)
    }
    return ticks
  }

  const ticks = generateTicks()

  return (
    <div
      className={`range-slider-container ${className} ${disabled ? 'disabled' : ''}`}
      onSubmit={e => e.preventDefault()}
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      onTouchStart={e => e.stopPropagation()}
    >
      {label && (
        <label htmlFor={id} className="range-slider-label">
          {label}
        </label>
      )}

      <div className="range-slider-wrapper">
        {/* Value display */}
        <div className="range-slider-values">
          <span className="range-value min-value">{formatValue(range ? minValue : min)}</span>
          {range && <span className="range-value max-value">{formatValue(maxValue)}</span>}
        </div>

        {/* Slider */}
        <div
          ref={sliderRef}
          className="range-slider-track"
          onClick={handleTrackClick}
          onMouseDown={e => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onTouchStart={e => {
            e.preventDefault()
            e.stopPropagation()
          }}
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={range ? minValue : maxValue}
          tabIndex={disabled ? -1 : 0}
          {...props}
        >
          {/* Background track */}
          <div className="range-slider-track-bg" />

          {/* Active track */}
          <div
            className="range-slider-track-active"
            style={{
              left: range ? `${getPositionFromValue(minValue)}%` : '0%',
              width: range
                ? `${getPositionFromValue(maxValue) - getPositionFromValue(minValue)}%`
                : `${getPositionFromValue(maxValue)}%`,
            }}
          />

          {/* Tick marks */}
          {ticks.map((tick, index) => (
            <div
              key={index}
              className="range-slider-tick"
              style={{ left: `${getPositionFromValue(tick)}%` }}
            >
              <div className="range-slider-tick-mark" />
              <div className="range-slider-tick-label">{formatValue(tick)}</div>
            </div>
          ))}

          {/* Handles */}
          {range && (
            <div
              className={`range-slider-handle min-handle ${isDragging === 'min' ? 'dragging' : ''}`}
              style={{ left: `${getPositionFromValue(minValue)}%` }}
              onMouseDown={e => {
                e.preventDefault()
                e.stopPropagation()
                handlePointerDown(e, 'min')
              }}
              onTouchStart={e => {
                e.preventDefault()
                e.stopPropagation()
                handlePointerDown(e, 'min')
              }}
              onMouseEnter={() => showTooltips && setShowTooltip(prev => ({ ...prev, min: true }))}
              onMouseLeave={() => !isDragging && setShowTooltip(prev => ({ ...prev, min: false }))}
              role="slider"
              aria-valuemin={min}
              aria-valuemax={maxValue}
              aria-valuenow={minValue}
              aria-label={`${label || 'Range'} minimum value`}
              tabIndex={disabled ? -1 : 0}
            >
              {/* Tooltip */}
              {showTooltips && showTooltip.min && (
                <div className="range-slider-tooltip">{formatValue(minValue)}</div>
              )}
            </div>
          )}

          <div
            className={`range-slider-handle ${range ? 'max-handle' : 'single-handle'} ${isDragging === 'max' || isDragging === 'single' ? 'dragging' : ''}`}
            style={{ left: `${getPositionFromValue(maxValue)}%` }}
            onMouseDown={e => {
              e.preventDefault()
              e.stopPropagation()
              handlePointerDown(e, range ? 'max' : 'single')
            }}
            onTouchStart={e => {
              e.preventDefault()
              e.stopPropagation()
              handlePointerDown(e, range ? 'max' : 'single')
            }}
            onMouseEnter={() => showTooltips && setShowTooltip(prev => ({ ...prev, max: true }))}
            onMouseLeave={() => !isDragging && setShowTooltip(prev => ({ ...prev, max: false }))}
            role="slider"
            aria-valuemin={range ? minValue : min}
            aria-valuemax={max}
            aria-valuenow={maxValue}
            aria-label={`${label || 'Range'} ${range ? 'maximum' : ''} value`}
            tabIndex={disabled ? -1 : 0}
          >
            {/* Tooltip */}
            {showTooltips && showTooltip.max && (
              <div className="range-slider-tooltip">{formatValue(maxValue)}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RangeSlider
