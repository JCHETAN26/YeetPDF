import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { uploadRouter } from './routes/upload.js';
import { pdfRouter } from './routes/pdf.js';
import { analyticsRouter } from './routes/analytics.js';
import { authRouter } from './routes/auth.js';
import { cleanupExpiredDocuments } from './services/expiry.js';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - allow multiple origins for development
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, origin);
    }
    callback(null, allowedOrigins[0]); // Default to first origin
  },
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);        // Authentication
app.use('/api/upload', uploadRouter);    // 1. Issue secure upload URLs
app.use('/api/pdf', pdfRouter);          // 2. Serve PDFs efficiently  
app.use('/api/analytics', analyticsRouter); // 3 & 4. Collect events + Aggregate heatmaps

// 5. Auto-expire documents - runs every hour
cron.schedule('0 * * * *', async () => {
  console.log('[CRON] Running document expiry cleanup...');
  const deleted = await cleanupExpiredDocuments();
  console.log(`[CRON] Cleaned up ${deleted} expired documents`);
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`✓ Backend running on http://localhost:${PORT}`);
  console.log(`✓ Expiry cleanup scheduled (hourly)`);
});
