import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  FileText, 
  Eye, 
  Clock, 
  TrendingUp, 
  BarChart3,
  ArrowLeft,
  Users,
  Loader2,
  Calendar,
  Percent,
  BookOpen,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getDocument, getDocumentAnalytics } from "@/lib/api";
import { formatDuration } from "@/types";
import type { PDFDocument, DocumentAnalytics } from "@/types";

const AnalyticsDashboard = () => {
  const navigate = useNavigate();
  const { documentId } = useParams<{ documentId: string }>();
  const [document, setDocument] = useState<PDFDocument | null>(null);
  const [analytics, setAnalytics] = useState<DocumentAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async (showRefresh = false) => {
    const docId = documentId || 'demo123';
    
    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      const [doc, analyticsData] = await Promise.all([
        getDocument(docId),
        getDocumentAnalytics(docId)
      ]);
      
      if (!doc) {
        setError("Document not found or has expired");
        return;
      }
      
      setDocument(doc);
      setAnalytics(analyticsData);
      setError(null);
    } catch (err) {
      setError("Failed to load analytics");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [documentId]);

  const getEngagementColor = (score: number) => {
    if (score < 33) return "bg-heatmap-low";
    if (score < 66) return "bg-heatmap-mid";
    return "bg-heatmap-high";
  };

  const maxViews = analytics ? Math.max(...analytics.pages.map(p => p.views)) : 100;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center premium-card p-8 max-w-md">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">{error || 'No analytics available'}</h1>
          <p className="text-muted-foreground mb-6">
            Analytics data may not be available yet.
          </p>
          <Button onClick={() => navigate("/")}>
            Upload a PDF
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="w-full py-4 px-6 border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <span className="font-semibold">Analytics</span>
                {document && (
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {document.fileName}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => loadData(true)}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="subtle" 
              size="sm" 
              onClick={() => navigate(document?.viewerUrl || `/v/${documentId}`)}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Viewer
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="premium-card p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Eye className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-foreground">{analytics.totalViews.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total Views</p>
          </div>

          <div className="premium-card p-6 animate-fade-in" style={{ animationDelay: "0.05s" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-foreground">{formatDuration(analytics.avgSessionTime)}</p>
            <p className="text-sm text-muted-foreground">Avg. Session Time</p>
          </div>

          <div className="premium-card p-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-foreground">{analytics.uniqueVisitors.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Unique Visitors</p>
          </div>

          <div className="premium-card p-6 animate-fade-in" style={{ animationDelay: "0.15s" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Percent className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-foreground">{analytics.completionRate}%</p>
            <p className="text-sm text-muted-foreground">Completion Rate</p>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="premium-card p-5 animate-fade-in" style={{ animationDelay: "0.18s" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Most Viewed Page</p>
                <p className="text-xl font-semibold">Page {analytics.mostViewedPage}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-heatmap-high" />
            </div>
          </div>
          
          <div className="premium-card p-5 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg. Pages Viewed</p>
                <p className="text-xl font-semibold">{analytics.avgPagesViewed} / {document?.pageCount || analytics.pages.length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
          </div>

          <div className="premium-card p-5 animate-fade-in" style={{ animationDelay: "0.22s" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Expires In</p>
                <p className="text-xl font-semibold">
                  {document ? Math.ceil((new Date(document.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 7} days
                </p>
              </div>
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Page Heatmap */}
          <div className="lg:col-span-2 premium-card p-6 animate-fade-in" style={{ animationDelay: "0.25s" }}>
            <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Page Engagement Heatmap
            </h3>
            
            <div className="space-y-3">
              {analytics.pages.map((page) => (
                <div key={page.pageNumber} className="flex items-center gap-4">
                  <span className="w-16 text-sm text-muted-foreground">
                    Page {page.pageNumber}
                  </span>
                  <div className="flex-1 relative">
                    <div className="h-8 bg-muted rounded-lg overflow-hidden">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div 
                            className={`h-full rounded-lg ${getEngagementColor(page.engagementScore)} transition-all duration-500 cursor-pointer hover:opacity-80`}
                            style={{ width: `${Math.max(5, (page.views / maxViews) * 100)}%` }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs space-y-1">
                            <p className="font-medium">Page {page.pageNumber}</p>
                            <p>{page.views.toLocaleString()} views</p>
                            <p>Avg. time: {page.avgTimeSpent}s</p>
                            <p>Scroll depth: {page.scrollDepth}%</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  <span className="w-20 text-right text-sm font-medium text-foreground">
                    {page.views.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-3 h-3 rounded bg-heatmap-low" />
                <span>Low engagement</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-3 h-3 rounded bg-heatmap-mid" />
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-3 h-3 rounded bg-heatmap-high" />
                <span>High engagement</span>
              </div>
            </div>
          </div>

          {/* Engagement Funnel */}
          <div className="premium-card p-6 animate-fade-in" style={{ animationDelay: "0.28s" }}>
            <h3 className="text-lg font-semibold text-foreground mb-6">
              Engagement Funnel
            </h3>
            
            <div className="space-y-5">
              {analytics.funnel.map((stage, index) => (
                <div key={stage.stage} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-foreground">{stage.stage}</span>
                    <span className="text-sm font-semibold text-foreground">{stage.percentage}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-700"
                      style={{ 
                        width: `${stage.percentage}%`,
                        opacity: 1 - (index * 0.15)
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stage.count.toLocaleString()} visitors
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Views Over Time */}
        {analytics.viewsOverTime.length > 0 && (
          <div className="mt-6 premium-card p-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Views Over Time (Last 7 Days)
            </h3>
            <div className="flex items-end gap-2 h-32">
              {analytics.viewsOverTime.map((day, i) => {
                const maxDayViews = Math.max(...analytics.viewsOverTime.map(d => d.views));
                const height = (day.views / maxDayViews) * 100;
                return (
                  <Tooltip key={day.date}>
                    <TooltipTrigger asChild>
                      <div className="flex-1 flex flex-col items-center gap-2">
                        <div 
                          className="w-full bg-primary/80 hover:bg-primary rounded-t transition-all cursor-pointer"
                          style={{ height: `${Math.max(8, height)}%` }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs">
                        <p className="font-medium">{new Date(day.date).toLocaleDateString()}</p>
                        <p>{day.views.toLocaleString()} views</p>
                        <p>{day.uniqueVisitors.toLocaleString()} unique</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        )}

        {/* Ad Placeholder */}
        <div className="mt-8 premium-card p-6 animate-fade-in" style={{ animationDelay: "0.35s" }}>
          <div className="flex items-center justify-between mb-4">
            <span className="sponsored-badge">Sponsored</span>
          </div>
          <div className="h-24 bg-muted/50 rounded-xl flex items-center justify-center border border-dashed border-border">
            <span className="text-sm text-muted-foreground">AdSense Leaderboard (728x90)</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AnalyticsDashboard;
