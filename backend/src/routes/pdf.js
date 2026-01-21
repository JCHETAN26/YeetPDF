import { Router } from 'express';
import { getDocument, pdfData } from '../store.js';
import { 
  isS3Configured, 
  getPresignedDownloadUrl, 
  getPDFStream,
  checkPDFExists 
} from '../services/s3.js';

const router = Router();

/**
 * GET /api/pdf/:id
 * Serve PDF file efficiently with proper headers
 * Uses S3 presigned URL redirect or streams from memory
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { download } = req.query; // ?download=true for attachment
    
    // Get document metadata
    const doc = getDocument(id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found or expired' });
    }
    
    // If S3 is configured and document has S3 key, redirect to presigned URL
    if (isS3Configured() && doc.s3Key) {
      const presignedUrl = await getPresignedDownloadUrl(
        doc.s3Key, 
        doc.fileName, 
        download !== 'true' // inline unless download=true
      );
      return res.redirect(presignedUrl);
    }
    
    // Fallback: serve from memory
    const data = pdfData.get(id);
    if (!data) {
      return res.status(404).json({ error: 'PDF data not found' });
    }
    
    // Set headers for efficient PDF serving
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', data.length);
    res.setHeader('Content-Disposition', 
      download === 'true' 
        ? `attachment; filename="${doc.fileName}"` 
        : `inline; filename="${doc.fileName}"`
    );
    
    // Cache headers
    res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
    res.setHeader('ETag', `"${id}-${doc.fileSize}"`);
    
    // Support range requests for PDF.js
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : data.length - 1;
      const chunkSize = end - start + 1;
      
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${data.length}`);
      res.setHeader('Content-Length', chunkSize);
      res.setHeader('Accept-Ranges', 'bytes');
      
      res.send(data.subarray(start, end + 1));
    } else {
      res.setHeader('Accept-Ranges', 'bytes');
      res.send(data);
    }
  } catch (err) {
    console.error('PDF serve error:', err);
    res.status(500).json({ error: 'Failed to serve PDF' });
  }
});

/**
 * GET /api/pdf/:id/stream
 * Stream PDF directly from S3 (for server-side processing)
 */
router.get('/:id/stream', async (req, res) => {
  try {
    const { id } = req.params;
    
    const doc = getDocument(id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found or expired' });
    }
    
    if (isS3Configured() && doc.s3Key) {
      const { stream, contentLength, contentType } = await getPDFStream(doc.s3Key);
      
      res.setHeader('Content-Type', contentType || 'application/pdf');
      res.setHeader('Content-Length', contentLength);
      res.setHeader('Content-Disposition', `inline; filename="${doc.fileName}"`);
      
      stream.pipe(res);
    } else {
      // Fallback to memory
      const data = pdfData.get(id);
      if (!data) {
        return res.status(404).json({ error: 'PDF data not found' });
      }
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', data.length);
      res.send(data);
    }
  } catch (err) {
    console.error('PDF stream error:', err);
    res.status(500).json({ error: 'Failed to stream PDF' });
  }
});

/**
 * GET /api/pdf/:id/info
 * Get document metadata without downloading the file
 */
router.get('/:id/info', (req, res) => {
  try {
    const { id } = req.params;
    
    const doc = getDocument(id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found or expired' });
    }
    
    res.json({
      success: true,
      document: {
        id: doc.id,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        pageCount: doc.pageCount,
        createdAt: doc.createdAt,
        expiresAt: doc.expiresAt
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get document info' });
  }
});

/**
 * HEAD /api/pdf/:id
 * Check if document exists without downloading
 */
router.head('/:id', (req, res) => {
  const { id } = req.params;
  const doc = getDocument(id);
  
  if (!doc) {
    return res.status(404).end();
  }
  
  const data = pdfData.get(id);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Length', data?.length || 0);
  res.status(200).end();
});

export { router as pdfRouter };
