const express = require('express')
const router = express.Router()
const { getCollection } = require('../utils/database')

// Get all unique states
router.get('/states', async (req, res) => {
  try {
    const mpsCollection = await getCollection('mps')

    // Get states from MPs collection
    const states = await mpsCollection.distinct('state')

    // Sort states alphabetically
    const sortedStates = states
      .filter(state => state && state.trim()) // Remove null/empty values
      .sort()

    res.json({
      success: true,
      states: sortedStates,
      count: sortedStates.length,
    })
  } catch (error) {
    console.error('Error fetching states:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch states',
      error: error.message,
    })
  }
})

// Get districts by state
router.get('/districts', async (req, res) => {
  try {
    const { state } = req.query
    const mpsCollection = await getCollection('mps')

    let query = {}
    if (state && state !== 'all') {
      query.state = state
    }

    // Get constituencies (districts) from MPs collection
    const constituencies = await mpsCollection.distinct('constituency', query)

    // Sort constituencies alphabetically
    const sortedConstituencies = constituencies
      .filter(constituency => constituency && constituency.trim()) // Remove null/empty values
      .sort()

    res.json({
      success: true,
      districts: sortedConstituencies,
      count: sortedConstituencies.length,
      state: state || 'all',
    })
  } catch (error) {
    console.error('Error fetching districts:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch districts',
      error: error.message,
    })
  }
})

// Get all unique constituencies
router.get('/constituencies', async (req, res) => {
  try {
    const { state } = req.query
    const mpsCollection = await getCollection('mps')

    let query = {}
    if (state && state !== 'all') {
      query.state = state
    }

    const constituencies = await mpsCollection.distinct('constituency', query)

    const sortedConstituencies = constituencies
      .filter(constituency => constituency && constituency.trim())
      .sort()

    res.json({
      success: true,
      constituencies: sortedConstituencies,
      count: sortedConstituencies.length,
      state: state || 'all',
    })
  } catch (error) {
    console.error('Error fetching constituencies:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch constituencies',
      error: error.message,
    })
  }
})

// Get all unique houses
router.get('/houses', async (req, res) => {
  try {
    const mpsCollection = await getCollection('mps')

    const houses = await mpsCollection.distinct('house')

    const sortedHouses = houses.filter(house => house && house.trim()).sort()

    res.json({
      success: true,
      houses: sortedHouses,
      count: sortedHouses.length,
    })
  } catch (error) {
    console.error('Error fetching houses:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch houses',
      error: error.message,
    })
  }
})

// Get filter options summary (all filter data in one call)
router.get('/summary', async (req, res) => {
  try {
    const mpsCollection = await getCollection('mps')

    // Get all unique values in parallel
    const [states, houses, constituencies] = await Promise.all([
      mpsCollection.distinct('state'),
      mpsCollection.distinct('house'),
      mpsCollection.distinct('constituency'),
    ])

    res.json({
      success: true,
      filters: {
        states: states.filter(s => s && s.trim()).sort(),
        houses: houses.filter(h => h && h.trim()).sort(),
        constituencies: constituencies.filter(c => c && c.trim()).sort(),
      },
      counts: {
        states: states.length,
        houses: houses.length,
        constituencies: constituencies.length,
      },
    })
  } catch (error) {
    console.error('Error fetching filter summary:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch filter summary',
      error: error.message,
    })
  }
})

// Get MP count by filters (for showing result counts)
router.get('/counts', async (req, res) => {
  try {
    const { state, house, constituency } = req.query
    const mpsCollection = await getCollection('mps')

    let query = {}

    if (state && state !== 'all') {
      query.state = state
    }
    if (house && house !== 'all') {
      query.house = house
    }
    if (constituency && constituency !== 'all') {
      query.constituency = constituency
    }

    const count = await mpsCollection.countDocuments(query)

    res.json({
      success: true,
      count: count,
      filters: { state, house, constituency },
    })
  } catch (error) {
    console.error('Error fetching filter counts:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch filter counts',
      error: error.message,
    })
  }
})

module.exports = router
