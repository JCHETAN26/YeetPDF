/**
 * User store - in-memory for demo
 * Replace with PostgreSQL/MongoDB for production
 */

// Users: { googleId -> { user data } }
export const users = new Map();

// User documents: { googleId -> Set<documentId> }
export const userDocuments = new Map();

/**
 * Find or create user from Google profile
 */
export function findOrCreateUser(googleProfile) {
  const { sub: googleId, email, name, picture } = googleProfile;
  
  let user = users.get(googleId);
  
  if (!user) {
    user = {
      id: googleId,
      googleId,
      email,
      name,
      picture,
      createdAt: new Date().toISOString(),
    };
    users.set(googleId, user);
    userDocuments.set(googleId, new Set());
  } else {
    // Update profile info
    user.email = email;
    user.name = name;
    user.picture = picture;
  }
  
  return user;
}

/**
 * Get user by Google ID
 */
export function getUserById(googleId) {
  return users.get(googleId) || null;
}

/**
 * Link a document to a user
 */
export function linkDocumentToUser(googleId, documentId) {
  if (!userDocuments.has(googleId)) {
    userDocuments.set(googleId, new Set());
  }
  userDocuments.get(googleId).add(documentId);
}

/**
 * Get all document IDs for a user
 */
export function getUserDocumentIds(googleId) {
  return Array.from(userDocuments.get(googleId) || []);
}

/**
 * Check if user owns a document
 */
export function userOwnsDocument(googleId, documentId) {
  const docs = userDocuments.get(googleId);
  return docs ? docs.has(documentId) : false;
}

/**
 * Remove document from user (on expiry)
 */
export function unlinkDocumentFromUser(googleId, documentId) {
  const docs = userDocuments.get(googleId);
  if (docs) {
    docs.delete(documentId);
  }
}
