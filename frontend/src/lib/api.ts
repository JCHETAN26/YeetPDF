import type {
  PDFDocument,
  DocumentAnalytics,
  UploadProgress,
  PageViewEvent,
  PageEngagement,
} from '@/types';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// API Base URL - use backend in production, fallback to mock for demo
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === 'true' || import.meta.env.PROD;
const TOKEN_KEY = 'pdfshare_token';

// Generate unique IDs
function generateId(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// In-memory storage for demo (would be replaced by actual API calls)
const documentsStore = new Map<string, PDFDocument>();
const analyticsStore = new Map<string, DocumentAnalytics>();
const pdfDataStore = new Map<string, ArrayBuffer>();

// Upload a PDF file
export async function uploadPDF(
  file: File,
  customSlug?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<PDFDocument> {

  console.log('[API] uploadPDF called:', { fileName: file.name, customSlug, USE_BACKEND });

  // Try backend API first
  if (USE_BACKEND) {
    return uploadPDFToBackend(file, customSlug, onProgress);
  }

  // Fallback to mock implementation
  return uploadPDFMock(file, onProgress);
}

// Backend upload implementation
async function uploadPDFToBackend(
  file: File,
  customSlug?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<PDFDocument> {
  console.log('[API] uploadPDFToBackend:', { customSlug, API_BASE });

  onProgress?.({ phase: 'preparing', progress: 0, message: 'Preparing upload...' });

  // Read PDF to get actual page count
  let pageCount = 1; // default fallback
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    pageCount = pdf.numPages;
    console.log('[API] Detected PDF pages:', pageCount);
  } catch (err) {
    console.warn('[API] Could not detect page count, using default:', err);
  }

  const formData = new FormData();
  formData.append('pageCount', pageCount.toString());
  if (customSlug) {
    formData.append('customSlug', customSlug);
    console.log('[API] Added customSlug to FormData:', customSlug);
  }
  formData.append('file', file);

  onProgress?.({ phase: 'uploading', progress: 30, message: 'Uploading...' });

  // Get auth token if available
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const uploadUrl = `${API_BASE}/upload/direct`;
  console.log('[API] Uploading to:', uploadUrl);

  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }

  onProgress?.({ phase: 'processing', progress: 80, message: 'Processing...' });

  const result = await response.json();

  console.log('[API] Upload response:', result);

  onProgress?.({ phase: 'complete', progress: 100, message: 'Complete!' });

  return {
    id: result.document.id,
    fileName: result.document.fileName,
    fileSize: result.document.fileSize,
    pageCount: result.document.pageCount,
    uploadedAt: new Date(result.document.createdAt),
    expiresAt: new Date(result.document.expiresAt),
    shareUrl: result.document.shareUrl,
    viewerUrl: result.document.viewerUrl,
    analyticsUrl: result.document.analyticsUrl,
  };
}

// Mock upload implementation
async function uploadPDFMock(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<PDFDocument> {
  const documentId = generateId(10);

  // Phase 1: Preparing
  onProgress?.({
    phase: 'preparing',
    progress: 0,
    message: 'Preparing your file...',
  });

  await new Promise(resolve => setTimeout(resolve, 300));

  // Phase 2: Uploading with simulated progress
  onProgress?.({
    phase: 'uploading',
    progress: 10,
    message: 'Uploading...',
  });

  // Read the file into memory (for demo)
  const arrayBuffer = await file.arrayBuffer();
  pdfDataStore.set(documentId, arrayBuffer);

  // Simulate upload progress
  for (let i = 20; i <= 70; i += 10) {
    await new Promise(resolve => setTimeout(resolve, 150));
    onProgress?.({
      phase: 'uploading',
      progress: i,
      message: `Uploading... ${i}%`,
    });
  }

  // Phase 3: Processing
  onProgress?.({
    phase: 'processing',
    progress: 80,
    message: 'Processing PDF...',
  });

  // Get page count (would use PDF.js in real implementation)
  // For demo, estimate based on file size
  const estimatedPages = Math.max(1, Math.floor(file.size / 50000));

  await new Promise(resolve => setTimeout(resolve, 500));

  onProgress?.({
    phase: 'processing',
    progress: 90,
    message: 'Generating preview...',
  });

  await new Promise(resolve => setTimeout(resolve, 300));

  // Create document record
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const baseUrl = window.location.origin;

  const document: PDFDocument = {
    id: documentId,
    fileName: file.name,
    fileSize: file.size,
    pageCount: estimatedPages,
    uploadedAt: now,
    expiresAt,
    shareUrl: `${baseUrl}/v/${documentId}`,
    viewerUrl: `/v/${documentId}`,
    analyticsUrl: `/analytics/${documentId}`,
  };

  documentsStore.set(documentId, document);

  // Initialize analytics
  initializeAnalytics(documentId, estimatedPages);

  // Phase 4: Complete
  onProgress?.({
    phase: 'complete',
    progress: 100,
    message: 'Upload complete!',
  });

  return document;
}

// Initialize analytics for a new document
function initializeAnalytics(documentId: string, pageCount: number): void {
  const pages: PageEngagement[] = Array.from({ length: pageCount }, (_, i) => ({
    pageNumber: i + 1,
    views: 0,
    uniqueViews: 0,
    avgTimeSpent: 0,
    totalTimeSpent: 0,
    engagementScore: 0,
    scrollDepth: 0,
  }));

  const analytics: DocumentAnalytics = {
    documentId,
    totalViews: 0,
    uniqueVisitors: 0,
    avgSessionTime: 0,
    avgPagesViewed: 0,
    completionRate: 0,
    mostViewedPage: 1,
    leastViewedPage: 1,
    pages,
    funnel: [
      { stage: 'Viewed Link', count: 0, percentage: 100 },
      { stage: 'Opened Document', count: 0, percentage: 0 },
      { stage: 'Read 50%+', count: 0, percentage: 0 },
      { stage: 'Read 100%', count: 0, percentage: 0 },
    ],
    sessions: [],
    viewsOverTime: [],
  };

  analyticsStore.set(documentId, analytics);
}

// Get document by ID
export async function getDocument(documentId: string): Promise<PDFDocument | null> {
  // Try backend first
  if (USE_BACKEND) {
    try {
      const response = await fetch(`${API_BASE}/pdf/${documentId}/info`);
      if (!response.ok) return null;
      const result = await response.json();
      return {
        id: result.document.id,
        fileName: result.document.fileName,
        fileSize: result.document.fileSize,
        pageCount: result.document.pageCount,
        uploadedAt: new Date(result.document.createdAt),
        expiresAt: new Date(result.document.expiresAt),
        shareUrl: `${window.location.origin}/v/${documentId}`,
        viewerUrl: `/v/${documentId}`,
        analyticsUrl: `/analytics/${documentId}`,
      };
    } catch {
      return null;
    }
  }

  // Mock implementation
  await new Promise(resolve => setTimeout(resolve, 100));

  const doc = documentsStore.get(documentId);

  // If no document exists, create a demo one for testing
  if (!doc) {
    // Create a demo document for the viewer
    const demoDoc: PDFDocument = {
      id: documentId,
      fileName: 'Sample Document.pdf',
      fileSize: 1024 * 1024 * 2, // 2MB
      pageCount: 12,
      uploadedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      shareUrl: `${window.location.origin}/v/${documentId}`,
      viewerUrl: `/v/${documentId}`,
      analyticsUrl: `/analytics/${documentId}`,
    };

    documentsStore.set(documentId, demoDoc);
    initializeAnalytics(documentId, 12);
    generateMockAnalytics(documentId);

    return demoDoc;
  }

  return doc;
}

// Get PDF data for rendering
export async function getPDFData(documentId: string): Promise<ArrayBuffer | null> {
  return pdfDataStore.get(documentId) || null;
}

// Get analytics for a document
export async function getDocumentAnalytics(documentId: string): Promise<DocumentAnalytics | null> {
  // Try backend first
  if (USE_BACKEND) {
    try {
      const response = await fetch(`${API_BASE}/analytics/${documentId}/heatmap`);
      if (!response.ok) return null;
      const result = await response.json();
      return {
        documentId,
        totalViews: result.summary.totalViews,
        uniqueVisitors: result.summary.uniqueVisitors,
        avgSessionTime: result.summary.avgSessionTime,
        avgPagesViewed: Math.floor(result.pages.length * 0.6),
        completionRate: result.summary.completionRate,
        mostViewedPage: result.summary.mostViewedPage,
        leastViewedPage: result.summary.leastViewedPage,
        pages: result.pages.map((p: any) => ({
          pageNumber: p.pageNumber,
          views: p.views,
          uniqueViews: p.uniqueViews,
          avgTimeSpent: p.avgTimeSpent,
          totalTimeSpent: p.totalTimeSpent,
          engagementScore: p.engagementScore,
          scrollDepth: p.maxScrollDepth,
        })),
        funnel: result.funnel,
        sessions: [],
        viewsOverTime: [],
      };
    } catch {
      return null;
    }
  }

  // Mock implementation
  await new Promise(resolve => setTimeout(resolve, 100));

  let analytics = analyticsStore.get(documentId);

  // Generate mock data if none exists
  if (!analytics) {
    const doc = await getDocument(documentId);
    if (doc) {
      analytics = analyticsStore.get(documentId);
      if (analytics) {
        generateMockAnalytics(documentId);
        analytics = analyticsStore.get(documentId);
      }
    }
  }

  return analytics || null;
}

// Generate mock analytics data for demo
function generateMockAnalytics(documentId: string): void {
  const analytics = analyticsStore.get(documentId);
  if (!analytics) return;

  const totalViews = Math.floor(Math.random() * 2000) + 500;
  const uniqueVisitors = Math.floor(totalViews * 0.7);

  // Generate page engagement data with realistic distribution
  // First pages tend to have more views
  analytics.pages = analytics.pages.map((page, index) => {
    const dropOff = Math.pow(0.9, index); // 10% drop-off per page
    const baseViews = Math.floor(totalViews * dropOff);
    const randomFactor = 0.8 + Math.random() * 0.4;
    const views = Math.floor(baseViews * randomFactor);
    const avgTime = 15 + Math.floor(Math.random() * 45); // 15-60 seconds

    return {
      ...page,
      views,
      uniqueViews: Math.floor(views * 0.75),
      avgTimeSpent: avgTime,
      totalTimeSpent: views * avgTime,
      engagementScore: Math.min(100, (views / totalViews) * 200 * randomFactor),
      scrollDepth: 70 + Math.floor(Math.random() * 30),
    };
  });

  // Find most/least viewed pages
  const sortedPages = [...analytics.pages].sort((a, b) => b.views - a.views);
  analytics.mostViewedPage = sortedPages[0]?.pageNumber || 1;
  analytics.leastViewedPage = sortedPages[sortedPages.length - 1]?.pageNumber || 1;

  // Update totals
  analytics.totalViews = totalViews;
  analytics.uniqueVisitors = uniqueVisitors;
  analytics.avgSessionTime = 180 + Math.floor(Math.random() * 120); // 3-5 minutes
  analytics.avgPagesViewed = Math.floor(analytics.pages.length * 0.6);
  analytics.completionRate = 25 + Math.floor(Math.random() * 20); // 25-45%

  // Update funnel
  analytics.funnel = [
    { stage: 'Viewed Link', count: totalViews, percentage: 100 },
    { stage: 'Opened Document', count: Math.floor(totalViews * 0.9), percentage: 90 },
    { stage: 'Read 50%+', count: Math.floor(totalViews * 0.55), percentage: 55 },
    { stage: 'Read 100%', count: Math.floor(totalViews * analytics.completionRate / 100), percentage: analytics.completionRate },
  ];

  // Generate time series for last 7 days
  analytics.viewsOverTime = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dailyViews = Math.floor(totalViews / 7 * (0.7 + Math.random() * 0.6));
    return {
      date: date.toISOString().split('T')[0],
      views: dailyViews,
      uniqueVisitors: Math.floor(dailyViews * 0.7),
    };
  });

  analyticsStore.set(documentId, analytics);
}

