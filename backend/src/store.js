/**
 * In-memory document store
 * Replace with Redis/PostgreSQL for production
 */

// Documents: { id -> { metadata, expiresAt } }
export const documents = new Map();

// PDF binary data: { id -> Buffer }
export const pdfData = new Map();

// Analytics events: { documentId -> [events] }
export const analyticsEvents = new Map();

// Aggregated page stats: { documentId -> { pageNumber -> stats } }
export const pageStats = new Map();

/**
 * Generate a short, URL-safe ID
 */
export async function generateId(length = 10, customSlug = null) {
  if (customSlug) {
    // Check if slug is already taken
    if (documents.has(customSlug)) {
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
export function getDocument(id) {
  const doc = documents.get(id);
  if (!doc) return null;
  
  // Check if expired
  if (new Date() > new Date(doc.expiresAt)) {
    deleteDocument(id);
    return null;
  }
  
  return doc;
}

/**
 * Create a new document record
 */
export function createDocument(id, metadata) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  const doc = {
    id,
    ...metadata,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
  
  documents.set(id, doc);
  analyticsEvents.set(id, []);
  pageStats.set(id, new Map());
  
  return doc;
}

/**
 * Delete document and all associated data
 */
export function deleteDocument(id) {
  documents.delete(id);
  pdfData.delete(id);
  analyticsEvents.delete(id);
  pageStats.delete(id);
}

/**
 * Get all expired document IDs
 */
export function getExpiredDocumentIds() {
  const now = new Date();
  const expired = [];
  
  for (const [id, doc] of documents) {
    if (new Date(doc.expiresAt) < now) {
      expired.push(id);
    }
  }
  
  return expired;
}
