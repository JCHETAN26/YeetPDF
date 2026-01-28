import { useState, useEffect, useRef } from 'react';
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

interface PageData {
  pageNum: number;
  rendered: boolean;
}

export function PDFRenderer({ pdfUrl, onPageView, onPageExit }: PDFRendererProps) {
  const [pdf, setPdf] = useState<any>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [isLoading, setIsLoading] = useState(true);
  const [pages, setPages] = useState<PageData[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const pageEnteredAtRef = useRef<Date>(new Date());
  const currentPageRef = useRef(1);
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const renderingRef = useRef<Set<number>>(new Set());

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
        setPages(Array.from({ length: pdfDoc.numPages }, (_, i) => ({
          pageNum: i + 1,
          rendered: false
        })));
        setIsLoading(false);
      } catch (error) {
        console.error('[PDFRenderer] Error loading PDF:', error);
        setIsLoading(false);
      }
    };

    loadPdf();
  }, [pdfUrl]);

  // Render all pages when PDF loads or scale changes
  useEffect(() => {
    if (!pdf) return;

    const renderAllPages = async () => {
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const canvas = canvasRefs.current.get(pageNum);
        if (!canvas || renderingRef.current.has(pageNum)) continue;

        renderingRef.current.add(pageNum);

        try {
          const page = await pdf.getPage(pageNum);

          // Fix for high DPI (Retina) displays
          const outputScale = window.devicePixelRatio || 1;
          const viewport = page.getViewport({ scale });

          const context = canvas.getContext('2d')!;

          // Set actual canvas dimensions (scaled)
          canvas.width = Math.floor(viewport.width * outputScale);
          canvas.height = Math.floor(viewport.height * outputScale);

          // Set visible CSS dimensions (unscaled)
          canvas.style.width = Math.floor(viewport.width) + "px";
          canvas.style.height = Math.floor(viewport.height) + "px";

          // Improve text rendering
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = 'high';

          const transform = outputScale !== 1
            ? [outputScale, 0, 0, outputScale, 0, 0]
            : null;

          await page.render({
            canvasContext: context,
            viewport: viewport,
            transform: transform || undefined,
          }).promise;

          // Add clickable links overlay
          const parent = canvas.parentElement;
          if (parent) {
            // Remove existing annotation layer
            const existingLayer = parent.querySelector('.annotation-layer');
            if (existingLayer) existingLayer.remove();

            const annotationLayer = document.createElement('div');
            annotationLayer.className = 'annotation-layer';
            annotationLayer.style.position = 'absolute';
            annotationLayer.style.top = '0';
            annotationLayer.style.left = '0';
            annotationLayer.style.width = `${viewport.width}px`;
            annotationLayer.style.height = `${viewport.height}px`;
            annotationLayer.style.pointerEvents = 'auto';
            parent.appendChild(annotationLayer);

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
          }

          setPages(prev => prev.map(p =>
            p.pageNum === pageNum ? { ...p, rendered: true } : p
          ));

        } catch (error) {
          console.error(`[PDFRenderer] Error rendering page ${pageNum}:`, error);
        }

        renderingRef.current.delete(pageNum);
      }
    };

    // Small delay to ensure refs are set
    setTimeout(renderAllPages, 100);
  }, [pdf, scale, totalPages]);

  // Track current page based on scroll position
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !pdf) return;

    const handleScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.top + containerRect.height / 2;

      let closestPage = 1;
      let closestDistance = Infinity;

      canvasRefs.current.forEach((canvas, pageNum) => {
        const rect = canvas.getBoundingClientRect();
        const pageCenter = rect.top + rect.height / 2;
        const distance = Math.abs(pageCenter - containerCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestPage = pageNum;
        }
      });

      if (closestPage !== currentPageRef.current) {
        const timeSpent = (new Date().getTime() - pageEnteredAtRef.current.getTime()) / 1000;
        onPageExit(currentPageRef.current, timeSpent);

        setCurrentPage(closestPage);
        currentPageRef.current = closestPage;
        pageEnteredAtRef.current = new Date();
        onPageView(closestPage);
      }
    };

    container.addEventListener('scroll', handleScroll);
    onPageView(1);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      const timeSpent = (new Date().getTime() - pageEnteredAtRef.current.getTime()) / 1000;
      onPageExit(currentPageRef.current, timeSpent);
    };
  }, [pdf, onPageView, onPageExit]);

  const zoomIn = () => {
    renderingRef.current.clear();
    setScale(Math.min(scale + 0.25, 3));
  };

  const zoomOut = () => {
    renderingRef.current.clear();
    setScale(Math.max(scale - 0.25, 0.5));
  };

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
      >
        <div className="flex flex-col items-center py-8 gap-6">
          {pages.map(({ pageNum, rendered }) => (
            <div
              key={pageNum}
              className="relative shadow-2xl bg-white"
              style={{ minHeight: '200px', minWidth: '200px' }}
            >
              <canvas
                ref={(el) => {
                  if (el) canvasRefs.current.set(pageNum, el);
                }}
              />
              {!rendered && (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
                  <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
