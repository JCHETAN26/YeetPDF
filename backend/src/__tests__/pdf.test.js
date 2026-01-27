/**
 * PDF Serving Tests
 * Tests for PDF retrieval, streaming, and metadata endpoints
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { pdfRouter } from '../routes/pdf.js';
import { createDocument, pdfData } from '../store.js';
import { setupTestEnvironment, createMockPDF, createTestDocument } from './helpers/setup.js';

function createTestApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/pdf', pdfRouter);
    return app;
}

describe('PDF Serving API', () => {
    setupTestEnvironment();

    describe('GET /api/pdf/:id', () => {
        it('should serve PDF file with correct headers', async () => {
            const app = createTestApp();
            const pdfBuffer = createMockPDF(100);
            const doc = createTestDocument({ id: 'test-pdf-1' });

            // Store document and PDF data
            createDocument('test-pdf-1', {
                fileName: doc.fileName,
                fileSize: doc.fileSize,
                mimeType: doc.mimeType,
                pageCount: doc.pageCount,
            });
            pdfData.set('test-pdf-1', pdfBuffer);

            const response = await request(app)
                .get('/api/pdf/test-pdf-1')
                .expect(200)
                .expect('Content-Type', 'application/pdf');

            expect(response.headers['content-length']).toBe(String(pdfBuffer.length));
            expect(response.headers['accept-ranges']).toBe('bytes');
        });

        it('should support range requests for PDF.js', async () => {
            const app = createTestApp();
            const pdfBuffer = createMockPDF(100);

            createDocument('test-pdf-2', createTestDocument({ id: 'test-pdf-2' }));
            pdfData.set('test-pdf-2', pdfBuffer);

            const response = await request(app)
                .get('/api/pdf/test-pdf-2')
                .set('Range', 'bytes=0-999')
                .expect(206); // Partial Content

            expect(response.headers['content-range']).toContain('bytes 0-999');
        });

        it('should return 404 for non-existent document', async () => {
            const app = createTestApp();

            await request(app)
                .get('/api/pdf/non-existent')
                .expect(404);
        });

        it('should return 404 for expired document', async () => {
            const app = createTestApp();
            const pdfBuffer = createMockPDF(50);

            // Create expired document
            const expiredDoc = createTestDocument({
                id: 'expired-doc',
                expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired 1 second ago
            });

            createDocument('expired-doc', expiredDoc);
            pdfData.set('expired-doc', pdfBuffer);

            await request(app)
                .get('/api/pdf/expired-doc')
                .expect(404);
        });

        it('should set download headers when download=true', async () => {
            const app = createTestApp();
            const pdfBuffer = createMockPDF(50);

            createDocument('test-pdf-3', createTestDocument({ id: 'test-pdf-3', fileName: 'my-document.pdf' }));
            pdfData.set('test-pdf-3', pdfBuffer);

            const response = await request(app)
                .get('/api/pdf/test-pdf-3?download=true')
                .expect(200);

            expect(response.headers['content-disposition']).toContain('attachment');
            expect(response.headers['content-disposition']).toContain('my-document.pdf');
        });
    });

    describe('GET /api/pdf/:id/info', () => {
        it('should return document metadata without file', async () => {
            const app = createTestApp();
            const doc = createTestDocument({ id: 'test-info-1' });

            createDocument('test-info-1', doc);

            const response = await request(app)
                .get('/api/pdf/test-info-1/info')
                .expect(200);

            expect(response.body).toMatchObject({
                success: true,
                document: {
                    id: 'test-info-1',
                    fileName: doc.fileName,
                    fileSize: doc.fileSize,
                    pageCount: doc.pageCount,
                    createdAt: expect.any(String),
                    expiresAt: expect.any(String),
                },
            });
        });

        it('should return 404 for non-existent document', async () => {
            const app = createTestApp();

            await request(app)
                .get('/api/pdf/non-existent/info')
                .expect(404);
        });
    });

    describe('HEAD /api/pdf/:id', () => {
        it('should return 200 for existing document', async () => {
            const app = createTestApp();
            const pdfBuffer = createMockPDF(100);

            createDocument('test-head-1', createTestDocument({ id: 'test-head-1' }));
            pdfData.set('test-head-1', pdfBuffer);

            await request(app)
                .head('/api/pdf/test-head-1')
                .expect(200)
                .expect('Content-Type', 'application/pdf');
        });

        it('should return 404 for non-existent document', async () => {
            const app = createTestApp();

            await request(app)
                .head('/api/pdf/non-existent')
                .expect(404);
        });
    });
});
