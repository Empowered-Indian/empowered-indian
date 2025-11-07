import { useState, useEffect, useRef, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';

/**
 * RangeSlider Component
 *
 * A dual-handle range slider component using shadcn's Slider (Radix UI)
 * with debounced onChange and custom formatting.
 *
 * Features:
 * - Dual handles powered by shadcn/Radix UI
 * - Debounced onChange (300ms) to prevent excessive API calls
 * - Custom value formatting
 * - Full accessibility via Radix UI
 *
 * @param {Object} props
 * @param {number} props.min - Minimum value of the range
 * @param {number} props.max - Maximum value of the range
 * @param {Array} props.value - Current value as [minValue, maxValue]
 * @param {Function} props.onChange - Callback function with debounced updates (300ms delay)
 * @param {Function} props.format - Function to format display values (default: toString)
 * @param {string} props.label - Accessible label for the slider
 * @param {number} props.step - Increment size (default: 1)
 * @param {boolean} props.disabled - Whether the slider is disabled (default: false)
 * @param {string} props.className - Additional CSS classes
 */
const RangeSlider = ({
  min = 0,
  max = 100,
  value = [min, max],
  onChange,
  format = (val) => val.toString(),
  label = 'Range Slider',
  step = 1,
  disabled = false,
  className = ''
}) => {
  // Internal state for immediate UI updates
  const [internalValue, setInternalValue] = useState(value);
  const debounceTimerRef = useRef(null);

  // Sync internal value with external value prop
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Debounced onChange function
  const debouncedOnChange = useCallback((newValue) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (onChange) {
        onChange(newValue);
      }
    }, 300);
  }, [onChange]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Handle value change from slider
  const handleValueChange = useCallback((newValue) => {
    setInternalValue(newValue);
    debouncedOnChange(newValue);
  }, [debouncedOnChange]);

  return (
    <div className={`range-slider ${className}`}>
      {/* Value display */}
      <div className="range-slider__values flex justify-between items-center mb-3">
        <div className="text-sm font-medium text-gray-700">
          {label}
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <span>{format(internalValue[0])}</span>
          <span className="text-gray-400">-</span>
          <span>{format(internalValue[1])}</span>
        </div>
      </div>

      {/* Slider component */}
      <Slider
        min={min}
        max={max}
        step={step}
        value={internalValue}
        onValueChange={handleValueChange}
        disabled={disabled}
        aria-label={label}
        className="range-slider__container"
      />
    </div>
  );
};

export default RangeSlider;
