/**
 * Upload Endpoints Tests
 * Tests for PDF upload flow (direct, presigned, confirmation)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { uploadRouter } from '../routes/upload.js';
import { setupTestEnvironment, createMockPDF, mockS3Configured } from './helpers/setup.js';

// Create a minimal test app
function createTestApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/upload', uploadRouter);
    return app;
}

describe('Upload API', () => {
    setupTestEnvironment();

    describe('POST /api/upload/request', () => {
        it('should return upload URL for direct upload when S3 not configured', async () => {
            const cleanup = mockS3Configured(false);
            const app = createTestApp();

            const response = await request(app)
                .post('/api/upload/request')
                .send({ fileName: 'test.pdf', contentType: 'application/pdf' })
                .expect(200);

            expect(response.body).toMatchObject({
                success: true,
                documentId: expect.any(String),
                uploadMethod: 'direct',
                uploadUrl: expect.stringContaining('/api/upload/'),
            });

            cleanup();
        });

        it('should reject request without fileName', async () => {
            const app = createTestApp();

            await request(app)
                .post('/api/upload/request')
                .send({})
                .expect(400);
        });
    });

    describe('POST /api/upload/direct', () => {
        it('should successfully upload a PDF file', async () => {
            const cleanup = mockS3Configured(false);
            const app = createTestApp();
            const pdfBuffer = createMockPDF(50); // 50KB

            const response = await request(app)
                .post('/api/upload/direct')
                .attach('file', pdfBuffer, 'test.pdf')
                .field('pageCount', '5')
                .expect(200);

            expect(response.body).toMatchObject({
                success: true,
                document: {
                    id: expect.any(String),
                    fileName: 'test.pdf',
                    fileSize: expect.any(Number),
                    pageCount: 5,
                    shareUrl: expect.stringContaining('/v/'),
                    analyticsUrl: expect.stringContaining('/analytics/'),
                },
            });

            cleanup();
        });

        it('should reject non-PDF files', async () => {
            const app = createTestApp();
            const txtBuffer = Buffer.from('This is not a PDF');

            await request(app)
                .post('/api/upload/direct')
                .attach('file', txtBuffer, 'test.txt')
                .expect(500); // Multer will reject before route handler
        });

        it('should handle custom slug', async () => {
            const cleanup = mockS3Configured(false);
            const app = createTestApp();
            const pdfBuffer = createMockPDF(10);

            const response = await request(app)
                .post('/api/upload/direct')
                .attach('file', pdfBuffer, 'my-doc.pdf')
                .field('customSlug', 'my-custom-link')
                .expect(200);

            expect(response.body.document.id).toContain('my-custom-link');
            expect(response.body.document.shareUrl).toContain('my-custom-link');

            cleanup();
        });

        it('should estimate page count from file size if not provided', async () => {
            const cleanup = mockS3Configured(false);
            const app = createTestApp();
            const pdfBuffer = createMockPDF(250); // 250KB ~ 5 pages

            const response = await request(app)
                .post('/api/upload/direct')
                .attach('file', pdfBuffer, 'large.pdf')
                .expect(200);

            expect(response.body.document.pageCount).toBeGreaterThan(0);

            cleanup();
        });
    });

    describe('POST /api/upload/confirm/:id', () => {
        it('should confirm upload and update document metadata', async () => {
            const cleanup = mockS3Configured(false);
            const app = createTestApp();

            // First, create a pending upload
            const requestResponse = await request(app)
                .post('/api/upload/request')
                .send({ fileName: 'test.pdf' });

            const documentId = requestResponse.body.documentId;

            // Then confirm it
            const confirmResponse = await request(app)
                .post(`/api/upload/confirm/${documentId}`)
                .send({ fileSize: 102400, pageCount: 10 })
                .expect(200);

            expect(confirmResponse.body).toMatchObject({
                success: true,
                document: {
                    id: documentId,
                    fileSize: 102400,
                    pageCount: 10,
                },
            });

            cleanup();
        });

        it('should return 404 for non-existent document', async () => {
            const app = createTestApp();

            await request(app)
                .post('/api/upload/confirm/non-existent-id')
                .send({ fileSize: 1000, pageCount: 1 })
                .expect(404);
        });
    });
});