// Track a page view event
export async function trackPageView(event: PageViewEvent): Promise<void> {
  // Send to backend if available
  if (USE_BACKEND) {
    try {
      await fetch(`${API_BASE}/analytics/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: event.documentId,
          sessionId: event.sessionId,
          type: event.exitedAt ? 'page_exit' : 'page_view',
          pageNumber: event.pageNumber,
          data: {
            sessionId: event.sessionId,
            timeSpent: event.exitedAt && event.enteredAt
              ? (event.exitedAt.getTime() - event.enteredAt.getTime()) / 1000
              : 0,
            scrollDepth: event.scrollDepth,
          }
        }),
      });
      return;
    } catch {
      // Fall through to mock
    }
  }

  // Mock implementation
  const analytics = analyticsStore.get(event.documentId);
  if (!analytics) return;

  const pageIndex = event.pageNumber - 1;
  if (pageIndex >= 0 && pageIndex < analytics.pages.length) {
    const page = analytics.pages[pageIndex];
    page.views += 1;

    if (event.exitedAt && event.enteredAt) {
      const timeSpent = (event.exitedAt.getTime() - event.enteredAt.getTime()) / 1000;
      page.totalTimeSpent += timeSpent;
      page.avgTimeSpent = page.totalTimeSpent / page.views;
    }

    page.scrollDepth = Math.max(page.scrollDepth, event.scrollDepth);
    page.engagementScore = calculateEngagementScore(page);

    analytics.totalViews += 1;
    analyticsStore.set(event.documentId, analytics);
  }
}

function calculateEngagementScore(page: PageEngagement): number {
  // Weight factors for engagement score
  const timeWeight = Math.min(page.avgTimeSpent / 60, 1) * 40; // Max 40 points for 60+ seconds
  const scrollWeight = (page.scrollDepth / 100) * 30; // Max 30 points for full scroll
  const viewWeight = Math.min(page.views / 100, 1) * 30; // Max 30 points for 100+ views

  return Math.min(100, timeWeight + scrollWeight + viewWeight);
}

// Start a new viewing session
export function startSession(documentId: string): string {
  // Check if we already have a session for this document (within last hour)
  const storageKey = `yeetpdf_session_${documentId}`;
  const existingSession = localStorage.getItem(storageKey);

  if (existingSession) {
    try {
      const { sessionId, timestamp } = JSON.parse(existingSession);
      const age = Date.now() - timestamp;
      // If session is less than 1 hour old, reuse it
      if (age < 60 * 60 * 1000) {
        console.log('[Analytics] Reusing existing session:', sessionId);
        return sessionId;
      }
    } catch (e) {
      // Invalid session data, create new one
    }
  }

  // Create new session
  const sessionId = generateId(16);

  // Store in localStorage with timestamp
  localStorage.setItem(storageKey, JSON.stringify({
    sessionId,
    timestamp: Date.now()
  }));

  console.log('[Analytics] Created new session:', sessionId);

  const analytics = analyticsStore.get(documentId);

  if (analytics) {
    analytics.sessions.push({
      sessionId,
      startedAt: new Date(),
      pagesViewed: [],
      totalTimeSpent: 0,
      device: detectDevice(),
      referrer: document.referrer || undefined,
    });
    analytics.uniqueVisitors += 1;
    analyticsStore.set(documentId, analytics);
  }

  return sessionId;
}

function detectDevice(): 'desktop' | 'mobile' | 'tablet' {
  const ua = navigator.userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/.test(ua)) return 'mobile';
  return 'desktop';
}

// End a viewing session
export async function endSession(documentId: string, sessionId: string): Promise<void> {
  const analytics = analyticsStore.get(documentId);
  if (!analytics) return;

  const session = analytics.sessions.find(s => s.sessionId === sessionId);
  if (session) {
    session.endedAt = new Date();
    session.totalTimeSpent = (session.endedAt.getTime() - session.startedAt.getTime()) / 1000;
    analyticsStore.set(documentId, analytics);
  }
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Calculate time until expiry
export function getTimeUntilExpiry(expiresAt: Date): string {
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();

  if (diff <= 0) return 'Expired';

  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  if (days > 0) return `${days}d ${hours}h remaining`;
  return `${hours}h remaining`;
}
