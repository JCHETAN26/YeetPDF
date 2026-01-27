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

// Trust proxy for Railway/deployment platforms
app.set('trust proxy', 1);

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://yeet-pdf.vercel.app',
  'http://localhost:8080'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
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
