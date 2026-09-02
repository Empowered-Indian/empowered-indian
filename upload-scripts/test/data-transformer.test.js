const test = require('node:test')
const assert = require('node:assert/strict')

const { transformWorksRecommended } = require('../src/data-transformer')

test('preserves every recommendation, including completed works, for MoSPI utilization', () => {
  const rows = [
    {
      Sno: 1,
      STATE_NAME: 'Telangana',
      MP_NAME: 'Example MP',
      CONSTITUENCY: 'Karimnagar',
      WORK_RECOMMENDATION_DTL_ID: '101',
      RECOMMENDATION_DATE: '01-Jan-2026',
      RECOMMENDED_AMOUNT: '₹1,25,000',
      WORK_STAGE: 'Completed',
      SANCTION_DATE: '02-Feb-2026',
      SANCTION_AMOUNT: '₹1,20,000',
    },
  ]

  const result = transformWorksRecommended(rows, 'Lok Sabha', '18')

  assert.equal(result.length, 1)
  assert.equal(result[0].recommendedAmount, 125000)
  assert.equal(result[0].workStage, 'Completed')
  assert.equal(result[0].sanctionDate, '2026-02-02')
  assert.equal(result[0].sanctionedAmount, 120000)
})
