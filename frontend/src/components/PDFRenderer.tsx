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

  // Render current page
  useEffect(() => {
    if (!pdf || !canvasRef.current) return;

    const renderPage = async () => {
      const page = await pdf.getPage(currentPage);
      const viewport = page.getViewport({ scale });
      
      const canvas = canvasRef.current!;
      const context = canvas.getContext('2d')!;
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;
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

      {/* PDF Canvas */}
      <div className="flex-1 overflow-auto bg-neutral-900 flex items-start justify-center p-8 relative z-10">
        <canvas ref={canvasRef} className="shadow-2xl" />
      </div>
    </div>
  );
}
