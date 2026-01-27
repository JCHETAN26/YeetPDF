/**
 * User store - PostgreSQL via Prisma
 * Replaces in-memory Maps with database persistence
 */

import prisma from '../db.js';

/**
 * Find or create user from Google profile
 */
export async function findOrCreateUser(googleProfile) {
  const { sub: googleId, email, name, picture } = googleProfile;

  // Try to find existing user
  let user = await prisma.user.findUnique({
    where: { googleId }
  });

  if (!user) {
    // Create new user
    user = await prisma.user.create({
      data: {
        id: googleId,
        googleId,
        email,
        name,
        picture: picture || null,
      }
    });
  } else {
    // Update profile info
    user = await prisma.user.update({
      where: { googleId },
      data: {
        email,
        name,
        picture: picture || null,
      }
    });
  }

  return user;
}

/**
 * Get user by Google ID
 */
export async function getUserById(googleId) {
  return await prisma.user.findUnique({
    where: { id: googleId }
  });
}

/**
 * Link a document to a user (handled via document.ownerId now)
 */
export async function linkDocumentToUser(googleId, documentId) {
  await prisma.document.update({
    where: { id: documentId },
    data: { ownerId: googleId }
  });
}

/**
 * Get all document IDs for a user
 */
export async function getUserDocumentIds(googleId) {
  const documents = await prisma.document.findMany({
    where: { ownerId: googleId },
    select: { id: true },
    orderBy: { createdAt: 'desc' }
  });

  return documents.map(doc => doc.id);
}

/**
 * Check if user owns a document
 */
export async function userOwnsDocument(googleId, documentId) {
  const doc = await prisma.document.findFirst({
    where: {
      id: documentId,
      ownerId: googleId
    }
  });

  return !!doc;
}

/**
 * Remove document from user (handled by cascade delete)
 */
export async function unlinkDocumentFromUser(googleId, documentId) {
  // No-op - cascade delete handles this
  // Kept for backward compatibility
}
