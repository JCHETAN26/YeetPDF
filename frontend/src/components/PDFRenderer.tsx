import { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Configure PDF.js worker using CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFRendererProps {
  pdfUrl: string;
  onPageView: (pageNumber: number) => void;
  onPageExit: (pageNumber: number, timeSpent: number) => void;
}

export function PDFRenderer({ pdfUrl, onPageView, onPageExit }: PDFRendererProps) {
  const [pdf, setPdf] = useState<any>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [isLoading, setIsLoading] = useState(true);
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const pageEnteredAtRef = useRef<Date>(new Date());
  const currentPageRef = useRef(1);

  // Load PDF
  useEffect(() => {
    const loadPdf = async () => {
      try {
        console.log('[PDFRenderer] Loading PDF from:', pdfUrl);
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdfDoc = await loadingTask.promise;
        console.log('[PDFRenderer] PDF loaded, pages:', pdfDoc.numPages);
        setPdf(pdfDoc);
        setTotalPages(pdfDoc.numPages);
        setIsLoading(false);
      } catch (error) {
        console.error('[PDFRenderer] Error loading PDF:', error);
        setIsLoading(false);
      }
    };

    loadPdf();
  }, [pdfUrl]);

  // Render a single page
  const renderPage = useCallback(async (pageNum: number, container: HTMLDivElement) => {
    if (!pdf || renderedPages.has(pageNum)) return;

    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      // Clear container
      container.innerHTML = '';
      container.style.width = `${viewport.width}px`;
      container.style.height = `${viewport.height}px`;

      // Create canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      canvas.style.display = 'block';
      container.appendChild(canvas);

      // Render canvas
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      // Create annotation layer for clickable links
      const annotationLayer = document.createElement('div');
      annotationLayer.style.position = 'absolute';
      annotationLayer.style.top = '0';
      annotationLayer.style.left = '0';
      annotationLayer.style.width = `${viewport.width}px`;
      annotationLayer.style.height = `${viewport.height}px`;
      annotationLayer.style.pointerEvents = 'auto';
      container.appendChild(annotationLayer);

      // Get and render annotations (links)
      const annotations = await page.getAnnotations();

      annotations.forEach((annotation: any) => {
        if (annotation.subtype === 'Link' && annotation.url) {
          const rect = annotation.rect;
          const [x1, y1, x2, y2] = viewport.convertToViewportRectangle(rect);

          const left = Math.min(x1, x2);
          const top = Math.min(y1, y2);
          const width = Math.abs(x2 - x1);
          const height = Math.abs(y2 - y1);

          const link = document.createElement('a');
          link.href = annotation.url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.style.position = 'absolute';
          link.style.left = `${left}px`;
          link.style.top = `${top}px`;
          link.style.width = `${width}px`;
          link.style.height = `${height}px`;
          link.style.cursor = 'pointer';
          link.style.backgroundColor = 'transparent';
          link.style.transition = 'background-color 0.2s';
          link.onmouseenter = () => { link.style.backgroundColor = 'rgba(59, 130, 246, 0.2)'; };
          link.onmouseleave = () => { link.style.backgroundColor = 'transparent'; };

          annotationLayer.appendChild(link);
        }
      });

      setRenderedPages(prev => new Set([...prev, pageNum]));
    } catch (error) {
      console.error(`[PDFRenderer] Error rendering page ${pageNum}:`, error);
    }
  }, [pdf, scale, renderedPages]);

  // Render all pages when PDF loads
  useEffect(() => {
    if (!pdf) return;

    // Reset rendered pages when scale changes
    setRenderedPages(new Set());

    // Render pages
    pageRefs.current.forEach((container, pageNum) => {
      renderPage(pageNum, container);
    });
  }, [pdf, scale, renderPage]);

  // Track current page based on scroll position
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !pdf) return;

    const handleScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.top + containerRect.height / 2;

      let closestPage = 1;
      let closestDistance = Infinity;

      pageRefs.current.forEach((pageEl, pageNum) => {
        const pageRect = pageEl.getBoundingClientRect();
        const pageCenter = pageRect.top + pageRect.height / 2;
        const distance = Math.abs(pageCenter - containerCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestPage = pageNum;
        }
      });

      if (closestPage !== currentPageRef.current) {
        // Track exit from previous page
        const timeSpent = (new Date().getTime() - pageEnteredAtRef.current.getTime()) / 1000;
        onPageExit(currentPageRef.current, timeSpent);

        // Track view of new page
        setCurrentPage(closestPage);
        currentPageRef.current = closestPage;
        pageEnteredAtRef.current = new Date();
        onPageView(closestPage);
      }
    };

    container.addEventListener('scroll', handleScroll);

    // Initial page view
    onPageView(1);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      // Track exit on unmount
      const timeSpent = (new Date().getTime() - pageEnteredAtRef.current.getTime()) / 1000;
      onPageExit(currentPageRef.current, timeSpent);
    };
  }, [pdf, onPageView, onPageExit]);

  const zoomIn = () => setScale(Math.min(scale + 0.25, 3));
  const zoomOut = () => setScale(Math.max(scale - 0.25, 0.5));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-neutral-900">
        <div className="flex flex-col items-center gap-3 text-white">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span>Loading PDF...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-neutral-900">
      {/* Controls */}
      <div className="flex items-center justify-between p-3 bg-neutral-800 border-b border-neutral-700 relative z-50">
        <span className="text-white text-sm px-4">
          Page {currentPage} of {totalPages}
        </span>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="text-white hover:bg-neutral-700 cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>

          <span className="text-white text-sm px-2 min-w-[50px] text-center">
            {Math.round(scale * 100)}%
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={zoomIn}
            disabled={scale >= 3}
            className="text-white hover:bg-neutral-700 cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Scrollable PDF Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-neutral-900"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="flex flex-col items-center py-8 gap-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <div
              key={pageNum}
              ref={(el) => {
                if (el) {
                  pageRefs.current.set(pageNum, el);
                  // Render when ref is set
                  if (pdf && !renderedPages.has(pageNum)) {
                    renderPage(pageNum, el);
                  }
                }
              }}
              className="relative shadow-2xl bg-white"
              style={{ minHeight: '200px' }}
            >
              {!renderedPages.has(pageNum) && (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-200">
                  <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
