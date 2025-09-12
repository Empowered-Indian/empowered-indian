// Utilities for building and parsing human‑readable slugs

const stripDiacritics = (str = '') =>
  str.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

const ordinal = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return '';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return num + (s[(v - 20) % 10] || s[v] || s[0]);
};

export const slugify = (str = '') => {
  const s = stripDiacritics(String(str).toLowerCase());
  return s
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
};

// Normalize an MP slug by ensuring that any house/term token appears at most once,
// and only as a single suffix at the end of the slug.
// Examples:
//  - "narendra-modi-varanasi-17th-lok-sabha-17th-lok-sabha" => "narendra-modi-varanasi-17th-lok-sabha"
//  - "abc-rajya-sabha-rajya-sabha" => "abc-rajya-sabha"
//  - "abc-lok-sabha" => "abc-lok-sabha"
export const normalizeMPSlug = (slug = '') => {
  if (!slug) return '';
  // First, ensure a consistent hyphenated, lowercase form
  const s = slugify(String(slug));
  if (!s) return s;

  const parts = s.split('-').filter(Boolean);
  const base = [];

  let foundRajyaSabha = false;
  let foundGenericLokSabha = false;
  let foundOrdinalLokSabha = null; // e.g., "17th-lok-sabha"

  const isOrdinal = (tok) => /^(\d+)(st|nd|rd|th)$/.test(tok);

  for (let i = 0; i < parts.length; ) {
    const tok = parts[i];

    // Match ordinal-lok-sabha (e.g., 17th-lok-sabha)
    if (isOrdinal(tok) && parts[i + 1] === 'lok' && parts[i + 2] === 'sabha') {
      foundOrdinalLokSabha = `${tok}-lok-sabha`;
      i += 3;
      continue;
    }

    // Match generic lok-sabha
    if (tok === 'lok' && parts[i + 1] === 'sabha') {
      foundGenericLokSabha = true;
      i += 2;
      continue;
    }

    // Match rajya-sabha
    if (tok === 'rajya' && parts[i + 1] === 'sabha') {
      foundRajyaSabha = true;
      i += 2;
      continue;
    }

    // Otherwise, it's part of the base slug
    base.push(tok);
    i += 1;
  }

  // Rebuild base and append exactly one suffix (if any), with this priority:
  // ordinal-lok-sabha > generic lok-sabha > rajya-sabha
  let normalized = base.join('-');
  let suffix = '';
  if (foundOrdinalLokSabha) suffix = foundOrdinalLokSabha;
  else if (foundGenericLokSabha) suffix = 'lok-sabha';
  else if (foundRajyaSabha) suffix = 'rajya-sabha';

  if (suffix) normalized = [normalized, suffix].filter(Boolean).join('-');
  return normalized;
};

// Build a canonical MP slug like:
//   mp-name-constituency-state-<24hexId>
export const buildMPSlug = (mp) => {
  if (!mp) return '';
  const id = mp.id || mp._id || '';
  const parts = [mp.name || mp.mpName, mp.constituency, mp.state]
    .filter(Boolean)
    .map(slugify);
  const base = parts.filter(Boolean).join('-');
  return [base, id].filter(Boolean).join('-');
};

// Build a human‑readable MP slug without ID
// Default: name-constituency-state
export const buildMPSlugHuman = (mp, opts = {}) => {
  if (!mp) return '';
  const { lsTerm, includeHouse = true, includeTerm = true } = opts;
  const parts = [mp.name || mp.mpName, mp.constituency, mp.state]
    .filter(Boolean)
    .map(slugify);
  const house = String(mp.house || '').toLowerCase();
  if (includeHouse && house) {
    if (house.includes('lok')) {
      if (includeTerm && (lsTerm || mp.ls_term)) {
        parts.push(slugify(`${ordinal(lsTerm || mp.ls_term)} lok sabha`));
      } else {
        parts.push('lok-sabha');
      }
    } else if (house.includes('rajya')) {
      parts.push('rajya-sabha');
    }
  }
  return normalizeMPSlug(parts.filter(Boolean).join('-'));
};

export const buildMPSlugCandidates = (mp) => {
  if (!mp) return [];
  const base = buildMPSlugHuman(mp, { includeHouse: false, includeTerm: false });
  const withHouseOnly = buildMPSlugHuman(mp, { includeHouse: true, includeTerm: false });
  const candidates = new Set([base, withHouseOnly]);
  if (String(mp.house || '').toLowerCase().includes('lok')) {
    candidates.add(buildMPSlugHuman(mp, { includeHouse: true, includeTerm: true, lsTerm: 18 }));
    candidates.add(buildMPSlugHuman(mp, { includeHouse: true, includeTerm: true, lsTerm: 17 }));
  }
  // Ensure all candidates are normalized and unique
  return Array.from(new Set(Array.from(candidates).map((c) => normalizeMPSlug(c)))).filter(Boolean);
};

// Extract id from a slug if present (expects trailing 24-hex)
export const getIdFromSlug = (slug = '') => {
  if (!slug) return null;
  const last = String(slug).split('-').pop();
  return /^[a-f0-9]{24}$/i.test(last) ? last : null;
};

// Check if the param looks like a bare 24-hex id
export const isBareObjectId = (s = '') => /^[a-f0-9]{24}$/i.test(String(s));
