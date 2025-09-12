#!/usr/bin/env node

import { connectDatabase, getWorksWithImages } from './database.js';
import { getWorkImages, downloadImageData } from './mplads-api.js';
import { uploadImageToR2 } from './r2-client.js';
import { config } from './config.js';

// Test a single work to validate the entire pipeline
async function testSingleWork() {
  console.log('🧪 Testing MPLADS Image Extraction Pipeline...');
  
  try {
    // Connect to database
    await connectDatabase();
    
    // Get a few works with images
    console.log('🔍 Finding test works...');
    const worksData = await getWorksWithImages();
    const testWorks = [...worksData.completed, ...worksData.recommended].slice(0, 3);
    
    if (testWorks.length === 0) {
      console.log('❌ No works with images found for testing');
      return;
    }

    console.log(`📋 Testing with ${testWorks.length} works:`);
    testWorks.forEach(work => {
      console.log(`   - ${work.workId}: ${work.mpName} (${work.state})`);
    });

    // Test each work
    for (const work of testWorks) {
      console.log(`\n🔬 Testing work ${work.workId}...`);
      
      try {
        // Step 1: Get image metadata
        const workImages = await getWorkImages(work.workId);
        console.log(`📸 Found ${workImages.total} images:`);
        console.log(`   - Recommended: ${workImages.recommended.length}`);
        console.log(`   - Completed: ${workImages.completed.length}`);

        if (workImages.total === 0) {
          console.log('⚠️  No images found, skipping');
          continue;
        }

        // Step 2: Test downloading first image from each phase
        const testImages = [
          ...(workImages.recommended.length > 0 ? [{ ...workImages.recommended[0], phase: 'recommended' }] : []),
          ...(workImages.completed.length > 0 ? [{ ...workImages.completed[0], phase: 'completed' }] : [])
        ];

        for (const testImage of testImages.slice(0, 2)) { // Limit to 2 images for testing
          console.log(`\n📥 Testing download: ${testImage.fileName} (${testImage.attachmentId})`);
          
          try {
            // Download image data
            const imageData = await downloadImageData(testImage.attachmentId);
            console.log(`✅ Downloaded: ${Math.round(imageData.processedSize / 1024)}KB`);

            // Test R2 upload
            console.log(`📤 Testing R2 upload...`);
            const uploadResult = await uploadImageToR2(
              work.workId, 
              testImage.phase, 
              testImage.attachmentId, 
              imageData.buffer, 
              testImage.fileName
            );
            
            console.log(`✅ Uploaded to R2: ${uploadResult.r2Url}`);
            console.log(`   Size: ${Math.round(uploadResult.size / 1024)}KB`);

          } catch (error) {
            console.error(`❌ Failed to process ${testImage.fileName}:`, error.message);
          }
        }

      } catch (error) {
        console.error(`❌ Failed to test work ${work.workId}:`, error.message);
      }
    }

    console.log('\n✅ Pipeline test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

// Test MPLADS API connectivity
async function testApiConnectivity() {
  console.log('🌐 Testing MPLADS API connectivity...');
  
  try {
    // Test with known working example from documentation
    const testWorkId = '149239'; // From the documentation
    
    console.log(`🔍 Testing with work ID: ${testWorkId}`);
    
    const workImages = await getWorkImages(testWorkId);
    console.log(`📸 API Response:`, workImages);
    
    if (workImages.total > 0) {
      console.log('✅ MPLADS API is accessible and responding correctly');
    } else {
      console.log('⚠️  MPLADS API is accessible but returned no images');
    }
    
  } catch (error) {
    console.error('❌ MPLADS API connectivity test failed:', error.message);
    
    if (error.message.includes('timeout')) {
      console.log('💡 Suggestion: Check network connectivity or increase timeout');
    } else if (error.message.includes('401') || error.message.includes('403')) {
      console.log('💡 Suggestion: Session cookies may have expired, update MPLADS_SESSION_COOKIE');
    }
  }
}

// Test R2 connectivity
async function testR2Connectivity() {
  console.log('☁️  Testing Cloudflare R2 connectivity...');
  
  try {
    // Create a small test buffer
    const testBuffer = Buffer.from('Test image data for R2 connectivity', 'utf-8');
    const testWorkId = 'test-work';
    const testAttachmentId = 'test-attachment';
    
    const uploadResult = await uploadImageToR2(
      testWorkId, 
      'test', 
      testAttachmentId, 
      testBuffer, 
      'test.txt'
    );
    
    console.log('✅ R2 upload test successful:', uploadResult.r2Url);
    
  } catch (error) {
    console.error('❌ R2 connectivity test failed:', error.message);
    
    if (error.message.includes('credentials')) {
      console.log('💡 Suggestion: Check R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY');
    } else if (error.message.includes('bucket')) {
      console.log('💡 Suggestion: Check R2_BUCKET_NAME or create the bucket');
    }
  }
}

// Run tests based on command line arguments
const testType = process.argv[2] || 'pipeline';

switch (testType) {
  case 'api':
    testApiConnectivity();
    break;
  case 'r2':
    testR2Connectivity();
    break;
  case 'pipeline':
  default:
    testSingleWork();
    break;
}

console.log(`\n🚀 Running test: ${testType}`);
console.log('💡 Available tests: pipeline, api, r2');
console.log('📝 Usage: npm test [api|r2|pipeline]\n');