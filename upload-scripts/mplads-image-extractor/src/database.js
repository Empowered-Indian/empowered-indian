import mongoose from 'mongoose';
import { config } from './config.js';

// Database connection
export async function connectDatabase() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Enhanced schema for image metadata
const ImageSchema = new mongoose.Schema({
  attachmentId: String,
  fileName: String,
  r2Key: String,
  r2Url: String,
  thumbnailR2Url: String,
  originalSize: Number,
  processedSize: Number,
  uploadedAt: { type: Date, default: Date.now },
  metadata: {
    gpsCoordinates: String,
    timestamp: String,
    description: String
  }
});

const ImageDataSchema = new mongoose.Schema({
  hasImages: { type: Boolean, default: false },
  lastImageCheck: Date,
  recommendedPhase: {
    images: [ImageSchema],
    count: { type: Number, default: 0 },
    lastUpdated: Date
  },
  completedPhase: {
    images: [ImageSchema], 
    count: { type: Number, default: 0 },
    lastUpdated: Date
  },
  summary: {
    totalImages: { type: Number, default: 0 },
    hasProgression: { type: Boolean, default: false },
    primaryPhase: String,
    storageUsed: { type: Number, default: 0 }
  }
});

// Updated Work schemas with image data
const BaseWorkSchema = {
  workId: String,
  mpName: String,
  house: String,
  state: String,
  constituency: String,
  workDescription: String,
  hasImage: Boolean,
  imageData: ImageDataSchema
};

// Force exact collection names (disable mongoose pluralization)
export const WorkCompleted = mongoose.model('WorkCompleted', new mongoose.Schema(BaseWorkSchema), 'works_completed');
export const WorkRecommended = mongoose.model('WorkRecommended', new mongoose.Schema(BaseWorkSchema), 'works_recommended');

// Get all works with images
export async function getWorksWithImages() {
  const [completed, recommended] = await Promise.all([
    WorkCompleted.find({ hasImage: true }).select('workId mpName state workDescription hasImage imageData'),
    WorkRecommended.find({ hasImage: true }).select('workId mpName state workDescription hasImage imageData')
  ]);
  
  return {
    completed: completed.map(work => ({ ...work.toObject(), collection: 'works_completed' })),
    recommended: recommended.map(work => ({ ...work.toObject(), collection: 'works_recommended' })),
    total: completed.length + recommended.length
  };
}

// Update work with image data
export async function updateWorkImages(workId, collection, imageData) {
  const Model = collection === 'works_completed' ? WorkCompleted : WorkRecommended;
  
  // First unset any existing imageData to avoid conflicts
  await Model.findOneAndUpdate(
    { workId },
    { $unset: { imageData: "" } }
  );
  
  // Then set the new imageData
  return await Model.findOneAndUpdate(
    { workId },
    { $set: { imageData } },
    { new: true, upsert: false }
  );
}