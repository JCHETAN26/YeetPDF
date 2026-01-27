/**
 * Analytics Tests
 * Tests for event collection, heatmap aggregation, and analytics summary
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { analyticsRouter } from '../routes/analytics.js';
import { createDocument } from '../store.js';
import { setupTestEnvironment, createTestDocument, createTestEvent } from './helpers/setup.js';

function createTestApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/analytics', analyticsRouter);
    return app;
}

describe('Analytics API', () => {
    setupTestEnvironment();

    describe('POST /api/analytics/event', () => {
        it('should successfully track a page view event', async () => {
            const app = createTestApp();

            // Create test document
            const doc = createTestDocument({ id: 'analytics-doc-1' });
            createDocument('analytics-doc-1', doc);

            const event = {
                documentId: 'analytics-doc-1',
                sessionId: 'session-1',
                type: 'page_view',
                pageNumber: 1,
                data: {},
            };

            const response = await request(app)
                .post('/api/analytics/event')
                .send(event)
                .expect(200);

            expect(response.body).toEqual({ success: true });
        });

        it('should track page exit with time spent', async () => {
            const app = createTestApp();
            const doc = createTestDocument({ id: 'analytics-doc-2' });
            createDocument('analytics-doc-2', doc);

            const event = {
                documentId: 'analytics-doc-2',
                sessionId: 'session-2',
                type: 'page_exit',
                pageNumber: 2,
                data: { timeSpent: 45 },
            };

            await request(app)
                .post('/api/analytics/event')
                .send(event)
                .expect(200);
        });

        it('should reject event with missing fields', async () => {
            const app = createTestApp();

            await request(app)
                .post('/api/analytics/event')
                .send({ documentId: 'test' }) // Missing required fields
                .expect(400);
        });

        it('should return 404 for non-existent document', async () => {
            const app = createTestApp();

            const event = {
                documentId: 'non-existent',
                sessionId: 'session-1',
                type: 'page_view',
                pageNumber: 1,
            };

            await request(app)
                .post('/api/analytics/event')
                .send(event)
                .expect(404);
        });
    });

    describe('POST /api/analytics/batch', () => {
        it('should handle multiple events in one request', async () => {
            const app = createTestApp();
            const doc = createTestDocument({ id: 'batch-doc-1' });
            createDocument('batch-doc-1', doc);

            const events = [
                createTestEvent({ documentId: 'batch-doc-1', pageNumber: 1 }),
                createTestEvent({ documentId: 'batch-doc-1', pageNumber: 2 }),
                createTestEvent({ documentId: 'batch-doc-1', pageNumber: 3 }),
            ];

            const response = await request(app)
                .post('/api/analytics/batch')
                .send({ events })
                .expect(200);

            expect(response.body.recorded).toBe(3);
        });

        it('should skip invalid events in batch', async () => {
            const app = createTestApp();
            const doc = createTestDocument({ id: 'batch-doc-2' });
            createDocument('batch-doc-2', doc);

            const events = [
                createTestEvent({ documentId: 'batch-doc-2', pageNumber: 1 }),
                { invalid: 'event' }, // Missing required fields
                createTestEvent({ documentId: 'batch-doc-2', pageNumber: 2 }),
            ];

            const response = await request(app)
                .post('/api/analytics/batch')
                .send({ events })
                .expect(200);

            expect(response.body.recorded).toBe(2); // Only 2 valid events
        });
    });

    describe('GET /api/analytics/:documentId/heatmap', () => {
        it('should return empty heatmap for new document', async () => {
            const app = createTestApp();
            const doc = createTestDocument({ id: 'heatmap-doc-1', pageCount: 5 });
            createDocument('heatmap-doc-1', doc);

            const response = await request(app)
                .get('/api/analytics/heatmap-doc-1/heatmap')
                .expect(200);

            expect(response.body).toMatchObject({
                success: true,
                documentId: 'heatmap-doc-1',
                summary: {
                    totalViews: 0,
                    uniqueVisitors: 0,
                },
                pages: expect.arrayContaining([
                    expect.objectContaining({
                        pageNumber: 1,
                        views: 0,
                        uniqueViews: 0,
                    }),
                ]),
            });

            expect(response.body.pages).toHaveLength(5);
        });

        it('should aggregate page stats correctly', async () => {
            const app = createTestApp();
            const doc = createTestDocument({ id: 'heatmap-doc-2', pageCount: 3 });
            createDocument('heatmap-doc-2', doc);

            // Track some events
            await request(app)
                .post('/api/analytics/event')
                .send(createTestEvent({ documentId: 'heatmap-doc-2', pageNumber: 1 }));

            await request(app)
                .post('/api/analytics/event')
                .send(createTestEvent({ documentId: 'heatmap-doc-2', pageNumber: 1, sessionId: 'session-2' }));

            await request(app)
                .post('/api/analytics/event')
                .send(createTestEvent({ documentId: 'heatmap-doc-2', pageNumber: 2, type: 'page_exit', data: { timeSpent: 30 } }));

            const response = await request(app)
                .get('/api/analytics/heatmap-doc-2/heatmap')
                .expect(200);

            expect(response.body.summary.totalViews).toBeGreaterThan(0);
            expect(response.body.pages[0].views).toBe(2); // Page 1 had 2 views
        });

        it('should calculate engagement scores', async () => {
            const app = createTestApp();
            const doc = createTestDocument({ id: 'heatmap-doc-3', pageCount: 2 });
            createDocument('heatmap-doc-3', doc);

            // Track engagement
            await request(app)
                .post('/api/analytics/event')
                .send(createTestEvent({
                    documentId: 'heatmap-doc-3',
                    pageNumber: 1,
                    data: { scrollDepth: 100 }
                }));

            const response = await request(app)
                .get('/api/analytics/heatmap-doc-3/heatmap')
                .expect(200);

            expect(response.body.pages[0].engagementScore).toBeGreaterThanOrEqual(0);
            expect(response.body.pages[0].engagementScore).toBeLessThanOrEqual(100);
        });
    });

    describe('GET /api/analytics/:documentId/summary', () => {
        it('should return quick summary stats', async () => {
            const app = createTestApp();
            const doc = createTestDocument({ id: 'summary-doc-1' });
            createDocument('summary-doc-1', doc);

            const response = await request(app)
                .get('/api/analytics/summary-doc-1/summary')
                .expect(200);

            expect(response.body).toMatchObject({
                success: true,
                summary: {
                    documentId: 'summary-doc-1',
                    totalViews: 0,
                    uniqueVisitors: 0,
                    pageCount: expect.any(Number),
                },
            });
        });

        it('should return 404 for non-existent document', async () => {
            const app = createTestApp();

            await request(app)
                .get('/api/analytics/non-existent/summary')
                .expect(404);
        });
    });
});
