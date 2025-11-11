const DEFAULT_LS_TERM = (process.env.DEFAULT_LS_TERM || '18').toString()

function getLsTermSelection(req) {
  const raw = (req.query.ls_term || DEFAULT_LS_TERM).toString().toLowerCase()
  if (raw === 'both') return 'both'
  if (raw === '17' || raw === '18') return raw
  // Accept numeric 17/18 too
  if (raw.includes('17')) return '17'
  // Fallback to configured default
  return DEFAULT_LS_TERM
}

// Build a filter object for Mongoose find() that restricts to the selected LS terms
// Applies only to Lok Sabha records. For RS callers, return {}.
function buildLsTermFindFilter(houseValue, selection) {
  if (houseValue && houseValue !== 'Lok Sabha') return {}
  const sel = (selection || '18').toString().toLowerCase()
  if (sel === 'both') {
    return { house: 'Lok Sabha', lsTerm: { $in: [17, 18] } }
  }
  const n = parseInt(sel, 10)
  return { house: 'Lok Sabha', lsTerm: n }
}

// Build a $or query to mix RS (no lsTerm) plus LS with selection
function buildMixedHouseOrFilter(selection) {
  const sel = (selection || '18').toString().toLowerCase()
  if (sel === 'both') {
    // Both terms for LS, plus RS unchanged
    return [{ house: 'Rajya Sabha' }, { house: 'Lok Sabha', lsTerm: { $in: [17, 18] } }]
  }
  const n = parseInt(sel, 10)
  return [{ house: 'Rajya Sabha' }, { house: 'Lok Sabha', lsTerm: n }]
}

module.exports = {
  DEFAULT_LS_TERM,
  getLsTermSelection,
  buildLsTermFindFilter,
  buildMixedHouseOrFilter,
}
