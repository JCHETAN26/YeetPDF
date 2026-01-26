import { Router } from 'express';
import { getDocument, analyticsEvents, pageStats } from '../store.js';

const router = Router();

/**
 * POST /api/analytics/event
 * Collect a page-level analytics event
 * 
 * Body: {
 *   documentId: string,
 *   sessionId: string,
 *   type: 'page_view' | 'page_exit' | 'scroll',
 *   pageNumber: number,
 *   data: { timeSpent?, scrollDepth?, ... }
 * }
 */
router.post('/event', (req, res) => {
  try {
    const { documentId, sessionId, type, pageNumber, data = {} } = req.body;
    
    // Validate required fields
    if (!documentId || !sessionId || !type || !pageNumber) {
      return res.status(400).json({ 
        error: 'Missing required fields: documentId, sessionId, type, pageNumber' 
      });
    }
    
    // Check document exists
    const doc = getDocument(documentId);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Create event
    const event = {
      documentId,
      sessionId,
      type,
      pageNumber,
      data,
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'],
      ip: req.ip
    };
    
    // Store event
    const events = analyticsEvents.get(documentId) || [];
    events.push(event);
    analyticsEvents.set(documentId, events);
    
    // Update aggregated page stats
    updatePageStats(documentId, pageNumber, type, data, sessionId);
    
    res.json({ success: true });
  } catch (err) {
    console.error('Analytics event error:', err);
    res.status(500).json({ error: 'Failed to record event' });
  }
});

/**
 * POST /api/analytics/batch
 * Collect multiple events at once (for efficiency)
 */
router.post('/batch', (req, res) => {
  try {
    const { events: eventList } = req.body;
    
    if (!Array.isArray(eventList)) {
      return res.status(400).json({ error: 'events must be an array' });
    }
    
    let recorded = 0;
    for (const evt of eventList) {
      const { documentId, sessionId, type, pageNumber, data = {} } = evt;
      
      if (!documentId || !sessionId || !type || !pageNumber) continue;
      
      const doc = getDocument(documentId);
      if (!doc) continue;
      
      const event = {
        documentId,
        sessionId,
        type,
        pageNumber,
        data,
        timestamp: new Date().toISOString()
      };
      
      const events = analyticsEvents.get(documentId) || [];
      events.push(event);
      analyticsEvents.set(documentId, events);
      
      updatePageStats(documentId, pageNumber, type, data, sessionId);
      recorded++;
    }
    
    res.json({ success: true, recorded });
  } catch (err) {
    console.error('Batch analytics error:', err);
    res.status(500).json({ error: 'Failed to record events' });
  }
});

/**
 * GET /api/analytics/:documentId/heatmap
 * Get aggregated heatmap data for a document
 */
router.get('/:documentId/heatmap', (req, res) => {
  try {
    const { documentId } = req.params;
    
    const doc = getDocument(documentId);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const stats = pageStats.get(documentId) || new Map();
    const pages = [];
    
    // Build page-by-page heatmap data
    for (let i = 1; i <= doc.pageCount; i++) {
      const pageData = stats.get(i) || createEmptyPageStats();
      pages.push({
        pageNumber: i,
        views: pageData.views,
        uniqueViews: pageData.uniqueSessions.size,
        avgTimeSpent: pageData.views > 0 ? Math.round(pageData.totalTimeSpent / pageData.views) : 0,
        totalTimeSpent: pageData.totalTimeSpent,
        maxScrollDepth: pageData.maxScrollDepth,
        engagementScore: calculateEngagementScore(pageData)
      });
    }
    
    // Calculate overall stats
    const totalViews = pages.reduce((sum, p) => sum + p.views, 0);
    const allSessions = new Set();
    for (const [_, data] of stats) {
      for (const sid of data.uniqueSessions) {
        allSessions.add(sid);
      }
    }
    
    res.json({
      success: true,
      documentId,
      summary: {
        totalViews,
        uniqueVisitors: allSessions.size,
        avgSessionTime: calculateAvgSessionTime(documentId),
        completionRate: calculateCompletionRate(documentId, doc.pageCount),
        mostViewedPage: findMostViewedPage(pages),
        leastViewedPage: findLeastViewedPage(pages)
      },
      pages,
      funnel: calculateFunnel(documentId, doc.pageCount),
      viewsOverTime: calculateViewsOverTime(documentId)
    });
  } catch (err) {
    console.error('Heatmap error:', err);
    res.status(500).json({ error: 'Failed to get heatmap data' });
  }
});

/**
 * GET /api/analytics/:documentId/summary
 * Get quick summary stats
 */
