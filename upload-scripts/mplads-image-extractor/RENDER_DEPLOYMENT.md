# Render Deployment Guide

## Deploy MPLADS Image Extractor as Background Worker

### Prerequisites
- GitHub repository with this code
- Render account (free tier available)
- MongoDB Atlas database
- Cloudflare R2 storage
- Valid MPLADS session cookie

### Deployment Steps

#### 1. Push to GitHub
```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

#### 2. Create Render Service
1. Go to https://render.com/dashboard
2. Click "New +" → "Background Worker"
3. Connect your GitHub repository
4. Select the `upload-scripts/mplads-image-extractor` folder

#### 3. Configure Service Settings
- **Name**: `mplads-image-extractor`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: `Starter (Free)` or `Standard ($7/month)`

#### 4. Set Environment Variables
Add these in Render dashboard:

**Database:**
- `MONGODB_URI`: Your MongoDB Atlas connection string

**Cloudflare R2:**
- `R2_ACCESS_KEY_ID`: Your R2 access key
- `R2_SECRET_ACCESS_KEY`: Your R2 secret key
- `R2_ENDPOINT`: https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
- `R2_BUCKET_NAME`: mplads-images
- `R2_PUBLIC_DOMAIN`: Your R2 public domain

**MPLADS API:**
- `MPLADS_SESSION_COOKIE`: Valid session cookie from browser

**Processing (Optional - defaults provided):**
- `BATCH_SIZE`: 10 (for free tier)
- `RATE_LIMIT_DELAY`: 3000
- `MAX_CONCURRENT_WORKERS`: 1 (for free tier)
- `ENABLE_THUMBNAILS`: false (to save memory)

#### 5. Deploy
1. Click "Create Background Worker"
2. Render will automatically build and deploy
3. Monitor logs in Render dashboard

### Free Tier Limitations
- **512MB RAM**: Configured for memory efficiency
- **Limited CPU**: Reduced concurrency settings
- **No persistent storage**: Uses cloud services (MongoDB + R2)
- **Monthly usage limits**: Monitor in dashboard

### Monitoring
- **Logs**: Available in Render dashboard
- **Metrics**: Processing rate, success rate, errors
- **Alerts**: Set up notifications for failures

### Scaling Options
Upgrade to **Standard plan ($7/month)** for:
- More RAM and CPU
- Higher concurrency
- Better performance
- Longer runtime limits

### Stopping/Restarting
- **Manual control**: Use Render dashboard
- **Auto-restart**: On failures (built-in)
- **Suspend**: To pause processing

### Cost Estimate
- **Free tier**: $0/month (with usage limits)
- **Standard**: $7/month (recommended for full dataset)
- **External services**: MongoDB Atlas (free tier) + Cloudflare R2 (~$1-2/month)

### Session Management
⚠️ **Important**: MPLADS session cookies expire. You'll need to:
1. Update session cookie when it expires
2. Restart the worker with new cookie
3. Consider implementing session refresh logic

### Expected Performance
- **Free tier**: ~500-1000 works/hour
- **Standard tier**: ~1500-3000 works/hour
- **Full dataset (25,841 works)**: 8-50 hours depending on plan