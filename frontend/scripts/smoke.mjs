/*
  Simple API smoke test for MPLADS endpoints.
  Usage:
    API_URL=http://localhost:5000/api npm run smoke
  or
    npm run smoke  (defaults to http://localhost:5000/api)
*/

const BASE = process.env.API_URL?.replace(/\/$/, '') || 'http://localhost:5000/api'

const fetchJson = async path => {
  const url = `${BASE}${path}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  const data = await res.json().catch(() => ({}))
  return { url, data }
}

const tests = [
  {
    name: 'MPs LS 17 (Lok Sabha) returns some results',
    path: '/summary/mps?page=1&limit=5&house=Lok%20Sabha&ls_term=17',
    ok: d => Array.isArray(d.data) && d.data.length > 0,
  },
  {
    name: 'MPs RS returns some results',
    path: '/summary/mps?page=1&limit=5&house=Rajya%20Sabha',
    ok: d => Array.isArray(d.data) && d.data.length > 0,
  },
  {
    name: 'MPs Both Houses (ls_term=both) mixes results',
    path: '/summary/mps?page=1&limit=5&ls_term=both',
    ok: d => Array.isArray(d.data) && d.data.length > 0,
  },
  {
    name: 'Overview LS 17 returns totals',
    path: '/summary/overview?house=Lok%20Sabha&ls_term=17',
    ok: d => d.success === true && typeof d.data?.totalMPs === 'number',
  },
  {
    name: 'States mixed (no house) returns list',
    path: '/summary/states?limit=10',
    ok: d => d.success === true && Array.isArray(d.data) && d.data.length > 0,
  },
]

const run = async () => {
  let pass = 0
  console.log(`Using API base: ${BASE}`)
  for (const t of tests) {
    try {
      const { url, data } = await fetchJson(t.path)
      const result = t.ok(data)
      if (!result) throw new Error('Assertion failed')
      console.log(`✔ PASS: ${t.name} (${url})`)
      pass++
    } catch (e) {
      console.error(`✖ FAIL: ${t.name} -> ${e.message}`)
    }
  }
  console.log(`\n${pass}/${tests.length} checks passed.`)
  if (pass !== tests.length) process.exit(1)
}

run().catch(e => {
  console.error(e)
  process.exit(1)
})
