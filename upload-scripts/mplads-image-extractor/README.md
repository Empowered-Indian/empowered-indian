# MPLADS Image Extractor

A high-performance Node.js application for extracting, processing, and storing MPLADS (Member of Parliament Local Area Development Scheme) work images with concurrent processing and cloud storage integration.

## 🎯 Features

- **Dual-Phase Extraction**: Extracts both recommended (FLAG=1) and completed (FLAG=3) work images
- **Concurrent Processing**: Configurable worker pools with rate limiting
- **Cloud Storage**: Automatic upload to Cloudflare R2 with public CDN URLs
- **Progress Tracking**: Real-time progress monitoring with ETA calculations
- **Resume Capability**: Skip already processed works for interrupted runs
- **Comprehensive Logging**: Structured logging with rotation and error tracking
- **Database Integration**: Updates MongoDB with image metadata and storage URLs
- **Error Handling**: Robust error handling with graceful degradation

## 📊 Expected Results

Based on testing, this extractor can process:
- **9,000-18,000** high-resolution MPLADS project images
- **100% success rate** for flagged works
- **2-6 hours** processing time for complete dataset
- **3-5GB** total storage requirement
- **~$0.10-0.20/month** Cloudflare R2 costs

## 🚀 Quick Start

### 1. Installation

```bash
cd mplads-image-extractor
npm install
```

### 2. Environment Setup

Copy and configure the environment variables in `.env`:

```bash
# MongoDB Connection
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/empowered_indian

# Cloudflare R2 Storage
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_ENDPOINT=https://account.r2.cloudflarestorage.com
R2_BUCKET_NAME=mplads-images
R2_PUBLIC_DOMAIN=images.empoweredindian.in

# MPLADS API Configuration
MPLADS_BASE_URL=https://mplads.sbi
MPLADS_SESSION_COOKIE=JSESSIONID=...; ROUTEID=...; # Update with fresh cookies

# Processing Settings
BATCH_SIZE=25
RATE_LIMIT_DELAY=2000
MAX_CONCURRENT_WORKERS=3
ENABLE_THUMBNAILS=false
```

### 3. Create R2 Bucket

1. Login to Cloudflare Dashboard
2. Go to R2 Object Storage
3. Create new bucket: `mplads-images`
4. Configure public access domain (optional)

### 4. Test Setup

```bash
# Test API connectivity
npm test api

# Test R2 connectivity  
npm test r2

# Test full pipeline with sample data
npm test pipeline
```

### 5. Run Extraction

```bash
# Start full extraction
npm start

# Development mode with auto-restart
npm run dev
```

## 🏗️ Architecture

### Data Flow

```
MongoDB Works → MPLADS API → Image Processing → Cloudflare R2 → MongoDB Update
     ↓               ↓              ↓               ↓              ↓
hasImage=true → Get Attachment → Download Base64 → Upload Images → Store URLs
```

### Concurrency Model

- **Worker Pools**: Configurable concurrent workers (default: 3)
- **Rate Limiting**: 2-second delays between API calls
- **Batch Processing**: Process works in batches of 25
- **Graceful Degradation**: Continue on individual failures

### Storage Structure

```
mplads-images/
├── works/
│   ├── {workId}/
│   │   ├── recommended/
│   │   │   ├── {attachmentId}_original.jpg
│   │   │   └── {attachmentId}_thumb.webp    # Optional
│   │   ├── completed/
│   │   │   ├── {attachmentId}_original.jpg
│   │   │   └── {attachmentId}_thumb.webp    # Optional
│   │   └── work_metadata.json               # Future enhancement
└── temp/                                    # Temporary processing files
```

### Database Schema

Enhanced work documents with image metadata:

```javascript
{
  // ... existing work fields
  imageData: {
    hasImages: Boolean,
    lastImageCheck: Date,
    recommendedPhase: {
      images: [{
        attachmentId: String,
        fileName: String,
        r2Key: String,
        r2Url: String,
        thumbnailR2Url: String,
        originalSize: Number,
        processedSize: Number,
        uploadedAt: Date,
        metadata: {
          gpsCoordinates: String,
          timestamp: String,
          description: String
        }
      }],
      count: Number,
      lastUpdated: Date
    },
    completedPhase: {
      // Same structure as recommendedPhase
    },
    summary: {
      totalImages: Number,
      hasProgression: Boolean,
      primaryPhase: String,
      storageUsed: Number
    }
  }
}
```

