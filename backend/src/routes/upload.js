import { Router } from 'express';
import multer from 'multer';
import { PDFDocument } from 'pdf-lib';
import { generateId, createDocument, updateDocument, getDocument, pdfData } from '../store.js';
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

// Multer for merge - handles multiple files
const mergeUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 10  // Max 10 files
  },
  fileFilter: (req, file, cb) => {
    console.log('[MERGE] File received:', file.originalname, file.mimetype);
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error(`Only PDF files are allowed. Got: ${file.mimetype}`));
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
      await createDocument(id, {
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

    const doc = await getDocument(id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Update document with actual file info
    await updateDocument(id, {
      fileSize: fileSize || doc.fileSize,
      pageCount: pageCount || Math.max(1, Math.floor((fileSize || 0) / 50000)),
      uploadPending: false,
      ownerId: req.user?.userId || doc.ownerId
    });

    // Link document to user if logged in
    if (req.user) {
      await linkDocumentToUser(req.user.userId, id);
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
    const doc = await createDocument(id, {
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      pageCount: actualPageCount,
      s3Key,
      ownerId: req.user?.userId || null,
    });

    console.log('[UPLOAD] Document created:', { id, ownerId: doc.ownerId, hasUser: !!req.user });

    // Link document to user if logged in (this is actually redundant now since we set ownerId above)
    if (req.user) {
      await linkDocumentToUser(req.user.userId, id);
      console.log('[UPLOAD] Linked document to user:', req.user.userId);
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
    const doc = await createDocument(id, {
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

/**
 * POST /api/upload/merge
 * Merge multiple PDFs into one document
 * FIXED VERSION with proper error handling
 */
router.post('/merge', optionalAuthMiddleware, async (req, res) => {
  console.log('[MERGE] Request received');
  console.log('[MERGE] Content-Type:', req.headers['content-type']);

  try {
    // Use promisified multer upload
    await new Promise((resolve, reject) => {
      mergeUpload.array('files', 10)(req, res, (err) => {
        if (err) {
          console.error('[MERGE] Multer error:', err.message);
          console.error('[MERGE] Error code:', err.code);
          console.error('[MERGE] Error field:', err.field);

          // If "Unexpected field" error, provide helpful message
          if (err.message.includes('Unexpected field')) {
            reject(new Error(`Field name mismatch. Expected "files" but got "${err.field}". Check FormData field names.`));
          } else {
            reject(err);
          }
        } else {
          resolve();
        }
      });
    });

    const files = req.files;
    const { customSlug, combinedName } = req.body;

    console.log('[MERGE] Received:', {
      fileCount: files?.length,
      customSlug,
      combinedName,
      hasAuth: !!req.user,
      files: files?.map(f => ({ name: f.originalname, size: f.size }))
    });

    if (!files || files.length < 2) {
      return res.status(400).json({ error: 'At least 2 PDF files are required' });
    }

    // Create merged PDF
    console.log('[MERGE] Creating merged PDF...');
    const mergedPdf = await PDFDocument.create();
    let totalPageCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        console.log(`[MERGE] Processing file ${i + 1}/${files.length}: ${file.originalname}`);

        // Load the PDF with error handling
        const pdf = await PDFDocument.load(file.buffer, { ignoreEncryption: true });
        const pageCount = pdf.getPageCount();

        console.log(`[MERGE] File ${file.originalname} has ${pageCount} pages`);

        // Copy all pages
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
        totalPageCount += pageCount;

        console.log(`[MERGE] Successfully added ${pageCount} pages from ${file.originalname}`);
      } catch (err) {
        console.error(`[MERGE] Failed to process file ${file.originalname}:`, err.message);
        console.error('[MERGE] Error stack:', err.stack);
        return res.status(400).json({
          error: `Failed to process ${file.originalname}: ${err.message}`
        });
      }
    }

    console.log(`[MERGE] Merging complete. Total pages: ${totalPageCount}`);

    // Save the merged PDF
    console.log('[MERGE] Saving merged PDF...');
    const mergedPdfBytes = await mergedPdf.save();
    const mergedBuffer = Buffer.from(mergedPdfBytes);

    console.log(`[MERGE] Merged PDF size: ${mergedBuffer.length} bytes`);

    const id = await generateId(10, customSlug);
    const fileName = combinedName || `merged-${files.length}-documents.pdf`;

    console.log('[MERGE] Generated ID:', id, 'Pages:', totalPageCount);

    let s3Key = null;

    // Upload to S3 if configured
    if (isS3Configured()) {
      console.log('[MERGE] Uploading to S3...');
      const result = await uploadPDFToS3(id, fileName, mergedBuffer);
      s3Key = result.key;
      console.log('[MERGE] Uploaded to S3:', s3Key);
    } else {
      // Store in memory (demo mode)
      console.log('[MERGE] Storing in memory...');
      pdfData.set(id, mergedBuffer);
    }

    // Create document record
    console.log('[MERGE] Creating document record...');
    const doc = await createDocument(id, {
      fileName,
      fileSize: mergedBuffer.length,
      mimeType: 'application/pdf',
      pageCount: totalPageCount,
      s3Key,
      ownerId: req.user?.userId || null
    });

    // Link document to user if logged in
    if (req.user) {
      await linkDocumentToUser(req.user.userId, id);
      console.log('[MERGE] Linked document to user:', req.user.userId);
    }

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const response = {
      success: true,
      document: {
        ...doc,
        shareUrl: `${frontendUrl}/v/${id}`,
        viewerUrl: `/v/${id}`,
        analyticsUrl: `/analytics/${id}`,
        pdfUrl: `${baseUrl}/api/pdf/${id}`
      }
    };

    console.log('[MERGE] Success! Document ID:', id);
    res.json(response);

  } catch (err) {
    console.error('[MERGE] Unexpected error:', err.message);
    console.error('[MERGE] Stack:', err.stack);
    res.status(500).json({
      error: err.message || 'Merge failed',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

export { router as uploadRouter };
