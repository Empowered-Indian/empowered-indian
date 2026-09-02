const stripDiacritics = (value = '') =>
  String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')

const ordinal = value => {
  const number = Number(value)
  if (!Number.isFinite(number)) return ''
  const suffixes = ['th', 'st', 'nd', 'rd']
  const modulo = number % 100
  return number + (suffixes[(modulo - 20) % 10] || suffixes[modulo] || suffixes[0])
}

const slugify = (value = '') =>
  stripDiacritics(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')

const normalizeMPSlug = (value = '') => {
  const parts = slugify(value).split('-').filter(Boolean)
  const base = []
  let suffix = ''

  for (let index = 0; index < parts.length; ) {
    const token = parts[index]
    if (
      /^(\d+)(st|nd|rd|th)$/.test(token) &&
      parts[index + 1] === 'lok' &&
      parts[index + 2] === 'sabha'
    ) {
      suffix = `${token}-lok-sabha`
      index += 3
    } else if (token === 'lok' && parts[index + 1] === 'sabha') {
      if (!suffix) suffix = 'lok-sabha'
      index += 2
    } else if (token === 'rajya' && parts[index + 1] === 'sabha') {
      if (!suffix) suffix = 'rajya-sabha'
      index += 2
    } else {
      base.push(token)
      index += 1
    }
  }

  return [base.join('-'), suffix].filter(Boolean).join('-')
}

const buildMPSlug = (mp, options = {}) => {
  const { includeHouse = true, includeTerm = true, lsTerm } = options
  const parts = [mp?.name || mp?.mpName, mp?.constituency, mp?.state].filter(Boolean)
  const house = String(mp?.house || '').toLowerCase()

  if (includeHouse && house.includes('lok')) {
    const term = lsTerm ?? mp?.lsTerm ?? mp?.ls_term
    parts.push(includeTerm && term ? `${ordinal(term)} lok sabha` : 'lok sabha')
  } else if (includeHouse && house.includes('rajya')) {
    parts.push('rajya sabha')
  }

  return normalizeMPSlug(parts.join('-'))
}

const buildMPSlugCandidates = mp => {
  const candidates = new Set([
    buildMPSlug(mp, { includeHouse: false, includeTerm: false }),
    buildMPSlug(mp, { includeHouse: true, includeTerm: false }),
  ])

  if (
    String(mp?.house || '')
      .toLowerCase()
      .includes('lok')
  ) {
    const term = mp?.lsTerm ?? mp?.ls_term
    if (term) candidates.add(buildMPSlug(mp, { lsTerm: term }))
    candidates.add(buildMPSlug(mp, { lsTerm: 18 }))
    candidates.add(buildMPSlug(mp, { lsTerm: 17 }))
  }

  return [...candidates].filter(Boolean)
}

module.exports = {
  slugify,
  normalizeMPSlug,
  buildMPSlug,
  buildMPSlugCandidates,
}
