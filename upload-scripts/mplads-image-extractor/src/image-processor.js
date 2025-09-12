import sharp from 'sharp';
import pLimit from 'p-limit';
import { config } from './config.js';
import { getWorkImages, downloadImageData, delay } from './mplads-api.js';
import { uploadImageToR2, uploadThumbnailToR2, imageExistsInR2 } from './r2-client.js';
import { updateWorkImages } from './database.js';

// Create concurrency limiter
const limit = pLimit(config.processing.maxConcurrentWorkers);

// Process images for a single work
export async function processWorkImages(work) {
  const { workId, collection, mpName, state } = work;
  
  try {
    console.log(`🔍 Processing work ${workId} (${mpName || 'Unknown MP'}, ${state || 'Unknown State'})`);
    
    // Get all images for this work
    const workImages = await getWorkImages(workId, collection);
    
    if (workImages.total === 0) {
      console.log(`⚠️  No images found for work ${workId}`);
      return { success: false, reason: 'No images found', workId };
    }

    console.log(`📸 Found ${workImages.total} images (${workImages.recommended.length} recommended, ${workImages.completed.length} completed)`);

    // Process recommended phase images
    const recommendedImages = await processPhaseImages(workId, 'recommended', workImages.recommended);
    
    // Process completed phase images
    const completedImages = await processPhaseImages(workId, 'completed', workImages.completed);

    // Build image data object
    const imageData = {
      hasImages: true,
      lastImageCheck: new Date(),
      recommendedPhase: {
        images: recommendedImages,
        count: recommendedImages.length,
        lastUpdated: new Date()
      },
      completedPhase: {
        images: completedImages,
        count: completedImages.length,
        lastUpdated: new Date()
      },
      summary: {
        totalImages: recommendedImages.length + completedImages.length,
        hasProgression: recommendedImages.length > 0 && completedImages.length > 0,
        primaryPhase: recommendedImages.length > completedImages.length ? 'recommended' : 'completed',
        storageUsed: [...recommendedImages, ...completedImages].reduce((sum, img) => sum + (img.processedSize || 0), 0)
      }
    };

    // Update database
    await updateWorkImages(workId, collection, imageData);
    
    const totalSizeMB = (imageData.summary.storageUsed / 1024 / 1024).toFixed(2);
    console.log(`✅ Successfully processed work ${workId} - ${imageData.summary.totalImages} images (${totalSizeMB} MB)`);
    
    return { 
      success: true, 
      workId,
      mpName,
      state,
      imagesProcessed: imageData.summary.totalImages,
      storageUsed: imageData.summary.storageUsed,
      hasProgression: imageData.summary.hasProgression
    };

  } catch (error) {
    console.error(`❌ Failed to process work ${workId}:`, error.message);
    return { success: false, workId, error: error.message };
  }
}

// Process images for a specific phase (recommended or completed)
async function processPhaseImages(workId, phase, attachments) {
  const processedImages = [];
  
  for (const attachment of attachments) {
    const { fileName, attachmentId } = attachment;
    
    try {
      // Check if image already exists in R2
      const exists = await imageExistsInR2(workId, phase, attachmentId);
      if (exists) {
        console.log(`⏭️  Image ${attachmentId} already exists, skipping`);
        continue;
      }

      // Add rate limiting delay
      console.log(`⏳ Waiting ${config.processing.rateLimitDelay/1000}s before next API call...`);
      await delay(config.processing.rateLimitDelay);
      
      // Download image data
      console.log(`📥 Downloading ${fileName} (${attachmentId})`);
      const imageData = await downloadImageData(attachmentId);
      
      // Upload original image
      const uploadResult = await uploadImageToR2(workId, phase, attachmentId, imageData.buffer, fileName);
      
      // Explicit memory cleanup for large images
      imageData.buffer = null;
      
      // Generate and upload thumbnail (if enabled)
      let thumbnailResult = null;
      if (config.processing.enableThumbnails) {
        try {
          const thumbnailBuffer = await sharp(imageData.buffer)
            .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();
            
          thumbnailResult = await uploadThumbnailToR2(workId, phase, attachmentId, thumbnailBuffer);
          
          // Cleanup thumbnail buffer
          thumbnailBuffer = null;
        } catch (thumbError) {
          console.warn(`⚠️  Failed to generate thumbnail for ${attachmentId}:`, thumbError.message);
        }
      }

      // Build image record
      const imageRecord = {
        attachmentId,
        fileName,
        r2Key: uploadResult.r2Key,
        r2Url: uploadResult.r2Url,
        thumbnailR2Url: thumbnailResult?.r2Url || null,
        originalSize: imageData.originalSize,
        processedSize: imageData.processedSize,
        uploadedAt: new Date(),
        metadata: {
          gpsCoordinates: null, // TODO: Extract from EXIF if needed
          timestamp: null,      // TODO: Extract from EXIF if needed
          description: `${phase.charAt(0).toUpperCase() + phase.slice(1)} phase image`
        }
      };

      processedImages.push(imageRecord);
      console.log(`✅ Uploaded ${fileName} (${Math.round(imageData.processedSize / 1024)}KB) to ${uploadResult.r2Key}`);

    } catch (error) {
      console.error(`❌ Failed to process image ${attachmentId}:`, error.message);
      // Continue with next image rather than failing the entire work
    }
  }
  
  return processedImages;
}

// Process multiple works concurrently
export async function processWorksBatch(works) {
  console.log(`🚀 Processing batch of ${works.length} works (${config.processing.maxConcurrentWorkers} concurrent workers)`);
  
  const results = await Promise.allSettled(
    works.map(work => limit(() => processWorkImages(work)))
  );
  
  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.length - successful;
  
  // Calculate batch statistics
  const successfulResults = results
    .filter(r => r.status === 'fulfilled' && r.value.success)
    .map(r => r.value);
  
  const totalImages = successfulResults.reduce((sum, r) => sum + (r.imagesProcessed || 0), 0);
  const totalStorage = successfulResults.reduce((sum, r) => sum + (r.storageUsed || 0), 0);
  const progressionWorks = successfulResults.filter(r => r.hasProgression).length;
  
  console.log(`📊 Batch complete: ${successful} successful, ${failed} failed | ${totalImages} images | ${(totalStorage/1024/1024).toFixed(2)} MB | ${progressionWorks} progression works`);
  
  return results.map(result => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return { success: false, error: result.reason?.message || 'Unknown error' };
    }
  });
}