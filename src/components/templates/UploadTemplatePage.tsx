import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TemplateUpload } from './TemplateUpload';

export function UploadTemplatePage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleUploadSuccess = (templateId: string) => {
    // Navigate to template editor or viewer
    navigate(`/templates/${templateId}`);
  };

  const handleUploadError = (error: string) => {
    setError(error);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Upload Template</h2>
          <p className="mt-1 text-sm text-gray-600">
            Upload a template file that will be used to generate certificates.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Upload failed
                </h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <TemplateUpload
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
        />

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900">
            Supported file types
          </h3>
          <div className="mt-2 text-sm text-gray-500">
            <ul className="list-disc pl-5 space-y-1">
              <li>PDF documents (.pdf)</li>
              <li>Word documents (.docx)</li>
              <li>PowerPoint presentations (.pptx)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
