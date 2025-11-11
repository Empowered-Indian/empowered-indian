const { validationResult } = require('express-validator')
const { getCollection } = require('../utils/database')
const { ObjectId } = require('mongodb')
const { secureLogger } = require('../utils/logger')

// Submit user feedback
const submitFeedback = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      })
    }

    const {
      type, // 'bug', 'data_issue', 'feature_request', 'general'
      title,
      description,
      category, // 'mp', 'work', 'expenditure', 'general'
      relatedId, // Optional: related MP, work, or expenditure ID
      contactEmail, // Optional
      priority = 'medium', // 'low', 'medium', 'high'
      userAgent,
      url,
    } = req.body

    const feedbackCollection = await getCollection('feedback')

    const feedback = {
      type,
      title,
      description,
      category,
      relatedId: relatedId || null,
      contactEmail: contactEmail || null,
      priority,
      status: 'open', // 'open', 'in_progress', 'resolved', 'closed'
      metadata: {
        userAgent: userAgent || req.get('User-Agent'),
        url: url || req.get('Referer'),
        ipAddress: req.ip,
        timestamp: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await feedbackCollection.insertOne(feedback)

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        id: result.insertedId,
        status: 'submitted',
      },
    })
  } catch (error) {
    secureLogger.error(
      'Error submitting feedback',
      {
        category: 'feedback',
        type: 'submit_feedback_error',
        error: error.message,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      },
      req.correlationId
    )
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
    })
  }
}

// Report data issue
const reportDataIssue = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      })
    }

    const {
      issueType, // 'incorrect_data', 'missing_data', 'outdated_data'
      description,
      location, // State/Constituency
      mpName,
      workId,
      expectedValue,
      actualValue,
      contactEmail,
    } = req.body

    const issuesCollection = await getCollection('data_issues')

    const issue = {
      type: 'data_issue',
      issueType,
      description,
      location: location || null,
      mpName: mpName || null,
      workId: workId || null,
      expectedValue: expectedValue || null,
      actualValue: actualValue || null,
      contactEmail: contactEmail || null,
      status: 'reported', // 'reported', 'investigating', 'fixed', 'invalid'
      priority: 'high', // Data issues are high priority
      metadata: {
        userAgent: req.get('User-Agent'),
        url: req.get('Referer'),
        ipAddress: req.ip,
        timestamp: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await issuesCollection.insertOne(issue)

    res.status(201).json({
      success: true,
      message: 'Data issue reported successfully',
      data: {
        id: result.insertedId,
        status: 'reported',
      },
    })
  } catch (error) {
    secureLogger.error(
      'Error reporting data issue',
      {
        category: 'feedback',
        type: 'report_issue_error',
        error: error.message,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      },
      req.correlationId
    )
    res.status(500).json({
      success: false,
      message: 'Failed to report data issue',
    })
  }
}

// Get feedback statistics (for admin)
const getFeedbackStats = async (req, res) => {
  try {
    const feedbackCollection = await getCollection('feedback')
    const issuesCollection = await getCollection('data_issues')

    const [feedbackStats, issueStats] = await Promise.all([
      feedbackCollection
        .aggregate([
          {
            $facet: {
              byType: [{ $group: { _id: '$type', count: { $sum: 1 } } }],
              byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
              byPriority: [{ $group: { _id: '$priority', count: { $sum: 1 } } }],
              total: [{ $count: 'total' }],
              recent: [
                { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
                { $count: 'recentCount' },
              ],
            },
          },
        ])
        .toArray(),

      issuesCollection
        .aggregate([
          {
            $facet: {
              byType: [{ $group: { _id: '$issueType', count: { $sum: 1 } } }],
              byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
              total: [{ $count: 'total' }],
            },
          },
        ])
        .toArray(),
    ])

    res.json({
      success: true,
      data: {
        feedback: feedbackStats[0],
        dataIssues: issueStats[0],
        summary: {
          totalFeedback: feedbackStats[0].total[0]?.total || 0,
          totalDataIssues: issueStats[0].total[0]?.total || 0,
          recentFeedback: feedbackStats[0].recent[0]?.recentCount || 0,
        },
      },
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    secureLogger.error(
      'Error getting feedback statistics',
      {
        category: 'feedback',
        type: 'feedback_stats_error',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      req.correlationId
    )
    res.status(500).json({
      success: false,
      message: 'Failed to get feedback statistics',
    })
  }
}

// Get all feedback submissions with pagination and filtering
const getAllFeedback = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      type,
      priority,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query

    const feedbackCollection = await getCollection('feedback')

    // Build filter object
    const filter = {}
    if (status) filter.status = status
    if (type) filter.type = type
    if (priority) filter.priority = priority

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Build sort object
    const sort = {}
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1

    // Get feedback with pagination
    const [feedback, totalCount] = await Promise.all([
      feedbackCollection.find(filter).sort(sort).skip(skip).limit(parseInt(limit)).toArray(),
      feedbackCollection.countDocuments(filter),
    ])

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / parseInt(limit))
    const currentPage = parseInt(page)

    res.json({
      success: true,
      data: feedback,
      pagination: {
        currentPage,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: parseInt(limit),
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
      },
    })
  } catch (error) {
    secureLogger.error(
      'Error getting all feedback',
      {
        category: 'feedback',
        type: 'get_all_feedback_error',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      req.correlationId
    )
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback submissions',
    })
  }
}

