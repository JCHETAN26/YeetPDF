/**
 * Test Setup & Utilities
 * Provides test helpers, mocks, and fixtures for backend tests
 */

import { beforeEach, afterEach } from 'vitest';
import { documents, pdfData, analyticsEvents, pageStats } from '../../store.js';

/**
 * Clear all in-memory stores before each test
 * Ensures tests are isolated and don't affect each other
 */
export function setupTestEnvironment() {
    beforeEach(() => {
        documents.clear();
        pdfData.clear();
        analyticsEvents.clear();
        pageStats.clear();
    });
}

/**
 * Create a mock PDF buffer for testing
 */
export function createMockPDF(sizeInKB = 100) {
    const buffer = Buffer.alloc(sizeInKB * 1024);
    buffer.write('%PDF-1.4'); // PDF signature
    return buffer;
}

/**
 * Create a test document fixture
 */
export function createTestDocument(overrides = {}) {
    return {
        id: 'test-doc-123',
        fileName: 'test.pdf',
        fileSize: 102400,
        mimeType: 'application/pdf',
        pageCount: 5,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        s3Key: null,
        ...overrides,
    };
}

/**
 * Create test analytics event
 */
export function createTestEvent(overrides = {}) {
    return {
        documentId: 'test-doc-123',
        sessionId: 'test-session-456',
        type: 'page_view',
        pageNumber: 1,
        data: {},
        timestamp: new Date().toISOString(),
        ...overrides,
    };
}

/**
 * Wait for a promise with timeout
 */
export function waitFor(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock S3 configuration
 */
export function mockS3Configured(configured = false) {
    const originalEnv = process.env.AWS_S3_BUCKET;

    if (configured) {
        process.env.AWS_S3_BUCKET = 'test-bucket';
    } else {
        delete process.env.AWS_S3_BUCKET;
    }

    return () => {
        if (originalEnv) {
            process.env.AWS_S3_BUCKET = originalEnv;
        } else {
            delete process.env.AWS_S3_BUCKET;
        }
    };
}
