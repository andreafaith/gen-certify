import React from 'react';
import { GenerationProgress as Progress } from '../../services/certificateGenerator';

type GenerationProgressProps = {
  progress: Progress;
};

export function GenerationProgress({ progress }: GenerationProgressProps) {
  const percentage = Math.round((progress.current / progress.total) * 100);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">
          {progress.status}
        </span>
        <span className="text-sm font-medium text-gray-700">
          {percentage}%
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="text-sm text-gray-500">
        {progress.current} of {progress.total} certificates generated
      </div>
    </div>
  );
}
