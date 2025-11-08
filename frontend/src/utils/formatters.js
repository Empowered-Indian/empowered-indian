// General number formatter for Indian Rupee compact display
// Examples: 1326.5 CR, 24.3 L, 950 K, 12,345
export function formatINRCompact(amount, options = {}) {
  const {
    maximumFractionDigits = 1,
    minimumFractionDigits = 0,
    includeRupeeSymbol = false,
    uppercaseUnits = true,
  } = options

  const normalized = Number(amount)
  if (!Number.isFinite(normalized)) {
    return '0'
  }

  const abs = Math.abs(normalized)

  let value = normalized
  let unit = ''

  if (abs >= 1e7) {
    value = normalized / 1e7 // Crore
    unit = uppercaseUnits ? 'CR' : 'Cr'
  } else if (abs >= 1e5) {
    value = normalized / 1e5 // Lakh
    unit = uppercaseUnits ? 'L' : 'L'
  } else if (abs >= 1e3) {
    value = normalized / 1e3 // Thousand
    unit = uppercaseUnits ? 'K' : 'k'
  }

  if (unit) {
    const number = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(value)
    const prefix = includeRupeeSymbol ? '₹' : ''
    return `${prefix}${number} ${unit}`.trim()
  }

  // For values below 1 lakh, just format with Indian grouping
  if (includeRupeeSymbol) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(normalized)
  }

  return new Intl.NumberFormat('en-IN').format(normalized)
}

// Full currency formatter (non-compact) for convenience
export function formatINRCurrency(amount, maximumFractionDigits = 0) {
  const normalized = Number(amount)
  if (!Number.isFinite(normalized)) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits,
  }).format(normalized)
}
