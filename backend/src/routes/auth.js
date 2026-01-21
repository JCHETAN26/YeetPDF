import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { findOrCreateUser, getUserById, getUserDocumentIds, userOwnsDocument } from '../services/users.js';
import { getDocument } from '../store.js';

const router = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET || 'pdfshare-secret-change-in-production';

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * POST /api/auth/google
 * Exchange Google credential for app session
 */
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ error: 'Missing Google credential' });
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    
    // Find or create user
    const user = findOrCreateUser(payload);
    
    // Create session JWT
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      }
    });
  } catch (error) {
    console.error('[AUTH] Google verification failed:', error.message);
    res.status(401).json({ error: 'Invalid Google credential' });
  }
});

/**
 * GET /api/auth/me
 * Get current user from JWT
 */
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

/**
 * GET /api/auth/documents
 * Get all documents for current user
 */
router.get('/documents', authMiddleware, (req, res) => {
  const documentIds = getUserDocumentIds(req.user.userId);
  
  // Get document details
  const documents = documentIds
    .map(id => getDocument(id))
    .filter(Boolean) // Remove expired/deleted
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.json({ documents });
});

/**
 * Middleware to verify JWT and attach user to request
 */
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Optional auth middleware - doesn't fail if no token
 */
export function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch {
      // Token invalid, continue without user
    }
  }
  next();
}

/**
 * Check if user owns document (for analytics access)
 */
export function requireDocumentOwnership(req, res, next) {
  const { id } = req.params;
  
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (!userOwnsDocument(req.user.userId, id)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  next();
}

export const authRouter = router;
