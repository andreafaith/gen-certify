import React, { useState, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import '../../lib/pdfWorker';

interface PDFPreviewProps {
  url: string;
  className?: string;
}

export function PDFPreview({ url, className = '' }: PDFPreviewProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    console.log('PDFPreview mounted with URL:', url);
  }, [url]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    console.log('PDF loaded successfully with', numPages, 'pages');
    setNumPages(numPages);
    setPageNumber(1);
  }

  function onDocumentLoadError(error: Error) {
    console.error('Error loading PDF:', error);
    setError(error);
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-2">Failed to load PDF</p>
        <p className="text-sm text-gray-500">{error.message}</p>
        <p className="text-sm text-gray-400 mt-2">URL: {url}</p>
      </div>
    );
  }

  return (
    <div className={`pdf-preview ${className}`}>
      <Document
        file={url}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
            <span className="ml-3 text-gray-600">Loading PDF...</span>
          </div>
        }
        className="flex justify-center"
        error={
          <div className="text-center py-12">
            <p className="text-red-600">Failed to load PDF</p>
            <p className="text-sm text-gray-500 mt-2">URL: {url}</p>
          </div>
        }
      >
        {numPages && (
          <Page
            pageNumber={pageNumber}
            className="shadow-lg"
            renderTextLayer={false}
            renderAnnotationLayer={false}
            loading={
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
                <span className="ml-3 text-gray-600">Loading page {pageNumber}...</span>
              </div>
            }
            error={
              <div className="text-center py-12">
                <p className="text-red-600">Failed to load page {pageNumber}</p>
              </div>
            }
          />
        )}
      </Document>
      {numPages && numPages > 1 && (
        <div className="flex justify-center items-center mt-4 space-x-4">
          <button
            onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
            disabled={pageNumber <= 1}
            className="px-3 py-1 bg-gray-100 rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {pageNumber} of {numPages}
          </span>
          <button
            onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
            disabled={pageNumber >= numPages}
            className="px-3 py-1 bg-gray-100 rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
