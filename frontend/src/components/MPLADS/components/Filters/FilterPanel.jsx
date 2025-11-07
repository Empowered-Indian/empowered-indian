import { useState, useEffect, useCallback } from 'react';
import { FiFilter, FiX, FiChevronDown, FiChevronUp, FiAlertCircle, FiRotateCcw } from 'react-icons/fi';
import { useFilters } from '../../../../contexts/FilterContext';
import { useResponsive } from '../../../../hooks/useMediaQuery';
import { useFilterData } from '../../../../hooks/useFilterData';
import { sanitizeInput } from '../../../../utils/inputSanitization';
import { RangeSlider } from '../Common/Slider';
import ActiveFilters from './ActiveFilters';
import { Button } from '@/components/ui/button';
import './FilterPanel.css';
import { mpladsAPI } from '../../../../services/api/mplads';
import { formatTermOrdinal, normalizeTerms } from '../../../../utils/lsTerm';

const FilterPanel = ({ onClose, isMobile: propIsMobile = false }) => {
  const { filters, updateFilter, resetFilters, getActiveFilterCount } = useFilters();
  const responsive = useResponsive();
  const { filterData, loading, error, fetchConstituencies } = useFilterData();
  
  // Use prop or detect mobile automatically
  const isMobile = propIsMobile || responsive.isMobile;
  const [expandedSections, setExpandedSections] = useState({
    location: !isMobile,
    mp: !isMobile,
    financial: false,
    works: false,
    date: false
  });
  
  // Update expanded sections when mobile state changes
  useEffect(() => {
    if (isMobile) {
      // On mobile, collapse all sections initially for better UX
      setExpandedSections({
        location: false,
        mp: false,
        financial: false,
        works: false,
        date: false
      });
    } else {
      // On desktop, expand location and MP by default
      setExpandedSections(prevSections => ({
        ...prevSections,
        location: true,
        mp: true
      }));
    }
  }, [isMobile]);
  const [validationErrors, setValidationErrors] = useState({});
  const [isClosing, setIsClosing] = useState(false);
  const [terms, setTerms] = useState([18, 17]);
  const [termsLoading, setTermsLoading] = useState(false);
  const [termsError, setTermsError] = useState(null);

  const activeFilterCount = getActiveFilterCount();

  const handleClose = useCallback(() => {
    if (isMobile) {
      setIsClosing(true);
      setTimeout(() => {
        onClose?.();
      }, 150); // Match CSS animation duration
    } else {
      onClose?.();
    }
  }, [isMobile, onClose]);

  // Auto-close behavior for mobile
  useEffect(() => {
    if (isMobile && onClose) {
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          handleClose();
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isMobile, handleClose, onClose]);

  // Load available LS terms
  useEffect(() => {
    let mounted = true;
    const LS_KEY = 'mplads_terms';
    const TS_KEY = 'mplads_terms_ts';
    const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h

    const fromCache = () => {
      try {
        const raw = localStorage.getItem(LS_KEY);
        const ts = Number(localStorage.getItem(TS_KEY) || 0);
        if (!raw) return null;
        if (Date.now() - ts > MAX_AGE_MS) return null;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : null;
      } catch { return null; }
    };

    const toCache = (arr) => {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(arr));
        localStorage.setItem(TS_KEY, String(Date.now()));
      } catch { /* ignore */ }
    };

    const load = async () => {
      const cached = fromCache();
      if (cached && mounted) {
        const normalized = normalizeTerms(cached);
        if (normalized.length) setTerms(normalized);
      }
      try {
        setTermsLoading(true);
        const resp = await mpladsAPI.getTerms();
        const normalized = normalizeTerms(resp?.data);
        if (mounted && normalized.length) {
          setTerms(normalized);
          toCache(normalized);
        }
        setTermsError(null);
      } catch (e) {
        if (mounted) setTermsError(e?.message || 'Failed to load terms');
      } finally {
        if (mounted) setTermsLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Validation functions
  const validateUtilization = useCallback((value, field) => {
    const errors = { ...validationErrors };
    
    if (value === '') {
      delete errors[field];
      setValidationErrors(errors);
      return true;
    }
    
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
      errors[field] = 'Please enter a valid number';
    } else if (numValue < 0) {
      errors[field] = 'Value cannot be negative';
    } else if (numValue > 100) {
      errors[field] = 'Value cannot exceed 100%';
    } else {
      // Check min/max relationship
      if (field === 'minUtilization' && filters.maxUtilization !== '') {
        const maxValue = parseFloat(filters.maxUtilization);
        if (!isNaN(maxValue) && numValue > maxValue) {
          errors[field] = 'Min value cannot exceed max value';
        } else {
          delete errors[field];
          // Only clear max error if it was related to range validation
          if (errors.maxUtilization === 'Max value cannot be less than min value') {
            delete errors.maxUtilization;
          }
        }
      } else if (field === 'maxUtilization' && filters.minUtilization !== '') {
        const minValue = parseFloat(filters.minUtilization);
        if (!isNaN(minValue) && numValue < minValue) {
          errors[field] = 'Max value cannot be less than min value';
        } else {
          delete errors[field];
          // Only clear min error if it was related to range validation
          if (errors.minUtilization === 'Min value cannot exceed max value') {
            delete errors.minUtilization;
          }
        }
      } else {
        delete errors[field];
      }
    }
    
    setValidationErrors(errors);
    return !errors[field];
  }, [filters.minUtilization, filters.maxUtilization, validationErrors]);

  const validateAmount = useCallback((value, field) => {
    const errors = { ...validationErrors };
    
    if (value === '') {
      delete errors[field];
      setValidationErrors(errors);
      return true;
    }
    
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
      errors[field] = 'Please enter a valid number';
    } else if (numValue < 0) {
      errors[field] = 'Amount cannot be negative';
    } else {
      // Check min/max relationship
      if (field === 'minAmount' && filters.maxAmount !== '') {
        const maxValue = parseFloat(filters.maxAmount);
        if (!isNaN(maxValue) && numValue > maxValue) {
          errors[field] = 'Min amount cannot exceed max amount';
        } else {
          delete errors[field];
          // Only clear max error if it was related to range validation
          if (errors.maxAmount === 'Max amount cannot be less than min amount') {
            delete errors.maxAmount;
          }
        }
      } else if (field === 'maxAmount' && filters.minAmount !== '') {
        const minValue = parseFloat(filters.minAmount);
        if (!isNaN(minValue) && numValue < minValue) {
          errors[field] = 'Max amount cannot be less than min amount';
        } else {
          delete errors[field];
          // Only clear min error if it was related to range validation
          if (errors.minAmount === 'Min amount cannot exceed max amount') {
            delete errors.minAmount;
          }
        }
      } else {
        delete errors[field];
      }
    }
    
    setValidationErrors(errors);
    return !errors[field];
  }, [filters.minAmount, filters.maxAmount, validationErrors]);

  const validateYearRange = (value, field) => {
    const errors = { ...validationErrors };
    const currentYear = new Date().getFullYear();
    const year = parseInt(value);
    
    // Clear field-specific errors first
    delete errors[field];
    delete errors.yearRange;
    
    if (value === '') {
      setValidationErrors(errors);
      return true;
    }
    
    // Check if year is valid
    if (isNaN(year)) {
      errors[field] = 'Please enter a valid year';
      setValidationErrors(errors);
      return false;
    }
    
    // Check if year is in the future
    if (year > currentYear) {
      errors[field] = 'Year cannot be in the future';
      setValidationErrors(errors);
      return false;
    }
    
    // Check if year is too far in the past (MPLADS started in 1993)
    if (year < 1993) {
      errors[field] = 'Year cannot be before 1993 (MPLADS inception)';
      setValidationErrors(errors);
      return false;
    }
    
    // Check year range relationship
    if (field === 'yearFrom' && filters.yearTo !== '') {
      const toYear = parseInt(filters.yearTo);
      if (!isNaN(toYear) && year > toYear) {
        errors.yearRange = 'From year cannot be after To year';
      }
    } else if (field === 'yearTo' && filters.yearFrom !== '') {
      const fromYear = parseInt(filters.yearFrom);
      if (!isNaN(fromYear) && year < fromYear) {
        errors.yearRange = 'To year cannot be before From year';
      }
    }
    
    setValidationErrors(errors);
    return !errors[field] && !errors.yearRange;
  };

  // Removed unused function handleUtilizationChange
  const handleUtilizationRangeChange = useCallback((range) => {
    const [minValue, maxValue] = range;
    
    // Validate both values
    validateUtilization(minValue.toString(), 'minUtilization');
    validateUtilization(maxValue.toString(), 'maxUtilization');
    
    // Update filters
    updateFilter('minUtilization', minValue === 0 ? '' : minValue.toString());
    updateFilter('maxUtilization', maxValue === 100 ? '' : maxValue.toString());
  }, [updateFilter, validateUtilization]);

  // Removed unused function handleAmountChange
  const handleAmountRangeChange = useCallback((range) => {
    const [minValue, maxValue] = range;
    
    // Validate both values
    validateAmount(minValue.toString(), 'minAmount');
    validateAmount(maxValue.toString(), 'maxAmount');
    
    // Update filters
    updateFilter('minAmount', minValue === 0 ? '' : minValue.toString());
    updateFilter('maxAmount', maxValue === 100 ? '' : maxValue.toString());
  }, [updateFilter, validateAmount]);

  const handleYearChange = (field, value) => {
    updateFilter(field, value);
    validateYearRange(value, field);
  };

  // Dynamic filter data from database
  const { states, houses, workStatuses, sectors } = filterData;
  
  // Update constituencies when state changes
  useEffect(() => {
    if (filters.state && filters.state !== 'all') {
      fetchConstituencies(filters.state);
    }
  }, [filters.state, fetchConstituencies]);
  const currentYear = new Date().getFullYear();
  // Generate years from 1993 (MPLADS inception) to current year
  const years = Array.from({ length: currentYear - 1993 + 1 }, (_, i) => currentYear - i);

  return (
    <div className={`filter-panel ${isMobile ? 'filter-panel-mobile' : ''} ${isClosing ? 'filter-panel-closing' : ''}`}>
      {isMobile && <div className="filter-overlay" onClick={handleClose} />}
      
      <div className="filter-content">
        <div className="filter-header">
          <div className="filter-title">
            <FiFilter />
            <h3>Filters</h3>
            {activeFilterCount > 0 && (
              <span className="filter-count">{activeFilterCount}</span>
            )}
          </div>
          <div className="filter-actions">
            <Button
              variant="ghost"
              className="filter-reset-btn gap-2"
              onClick={resetFilters}
              disabled={activeFilterCount === 0}
              title="Reset all filters"
            >
              <FiRotateCcw />
              <span className="filter-btn-text">Reset All</span>
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                className="filter-close-btn"
                onClick={handleClose}
                title="Close filters panel"
              >
                <FiX />
              </Button>
            )}
          </div>
        </div>

        {/* Show active filters for better UX */}
        {activeFilterCount > 0 && (
          <div className="filter-active-section">
            <ActiveFilters className="filter-panel-active" />
          </div>
        )}

        <div className="filter-sections">
          {/* Location Filters */}
          <div className="filter-section">
            <Button
              variant="ghost"
              className={`filter-section-header gap-2 ${expandedSections.location ? 'expanded' : ''}`}
              onClick={() => toggleSection('location')}
              aria-expanded={expandedSections.location}
            >
              <span>Location</span>
              {expandedSections.location ? <FiChevronUp /> : <FiChevronDown />}
            </Button>
          {expandedSections.location && (
            <div className="filter-section-content">
              <div className="filter-group">
                <label>State</label>
                <select 
                  value={filters.state} 
                  onChange={(e) => updateFilter('state', e.target.value)}
                  disabled={loading.states}
                >
                  <option value="">
                    {loading.states ? 'Loading states...' : 'All States'}
                  </option>
                  {states.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                {error.states && (
                  <div className="filter-error">
                    <FiAlertCircle size={14} />
                    <span>Error loading states</span>
                  </div>
                )}
              </div>
              <div className="filter-group">
                <label>Constituency</label>
                <input 
                  type="text"
                  placeholder="Enter constituency name"
                  value={filters.constituency}
                  onChange={(e) => updateFilter('constituency', sanitizeInput(e.target.value))}
                />
              </div>
            </div>
          )}
        </div>

          {/* MP Filters */}
          <div className="filter-section">
            <Button
              variant="ghost"
              className={`filter-section-header gap-2 ${expandedSections.mp ? 'expanded' : ''}`}
              onClick={() => toggleSection('mp')}
              aria-expanded={expandedSections.mp}
            >
              <span>Member of Parliament</span>
              {expandedSections.mp ? <FiChevronUp /> : <FiChevronDown />}
            </Button>
          {expandedSections.mp && (
            <div className="filter-section-content">
              <div className="filter-group">
                <label>House</label>
                <select 
                  value={filters.house}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateFilter('house', val);
                    if (val === 'Both Houses') updateFilter('lsTerm', 18);
                  }}
                  disabled={loading.houses}
                >
                  <option value="Both Houses">
                    {loading.houses ? 'Loading...' : 'Both Houses'}
                  </option>
                  {houses.map(house => (
                    <option key={house} value={house}>{house}</option>
                  ))}
                </select>
                {error.houses && (
                  <div className="filter-error">
                    <FiAlertCircle size={14} />
                    <span>Error loading houses</span>
                  </div>
                )}
              </div>

              <div className="filter-group">
                <label>Lok Sabha Term</label>
                <select
                  value={String(filters.lsTerm || 18)}
                  onChange={(e) => updateFilter('lsTerm', Number(e.target.value))}
                  disabled={termsLoading || filters.house === 'Rajya Sabha' || filters.house === 'Both Houses'}
                >
                {terms.map((t) => (
                  <option key={String(t)} value={String(t)}>{formatTermOrdinal(t)}</option>
                ))}
                </select>
                {termsError && (
                  <div className="filter-error">
                    <FiAlertCircle size={14} />
                    <span>Error loading terms</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

          {/* Financial Filters */}
          <div className="filter-section">
            <Button
              variant="ghost"
              className={`filter-section-header gap-2 ${expandedSections.financial ? 'expanded' : ''}`}
              onClick={() => toggleSection('financial')}
              aria-expanded={expandedSections.financial}
            >
              <span>Financial</span>
              {expandedSections.financial ? <FiChevronUp /> : <FiChevronDown />}
            </Button>
          {expandedSections.financial && (
            <div className="filter-section-content">
              <div className="filter-group">
                <RangeSlider
                  label="Fund Utilization (%)"
                  min={0}
                  max={100}
                  step={1}
                  value={[
                    filters.minUtilization === '' ? 0 : parseFloat(filters.minUtilization) || 0,
                    filters.maxUtilization === '' ? 100 : parseFloat(filters.maxUtilization) || 100
                  ]}
                  onChange={handleUtilizationRangeChange}
                  formatValue={(value) => `${value}%`}
                  debounceDelay={300}
                  className="filter-range-slider"
                />
                {(validationErrors.minUtilization || validationErrors.maxUtilization) && (
                  <div className="error-message">
                    <FiAlertCircle />
                    {validationErrors.minUtilization || validationErrors.maxUtilization}
                  </div>
                )}
              </div>
              <div className="filter-group">
                <RangeSlider
                  label="Amount Range (₹ Cr)"
                  min={0}
                  max={100}
                  step={0.1}
                  value={[
                    filters.minAmount === '' ? 0 : parseFloat(filters.minAmount) || 0,
                    filters.maxAmount === '' ? 100 : parseFloat(filters.maxAmount) || 100
                  ]}
                  onChange={handleAmountRangeChange}
                  formatValue={(value) => `₹${value} Cr`}
                  debounceDelay={300}
                  className="filter-range-slider"
                />
                {(validationErrors.minAmount || validationErrors.maxAmount) && (
                  <div className="error-message">
                    <FiAlertCircle />
                    {validationErrors.minAmount || validationErrors.maxAmount}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

          {/* Works Filters */}
          <div className="filter-section">
            <Button
              variant="ghost"
              className={`filter-section-header gap-2 ${expandedSections.works ? 'expanded' : ''}`}
              onClick={() => toggleSection('works')}
              aria-expanded={expandedSections.works}
            >
              <span>Works & Projects</span>
              {expandedSections.works ? <FiChevronUp /> : <FiChevronDown />}
            </Button>
          {expandedSections.works && (
            <div className="filter-section-content">
              <div className="filter-group">
                <label>Work Status</label>
                <select 
                  value={filters.workStatus} 
                  onChange={(e) => updateFilter('workStatus', e.target.value)}
                >
                  <option value="">All Status</option>
                  {workStatuses.map(status => (
                    <option key={status} value={status.toLowerCase().replace(' ', '-')}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Sector</label>
                <select 
                  value={filters.sector} 
                  onChange={(e) => updateFilter('sector', e.target.value)}
                >
                  <option value="">All Sectors</option>
                  {sectors.map(sector => (
                    <option key={sector} value={sector}>{sector}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

          {/* Date Filters */}
          <div className="filter-section">
            <Button
              variant="ghost"
              className={`filter-section-header gap-2 ${expandedSections.date ? 'expanded' : ''}`}
              onClick={() => toggleSection('date')}
              aria-expanded={expandedSections.date}
            >
              <span>Date Range</span>
              {expandedSections.date ? <FiChevronUp /> : <FiChevronDown />}
            </Button>
          {expandedSections.date && (
            <div className="filter-section-content">
              <div className="filter-group">
                <label>Year Range</label>
                <div className="range-inputs">
                  <div className="input-wrapper">
                    <select 
                      value={filters.yearFrom} 
                      onChange={(e) => handleYearChange('yearFrom', e.target.value)}
                      className={validationErrors.yearFrom || validationErrors.yearRange ? 'error' : ''}
                      aria-invalid={!!(validationErrors.yearFrom || validationErrors.yearRange)}
                      aria-describedby={validationErrors.yearFrom ? 'yearFrom-error' : undefined}
                    >
                      <option value="">From</option>
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    {validationErrors.yearFrom && (
                      <span id="yearFrom-error" className="error-message">
                        <FiAlertCircle />
                        {validationErrors.yearFrom}
                      </span>
                    )}
                  </div>
                  <span className="range-separator">to</span>
                  <div className="input-wrapper">
                    <select 
                      value={filters.yearTo} 
                      onChange={(e) => handleYearChange('yearTo', e.target.value)}
                      className={validationErrors.yearTo || validationErrors.yearRange ? 'error' : ''}
                      aria-invalid={!!(validationErrors.yearTo || validationErrors.yearRange)}
                      aria-describedby={validationErrors.yearTo ? 'yearTo-error' : undefined}
                    >
                      <option value="">To</option>
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    {validationErrors.yearTo && (
                      <span id="yearTo-error" className="error-message">
                        <FiAlertCircle />
                        {validationErrors.yearTo}
                      </span>
                    )}
                  </div>
                </div>
                {validationErrors.yearRange && (
                  <span className="error-message">
                    <FiAlertCircle />
                    {validationErrors.yearRange}
                  </span>
                )}
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
