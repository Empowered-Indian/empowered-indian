import winston from 'winston';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create logger
export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Write all logs to file
    new winston.transports.File({
      filename: join(__dirname, '../logs/extraction.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    }),
    
    // Write errors to separate file
    new winston.transports.File({
      filename: join(__dirname, '../logs/errors.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Progress tracking
export class ProgressTracker {
  constructor(total) {
    this.total = total;
    this.processed = 0;
    this.successful = 0;
    this.failed = 0;
    this.startTime = Date.now();
    this.lastUpdate = Date.now();
  }

  update(result) {
    this.processed++;
    
    if (result.success) {
      this.successful++;
    } else {
      this.failed++;
    }

    // Log progress every 10 items or every 30 seconds
    const now = Date.now();
    if (this.processed % 10 === 0 || (now - this.lastUpdate) > 30000) {
      this.logProgress();
      this.lastUpdate = now;
    }
  }

  logProgress() {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const rate = this.processed / elapsed;
    const eta = this.processed > 0 ? ((this.total - this.processed) / rate) : 0;
    
    const progress = {
      processed: this.processed,
      total: this.total,
      successful: this.successful,
      failed: this.failed,
      percentage: ((this.processed / this.total) * 100).toFixed(1),
      rate: rate.toFixed(2),
      elapsed: elapsed.toFixed(1),
      eta: eta.toFixed(1)
    };

    console.log(`📈 Progress: ${progress.processed}/${progress.total} (${progress.percentage}%) | Success: ${progress.successful} | Failed: ${progress.failed} | Rate: ${progress.rate}/sec | ETA: ${progress.eta}s`);
    
    logger.info('Processing progress', progress);
  }

  complete() {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const finalStats = {
      total: this.total,
      successful: this.successful,
      failed: this.failed,
      totalTime: elapsed.toFixed(1),
      avgRate: (this.processed / elapsed).toFixed(2)
    };

    console.log(`🎉 Processing complete!`);
    console.log(`📊 Final stats: ${finalStats.successful}/${finalStats.total} successful (${((finalStats.successful/finalStats.total)*100).toFixed(1)}%)`);
    console.log(`⏱️  Total time: ${finalStats.totalTime}s | Average rate: ${finalStats.avgRate}/sec`);
    
    logger.info('Processing complete', finalStats);
    
    return finalStats;
  }
}