router.get('/:documentId/summary', (req, res) => {
  try {
    const { documentId } = req.params;
    
    const doc = getDocument(documentId);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const stats = pageStats.get(documentId) || new Map();
    
    let totalViews = 0;
    const allSessions = new Set();
    
    for (const [_, data] of stats) {
      totalViews += data.views;
      for (const sid of data.uniqueSessions) {
        allSessions.add(sid);
      }
    }
    
    res.json({
      success: true,
      summary: {
        documentId,
        totalViews,
        uniqueVisitors: allSessions.size,
        pageCount: doc.pageCount,
        createdAt: doc.createdAt,
        expiresAt: doc.expiresAt
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get summary' });
  }
});

// ============ Helper Functions ============

function createEmptyPageStats() {
  return {
    views: 0,
    uniqueSessions: new Set(),
    totalTimeSpent: 0,
    maxScrollDepth: 0
  };
}

function updatePageStats(documentId, pageNumber, type, data, sessionId) {
  const stats = pageStats.get(documentId) || new Map();
  const pageData = stats.get(pageNumber) || createEmptyPageStats();
  
  if (type === 'page_view') {
    pageData.views++;
    // Track unique session for this page
    if (sessionId) {
      pageData.uniqueSessions.add(sessionId);
    }
  }
  
  if (type === 'page_exit' && data.timeSpent) {
    pageData.totalTimeSpent += data.timeSpent;
  }
  
  if (data.scrollDepth) {
    pageData.maxScrollDepth = Math.max(pageData.maxScrollDepth, data.scrollDepth);
  }
  
  stats.set(pageNumber, pageData);
  pageStats.set(documentId, stats);
}

function calculateEngagementScore(pageData) {
  // Weight factors
  const viewWeight = Math.min(pageData.views / 50, 1) * 30;
  const timeWeight = Math.min((pageData.totalTimeSpent / pageData.views || 0) / 60, 1) * 40;
  const scrollWeight = (pageData.maxScrollDepth / 100) * 30;
  
  return Math.round(Math.min(100, viewWeight + timeWeight + scrollWeight));
}

function calculateAvgSessionTime(documentId) {
  const events = analyticsEvents.get(documentId) || [];
  const sessions = new Map();
  
  for (const evt of events) {
    if (!sessions.has(evt.sessionId)) {
      sessions.set(evt.sessionId, { start: evt.timestamp, end: evt.timestamp });
    } else {
      const s = sessions.get(evt.sessionId);
      if (evt.timestamp < s.start) s.start = evt.timestamp;
      if (evt.timestamp > s.end) s.end = evt.timestamp;
    }
  }
  
  let totalTime = 0;
  for (const [_, s] of sessions) {
    totalTime += (new Date(s.end) - new Date(s.start)) / 1000;
  }
  
  return sessions.size > 0 ? Math.round(totalTime / sessions.size) : 0;
}

function calculateCompletionRate(documentId, pageCount) {
  const events = analyticsEvents.get(documentId) || [];
  const sessionPages = new Map();
  
  for (const evt of events) {
    if (evt.type === 'page_view') {
      if (!sessionPages.has(evt.sessionId)) {
        sessionPages.set(evt.sessionId, new Set());
      }
      sessionPages.get(evt.sessionId).add(evt.pageNumber);
    }
  }
  
  let completed = 0;
  for (const [_, pages] of sessionPages) {
    if (pages.size >= pageCount) completed++;
  }
  
  return sessionPages.size > 0 ? Math.round((completed / sessionPages.size) * 100) : 0;
}

function calculateFunnel(documentId, pageCount) {
  const events = analyticsEvents.get(documentId) || [];
  const sessionPages = new Map();
  
  for (const evt of events) {
    if (evt.type === 'page_view') {
      if (!sessionPages.has(evt.sessionId)) {
        sessionPages.set(evt.sessionId, new Set());
      }
      sessionPages.get(evt.sessionId).add(evt.pageNumber);
    }
  }
  
  // If no sessions, return empty funnel with 0 counts
  if (sessionPages.size === 0) {
    return [
      { stage: 'Viewed Link', count: 0, percentage: 0 },
      { stage: 'Opened Document', count: 0, percentage: 0 },
      { stage: 'Read 50%+', count: 0, percentage: 0 },
      { stage: 'Read 100%', count: 0, percentage: 0 }
    ];
  }
  
  const total = sessionPages.size;
  let opened = 0, half = 0, complete = 0;
  
  for (const [_, pages] of sessionPages) {
    if (pages.size > 0) opened++;
    if (pages.size >= Math.ceil(pageCount / 2)) half++;
    if (pages.size >= pageCount) complete++;
  }
  
  return [
    { stage: 'Viewed Link', count: total, percentage: 100 },
    { stage: 'Opened Document', count: opened, percentage: Math.round((opened / total) * 100) },
    { stage: 'Read 50%+', count: half, percentage: Math.round((half / total) * 100) },
    { stage: 'Read 100%', count: complete, percentage: Math.round((complete / total) * 100) }
  ];
}

function findMostViewedPage(pages) {
  if (!pages || pages.length === 0) return 1;
  return pages.reduce((max, p) => p.views > max.views ? p : max, pages[0])?.pageNumber || 1;
}

function findLeastViewedPage(pages) {
  if (!pages || pages.length === 0) return 1;
  return pages.reduce((min, p) => p.views < min.views ? p : min, pages[0])?.pageNumber || 1;
}

function calculateViewsOverTime(documentId) {
  const events = analyticsEvents.get(documentId) || [];
  const dayMap = new Map();
  
  // Group events by day
  for (const evt of events) {
    const date = new Date(evt.timestamp).toISOString().split('T')[0];
    if (!dayMap.has(date)) {
      dayMap.set(date, { views: 0, sessions: new Set() });
    }
    const day = dayMap.get(date);
    if (evt.type === 'page_view') {
      day.views++;
      day.sessions.add(evt.sessionId);
    }
  }
  
  // Convert to array and sort by date
  const result = [];
  for (const [date, data] of dayMap) {
    result.push({
      date,
      views: data.views,
      uniqueVisitors: data.sessions.size
    });
  }
  
  result.sort((a, b) => a.date.localeCompare(b.date));
  
  // Fill in last 7 days with zeros if needed
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const existing = result.find(r => r.date === dateStr);
    last7Days.push(existing || { date: dateStr, views: 0, uniqueVisitors: 0 });
  }
  
  return last7Days;
}

export { router as analyticsRouter };