// Get all data issues with pagination and filtering
const getAllDataIssues = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      issueType,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query

    const issuesCollection = await getCollection('data_issues')

    // Build filter object
    const filter = {}
    if (status) filter.status = status
    if (issueType) filter.issueType = issueType

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Build sort object
    const sort = {}
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1

    // Get data issues with pagination
    const [issues, totalCount] = await Promise.all([
      issuesCollection.find(filter).sort(sort).skip(skip).limit(parseInt(limit)).toArray(),
      issuesCollection.countDocuments(filter),
    ])

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / parseInt(limit))
    const currentPage = parseInt(page)

    res.json({
      success: true,
      data: issues,
      pagination: {
        currentPage,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: parseInt(limit),
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
      },
    })
  } catch (error) {
    secureLogger.error(
      'Error getting all data issues',
      {
        category: 'feedback',
        type: 'get_all_issues_error',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      req.correlationId
    )
    res.status(500).json({
      success: false,
      message: 'Failed to fetch data issues',
    })
  }
}

// Update feedback status
const updateFeedbackStatus = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      })
    }

    const { id } = req.params
    const { status } = req.body

    const feedbackCollection = await getCollection('feedback')

    const result = await feedbackCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      }
    )

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      })
    }

    res.json({
      success: true,
      message: 'Feedback status updated successfully',
      data: { id, status },
    })
  } catch (error) {
    secureLogger.error(
      'Error updating feedback status',
      {
        category: 'feedback',
        type: 'update_feedback_error',
        error: error.message,
        feedbackId: req.params.id,
        timestamp: new Date().toISOString(),
      },
      req.correlationId
    )
    res.status(500).json({
      success: false,
      message: 'Failed to update feedback status',
    })
  }
}

// Update data issue status
const updateDataIssueStatus = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      })
    }

    const { id } = req.params
    const { status } = req.body

    const issuesCollection = await getCollection('data_issues')

    const result = await issuesCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      }
    )

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data issue not found',
      })
    }

    res.json({
      success: true,
      message: 'Data issue status updated successfully',
      data: { id, status },
    })
  } catch (error) {
    secureLogger.error(
      'Error updating data issue status',
      {
        category: 'feedback',
        type: 'update_issue_error',
        error: error.message,
        issueId: req.params.id,
        timestamp: new Date().toISOString(),
      },
      req.correlationId
    )
    res.status(500).json({
      success: false,
      message: 'Failed to update data issue status',
    })
  }
}

// Delete feedback (admin only)
const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params

    const feedbackCollection = await getCollection('feedback')

    const result = await feedbackCollection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      })
    }

    res.json({
      success: true,
      message: 'Feedback deleted successfully',
      data: { id },
    })
  } catch (error) {
    secureLogger.error(
      'Error deleting feedback',
      {
        category: 'feedback',
        type: 'delete_feedback_error',
        error: error.message,
        feedbackId: req.params.id,
        timestamp: new Date().toISOString(),
      },
      req.correlationId
    )
    res.status(500).json({
      success: false,
      message: 'Failed to delete feedback',
    })
  }
}

// Delete data issue (admin only)
const deleteDataIssue = async (req, res) => {
  try {
    const { id } = req.params

    const issuesCollection = await getCollection('data_issues')

    const result = await issuesCollection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data issue not found',
      })
    }

    res.json({
      success: true,
      message: 'Data issue deleted successfully',
      data: { id },
    })
  } catch (error) {
    secureLogger.error(
      'Error deleting data issue',
      {
        category: 'feedback',
        type: 'delete_issue_error',
        error: error.message,
        issueId: req.params.id,
        timestamp: new Date().toISOString(),
      },
      req.correlationId
    )
    res.status(500).json({
      success: false,
      message: 'Failed to delete data issue',
    })
  }
}

module.exports = {
  submitFeedback,
  reportDataIssue,
  getFeedbackStats,
  getAllFeedback,
  getAllDataIssues,
  updateFeedbackStatus,
  updateDataIssueStatus,
  deleteFeedback,
  deleteDataIssue,
}
