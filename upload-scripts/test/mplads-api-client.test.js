const test = require('node:test')
const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const https = require('node:https')

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

test('enforces an absolute request deadline even when the socket stays active', async () => {
  const originalRequest = https.request
  const request = new EventEmitter()
  request.write = () => {}
  request.end = () => {}
  request.setTimeout = () => {}
  request.destroy = error => {
    request.emit('error', error)
    request.emit('close')
  }
  https.request = () => request

  const client = new MPLADSApiClient('test-session')
  client.requestTimeoutMs = 5

  try {
    await assert.rejects(
      client.fetchData('lok_sabha', 'works_recommended', '18'),
      /Deadline fetching lok_sabha works_recommended/
    )
  } finally {
    https.request = originalRequest
  }
})

test('retries transient failures and returns only a complete snapshot', async () => {
  const client = new MPLADSApiClient('test-session')
  client.maxRetries = 2
  client.retryDelay = 0
  client.interRequestDelay = 0
  const attempts = new Map()
  client.fetchData = async (_house, dataType) => {
    const count = (attempts.get(dataType) || 0) + 1
    attempts.set(dataType, count)
    if (dataType === 'expenditure' && count === 1) throw new Error('ECONNRESET')
    return [{ id: dataType }]
  }

  const result = await client.fetchAllDataForHouse('lok_sabha', { lsTerm: '18' })

  assert.equal(attempts.get('expenditure'), 2)
  assert.deepEqual(Object.keys(result), [
    'works_completed',
    'works_recommended',
    'expenditure',
    'allocated_limit',
  ])
})

test('rejects a partial snapshot instead of publishing stale mixed data', async () => {
  const client = new MPLADSApiClient('test-session')
  client.maxRetries = 2
  client.retryDelay = 0
  client.interRequestDelay = 0
  client.fetchData = async (_house, dataType) => {
    if (dataType === 'works_recommended') throw new Error('upstream unavailable')
    return [{ id: dataType }]
  }

  await assert.rejects(
    client.fetchAllDataForHouse('lok_sabha', { lsTerm: '18' }),
    /Incomplete MPLADS snapshot: lok_sabha works_recommended/
  )
})
