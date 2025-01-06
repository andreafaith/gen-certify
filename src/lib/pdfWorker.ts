import { GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf';

// Set worker source to a CDN that's known to work
GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js';

// No need to export anything as we're just configuring the worker
