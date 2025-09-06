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
Set these in the Render dashboard:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://roshanasingh4:Roshan0000@cluster0.fxdmr79.mongodb.net/empowered_indian_db?retryWrites=true&w=majority&appName=Cluster0
R2_ACCESS_KEY_ID=9abbca7d947a81d9889949c6b0c92620
R2_SECRET_ACCESS_KEY=4ee338ab4e7bfefd659aec0d400acf09e42d5cc36f5f12003058884152fd2be7
R2_ENDPOINT=https://6ed0194790c6b519bf533c6854ab1793.r2.cloudflarestorage.com
R2_REGION=auto
R2_BUCKET_NAME=mplads-images
R2_PUBLIC_DOMAIN=images.empoweredindian.in
MPLADS_BASE_URL=https://mplads.sbi
MPLADS_SESSION_COOKIE=JSESSIONID=Uu-H8GiexY7PviXGya2Nhpib0ewSkC9_CnkmVDwn.digigov_app3_prod; ROUTEID=.3; TS0110b622=0137799b196e22b94bd5070bd2ab7ef3e699eb0586e2474bb66ba15cbda3295f55baaf12a43969c9ff447db71a16055d6ac5df520a135e50f2c64ef3bd5077583a6a99c80065188880866e1596d41d944a5dffa0772d0ab4293113612a89e088c9653e303361c44ce9eeedba408702245eb0a42baf6af763b56669817176c6325c12ac4771; f5avr1674964923aaaaaaaaaaaaaaaa_cspm_=FPCBCGFHKPGFDJGJGIPGODPIILHEGPMJPEMCOJFKFCJNIFBLPLKCOPGFIECKDNFPAEDCKDOOMGDFKGCHHEMAHGKMAILBNFLEAFDHEJLAKCNDHOAANDHMPMONBJIFGNJO; TS813228c3027=08b90ded0cab2000dfaebb61dad56fa69e66b56086c8fd32da527a3d463d65684cc2471817bed1e8084f42fee911300062ee4cc25b933e034a2a79db20fed75e6b9360909fc82f1abdd3572cbc002521807f82cc894d5ad7e7f175bd1033682b

# Performance Settings (24-hour completion)
BATCH_SIZE=20
RATE_LIMIT_DELAY=5000
MAX_CONCURRENT_WORKERS=2
ENABLE_THUMBNAILS=false
PROGRESS_SUMMARY_INTERVAL=100
```

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