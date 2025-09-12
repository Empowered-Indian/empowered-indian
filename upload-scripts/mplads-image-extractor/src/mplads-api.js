import axios from 'axios';
import { config } from './config.js';

// Create axios instance with MPLADS configuration
const mpladsClient = axios.create({
  baseURL: config.mplads.baseUrl,
  headers: {
    ...config.mplads.headers,
    'Cookie': config.mplads.sessionCookie
  },
  timeout: 30000
});

// Add response interceptor for debugging
mpladsClient.interceptors.response.use(
  response => response,
  error => {
    console.error('❌ MPLADS API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message
    });
    throw error;
  }
);

// Get attachment IDs for a work by FLAG
export async function getAttachmentIds(workId, flag) {
  try {
    const response = await mpladsClient.post('/rest/PreLoginDashboardData/getAttachIdsbyFlag', {
      FLAG: flag.toString(),
      WORK_ID: workId.toString()
    });

    const data = response.data;
    
    // Handle successful response with images
    if (Array.isArray(data) && data.length > 0 && data[0].FILE_NAME !== "N/A") {
      const result = data[0];
      
      // Handle multiple images
      if (Array.isArray(result.FILE_NAME) && Array.isArray(result.ATTACH_ID)) {
        return result.FILE_NAME.map((fileName, index) => ({
          fileName,
          attachmentId: result.ATTACH_ID[index]
        }));
      }
      
      // Handle single image
      return [{
        fileName: result.FILE_NAME,
        attachmentId: result.ATTACH_ID
      }];
    }
    
    // No images found
    return [];
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }
    throw error;
  }
}

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 2000, // 2 seconds base delay
  maxDelay: 10000, // Maximum 10 seconds delay
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED', 'EAI_AGAIN']
};

// Sleep utility for delays
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Check if error is retryable
function isRetryableError(error) {
  if (!error) return false;
  
  // Network/connection errors
  if (RETRY_CONFIG.retryableErrors.includes(error.code)) return true;
  
  // HTTP status codes that might be temporary
  if (error.response?.status >= 500) return true;
  if (error.response?.status === 429) return true; // Rate limit
  
  // Timeout errors
  if (error.message?.includes('timeout')) return true;
  if (error.message?.includes('ECONNRESET')) return true;
  
  return false;
}

// Calculate exponential backoff delay
function calculateDelay(attempt, baseDelay = RETRY_CONFIG.baseDelay) {
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 0.1 * exponentialDelay; // Add 10% jitter
  return Math.min(exponentialDelay + jitter, RETRY_CONFIG.maxDelay);
}

// Download image data with retry logic
export async function downloadImageData(attachmentId) {
  let lastError;
  
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      console.log(attempt > 1 ? `   🔄 Retry ${attempt}/${RETRY_CONFIG.maxRetries} for attachment ${attachmentId}` : '');
      
      const response = await mpladsClient.post('/rest/PreLoginCitizenWorkRcmdRest/getAttachmentById', 
        attachmentId.toString(),
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      let base64Data;
      
      // Handle different response formats
      if (typeof response.data === 'string') {
        // Direct base64 string format
        base64Data = response.data;
      } else if (Array.isArray(response.data) && response.data.length > 0 && response.data[0].URL) {
        // Array format with URL field containing base64
        base64Data = response.data[0].URL;
      } else {
        throw new Error('Invalid response format - expected base64 string or array with URL field');
      }

      // Decode base64 to buffer
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      if (attempt > 1) {
        console.log(`   ✅ Retry successful on attempt ${attempt}!`);
      }
      
      return {
        buffer: imageBuffer,
        originalSize: base64Data.length,
        processedSize: imageBuffer.length
      };
      
    } catch (error) {
      lastError = error;
      
      if (!isRetryableError(error)) {
        // Non-retryable error, fail immediately
        console.error(`❌ Non-retryable error for attachment ${attachmentId}:`, error.message);
        throw error;
      }
      
      if (attempt === RETRY_CONFIG.maxRetries) {
        // Final attempt failed
        console.error(`❌ Failed to download attachment ${attachmentId} after ${RETRY_CONFIG.maxRetries} attempts:`, error.message);
        throw error;
      }
      
      // Calculate delay for next retry
      const delay = calculateDelay(attempt);
      console.log(`   ⚠️  Attempt ${attempt} failed: ${error.message} (retrying in ${Math.round(delay/1000)}s)`);
      
      // Wait before retry
      await sleep(delay);
    }
  }
  
  // Should never reach here, but just in case
  throw lastError;
}

// Get images for a work based on its collection type
export async function getWorkImages(workId, collection) {
  const results = {
    recommended: [],
    completed: [],
    total: 0
  };

  try {
    if (collection === 'works_completed') {
      // Completed works: use FLAG=3 for completed images
      const completedAttachments = await getAttachmentIds(workId, 3);
      results.completed = completedAttachments;
      results.total = completedAttachments.length;
    } else if (collection === 'works_recommended') {
      // Recommended works: use FLAG=1 for recommended images  
      const recommendedAttachments = await getAttachmentIds(workId, 1);
      results.recommended = recommendedAttachments;
      results.total = recommendedAttachments.length;
    } else {
      // Fallback: try both flags (for unknown collection types)
      const recommendedAttachments = await getAttachmentIds(workId, 1);
      const completedAttachments = await getAttachmentIds(workId, 3);
      results.recommended = recommendedAttachments;
      results.completed = completedAttachments;
      results.total = recommendedAttachments.length + completedAttachments.length;
    }
    
    return results;
  } catch (error) {
    console.error(`❌ Failed to get images for work ${workId}:`, error.message);
    return results;
  }
}

// Add delay for rate limiting
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}