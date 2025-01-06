import React, { useState } from 'react';
import {
  certificateGenerator,
  OutputFormat,
  QualitySettings,
  GenerationProgress as ProgressType,
} from '../../services/certificateGenerator';
import { GenerationSettings } from './GenerationSettings';
import { GenerationProgress } from './GenerationProgress';

type CertificateGenerationProps = {
  templateData: any;
  recipientData: any[];
  onComplete: (blobs: Blob[]) => void;
};

export function CertificateGeneration({
  templateData,
  recipientData,
  onComplete,
}: CertificateGenerationProps) {
  const [format, setFormat] = useState<OutputFormat>('pdf');
  const [batchSize, setBatchSize] = useState(10);
  const [quality, setQuality] = useState<QualitySettings>({
    dpi: 300,
    imageQuality: 0.92,
    fontQuality: 'normal',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<ProgressType>({
    current: 0,
    total: 0,
    status: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const blobs = await certificateGenerator.generateCertificate(
        templateData,
        recipientData,
        {
          format,
          batchSize,
          quality,
          onProgress: setProgress,
        }
      );
      
      onComplete(blobs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (blobs: Blob[]) => {
    blobs.forEach((blob, index) => {
      const recipient = recipientData[index];
      const filename = `certificate_${recipient.name.replace(/\s+/g, '_')}`;
      certificateGenerator.downloadCertificate(blob, filename, format);
    });
  };

  return (
    <div className="space-y-6">
      <GenerationSettings
        format={format}
        batchSize={batchSize}
        quality={quality}
        onFormatChange={setFormat}
        onBatchSizeChange={setBatchSize}
        onQualityChange={setQuality}
      />

      {isGenerating && (
        <div className="mt-6">
          <GenerationProgress progress={progress} />
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="mt-6 flex justify-end space-x-4">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className={`px-4 py-2 rounded-md text-white ${
            isGenerating
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {isGenerating ? 'Generating...' : 'Generate Certificates'}
        </button>
      </div>
    </div>
  );
}
