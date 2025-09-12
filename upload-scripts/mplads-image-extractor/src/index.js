#!/usr/bin/env node

import { connectDatabase, getWorksWithImages } from './database.js';
import { processWorksBatch } from './image-processor.js';
import { logger, ProgressTracker } from './logger.js';
import { config } from './config.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory
async function ensureLogsDirectory() {
  const logsDir = path.join(__dirname, '../logs');
  try {
    await fs.mkdir(logsDir, { recursive: true });
  } catch (error) {
    console.error('Failed to create logs directory:', error);
  }
}

// Split array into batches
function createBatches(array, batchSize) {
  const batches = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}

// Main processing function
async function main() {
  console.log('🚀 MPLADS Image Extractor Starting...');
  console.log(`📋 Configuration: ${config.processing.batchSize} batch size, ${config.processing.maxConcurrentWorkers} workers, ${config.processing.rateLimitDelay}ms delay`);
  console.log(`⏱️  Estimated completion time: ~1-2 hours (optimized processing)`);
  
  try {
    // Setup
    await ensureLogsDirectory();
    await connectDatabase();
    
    // Get all works with images
    console.log('🔍 Finding works with images...');
    const worksData = await getWorksWithImages();
    const allWorks = [...worksData.completed, ...worksData.recommended];
    
    if (allWorks.length === 0) {
      console.log('⚠️  No works with images found');
      process.exit(0);
    }

    console.log(`📊 Found ${allWorks.length} works with images:`);
    console.log(`   - ${worksData.completed.length} completed works`);
    console.log(`   - ${worksData.recommended.length} recommended works`);
    
    // Filter out works that already have image data (optional resume functionality)
    const worksToProcess = allWorks.filter(work => !work.imageData?.hasImages);
    
    if (worksToProcess.length === 0) {
      console.log('✅ All works already processed');
      process.exit(0);
    }
    
    if (worksToProcess.length < allWorks.length) {
      console.log(`⏭️  Resuming: ${worksToProcess.length} works remaining (${allWorks.length - worksToProcess.length} already processed)`);
    }

    // Create batches
    const batches = createBatches(worksToProcess, config.processing.batchSize);
    console.log(`📦 Created ${batches.length} batches of up to ${config.processing.batchSize} works each`);
    
    // Initialize progress tracking
    const progressTracker = new ProgressTracker(worksToProcess.length);
    const stats = {
      totalImages: 0,
      totalStorage: 0,
      byState: {},
      errors: []
    };
    
    // Process batches
    logger.info('Starting batch processing', {
      totalWorks: worksToProcess.length,
      totalBatches: batches.length,
      batchSize: config.processing.batchSize
    });

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`\n🔄 Processing batch ${i + 1}/${batches.length} (${batch.length} works)`);
      
      try {
        const batchResults = await processWorksBatch(batch);
        
        // Update progress and stats
        for (const result of batchResults) {
          progressTracker.update(result);
          
          if (result.success) {
            stats.totalImages += result.imagesProcessed || 0;
            stats.totalStorage += result.storageUsed || 0;
            
            // Track by state if available
            const work = batch.find(w => w.workId === result.workId);
            if (work?.state) {
              stats.byState[work.state] = (stats.byState[work.state] || 0) + (result.imagesProcessed || 0);
            }
          } else {
            stats.errors.push({
              workId: result.workId,
              mpName: result.mpName,
              state: result.state,
              error: result.error,
              timestamp: new Date().toISOString()
            });
          }
        }
        
        // Show progress summary every N works
        const totalProcessed = (i + 1) * batch.length;
        if (totalProcessed % config.processing.progressSummaryInterval === 0) {
          const successRate = ((totalProcessed - stats.errors.length) / totalProcessed * 100).toFixed(1);
          const avgImagesPerWork = stats.totalImages / Math.max(totalProcessed - stats.errors.length, 1);
          console.log(`\n📈 PROGRESS SUMMARY: ${totalProcessed}/${worksToProcess.length} works (${(totalProcessed/worksToProcess.length*100).toFixed(1)}%)`);
          console.log(`   ✅ Success rate: ${successRate}% | 📸 Total images: ${stats.totalImages.toLocaleString()}`);
          console.log(`   💾 Storage used: ${(stats.totalStorage/1024/1024).toFixed(2)} MB | 📊 Avg: ${avgImagesPerWork.toFixed(1)} images/work`);
          const remainingWorks = worksToProcess.length - totalProcessed;
          const avgSecondsPerWork = 3; // 0.8s delay + ~2s processing time with 3 workers
          const etaMinutes = Math.round(remainingWorks * avgSecondsPerWork / 60);
          console.log(`   ⚠️  Errors: ${stats.errors.length} | ⏱️  ETA: ${etaMinutes} minutes remaining`);
        }

        // Log batch completion
        logger.info(`Batch ${i + 1} completed`, {
          batchSize: batch.length,
          successful: batchResults.filter(r => r.success).length,
          failed: batchResults.filter(r => !r.success).length
        });

        // Brief delay between batches + memory cleanup
        if (i < batches.length - 1) {
          console.log(`⏳ Brief pause before next batch...`);
          
          // Suggest garbage collection every 10 batches to keep memory clean
          if ((i + 1) % 10 === 0) {
            if (global.gc) {
              console.log(`🧹 Running garbage collection...`);
              global.gc();
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`❌ Batch ${i + 1} failed:`, error.message);
        logger.error('Batch processing error', { batchIndex: i, error: error.message });
        
        // Continue with next batch rather than stopping
      }
    }

    // Final results
    const finalStats = progressTracker.complete();
    
    console.log('\n🎯 Final Statistics:');
    console.log(`📸 Total images processed: ${stats.totalImages.toLocaleString()}`);
    console.log(`💾 Total storage used: ${(stats.totalStorage / 1024 / 1024).toFixed(2)} MB`);
    console.log(`🏛️  Images by state:`);
    
    Object.entries(stats.byState)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([state, count]) => {
        console.log(`   ${state}: ${count} images`);
      });

    if (stats.errors.length > 0) {
      console.log(`\n⚠️  ${stats.errors.length} errors occurred:`);
      stats.errors.slice(0, 5).forEach(error => {
        console.log(`   Work ${error.workId}: ${error.error}`);
      });
      if (stats.errors.length > 5) {
        console.log(`   ... and ${stats.errors.length - 5} more (check logs for details)`);
      }
    }

    // Log final stats
    logger.info('Processing completed', {
      ...finalStats,
      totalImages: stats.totalImages,
      totalStorageMB: (stats.totalStorage / 1024 / 1024),
      errorCount: stats.errors.length
    });

    console.log('✅ Image extraction completed successfully!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    logger.error('Fatal error in main process', { error: error.message, stack: error.stack });
    process.exit(1);
  } finally {
    // Close database connection
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  logger.info('Process interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  logger.info('Process terminated');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  logger.error('Unhandled promise rejection', { reason, promise });
  process.exit(1);
});

// Start the application
main();