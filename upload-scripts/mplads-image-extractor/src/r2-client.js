import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { config } from './config.js';

// Initialize R2 client
export const r2Client = new S3Client({
  region: config.r2.region,
  endpoint: config.r2.endpoint,
  credentials: {
    accessKeyId: config.r2.accessKeyId,
    secretAccessKey: config.r2.secretAccessKey
  },
  forcePathStyle: true // Required for R2
});

// Upload image to R2
export async function uploadImageToR2(workId, phase, attachmentId, imageBuffer, fileName) {
  const fileExtension = fileName.split('.').pop() || 'jpg';
  const r2Key = `works/${workId}/${phase}/${attachmentId}_original.${fileExtension}`;
  
  try {
    const uploadCommand = new PutObjectCommand({
      Bucket: config.r2.bucketName,
      Key: r2Key,
      Body: imageBuffer,
      ContentType: `image/${fileExtension}`,
      Metadata: {
        workId: workId.toString(),
        phase,
        attachmentId: attachmentId.toString(),
        originalFileName: fileName
      }
    });

    await r2Client.send(uploadCommand);
    
    const publicUrl = `https://${config.r2.publicDomain}/${r2Key}`;
    
    return {
      r2Key,
      r2Url: publicUrl,
      size: imageBuffer.length
    };
  } catch (error) {
    console.error(`❌ Failed to upload ${r2Key}:`, error.message);
    throw error;
  }
}

// Upload thumbnail to R2 (if enabled)
export async function uploadThumbnailToR2(workId, phase, attachmentId, thumbnailBuffer) {
  if (!config.processing.enableThumbnails) return null;
  
  const r2Key = `works/${workId}/${phase}/${attachmentId}_thumb.webp`;
  
  try {
    const uploadCommand = new PutObjectCommand({
      Bucket: config.r2.bucketName,
      Key: r2Key,
      Body: thumbnailBuffer,
      ContentType: 'image/webp',
      Metadata: {
        workId: workId.toString(),
        phase,
        attachmentId: attachmentId.toString(),
        type: 'thumbnail'
      }
    });

    await r2Client.send(uploadCommand);
    
    const publicUrl = `https://${config.r2.publicDomain}/${r2Key}`;
    
    return {
      r2Key,
      r2Url: publicUrl,
      size: thumbnailBuffer.length
    };
  } catch (error) {
    console.error(`❌ Failed to upload thumbnail ${r2Key}:`, error.message);
    return null;
  }
}

// Check if image already exists
export async function imageExistsInR2(workId, phase, attachmentId) {
  const r2Key = `works/${workId}/${phase}/${attachmentId}_original.jpg`;
  
  try {
    await r2Client.send(new HeadObjectCommand({
      Bucket: config.r2.bucketName,
      Key: r2Key
    }));
    return true;
  } catch (error) {
    if (error.name === 'NotFound') return false;
    throw error;
  }
}