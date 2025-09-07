# Render Deployment Guide - MPLADS Image Extractor

## Overview
Deploy the MPLADS Image Extractor as a Background Worker on Render to process all 25,959 works with images in approximately 7-8 hours.

## Deployment Steps

### 1. Connect Repository
- Go to [Render Dashboard](https://dashboard.render.com)
- Click "New" → "Background Worker"
- Connect your GitHub repository: `upload-scripts`
- **Important**: Render will deploy from the upload-scripts repository root

### 2. Service Configuration
- **Name**: `mplads-image-extractor`
- **Environment**: `Node`
- **Plan**: `Starter ($0/month)` - Free tier
- **Build Command**: `cd mplads-image-extractor && npm install`
- **Start Command**: `cd mplads-image-extractor && npm start`

### 3. Environment Variables
Set the  env variables in Render dashboard:

### 4. Deploy
- Click "Create Background Worker"
- Render will automatically build and start your service
- Monitor logs in the Render dashboard

## Expected Performance
- **Total Works**: 25,959 works with images to process
- **Processing Rate**: ~0.6 works/minute (balanced processing with 2 workers)
- **Completion Time**: ~24 hours
- **Memory Usage**: Optimized for 512MB Render free tier

## Monitoring
- View real-time logs in Render dashboard
- Progress updates every 100 processed works
- Success/failure statistics logged continuously

## File Structure
```
upload-scripts/                    (Git repository root)
├── Dockerfile                     (Updated for subdirectory)
├── render.yaml                    (Render configuration)
├── RENDER_DEPLOYMENT.md           (This file)
└── mplads-image-extractor/        (Actual application)
    ├── package.json
    ├── src/
    └── .env
```

## Notes
- The application runs from the `mplads-image-extractor/` subdirectory
- Render deployment files are in the repository root
- Background workers run continuously until the process completes
- No web interface - pure background processing
