const test = require('node:test')
const assert = require('node:assert/strict')

const MPLADSApiClient = require('../src/mplads-api-client')

test('uses the current MPLADS allocation report request key', () => {
  assert.equal(
    MPLADSApiClient.DATA_TYPE_REQUEST_KEYS.allocated_limit,
    "Allocated Limit for Hon'ble MPs"
  )
})

test('accepts the allocation response key returned by the portal', () => {
  assert.ok(MPLADSApiClient.RESPONSE_KEY_FALLBACKS.allocated_limit.includes('Allocated Limit'))
})
