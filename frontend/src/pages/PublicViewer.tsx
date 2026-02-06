import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  FileText,
  Download,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PDFRenderer } from "@/components/PDFRenderer";
import { getDocument, trackPageView, startSession } from "@/lib/api";
import type { PDFDocument } from "@/types";

/**
 * PublicViewer - Clean, distraction-free PDF viewer for link recipients
 * Tracks page-by-page views for accurate analytics
 */
const PublicViewer = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const [document, setDocument] = useState<PDFDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // PDF URL - direct from backend
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  const pdfUrl = documentId ? `${API_BASE}/pdf/${documentId}` : null;

  // Session tracking
  const sessionIdRef = useRef<string | null>(null);
  const pageTimesRef = useRef<Map<number, Date>>(new Map());

  // Load document data
  useEffect(() => {
    async function loadDocument() {
      if (!documentId) {
        setError("Invalid link");
        setIsLoading(false);
        return;
      }

      try {
        const doc = await getDocument(documentId);

        if (!doc) {
          setError("This document has expired or doesn't exist");
          setIsLoading(false);
          return;
        }

        setDocument(doc);

        // Start a viewing session
        sessionIdRef.current = startSession(documentId);

      } catch (err) {
        setError("Failed to load document");
      } finally {
        setIsLoading(false);
      }
    }

    loadDocument();
  }, [documentId]);

  // Handle page view
  const handlePageView = (pageNumber: number) => {
    if (!documentId || !sessionIdRef.current) return;

    pageTimesRef.current.set(pageNumber, new Date());

    trackPageView({
      documentId,
      sessionId: sessionIdRef.current,
      pageNumber,
      enteredAt: new Date(),
      exitedAt: undefined,
      scrollDepth: 0,
    });
  };

  // Handle page exit
  const handlePageExit = (pageNumber: number, timeSpent: number) => {
    if (!documentId || !sessionIdRef.current) return;

    const enteredAt = pageTimesRef.current.get(pageNumber);
    if (!enteredAt) return;

    trackPageView({
      documentId,
      sessionId: sessionIdRef.current,
      pageNumber,
      enteredAt,
      exitedAt: new Date(),
      scrollDepth: 100,
    });
  };

  // Download handler
  const handleDownload = () => {
    if (pdfUrl && document) {
      const link = window.document.createElement('a');
      link.href = `${pdfUrl}?download=true`;
      link.download = document.fileName;
      link.click();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-neutral-400">Loading document...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-neutral-800 flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-neutral-500" />
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">{error}</h1>
          <p className="text-neutral-400">
            The link may have expired or been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950">
      {/* Minimal Header - appears on hover */}
      <header className="fixed top-0 left-0 right-0 z-50 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="bg-gradient-to-b from-black/80 to-transparent py-4 px-6 pointer-events-auto">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-medium truncate max-w-[200px] sm:max-w-[400px]">
                {document?.fileName}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </header>

      {/* PDF Viewer content */}
      <main className="flex-1 flex flex-col pt-[70px]">


        <div className="flex-1">
          {pdfUrl ? (
            <PDFRenderer
              pdfUrl={pdfUrl}
              onPageView={handlePageView}
              onPageExit={handlePageExit}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                <p className="text-neutral-400">Unable to load PDF</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Minimal branding footer */}
      <footer className="fixed bottom-0 left-0 right-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="bg-gradient-to-t from-black/80 to-transparent py-4 px-6">
          <div className="text-center">
            <a
              href="/"
              className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors pointer-events-auto"
              target="_blank"
              rel="noopener noreferrer"
            >
              Shared via YeetPDF
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicViewer;
