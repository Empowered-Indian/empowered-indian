import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

export const config = {
  // Database
  mongoUri: process.env.MONGODB_URI,
  
  // Cloudflare R2
  r2: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    endpoint: process.env.R2_ENDPOINT,
    region: process.env.R2_REGION || 'auto',
    bucketName: process.env.R2_BUCKET_NAME,
    publicDomain: process.env.R2_PUBLIC_DOMAIN
  },
  
  // MPLADS API
  mplads: {
    baseUrl: process.env.MPLADS_BASE_URL,
    sessionCookie: process.env.MPLADS_SESSION_COOKIE,
    headers: {
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Accept-Language': 'en-US,en;q=0.9',
      'Connection': 'keep-alive',
      'Content-Type': 'application/json; charset=UTF-8',
      'Origin': 'https://mplads.sbi',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
      'X-Requested-With': 'XMLHttpRequest',
      'sec-ch-ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"'
    }
  },
  
  // Processing - Configured for gentle cloud processing
  processing: {
    batchSize: parseInt(process.env.BATCH_SIZE) || 10,          // Smaller batches for cloud
    rateLimitDelay: parseInt(process.env.RATE_LIMIT_DELAY) || 5000,  // 5 second delays for gentler processing
    maxConcurrentWorkers: parseInt(process.env.MAX_CONCURRENT_WORKERS) || 1, // Sequential processing
    enableThumbnails: process.env.ENABLE_THUMBNAILS === 'true',
    progressSummaryInterval: parseInt(process.env.PROGRESS_SUMMARY_INTERVAL) || 100  // More frequent summaries
  }
};

// Validate required environment variables
const requiredVars = [
  'MONGODB_URI',
  'R2_ACCESS_KEY_ID', 
  'R2_SECRET_ACCESS_KEY',
  'R2_ENDPOINT',
  'R2_BUCKET_NAME',
  'MPLADS_BASE_URL',
  'MPLADS_SESSION_COOKIE'
];

const missing = requiredVars.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error('❌ Missing required environment variables:', missing);
  process.exit(1);
}