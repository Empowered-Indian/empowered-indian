import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DEFAULT_SITE_URL = 'https://empoweredindian.in'
const DEFAULT_API_BASE_URL = 'https://api.empoweredindian.in/api'
const OUTPUT_PATH = path.resolve(__dirname, '../public/sitemap.xml')
const FETCH_TIMEOUT_MS = Number(process.env.SITEMAP_FETCH_TIMEOUT_MS || 15000)
const MP_PAGE_LIMIT = Number(process.env.SITEMAP_MP_PAGE_LIMIT || 1000)
const MAX_MP_PAGES = Number(process.env.SITEMAP_MAX_MP_PAGES || 20)
const CURRENT_LOK_SABHA_TERM = Number(process.env.SITEMAP_CURRENT_LOK_SABHA_TERM || 18)
const PREVIOUS_LOK_SABHA_TERM = Number(process.env.SITEMAP_PREVIOUS_LOK_SABHA_TERM || 17)

const stripDiacritics = (str = '') => str.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')

const ordinal = n => {
  const num = Number(n)
  if (!Number.isFinite(num)) return ''
  const s = ['th', 'st', 'nd', 'rd']
  const v = num % 100
  return num + (s[(v - 20) % 10] || s[v] || s[0])
}

const slugify = (str = '') => {
  const s = stripDiacritics(String(str).toLowerCase())
  return s
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

const normalizeMPSlug = (slug = '') => {
  if (!slug) return ''
  const s = slugify(String(slug))
  if (!s) return s

  const parts = s.split('-').filter(Boolean)
  const base = []
  let foundRajyaSabha = false
  let foundGenericLokSabha = false
  let foundOrdinalLokSabha = null
  const isOrdinal = tok => /^(\d+)(st|nd|rd|th)$/.test(tok)

  for (let i = 0; i < parts.length; ) {
    const tok = parts[i]

    if (isOrdinal(tok) && parts[i + 1] === 'lok' && parts[i + 2] === 'sabha') {
      foundOrdinalLokSabha = `${tok}-lok-sabha`
      i += 3
      continue
    }

    if (tok === 'lok' && parts[i + 1] === 'sabha') {
      foundGenericLokSabha = true
      i += 2
      continue
    }

    if (tok === 'rajya' && parts[i + 1] === 'sabha') {
      foundRajyaSabha = true
      i += 2
      continue
    }

    base.push(tok)
    i += 1
  }

  let normalized = base.join('-')
  let suffix = ''
  if (foundOrdinalLokSabha) suffix = foundOrdinalLokSabha
  else if (foundGenericLokSabha) suffix = 'lok-sabha'
  else if (foundRajyaSabha) suffix = 'rajya-sabha'

  if (suffix) normalized = [normalized, suffix].filter(Boolean).join('-')
  return normalized
}

const buildMPSlugHuman = (mp, opts = {}) => {
  if (!mp) return ''
  const { lsTerm, includeHouse = true, includeTerm = true } = opts
  const parts = [mp.name || mp.mpName, mp.constituency, mp.state].filter(Boolean).map(slugify)
  const house = String(mp.house || '').toLowerCase()

  if (includeHouse && house) {
    if (house.includes('lok')) {
      if (includeTerm && (lsTerm || mp.lsTerm || mp.ls_term)) {
        parts.push(slugify(`${ordinal(lsTerm || mp.lsTerm || mp.ls_term)} lok sabha`))
      } else {
        parts.push('lok-sabha')
      }
    } else if (house.includes('rajya')) {
      parts.push('rajya-sabha')
    }
  }

  return normalizeMPSlug(parts.filter(Boolean).join('-'))
}

const buildStateSlug = state =>
  String(state || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')

const normalizeOrigin = value => {
  const raw = String(value || DEFAULT_SITE_URL)
    .trim()
    .replace(/\/+$/, '')
  if (!raw) return DEFAULT_SITE_URL
  return raw
}

const normalizeApiBaseUrl = value => {
  const raw = String(value || '')
    .trim()
    .replace(/\/+$/, '')
  if (!raw || raw.includes('your-production-domain.com')) return DEFAULT_API_BASE_URL
  return raw
}

const SITE_URL = normalizeOrigin(
  process.env.SITEMAP_SITE_URL || process.env.SITE_URL || process.env.VITE_SITE_URL
)

const API_BASE_URL = normalizeApiBaseUrl(
  process.env.SITEMAP_API_URL ||
    process.env.API_URL ||
    process.env.VITE_API_URL_PRODUCTION ||
    process.env.VITE_API_URL
)

const STATIC_ROUTES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/mplads', changefreq: 'daily', priority: '0.9' },
  { path: '/mplads/mps', changefreq: 'daily', priority: '0.85' },
  { path: '/mplads/states', changefreq: 'daily', priority: '0.85' },
  { path: '/mplads/track-area', changefreq: 'daily', priority: '0.8' },
  { path: '/mplads/compare', changefreq: 'weekly', priority: '0.75' },
  { path: '/mplads/search', changefreq: 'daily', priority: '0.7' },
  { path: '/mplads/report', changefreq: 'monthly', priority: '0.6' },
  { path: '/about-us', changefreq: 'monthly', priority: '0.6' },
  { path: '/faq', changefreq: 'monthly', priority: '0.5' },
  { path: '/privacy-policy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms-of-service', changefreq: 'yearly', priority: '0.3' },
]

const buildAbsoluteUrl = routePath => {
  const normalizedPath = routePath === '/' ? '/' : `/${String(routePath).replace(/^\/+/, '')}`
  return `${SITE_URL}${normalizedPath}`
}

const escapeXml = value =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

const fetchJson = async pathWithQuery => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  const url = `${API_BASE_URL}${pathWithQuery.startsWith('/') ? pathWithQuery : `/${pathWithQuery}`}`

  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    return await res.json()
  } finally {
    clearTimeout(timeout)
  }
}

