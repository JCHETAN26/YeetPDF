import { getExpiredDocumentIds, deleteDocument, documents } from '../store.js';
import { isS3Configured, deleteDocumentFiles } from './s3.js';

/**
 * Clean up all expired documents
 * Called by cron job (hourly) and can be called manually
 * 
 * Note: S3 has its own lifecycle policy for 7-day expiration,
 * but we also clean up our metadata and any orphaned files.
 * 
 * @returns {number} Number of documents deleted
 */
export async function cleanupExpiredDocuments() {
  const expiredIds = getExpiredDocumentIds();
  
  for (const id of expiredIds) {
    try {
      // Get document to check for S3 key
      const doc = documents.get(id);
      
      // Delete from S3 if configured
      if (isS3Configured() && doc?.s3Key) {
        await deleteDocumentFiles(id);
        console.log(`[EXPIRY] Deleted S3 files for: ${id}`);
      }
      
      // Delete from local store
      deleteDocument(id);
      console.log(`[EXPIRY] Deleted document: ${id}`);
    } catch (err) {
      console.error(`[EXPIRY] Failed to delete document ${id}:`, err);
    }
  }
  
  return expiredIds.length;
}

/**
 * Check if a specific document is expired
 * 
 * @param {string} documentId 
 * @returns {boolean}
 */
export function isDocumentExpired(documentId) {
  const doc = documents.get(documentId);
  if (!doc) return true;
  return new Date() > new Date(doc.expiresAt);
}

/**
 * Get time remaining until expiry
 * 
 * @param {string} documentId 
 * @returns {{ days: number, hours: number, minutes: number } | null}
 */
export function getTimeUntilExpiry(documentId) {
  const doc = documents.get(documentId);
  if (!doc) return null;
  
  const now = new Date();
  const expiresAt = new Date(doc.expiresAt);
  const diff = expiresAt - now;
  
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };
  
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  
  return { days, hours, minutes };
}
