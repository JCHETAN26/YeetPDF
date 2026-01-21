// Core PDF Document types
export interface PDFDocument {
  id: string;
  fileName: string;
  fileSize: number;
  pageCount: number;
  uploadedAt: Date;
  expiresAt: Date;
  shareUrl: string;
  viewerUrl: string;
  analyticsUrl: string;
  thumbnailUrl?: string;
}

// Analytics types
export interface PageEngagement {
  pageNumber: number;
  views: number;
  uniqueViews: number;
  avgTimeSpent: number; // in seconds
  totalTimeSpent: number; // in seconds
  engagementScore: number; // 0-100
  scrollDepth: number; // 0-100 percentage
}

export interface ViewerSession {
  sessionId: string;
  startedAt: Date;
  endedAt?: Date;
  pagesViewed: number[];
  totalTimeSpent: number;
  device: 'desktop' | 'mobile' | 'tablet';
  referrer?: string;
  location?: {
    country: string;
    city?: string;
  };
}

export interface DocumentAnalytics {
  documentId: string;
  totalViews: number;
  uniqueVisitors: number;
  avgSessionTime: number; // in seconds
  avgPagesViewed: number;
  completionRate: number; // percentage who viewed all pages
  mostViewedPage: number;
  leastViewedPage: number;
  pages: PageEngagement[];
  funnel: FunnelStage[];
  sessions: ViewerSession[];
  viewsOverTime: TimeSeriesData[];
}

export interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
}

export interface TimeSeriesData {
  date: string;
  views: number;
  uniqueVisitors: number;
}

// Page view tracking event
export interface PageViewEvent {
  documentId: string;
  sessionId: string;
  pageNumber: number;
  enteredAt: Date;
  exitedAt?: Date;
  scrollDepth: number;
}

// Upload progress tracking
export interface UploadProgress {
  phase: 'preparing' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  error?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UploadResponse {
  document: PDFDocument;
  shareUrl: string;
  viewerUrl: string;
  analyticsUrl: string;
}

// Heatmap visualization helpers
export type HeatmapIntensity = 'low' | 'mid' | 'high';

export function getHeatmapIntensity(score: number): HeatmapIntensity {
  if (score < 33) return 'low';
  if (score < 66) return 'mid';
  return 'high';
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

export function generateObfuscatedId(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
