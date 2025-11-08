import { useState } from 'react'
import { FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { Button } from '@/components/ui/button'
import './ResponsiveTable.css'

const ResponsiveTable = ({
  columns,
  data,
  keyExtractor,
  mobileCardRenderer,
  className = '',
  emptyMessage = 'No data available',
  stickyHeader = true,
}) => {
  const [expandedRows, setExpandedRows] = useState(new Set())

  const toggleRowExpansion = rowKey => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(rowKey)) {
      newExpanded.delete(rowKey)
    } else {
      newExpanded.add(rowKey)
    }
    setExpandedRows(newExpanded)
  }

  // Default mobile card renderer
  const defaultMobileCard = (row, columns) => {
    return columns.map((col, index) => (
      <div key={index} className="mobile-row-field">
        <span className="mobile-field-label">{col.header}:</span>
        <span className="mobile-field-value">
          {col.render ? col.render(row) : row[col.accessor]}
        </span>
      </div>
    ))
  }

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className={`responsive-table-empty ${className}`}>
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop Table */}
      <div className={`responsive-table-desktop ${className}`}>
        <table className={`responsive-table ${stickyHeader ? 'sticky-header' : ''}`}>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={index} className={column.className || ''} style={column.style}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={keyExtractor ? keyExtractor(row) : rowIndex}>
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className={column.className || ''} style={column.style}>
                    {column.render ? column.render(row) : row[column.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className={`responsive-table-mobile ${className}`}>
        {data.map((row, index) => {
          const rowKey = keyExtractor ? keyExtractor(row) : index
          const isExpanded = expandedRows.has(rowKey)

          return (
            <div key={rowKey} className="mobile-card">
              <div
                className="mobile-card-header"
                onClick={() => toggleRowExpansion(rowKey)}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggleRowExpansion(rowKey)
                  }
                }}
                aria-expanded={isExpanded}
                aria-label={`${isExpanded ? 'Collapse' : 'Expand'} row details`}
              >
                <div className="mobile-card-summary">
                  {mobileCardRenderer
                    ? mobileCardRenderer(row, false)
                    : defaultMobileCard(row, columns.slice(0, 2))}
                </div>
                <Button variant="ghost" className="mobile-expand-button" aria-hidden="true">
                  {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                </Button>
              </div>

              {isExpanded && (
                <div className="mobile-card-details">
                  {mobileCardRenderer
                    ? mobileCardRenderer(row, true)
                    : defaultMobileCard(row, columns.slice(2))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

export default ResponsiveTable
