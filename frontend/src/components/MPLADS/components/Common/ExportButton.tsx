import { useState } from 'react'
import { FiDownload, FiFileText, FiDatabase } from 'react-icons/fi'
import { Button } from '@/components/ui/button'
import {
  exportCompletedWorks,
  exportRecommendedWorks,
  exportExpenditures,
  exportMPSummary,
  exportAsJSON,
  getCurrentFilters,
} from '../../../../utils/exportUtils'
import { useFilters } from '../../../../contexts/FilterContext'
import { useAnalytics } from '../../../../hooks/useAnalytics'
import './ExportButton.css'

const ExportButton = ({
  type, // 'completed-works', 'recommended-works', 'expenditures', 'mp-summary'
  additionalFilters = {},
  data = null, // For JSON export
  label,
  variant = 'primary', // 'primary', 'secondary', 'dropdown'
}) => {
  const [isExporting, setIsExporting] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const { filters } = useFilters()
  const { trackExport } = useAnalytics()

  const handleExport = async exportType => {
    setIsExporting(true)

    try {
      const currentFilters = getCurrentFilters(filters)
      const combinedFilters = { ...currentFilters, ...additionalFilters }

      // Estimate record count for analytics
      const estimatedRecords = data
        ? Array.isArray(data)
          ? data.length
          : Object.keys(data).length
        : 0

      switch (exportType) {
        case 'completed-works':
          await exportCompletedWorks(combinedFilters)
          trackExport('completed_works', 'csv', estimatedRecords)
          break
        case 'recommended-works':
          await exportRecommendedWorks(combinedFilters)
          trackExport('recommended_works', 'csv', estimatedRecords)
          break
        case 'expenditures':
          await exportExpenditures(combinedFilters)
          trackExport('expenditures', 'csv', estimatedRecords)
          break
        case 'mp-summary':
          await exportMPSummary(combinedFilters)
          trackExport('mp_summary', 'csv', estimatedRecords)
          break
        case 'json':
          if (data) {
            const filename = `${exportType}_${new Date().toISOString().split('T')[0]}.json`
            exportAsJSON(data, filename)
            trackExport('current_data', 'json', estimatedRecords)
          }
          break
        default:
          console.warn('Unknown export type:', exportType)
      }
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
      setShowDropdown(false)
    }
  }

  if (variant === 'dropdown') {
    return (
      <div className="export-dropdown-container">
        <Button
          className={`export-dropdown-button ${showDropdown ? 'active' : ''}`}
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={isExporting}
          variant="outline"
        >
          <FiDownload />
          <span>{label || 'Export'}</span>
          <svg
            className={`dropdown-arrow ${showDropdown ? 'rotated' : ''}`}
            width="12"
            height="12"
            viewBox="0 0 12 12"
          >
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        </Button>

        {showDropdown && (
          <div className="export-dropdown-menu">
            <Button
              className="dropdown-item"
              onClick={() => handleExport('completed-works')}
              disabled={isExporting}
              variant="ghost"
            >
              <FiFileText />
              <span>Completed Works (CSV)</span>
            </Button>
            <Button
              className="dropdown-item"
              onClick={() => handleExport('recommended-works')}
              disabled={isExporting}
              variant="ghost"
            >
              <FiFileText />
              <span>Recommended Works (CSV)</span>
            </Button>
            <Button
              className="dropdown-item"
              onClick={() => handleExport('expenditures')}
              disabled={isExporting}
              variant="ghost"
            >
              <FiFileText />
              <span>Expenditures (CSV)</span>
            </Button>
            <Button
              className="dropdown-item"
              onClick={() => handleExport('mp-summary')}
              disabled={isExporting}
              variant="ghost"
            >
              <FiFileText />
              <span>MP Summary (CSV)</span>
            </Button>
            {data && (
              <Button
                className="dropdown-item"
                onClick={() => handleExport('json')}
                disabled={isExporting}
                variant="ghost"
              >
                <FiDatabase />
                <span>Current Data (JSON)</span>
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }

  const getButtonLabel = () => {
    if (label) return label

    switch (type) {
      case 'completed-works':
        return 'Export Completed Works'
      case 'recommended-works':
        return 'Export Recommended Works'
      case 'expenditures':
        return 'Export Expenditures'
      case 'mp-summary':
        return 'Export MP Summary'
      default:
        return 'Export Data'
    }
  }

  return (
    <Button
      className={`export-button ${variant} ${isExporting ? 'exporting' : ''}`}
      onClick={() => handleExport(type)}
      disabled={isExporting}
      title={isExporting ? 'Exporting...' : `Export as CSV`}
      variant={variant === 'secondary' ? 'outline' : 'default'}
    >
      {isExporting ? (
        <>
          <div className="loading-spinner"></div>
          <span>Exporting...</span>
        </>
      ) : (
        <>
          <FiDownload />
          <span>{getButtonLabel()}</span>
        </>
      )}
    </Button>
  )
}

export default ExportButton