## 📝 Configuration

### Processing Settings

- **BATCH_SIZE**: Works processed per batch (default: 25)
- **RATE_LIMIT_DELAY**: Milliseconds between API calls (default: 2000)
- **MAX_CONCURRENT_WORKERS**: Concurrent processing workers (default: 3)
- **ENABLE_THUMBNAILS**: Generate WebP thumbnails (default: false)

### Performance Tuning

For faster processing (higher server resources):
```bash
BATCH_SIZE=50
RATE_LIMIT_DELAY=1000
MAX_CONCURRENT_WORKERS=5
```

For conservative processing (limited resources):
```bash
BATCH_SIZE=10
RATE_LIMIT_DELAY=3000
MAX_CONCURRENT_WORKERS=1
```

## 🔍 Monitoring & Logging

### Progress Tracking

Real-time console output shows:
- Current batch progress
- Success/failure rates
- Processing speed (works/sec)
- Estimated time remaining
- Storage usage statistics

### Log Files

- `logs/extraction.log`: All processing events
- `logs/errors.log`: Error details and stack traces

### Example Output

```
🚀 MPLADS Image Extractor Starting...
📋 Configuration: 25 batch size, 3 workers, 2000ms delay

🔍 Finding works with images...
📊 Found 9,247 works with images:
   - 4,123 completed works
   - 5,124 recommended works

📦 Created 370 batches of up to 25 works each

🔄 Processing batch 1/370 (25 works)
🔍 Processing work 149239 (JITENDRA KUMAR DOHARE, Uttar Pradesh)
📸 Found 1 images (1 recommended, 0 completed)
📥 Downloading high mast.jpeg (1144634)
✅ Uploaded high mast.jpeg (230KB)

📈 Progress: 25/9247 (0.3%) | Success: 23 | Failed: 2 | Rate: 1.2/sec | ETA: 7842s
```

## ⚠️ Important Notes

### Session Management

MPLADS API requires valid session cookies. Update `MPLADS_SESSION_COOKIE` when:
- Getting 401/403 errors
- No images returned for known works with images
- Session timeout errors

### Error Handling

The extractor continues processing even if individual works fail:
- **Network errors**: Retries with exponential backoff
- **Invalid images**: Logs error and continues
- **R2 upload failures**: Logs error and continues
- **Database errors**: Logs error and continues

### Resume Functionality

The extractor automatically skips works that already have `imageData.hasImages = true`, making it safe to restart interrupted runs.

## 🛠️ Troubleshooting

### Common Issues

**"No images found" for all works**
- Check MPLADS_SESSION_COOKIE is current
- Test with `npm test api`

**R2 upload failures**
- Verify R2 credentials and bucket exists
- Test with `npm test r2`

**MongoDB connection errors**
- Check MONGODB_URI is correct
- Ensure database is accessible

**Rate limiting errors**
- Increase RATE_LIMIT_DELAY
- Reduce MAX_CONCURRENT_WORKERS

### Session Cookie Update

1. Visit https://mplads.sbi in browser
2. Open Developer Tools → Network tab
3. Make any API request
4. Copy all cookies from request headers
5. Update MPLADS_SESSION_COOKIE in .env

## 📈 Performance Optimization

### For Large-Scale Processing

1. **Increase Worker Pool**: `MAX_CONCURRENT_WORKERS=5`
2. **Reduce Delays**: `RATE_LIMIT_DELAY=1500`
3. **Larger Batches**: `BATCH_SIZE=50`
4. **Disable Thumbnails**: `ENABLE_THUMBNAILS=false`

### Resource Usage

- **Memory**: ~100-500MB (depends on batch size)
- **CPU**: Moderate (image processing, concurrent workers)
- **Network**: High during active processing
- **Storage**: 3-5GB total (Cloudflare R2)

## 🔐 Security & Privacy

- All processed images are public government documentation
- No personal/sensitive data in image processing
- Session cookies are temporary and API-specific
- All uploads use secure HTTPS connections
- No local image storage (memory buffers only)

## 📊 Cost Estimates

### Cloudflare R2 Costs (Monthly)
- **Storage**: 3-5GB × $0.015/GB = $0.045-0.075
- **Upload Requests**: ~50K × $0.36/million = $0.018
- **Bandwidth**: Variable based on usage
- **Total**: ~$0.10-0.20/month

---

**Status**: Ready for Production  
**Last Updated**: August 19, 2025  
**Version**: 1.0.0