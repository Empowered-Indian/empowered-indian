# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY *.js ./

# Create logs directory
RUN mkdir -p logs

# Set memory limit for Node.js (important for Render free tier)
ENV NODE_OPTIONS="--max-old-space-size=512"

# Run the application
CMD ["npm", "start"]