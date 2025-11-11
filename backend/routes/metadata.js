/**
 * Metadata routes for data sync information
 * Used by frontend to display footer information about data freshness
 */

const express = require('express')
const router = express.Router()
const { Metadata } = require('../models')

/**
 * GET /api/metadata/sync-info
 * Returns data sync metadata for frontend footer display
 */
router.get('/sync-info', async (req, res) => {
  try {
    // Get the latest sync metadata
    const metadata = await Metadata.findOne({ source: 'Official MPLADS Portal API' })

    if (!metadata) {
      return res.json({
        success: true,
        data: {
          source: 'Official MPLADS Portal API',
          lastUpdated: 'Never',
          nextUpdate: 'pending first sync',
          totalRecords: 0,
          dataQuality: null,
          updateFrequency: 'daily',
        },
      })
    }

    // Update the "next update info" in case time has passed
    let nextUpdateInfo = metadata.nextUpdateInfo
    if (metadata.nextUpdate) {
      const now = new Date()
      const nextUpdate = new Date(metadata.nextUpdate)
      const diffMs = nextUpdate.getTime() - now.getTime()
      const diffHours = Math.round(diffMs / (1000 * 60 * 60))
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

      if (diffHours < 24) {
        nextUpdateInfo = `in ${diffHours} hours`
      } else if (diffDays === 1) {
        nextUpdateInfo = 'tomorrow'
      } else if (diffDays > 0) {
        nextUpdateInfo = `in ${diffDays} days`
      } else {
        nextUpdateInfo = 'due now'
      }
    }

    const response = {
      source: metadata.source,
      lastUpdated: metadata.lastUpdatedFormatted,
      nextUpdate: nextUpdateInfo,
      totalRecords: metadata.syncStats.totalRecords,
      dataQuality: metadata.syncStats.dataQuality,
      updateFrequency: metadata.updateFrequency,
      syncStats: {
        lokSabhaRecords: metadata.syncStats.lokSabhaRecords,
        rajyaSabhaRecords: metadata.syncStats.rajyaSabhaRecords,
        allocations: metadata.syncStats.allocations,
        expenditures: metadata.syncStats.expenditures,
        worksCompleted: metadata.syncStats.worksCompleted,
        worksRecommended: metadata.syncStats.worksRecommended,
        mps: metadata.syncStats.mps,
        syncDurationSeconds: metadata.syncStats.syncDurationSeconds,
      },
    }

    res.json({
      success: true,
      data: response,
    })
  } catch (error) {
    console.error('Error fetching sync metadata:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sync metadata',
    })
  }
})

/**
 * GET /api/metadata/should-update
 * Check if data should be updated based on schedule (for automation scripts)
 */
router.get('/should-update', async (req, res) => {
  try {
    const metadata = await Metadata.findOne({ source: 'Official MPLADS Portal API' })

    if (!metadata || !metadata.nextUpdate) {
      return res.json({
        success: true,
        shouldUpdate: true,
        reason: 'First time sync',
      })
    }

    const now = new Date()
    const nextUpdate = new Date(metadata.nextUpdate)
    const shouldUpdate = now >= nextUpdate

    res.json({
      success: true,
      shouldUpdate,
      reason: shouldUpdate ? 'Scheduled update time reached' : 'Update not yet due',
      nextUpdate: metadata.nextUpdateFormatted,
      lastUpdated: metadata.lastUpdatedFormatted,
    })
  } catch (error) {
    console.error('Error checking update schedule:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to check update schedule',
    })
  }
})

module.exports = router
