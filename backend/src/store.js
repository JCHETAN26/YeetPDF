/**
 * Database-backed document store using Prisma
 * Replaces in-memory Maps with PostgreSQL persistence
 */

import prisma from './db.js';

// Keep pdfData Map for binary storage (use S3 for production)
// PDFs are handled by S3, this is just a fallback
export const pdfData = new Map();

/**
 * Generate a short, URL-safe ID
 */
export async function generateId(length = 10, customSlug = null) {
  if (customSlug) {
    // Check if slug is already taken in database
    const existing = await prisma.document.findUnique({
      where: { id: customSlug }
    });

    if (existing) {
      // Append random suffix to make it unique
      const { nanoid } = await import('nanoid');
      return `${customSlug}-${nanoid(4)}`;
    }
    return customSlug;
  }

  const { nanoid } = await import('nanoid');
  return nanoid(length);
}

/**
 * Get document by ID
 */
export async function getDocument(id) {
  const doc = await prisma.document.findUnique({
    where: { id }
  });

  if (!doc) return null;

  // Check if expired
  if (new Date() > new Date(doc.expiresAt)) {
    await deleteDocument(id);
    return null;
  }

  return doc;
}

/**
 * Create a new document record
 */
export async function createDocument(id, metadata) {
  const now = new Date();
  const expiryDays = parseInt(process.env.DOCUMENT_EXPIRY_DAYS || '7', 10);
  const expiresAt = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000);

  const doc = await prisma.document.create({
    data: {
      id,
      fileName: metadata.fileName,
      fileSize: metadata.fileSize,
      mimeType: metadata.mimeType || 'application/pdf',
      pageCount: metadata.pageCount,
      s3Key: metadata.s3Key || null,
      uploadPending: metadata.uploadPending || false,
      ownerId: metadata.ownerId || null,
      expiresAt,
    }
  });

  return doc;
}

/**
 * Update existing document
 */
export async function updateDocument(id, updates) {
  return await prisma.document.update({
    where: { id },
    data: updates
  });
}

/**
 * Delete document and all associated data
 */
export async function deleteDocument(id) {
  // Cascade delete will handle analytics_events and page_stats
  await prisma.document.delete({
    where: { id }
  });

  // Clean up PDF binary if stored locally
  pdfData.delete(id);
}

/**
 * Get all expired document IDs
 */
export async function getExpiredDocumentIds() {
  const now = new Date();

  const expiredDocs = await prisma.document.findMany({
    where: {
      expiresAt: {
        lt: now
      }
    },
    select: {
      id: true
    }
  });

  return expiredDocs.map(doc => doc.id);
}

/**
 * Get all documents for a user
 */
export async function getUserDocuments(userId) {
  return await prisma.document.findMany({
    where: {
      ownerId: userId
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

// Re-export for backward compatibility (these are now handled by services/users.js)
export { prisma as documents };
export const analyticsEvents = null; // Handled by database
export const pageStats = null; // Handled by database
