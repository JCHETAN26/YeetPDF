import { Router } from 'express';
import multer from 'multer';
import { generateId, createDocument, pdfData, documents } from '../store.js';
import { 
  isS3Configured, 
  getPresignedUploadUrl, 
  uploadPDFToS3, 
  getS3Key 
} from '../services/s3.js';
import { optionalAuthMiddleware } from './auth.js';
import { linkDocumentToUser } from '../services/users.js';

const router = Router();

// Configure multer for memory storage (max 50MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

/**
 * POST /api/upload/request
 * Request a secure presigned upload URL for direct S3 upload
 * Client uploads directly to S3, bypassing our server for better performance
 */
router.post('/request', async (req, res) => {
  try {
    const { fileName, contentType = 'application/pdf' } = req.body;
    
    if (!fileName) {
      return res.status(400).json({ error: 'fileName is required' });
    }
    
    const id = await generateId();
    
    // If S3 is configured, return presigned URL for direct upload
    if (isS3Configured()) {
      const { uploadUrl, key } = await getPresignedUploadUrl(id, fileName, contentType);
      
      // Create document record (will be finalized after upload confirmation)
      createDocument(id, {
        fileName,
        fileSize: 0, // Will be updated after upload
        mimeType: contentType,
        pageCount: 0,
        s3Key: key,
        uploadPending: true,
      });
      
      return res.json({
        success: true,
        documentId: id,
        uploadUrl,
        uploadMethod: 'presigned',
        s3Key: key,
        expiresIn: 3600,
        maxSize: 50 * 1024 * 1024
      });
    }
    
    // Fallback: return our upload endpoint
    res.json({
      success: true,
      documentId: id,
      uploadUrl: `/api/upload/${id}`,
      uploadMethod: 'direct',
      expiresIn: 3600,
      maxSize: 50 * 1024 * 1024
    });
  } catch (err) {
    console.error('Upload request error:', err);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

/**
 * POST /api/upload/confirm/:id
 * Confirm upload completion (for presigned URL uploads)
 */
router.post('/confirm/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { fileSize, pageCount } = req.body;
    
    const doc = documents.get(id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Update document with actual file info
    doc.fileSize = fileSize || doc.fileSize;
    doc.pageCount = pageCount || Math.max(1, Math.floor((fileSize || 0) / 50000));
    doc.uploadPending = false;
    
    // Link document to user if logged in
    if (req.user) {
      doc.ownerId = req.user.userId;
      linkDocumentToUser(req.user.userId, id);
    }
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    res.json({
      success: true,
      document: {
        ...doc,
        shareUrl: `${frontendUrl}/v/${id}`,
        viewerUrl: `/v/${id}`,
        analyticsUrl: `/analytics/${id}`,
      }
    });
  } catch (err) {
    console.error('Upload confirm error:', err);
    res.status(500).json({ error: 'Failed to confirm upload' });
  }
});

/**
 * POST /api/upload/direct
 * Single-step upload (request + upload combined)
 * IMPORTANT: This must come BEFORE /:id route to avoid conflicts
 */
router.post('/direct', optionalAuthMiddleware, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { customSlug, pageCount } = req.body;
    
    console.log('[UPLOAD] Direct upload request:', {
      fileName: file?.originalname,
      fileSize: file?.size,
      customSlug,
      pageCount,
      hasAuth: !!req.user
    });
    
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    const id = await generateId(10, customSlug);
    console.log('[UPLOAD] Generated ID:', id, 'from customSlug:', customSlug);
    
    let s3Key = null;
    
    // Upload to S3 if configured
    if (isS3Configured()) {
      const result = await uploadPDFToS3(id, file.originalname, file.buffer);
      s3Key = result.key;
    } else {
      // Store in memory (demo mode)
      pdfData.set(id, file.buffer);
    }
    
    // Use provided page count or estimate from file size
    const actualPageCount = pageCount ? parseInt(pageCount, 10) : Math.max(1, Math.floor(file.size / 50000));
    
    console.log('[UPLOAD] Page count:', actualPageCount, '(provided:', pageCount, ')');
    
    // Create document record
    const doc = createDocument(id, {
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      pageCount: actualPageCount,
      s3Key,
      ownerId: req.user?.userId || null,
    });
    
    // Link document to user if logged in
    if (req.user) {
      linkDocumentToUser(req.user.userId, id);
    }
    
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    const responseDoc = {
      success: true,
      document: {
        ...doc,
        shareUrl: `${frontendUrl}/v/${id}`,
        viewerUrl: `/v/${id}`,
        analyticsUrl: `/analytics/${id}`,
        pdfUrl: `${baseUrl}/api/pdf/${id}`
      }
    };
    
    console.log('[UPLOAD] Response:', {
      id,
      shareUrl: responseDoc.document.shareUrl,
      viewerUrl: responseDoc.document.viewerUrl
    });
    
    res.json(responseDoc);
  } catch (err) {
    console.error('Direct upload error:', err);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

/**
 * POST /api/upload/:id
 * Direct upload endpoint (receives the PDF file)
 * Used when client doesn't support presigned URLs or S3 is not configured
 */
router.post('/:id', upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    let s3Key = null;
    
    // Upload to S3 if configured
    if (isS3Configured()) {
      const result = await uploadPDFToS3(id, file.originalname, file.buffer);
      s3Key = result.key;
    } else {
      // Store in memory (demo mode)
      pdfData.set(id, file.buffer);
    }
    
    // Estimate page count from file size
    const estimatedPages = Math.max(1, Math.floor(file.size / 50000));
    
    // Create document record
    const doc = createDocument(id, {
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      pageCount: estimatedPages,
      s3Key,
    });
    
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    res.json({
      success: true,
      document: {
        ...doc,
        shareUrl: `${frontendUrl}/v/${id}`,
        viewerUrl: `/v/${id}`,
        analyticsUrl: `/analytics/${id}`,
        pdfUrl: `${baseUrl}/api/pdf/${id}`
      }
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

export { router as uploadRouter };
