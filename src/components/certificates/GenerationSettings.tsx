import React from 'react';
import { OutputFormat, QualitySettings } from '../../services/certificateGenerator';

type GenerationSettingsProps = {
  format: OutputFormat;
  batchSize: number;
  quality: QualitySettings;
  onFormatChange: (format: OutputFormat) => void;
  onBatchSizeChange: (size: number) => void;
  onQualityChange: (quality: QualitySettings) => void;
};

export function GenerationSettings({
  format,
  batchSize,
  quality,
  onFormatChange,
  onBatchSizeChange,
  onQualityChange,
}: GenerationSettingsProps) {
  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium">Generation Settings</h3>
      
      {/* Output Format Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Output Format</label>
        <select
          value={format}
          onChange={(e) => onFormatChange(e.target.value as OutputFormat)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="pdf">PDF</option>
          <option value="docx">DOCX</option>
          <option value="ppt">PPT</option>
        </select>
      </div>

      {/* Batch Size Configuration */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Batch Size</label>
        <input
          type="number"
          min="1"
          max="100"
          value={batchSize}
          onChange={(e) => onBatchSizeChange(Number(e.target.value))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
        <p className="mt-1 text-sm text-gray-500">
          Number of certificates to generate in each batch (1-100)
        </p>
      </div>

      {/* Quality Settings */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Quality Settings</label>
        
        <div>
          <label className="block text-sm text-gray-600">DPI</label>
          <input
            type="number"
            min="72"
            max="600"
            value={quality.dpi}
            onChange={(e) =>
              onQualityChange({ ...quality, dpi: Number(e.target.value) })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600">Image Quality</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={quality.imageQuality}
            onChange={(e) =>
              onQualityChange({ ...quality, imageQuality: Number(e.target.value) })
            }
            className="mt-1 block w-full"
          />
          <div className="mt-1 text-sm text-gray-500">
            {Math.round(quality.imageQuality * 100)}%
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600">Font Quality</label>
          <select
            value={quality.fontQuality}
            onChange={(e) =>
              onQualityChange({
                ...quality,
                fontQuality: e.target.value as 'normal' | 'high',
              })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
    </div>
  );
}
