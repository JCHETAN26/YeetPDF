import { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [isLoading, setIsLoading] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const annotationLayerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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

  // Render current page with annotations (clickable links)
  useEffect(() => {
    if (!pdf || !canvasRef.current || !annotationLayerRef.current) return;

    const renderPage = async () => {
      const page = await pdf.getPage(currentPage);
      const viewport = page.getViewport({ scale });

      const canvas = canvasRef.current!;
      const context = canvas.getContext('2d')!;
      const annotationLayer = annotationLayerRef.current!;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Set container size to match canvas
      if (containerRef.current) {
        containerRef.current.style.width = `${viewport.width}px`;
        containerRef.current.style.height = `${viewport.height}px`;
      }

      // Render canvas
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      // Clear previous annotations
      annotationLayer.innerHTML = '';
      annotationLayer.style.width = `${viewport.width}px`;
      annotationLayer.style.height = `${viewport.height}px`;

      // Get and render annotations (links)
      const annotations = await page.getAnnotations();

      annotations.forEach((annotation: any) => {
        if (annotation.subtype === 'Link' && annotation.url) {
          // Calculate position
          const rect = annotation.rect;
          const [x1, y1, x2, y2] = viewport.convertToViewportRectangle(rect);

          const left = Math.min(x1, x2);
          const top = Math.min(y1, y2);
          const width = Math.abs(x2 - x1);
          const height = Math.abs(y2 - y1);

          // Create clickable link element
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
          // Subtle hover effect
          link.style.backgroundColor = 'transparent';
          link.style.transition = 'background-color 0.2s';
          link.onmouseenter = () => { link.style.backgroundColor = 'rgba(59, 130, 246, 0.2)'; };
          link.onmouseleave = () => { link.style.backgroundColor = 'transparent'; };

          annotationLayer.appendChild(link);
        }

        // Handle internal links (go to page)
        if (annotation.subtype === 'Link' && annotation.dest) {
          const rect = annotation.rect;
          const [x1, y1, x2, y2] = viewport.convertToViewportRectangle(rect);

          const left = Math.min(x1, x2);
          const top = Math.min(y1, y2);
          const width = Math.abs(x2 - x1);
          const height = Math.abs(y2 - y1);

          const link = document.createElement('div');
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

          link.onclick = async () => {
            try {
              // Resolve the destination to get the page number
              const dest = typeof annotation.dest === 'string'
                ? await pdf.getDestination(annotation.dest)
                : annotation.dest;

              if (dest) {
                const pageIndex = await pdf.getPageIndex(dest[0]);
                setCurrentPage(pageIndex + 1);
              }
            } catch (e) {
              console.log('[PDFRenderer] Could not resolve internal link:', e);
            }
          };

          annotationLayer.appendChild(link);
        }
      });
    };

    renderPage();
  }, [pdf, currentPage, scale]);

  // Track page views
  useEffect(() => {
    if (!pdf) return;

    // Track page view
    onPageView(currentPage);
    pageEnteredAtRef.current = new Date();
    currentPageRef.current = currentPage;

    // Track page exit on cleanup
    return () => {
      const timeSpent = (new Date().getTime() - pageEnteredAtRef.current.getTime()) / 1000;
      onPageExit(currentPageRef.current, timeSpent);
    };
  }, [currentPage, pdf, onPageView, onPageExit]);

  const goToPrevPage = () => {
    console.log('[PDFRenderer] goToPrevPage clicked, currentPage:', currentPage);
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToNextPage = () => {
    console.log('[PDFRenderer] goToNextPage clicked, currentPage:', currentPage, 'totalPages:', totalPages);
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const zoomIn = () => setScale(Math.min(scale + 0.25, 3));
  const zoomOut = () => setScale(Math.max(scale - 0.25, 0.5));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white">Loading PDF...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-neutral-900">
      {/* Controls */}
      <div className="flex items-center justify-between p-4 bg-neutral-800 border-b border-neutral-700 relative z-50">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            className="text-white hover:bg-neutral-700 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <span className="text-white text-sm px-4">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="text-white hover:bg-neutral-700 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

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

          <span className="text-white text-sm px-2">
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

      {/* PDF Canvas with Annotation Layer */}
      <div className="flex-1 overflow-auto bg-neutral-900 flex items-start justify-center p-8 relative z-10">
        <div ref={containerRef} className="relative shadow-2xl">
          <canvas ref={canvasRef} />
          {/* Annotation layer overlays the canvas for clickable links */}
          <div
            ref={annotationLayerRef}
            className="absolute top-0 left-0 pointer-events-auto"
            style={{ zIndex: 1 }}
          />
        </div>
      </div>
    </div>
  );
}
