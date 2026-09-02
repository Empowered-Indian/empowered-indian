const test = require('node:test')
const assert = require('node:assert/strict')
const { normalizeMPSlug, buildMPSlug, buildMPSlugCandidates } = require('../utils/mpSlug')

const bandi = {
  mpName: 'Sanjay Kumar Bandi',
  constituency: 'KARIMNAGAR',
  state: 'Telangana',
  house: 'Lok Sabha',
  lsTerm: 18,
}

test('builds the canonical cold-load MP slug', () => {
  assert.equal(buildMPSlug(bandi), 'sanjay-kumar-bandi-karimnagar-telangana-18th-lok-sabha')
})

test('accepts canonical, generic-house, and term fallback candidates', () => {
  const candidates = buildMPSlugCandidates(bandi)
  assert.ok(candidates.includes('sanjay-kumar-bandi-karimnagar-telangana'))
  assert.ok(candidates.includes('sanjay-kumar-bandi-karimnagar-telangana-lok-sabha'))
  assert.ok(candidates.includes('sanjay-kumar-bandi-karimnagar-telangana-18th-lok-sabha'))
  assert.ok(candidates.includes('sanjay-kumar-bandi-karimnagar-telangana-17th-lok-sabha'))
})

test('normalizes repeated house suffixes', () => {
  assert.equal(
    normalizeMPSlug('sanjay-kumar-bandi-18th-lok-sabha-lok-sabha'),
    'sanjay-kumar-bandi-18th-lok-sabha'
  )
})
