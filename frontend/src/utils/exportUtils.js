import toast from 'react-hot-toast'
import { API_BASE_URL } from './constants/api'

// Export completed works as CSV
export const exportCompletedWorks = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters)
    const response = await fetch(`${API_BASE_URL}/export/completed-works?${queryParams}`)

    if (!response.ok) {
      throw new Error('Export failed')
    }

    // Get filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition')
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
      : `mplads_completed_works_${new Date().toISOString().split('T')[0]}.csv`

    // Download the file
    const blob = await response.blob()
    downloadBlob(blob, filename)

    toast.success('Completed works exported successfully!')
  } catch (error) {
    console.error('Error exporting completed works:', error)
    toast.error('Failed to export completed works. Please try again.')
  }
}

// Export recommended works as CSV
export const exportRecommendedWorks = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters)
    const response = await fetch(`${API_BASE_URL}/export/recommended-works?${queryParams}`)

    if (!response.ok) {
      throw new Error('Export failed')
    }

    const contentDisposition = response.headers.get('Content-Disposition')
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
      : `mplads_recommended_works_${new Date().toISOString().split('T')[0]}.csv`

    const blob = await response.blob()
    downloadBlob(blob, filename)

    toast.success('Recommended works exported successfully!')
  } catch (error) {
    console.error('Error exporting recommended works:', error)
    toast.error('Failed to export recommended works. Please try again.')
  }
}

// Export expenditures as CSV
export const exportExpenditures = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters)
    const response = await fetch(`${API_BASE_URL}/export/expenditures?${queryParams}`)

    if (!response.ok) {
      throw new Error('Export failed')
    }

    const contentDisposition = response.headers.get('Content-Disposition')
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
      : `mplads_expenditures_${new Date().toISOString().split('T')[0]}.csv`

    const blob = await response.blob()
    downloadBlob(blob, filename)

    toast.success('Expenditures exported successfully!')
  } catch (error) {
    console.error('Error exporting expenditures:', error)
    toast.error('Failed to export expenditures. Please try again.')
  }
}

// Export MP summary as CSV
export const exportMPSummary = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters)
    const response = await fetch(`${API_BASE_URL}/export/mp-summary?${queryParams}`)

    if (!response.ok) {
      throw new Error('Export failed')
    }

    const contentDisposition = response.headers.get('Content-Disposition')
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
      : `mplads_mp_summary_${new Date().toISOString().split('T')[0]}.csv`

    const blob = await response.blob()
    downloadBlob(blob, filename)

    toast.success('MP summary exported successfully!')
  } catch (error) {
    console.error('Error exporting MP summary:', error)
    toast.error('Failed to export MP summary. Please try again.')
  }
}

// Helper function to download blob as file
const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

// Export current view data as JSON (for debugging/development)
export const exportAsJSON = (data, filename = 'mplads_data.json') => {
  try {
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    downloadBlob(blob, filename)
    toast.success('Data exported as JSON successfully!')
  } catch (error) {
    console.error('Error exporting as JSON:', error)
    toast.error('Failed to export data as JSON.')
  }
}

// Helper to get current filter state for exports
export const getCurrentFilters = filterContext => {
  const filters = {}

  if (filterContext.state) filters.state = filterContext.state
  if (filterContext.house) filters.house = filterContext.house
  // Include LS term to align with backend gating
  if (filterContext.lsTerm) filters.ls_term = Number(filterContext.lsTerm)
  if (filterContext.year) filters.year = filterContext.year
  if (filterContext.category) filters.category = filterContext.category
  if (filterContext.minAmount) filters.min_amount = filterContext.minAmount
  if (filterContext.maxAmount) filters.max_amount = filterContext.maxAmount
  if (filterContext.paymentStatus) filters.payment_status = filterContext.paymentStatus
  if (filterContext.searchQuery) filters.search = filterContext.searchQuery

  return filters
}

// Format export button props for consistent styling
export const getExportButtonProps = (isExporting = false) => ({
  disabled: isExporting,
  className: `export-button ${isExporting ? 'exporting' : ''}`,
  style: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: '#059669',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: isExporting ? 'not-allowed' : 'pointer',
    opacity: isExporting ? 0.6 : 1,
    transition: 'all 0.2s ease',
  },
})
