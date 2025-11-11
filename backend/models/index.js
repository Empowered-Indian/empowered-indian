const mongoose = require('mongoose')

// MP Schema
const mpSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    house: { type: String, required: true },
    state: { type: String, required: true },
    constituency: String,
  },
  { timestamps: true }
)

// Allocation Schema
const allocationSchema = new mongoose.Schema(
  {
    mpName: { type: String, required: true },
    house: { type: String, required: true },
    state: { type: String, required: true },
    constituency: String,
    allocatedAmount: { type: Number, default: 0 },
    // Lok Sabha term indicator (null for Rajya Sabha)
    lsTerm: { type: Number, default: null, index: true },
  },
  { timestamps: true }
)
allocationSchema.index({ mpName: 1, house: 1, lsTerm: 1 })
allocationSchema.index({ state: 1, house: 1, lsTerm: 1 })

// Expenditure Schema
const expenditureSchema = new mongoose.Schema(
  {
    mpName: { type: String, required: true },
    house: { type: String, required: true },
    state: { type: String, required: true },
    constituency: String,
    work: String,
    // Link to recommended/completed work when available
    workId: { type: Number, index: true },
    vendor: String,
    ida: String,
    expenditureDate: Date,
    paymentStatus: String,
    expenditureAmount: { type: Number, default: 0 },
    lsTerm: { type: Number, default: null, index: true },
  },
  { timestamps: true }
)
expenditureSchema.index({ mpName: 1, house: 1, lsTerm: 1 })
expenditureSchema.index({ state: 1, house: 1, lsTerm: 1 })
expenditureSchema.index({ expenditureDate: -1 })

// Works Completed Schema
const worksCompletedSchema = new mongoose.Schema(
  {
    mpName: { type: String, required: true },
    house: { type: String, required: true },
    state: { type: String, required: true },
    constituency: String,
    workCategory: String,
    workId: { type: Number, index: true },
    ida: String,
    workDescription: String,
    completedDate: Date,
    hasImage: { type: Boolean, default: false },
    averageRating: Number,
    finalAmount: { type: Number, default: 0 },
    lsTerm: { type: Number, default: null, index: true },
  },
  { timestamps: true }
)
worksCompletedSchema.index({ mpName: 1, house: 1, lsTerm: 1 })
worksCompletedSchema.index({ state: 1, house: 1, lsTerm: 1 })
worksCompletedSchema.index({ completedDate: -1 })

// Works Recommended Schema
const worksRecommendedSchema = new mongoose.Schema(
  {
    mpName: { type: String, required: true },
    house: { type: String, required: true },
    state: { type: String, required: true },
    constituency: String,
    workCategory: String,
    workId: { type: Number, index: true },
    ida: String,
    workDescription: String,
    recommendationDate: Date,
    hasImage: { type: Boolean, default: false },
    recommendedAmount: { type: Number, default: 0 },
    lsTerm: { type: Number, default: null, index: true },
  },
  { timestamps: true }
)
worksRecommendedSchema.index({ mpName: 1, house: 1, lsTerm: 1 })
worksRecommendedSchema.index({ state: 1, house: 1, lsTerm: 1 })
worksRecommendedSchema.index({ recommendationDate: -1 })

// Summary Schema
const summarySchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    mpName: String,
    house: String,
    state: String,
    constituency: String,
    allocatedAmount: Number,
    totalExpenditure: Number,
    transactionCount: Number,
    successfulPayments: Number,
    pendingPayments: Number,
    completedWorksCount: Number,
    totalCompletedAmount: Number,
    worksWithImages: Number,
    avgRating: Number,
    recommendedWorksCount: Number,
    totalRecommendedAmount: Number,
    utilizationPercentage: Number,
    completionRate: Number,
    pendingWorks: Number,
    unspentAmount: Number,
    // Additional metrics
    completedWorksValue: Number,
    totalCompletedWorksValue: Number,
    inProgressPayments: Number,
    paymentGapPercentage: Number,
    totalAllocated: Number,
    totalMPs: Number,
    avgAllocation: Number,
    totalTransactions: Number,
    totalWorksCompleted: Number,
    totalWorksRecommended: Number,
    overallUtilization: Number,
    overallCompletionRate: Number,
    mpCount: Number,
    // Optional: funds committed (including in-progress payments)
    fundsCommitted: Number,
    fundsCommittedPercentage: Number,
    totalInProgressPayments: Number,
    // Lok Sabha term indicator for term-aware summaries
    lsTerm: { type: Number, default: null, index: true },
  },
  { timestamps: true }
)
summarySchema.index({ type: 1, house: 1, lsTerm: 1 })
summarySchema.index({ mpName: 1, house: 1, lsTerm: 1 })
summarySchema.index({ state: 1, house: 1, lsTerm: 1 })

// Metadata Schema for data sync tracking
const metadataSchema = new mongoose.Schema(
  {
    source: { type: String, required: true, unique: true },
    lastUpdated: Date,
    lastUpdatedFormatted: String,
    nextUpdate: Date,
    nextUpdateFormatted: String,
    nextUpdateInfo: String,
    syncStats: {
      totalRecords: { type: Number, default: 0 },
      lokSabhaRecords: { type: Number, default: 0 },
      rajyaSabhaRecords: { type: Number, default: 0 },
      allocations: { type: Number, default: 0 },
      expenditures: { type: Number, default: 0 },
      worksCompleted: { type: Number, default: 0 },
      worksRecommended: { type: Number, default: 0 },
      mps: { type: Number, default: 0 },
      syncDurationSeconds: { type: Number, default: 0 },
      dataQuality: { type: Number, default: 100 },
    },
    updateFrequency: { type: String, default: 'daily' },
    version: String,
  },
  { timestamps: true }
)

// Create models
const MP = mongoose.model('MP', mpSchema, 'mps')
const Allocation = mongoose.model('Allocation', allocationSchema, 'allocations')
const Expenditure = mongoose.model('Expenditure', expenditureSchema, 'expenditures')
const WorksCompleted = mongoose.model('WorksCompleted', worksCompletedSchema, 'works_completed')
const WorksRecommended = mongoose.model(
  'WorksRecommended',
  worksRecommendedSchema,
  'works_recommended'
)
const Summary = mongoose.model('Summary', summarySchema, 'summaries')
const Metadata = mongoose.model('Metadata', metadataSchema, 'data_sync_metadata')

module.exports = {
  MP,
  Allocation,
  Expenditure,
  WorksCompleted,
  WorksRecommended,
  Summary,
  Metadata,
}