const buildQuery = params => {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
  })
  return search.toString()
}

const fetchAllMps = async params => {
  const mps = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages && page <= MAX_MP_PAGES) {
    const query = buildQuery({ page, limit: MP_PAGE_LIMIT, ...params })
    const payload = await fetchJson(`/summary/mps?${query}`)
    const pageMps = Array.isArray(payload?.data) ? payload.data : []
    mps.push(...pageMps)

    totalPages = Number(payload?.pagination?.totalPages || 1)
    page += 1
  }

  return mps
}

const fetchDynamicRoutes = async () => {
  if (process.env.SITEMAP_DYNAMIC === 'false') {
    console.log('Skipped dynamic sitemap routes because SITEMAP_DYNAMIC=false')
    return []
  }

  const [statesPayload, currentLokSabha, previousLokSabha, rajyaSabha] = await Promise.all([
    fetchJson(`/summary/states?limit=200&ls_term=${CURRENT_LOK_SABHA_TERM}`),
    fetchAllMps({ house: 'Lok Sabha', ls_term: CURRENT_LOK_SABHA_TERM }),
    fetchAllMps({ house: 'Lok Sabha', ls_term: PREVIOUS_LOK_SABHA_TERM }),
    fetchAllMps({ house: 'Rajya Sabha' }),
  ])

  const states = Array.isArray(statesPayload?.data) ? statesPayload.data : []
  const stateRoutes = states
    .map(item => buildStateSlug(item.state))
    .filter(Boolean)
    .map(slug => ({
      path: `/mplads/states/${slug}`,
      changefreq: 'daily',
      priority: '0.7',
    }))

  const mpGroups = [
    { records: currentLokSabha, lsTerm: CURRENT_LOK_SABHA_TERM },
    { records: previousLokSabha, lsTerm: PREVIOUS_LOK_SABHA_TERM },
    { records: rajyaSabha },
  ]
  const mpRoutes = mpGroups.flatMap(({ records, lsTerm }) =>
    records
      .map(mp => buildMPSlugHuman(mp, { lsTerm }))
      .filter(Boolean)
      .map(slug => ({
        path: `/mplads/mps/${slug}`,
        changefreq: 'daily',
        priority: '0.65',
      }))
  )

  console.log(
    [
      'Fetched dynamic sitemap routes:',
      `${stateRoutes.length} states`,
      `${currentLokSabha.length} Lok Sabha ${CURRENT_LOK_SABHA_TERM} MPs`,
      `${previousLokSabha.length} Lok Sabha ${PREVIOUS_LOK_SABHA_TERM} MPs`,
      `${rajyaSabha.length} Rajya Sabha MPs`,
    ].join(' ')
  )
  return [...stateRoutes, ...mpRoutes]
}

const toSitemapXml = routes => {
  const seen = new Set()
  const dedupedRoutes = routes.filter(route => {
    const loc = buildAbsoluteUrl(route.path)
    if (seen.has(loc)) return false
    seen.add(loc)
    return true
  })

  const urls = dedupedRoutes
    .map(route => {
      const tags = [
        `    <loc>${escapeXml(buildAbsoluteUrl(route.path))}</loc>`,
        route.changefreq ? `    <changefreq>${escapeXml(route.changefreq)}</changefreq>` : null,
        route.priority ? `    <priority>${escapeXml(route.priority)}</priority>` : null,
      ].filter(Boolean)

      return `  <url>\n${tags.join('\n')}\n  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

const run = async () => {
  let dynamicRoutes = []
  try {
    dynamicRoutes = await fetchDynamicRoutes()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (process.env.SITEMAP_REQUIRE_DYNAMIC === 'true') {
      throw new Error(`Failed to fetch dynamic sitemap routes: ${message}`)
    }
    console.warn(
      `Warning: using static sitemap routes only. Dynamic route fetch failed: ${message}`
    )
  }

  const routes = [...STATIC_ROUTES, ...dynamicRoutes]
  await writeFile(OUTPUT_PATH, toSitemapXml(routes), 'utf8')
  console.log(`Generated ${routes.length} sitemap entries at ${OUTPUT_PATH}`)
}

run().catch(error => {
  console.error(error)
  process.exit(1)
})
