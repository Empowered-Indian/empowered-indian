export const getKnownTerms = () => [18, 17]

export const getLokSabhaTermPeriod = lsTerm => {
  const t = Number(lsTerm)
  switch (t) {
    case 18:
      return { term: 18, startYear: 2024, endYear: 2029, label: 'Lok Sabha 2024–29' }
    case 17:
      return { term: 17, startYear: 2019, endYear: 2024, label: 'Lok Sabha 2019–24' }
    default:
      // Fallback: assume 5-year window ending at startYear+5, but unknown display
      return { term: t || 18, startYear: undefined, endYear: undefined, label: 'Lok Sabha' }
  }
}

export const getPeriodLabel = lsTerm => getLokSabhaTermPeriod(lsTerm).label

export const formatTermOrdinal = term => {
  const n = Number(term)
  if (!Number.isFinite(n)) return String(term)
  const v = n % 100
  if (v >= 11 && v <= 13) return `${n}th`
  switch (n % 10) {
    case 1:
      return `${n}st`
    case 2:
      return `${n}nd`
    case 3:
      return `${n}rd`
    default:
      return `${n}th`
  }
}

export const normalizeTerms = payload => {
  let source = payload
  if (source && typeof source === 'object') {
    source = source.terms ?? source.data?.terms ?? source.data ?? source
  }
  const arr = Array.isArray(source) ? source : []
  const nums = arr
    .map(item => {
      if (typeof item === 'number') return item
      if (typeof item === 'string') return parseInt(item, 10)
      if (item && typeof item === 'object') {
        const val = item.term ?? item.value ?? item.id
        return typeof val === 'string' ? parseInt(val, 10) : Number(val)
      }
      return NaN
    })
    .map(n => Number(n))
    .filter(n => Number.isFinite(n))
  const unique = Array.from(new Set(nums))
  return unique.sort((a, b) => b - a)
}
